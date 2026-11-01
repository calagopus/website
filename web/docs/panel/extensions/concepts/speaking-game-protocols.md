---
title: Speaking Game Protocols
description: Talk to the game running inside a server container directly, below the high-level Wings API.
---

# Speaking Game Protocols

Most of what an extension does to a server goes through the high-level Wings API: start it, stop it, read a file, pull a backup. Sometimes you need to talk to the *game* inside the container instead, for example to show a live Minecraft MOTD on a server card, read the current player count, or check whether a server is accepting connections rather than just "running" as far as Docker knows. That means speaking the game's own protocol over a raw socket.

The game's port is on the node, behind whatever firewall the operator set up, while your extension runs in the Panel, possibly on another machine, so you can't `TcpStream::connect` to it. **Query tunnels** solve this: Wings opens a socket to one of the server's ports *from the node's side* and relays the bytes to you over a WebSocket. Your extension gets a normal async socket.

This page covers the tunnel API and three examples: a Minecraft Server List Ping over TCP, a GameSpy query over UDP, and talking to a unix socket the game exposes inside the server's files.

## The Tunnel API

You open a tunnel from a [`WingsClient`](./routing.md), which you get from the server's node:

```rs
let client = server
    .node
    .fetch_cached(&state.database)
    .await?
    .api_client(&state.database)
    .await?;
```

The client exposes one method per transport:

| Method | Returns | Shape |
| ------ | ------- | ----- |
| `open_tunnel_tcp(server, port)` | `QueryStreamTunnel` | Implements `AsyncRead` + `AsyncWrite`; use it like any `tokio` socket |
| `open_tunnel_udp(server, port)` | `QueryUdpTunnel` | A datagram socket with `send(&[u8])` / `recv(&mut [u8])` |
| `open_tunnel_unix(server, path, ignored)` | `QueryStreamTunnel` | Same stream as TCP, connected to a unix socket file in the server's files; see [below](#example-talking-to-a-unix-socket) |

All three return `Result<_, ApiHttpError>`. `ApiHttpError` converts into `anyhow::Error` but doesn't implement `std::error::Error` itself, which is why the examples below detour through `anyhow::Error::from` when mapping it into an `std::io::Error` (add `anyhow = { workspace = true }` to your dependencies if you follow that pattern). When Wings refuses to open the tunnel at all (the server is offline, or the socket file doesn't exist), you get `ApiHttpError::Http(status, error)` with Wings' status code and message, the same shape as any other Wings API call.

The TCP and UDP methods take the server's `uuid` and a `u16` port. **The port is the port the game is listening on inside the container.** In almost every case that's the server's primary allocation, which you can read off the server model:

```rs
let allocation = server
    .allocation
    .as_ref()
    .ok_or_else(|| ApiResponse::error("server has no primary allocation"))?;

let port = allocation.allocation.port as u16; // stored as i32, narrow to u16
```

Before you write protocol code:

- **The TCP tunnel is a real `AsyncRead + AsyncWrite`.** Bring `tokio::io::{AsyncReadExt, AsyncWriteExt}` into scope for `read_exact`, `write_all`, `read_u8` and the rest. Each WebSocket binary frame becomes a chunk of the read stream, so a single `read_exact(&mut buf)` may span several frames or stop partway through one, just like a normal TCP socket. Don't assume one `read` equals one logical message; frame your reads yourself.
- **The UDP tunnel is message-oriented.** `send` writes one datagram, `recv` reads one datagram into your buffer and returns the number of bytes. There's no stream reassembly because UDP has no stream.
- **`recv` on the UDP tunnel has a built-in 5-second timeout.** If the node doesn't get a reply in time you get an `io::ErrorKind::TimedOut`. This is deliberate: a UDP query to a dead server would otherwise hang forever, since there's no connection to break. The TCP tunnel has no such timeout; wrap it in `tokio::time::timeout` yourself if you need one.
- **A refused UDP connection surfaces as `io::ErrorKind::ConnectionRefused`.** If Wings can't reach the port at all, the first `recv` returns this rather than timing out. Handle it as "server is down" rather than bubbling a raw 500. A tunnel that Wings closes underneath you reads as `UnexpectedEof` on UDP, and as a zero-byte read on TCP (so `read_exact` reports `UnexpectedEof` there too); TCP never produces `ConnectionRefused`.
- **Datagrams are capped at `MAX_DATAGRAM_SIZE` (64 KiB).** That's `wings_api::tunnel::MAX_DATAGRAM_SIZE`. Size your `recv` buffer to it and you'll never truncate a reply.

::: info
Query tunnels are read-write sockets, not a read-only "status" API. You can send arbitrary bytes to the game port, which is what makes them useful for protocols that need a handshake. It also means you must not expose an endpoint that lets an untrusted user pick the port and send arbitrary bytes, or you've built an SSRF tool aimed at the node's network. Pin the port to the server's own allocation like the examples below do.
:::

## Example: Minecraft MOTD over TCP (Server List Ping)

Modern Minecraft (Java Edition) answers the [Server List Ping](https://minecraft.wiki/w/Java_Edition_protocol/Server_List_Ping) on its normal game port over TCP. The flow is: send a *handshake* packet asking to move into the status state, send an empty *status request*, then read back a single JSON document describing the server, including its MOTD, player counts and version.

Every packet is length-prefixed and uses Minecraft's VarInt encoding, so we need two small helpers first:

```rs
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};

async fn write_varint<W: AsyncWrite + Unpin>(w: &mut W, mut value: i32) -> std::io::Result<()> {
    loop {
        let mut byte = (value & 0x7F) as u8;
        value = ((value as u32) >> 7) as i32;
        if value != 0 {
            byte |= 0x80; // continuation bit
        }
        w.write_all(&[byte]).await?;
        if value == 0 {
            return Ok(());
        }
    }
}

async fn read_varint<R: AsyncRead + Unpin>(r: &mut R) -> std::io::Result<i32> {
    let mut result = 0i32;
    let mut shift = 0u32;
    loop {
        let byte = r.read_u8().await?;
        result |= ((byte & 0x7F) as i32) << shift;
        if byte & 0x80 == 0 {
            return Ok(result);
        }
        shift += 7;
        if shift >= 35 {
            return Err(std::io::Error::other("varint too long"));
        }
    }
}
```

Now the query itself. We build the handshake body in a buffer, length-prefix it, write it, then do the same for the (empty) status request:

```rs
use wings_api::client::WingsClient;

/// Returns the raw status JSON the server reports (MOTD lives under `description`).
pub async fn query_minecraft(
    client: &WingsClient,
    server: uuid::Uuid,
    host: &str,
    port: u16,
) -> std::io::Result<serde_json::Value> {
    let mut tunnel = client
        .open_tunnel_tcp(server, port)
        .await
        .map_err(|err| std::io::Error::other(anyhow::Error::from(err)))?;

    // --- Handshake packet (id 0x00) ---
    let mut body: Vec<u8> = Vec::new();
    write_varint(&mut body, 0x00).await?; // packet id
    write_varint(&mut body, -1).await?; // protocol version (-1 = "just querying")
    write_varint(&mut body, host.len() as i32).await?;
    body.extend_from_slice(host.as_bytes());
    body.extend_from_slice(&port.to_be_bytes()); // server port, unsigned short, big-endian
    write_varint(&mut body, 1).await?; // next state: 1 = status

    write_varint(&mut tunnel, body.len() as i32).await?;
    tunnel.write_all(&body).await?;

    // --- Status request packet (id 0x00, empty body) ---
    write_varint(&mut tunnel, 1).await?; // length
    write_varint(&mut tunnel, 0x00).await?; // packet id
    tunnel.flush().await?;

    // --- Status response ---
    let _packet_len = read_varint(&mut tunnel).await?;
    let _packet_id = read_varint(&mut tunnel).await?; // 0x00
    let json_len = read_varint(&mut tunnel).await? as usize;

    let mut json = vec![0u8; json_len];
    tunnel.read_exact(&mut json).await?;

    serde_json::from_slice(&json).map_err(std::io::Error::other)
}
```

- **The `host` you pass into the handshake doesn't matter to most servers.** Vanilla ignores it, but servers behind a proxy (BungeeCord, Velocity, forced-host setups) route on it, so pass the address players actually connect with. The allocation's `ip_alias` is that address when the operator set one; otherwise fall back to the allocation IP itself, which is an `IpNetwork` and needs `.ip().to_string()` to become a host string.
- **We send the protocol version as `-1`.** When you only want the status, you don't have to pretend to be a specific client version; `-1` is the conventional "I'm just pinging" value and avoids "outdated client/server" rejections.
- **`read_exact` handles the framing.** Because the tunnel is a real `AsyncRead`, it reads the exact JSON length even if it arrives split across several WebSocket frames; the `tokio` extension trait loops until it has every byte.

The MOTD is the `description` field of the returned JSON. Depending on the server it's either a plain string or a [chat component](https://minecraft.wiki/w/Raw_JSON_text_format) object, so handle both:

```rs
let host = allocation
    .allocation
    .ip_alias
    .clone()
    .unwrap_or_else(|| allocation.allocation.ip.ip().to_compact_string());

let status = query_minecraft(&client, server.uuid, &host, port).await?;

let motd = match &status["description"] {
    serde_json::Value::String(s) => s.clone(),
    serde_json::Value::Object(_) => status["description"]["text"]
        .as_str()
        .unwrap_or_default()
        .to_string(),
    _ => String::new(),
};

let online = status["players"]["online"].as_i64().unwrap_or(0);
let max = status["players"]["max"].as_i64().unwrap_or(0);
```

## Example: GameSpy query over UDP

The other common pattern is the [GameSpy / UT3 query protocol](https://minecraft.wiki/w/Query) that runs over UDP. Bedrock-adjacent servers, many source-engine-style games, and Minecraft's own optional `enable-query` listener all speak it. Unlike the TCP ping it's a two-step challenge-response: you ask for a challenge token, then echo it back in your stat request so the server knows you're not a spoofed source address.

Because it's UDP, we use `open_tunnel_udp` and its `send` / `recv` pair instead of stream reads:

::: details Full example: GameSpy query
```rs
use wings_api::{client::WingsClient, tunnel::MAX_DATAGRAM_SIZE};

const MAGIC: [u8; 2] = [0xFE, 0xFD];
const TYPE_HANDSHAKE: u8 = 0x09;
const TYPE_STAT: u8 = 0x00;

/// Returns the server's MOTD via the basic GameSpy stat query.
pub async fn query_gamespy(
    client: &WingsClient,
    server: uuid::Uuid,
    port: u16,
) -> std::io::Result<String> {
    let mut tunnel = client
        .open_tunnel_udp(server, port)
        .await
        .map_err(|err| std::io::Error::other(anyhow::Error::from(err)))?;

    // Session id - only the low nibble of each byte is significant, so keep it small.
    let session_id: i32 = 1;

    // --- Step 1: handshake to obtain a challenge token ---
    let mut packet = Vec::new();
    packet.extend_from_slice(&MAGIC);
    packet.push(TYPE_HANDSHAKE);
    packet.extend_from_slice(&session_id.to_be_bytes());
    tunnel.send(&packet).await?;

    let mut buf = vec![0u8; MAX_DATAGRAM_SIZE];
    let n = tunnel.recv(&mut buf).await?; // ConnectionRefused/TimedOut if the server is down

    // Response: type (1) + session id (4) + null-terminated ASCII challenge integer.
    let token_str = std::str::from_utf8(&buf[5..n])
        .map_err(std::io::Error::other)?
        .trim_end_matches('\0');
    let challenge: i32 = token_str
        .trim()
        .parse()
        .map_err(std::io::Error::other)?;

    // --- Step 2: basic stat request, echoing the challenge token ---
    let mut packet = Vec::new();
    packet.extend_from_slice(&MAGIC);
    packet.push(TYPE_STAT);
    packet.extend_from_slice(&session_id.to_be_bytes());
    packet.extend_from_slice(&challenge.to_be_bytes());
    tunnel.send(&packet).await?;

    let n = tunnel.recv(&mut buf).await?;

    // Basic stat response: type (1) + session id (4) + null-terminated fields,
    // the first of which is the MOTD.
    let body = &buf[5..n];
    let motd_end = body.iter().position(|&b| b == 0).unwrap_or(body.len());
    let motd = String::from_utf8_lossy(&body[..motd_end]).into_owned();

    Ok(motd)
}
```
:::

Notes specific to the GameSpy flow:

- **The challenge token must be echoed as a big-endian `i32`.** The server sends it back as an ASCII *string* in the handshake response (e.g. `"9513307"`), and you parse it to an integer and re-encode it as four bytes. Forgetting the string→int→bytes round-trip is the single most common mistake here.
- **Rely on the built-in timeout.** There's no `tokio::time::timeout` around these `recv` calls because the UDP tunnel already gives up after 5 seconds and hands you a `TimedOut`. For a query that's the right behavior: a server that doesn't answer in 5 seconds isn't going to.
- **The "basic" stat only gives you a handful of fields.** MOTD, game type, map, player count, max players, and host. There's also a "full" stat (send `0x00` followed by four extra `0x00` padding bytes) that returns a longer key/value section plus the player list, over the same tunnel with a longer request and more parsing.

## Example: Talking to a Unix Socket

Not every game listens on a network port for its control traffic. Plenty of servers and wrappers expose an admin or RCON-style interface as a **unix socket file** instead, such as `/home/container/control.sock`, which only processes inside the container can reach. `open_tunnel_unix` connects to that file *from the node's side* and hands you the same `QueryStreamTunnel` the TCP tunnel uses, so everything above about `AsyncRead` / `AsyncWrite` and framing applies unchanged.

```rs
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use wings_api::client::{ApiHttpError, WingsClient};

/// Sends one line to a line-based control socket and returns the first line of the reply.
pub async fn send_control_command(
    client: &WingsClient,
    server: &shared::models::server::Server,
    command: &str,
) -> std::io::Result<String> {
    let tunnel = client
        .open_tunnel_unix(
            server.uuid,
            "control.sock",
            server.subuser_ignored_files.as_deref().unwrap_or(&[]),
        )
        .await
        .map_err(|err| match err {
            ApiHttpError::Http(status, error) if status.as_u16() == 409 => {
                std::io::Error::new(std::io::ErrorKind::ConnectionRefused, error.error.to_string())
            }
            err => std::io::Error::other(anyhow::Error::from(err)),
        })?;

    let mut tunnel = BufReader::new(tunnel);
    tunnel.write_all(command.as_bytes()).await?;
    tunnel.write_all(b"\n").await?;
    tunnel.flush().await?;

    let mut reply = String::new();
    tunnel.read_line(&mut reply).await?;

    Ok(reply.trim_end().to_string())
}
```

How the path and errors work:

- **The path is relative to the server's root**, the same root the file manager shows. `control.sock`, `/control.sock` and `plugins/../control.sock` all point at the same file. Wings resolves it inside the server's directory and refuses anything that would land outside it (`..`, absolute symlinks, relative symlinks), so a server owner can't point a symlink at the node's Docker socket and have you connect to it.
- **Pass the subuser's ignored files.** The third argument is the same denylist the file routes take. Wings checks it, and the egg's own file denylist, against both the path you asked for and where the socket really is after symlinks. A denied socket looks exactly like a missing one. If the request isn't on behalf of a subuser, pass `&[]`.
- **Errors come back before the tunnel opens**, as `ApiHttpError::Http`:

| Status | Meaning |
| ------ | ------- |
| `404` | No such file, or it's hidden from this user |
| `409` | The socket file exists but nothing is listening, typically a stale socket left behind by a stopped server |
| `417` | The path isn't a socket, or it's a datagram/seqpacket socket; only stream sockets are supported |
| `501` | The node isn't running on Linux, where unix socket tunnels aren't available |

- **Only stream sockets.** `SOCK_DGRAM` and `SOCK_SEQPACKET` sockets are rejected with `417`; there's no unix equivalent of the UDP tunnel.
- **No server-state check.** Unlike the TCP tunnel, Wings doesn't check whether the container is running; it just tries to connect. A stopped server usually shows up as `409` (stale socket) or `404` (the game cleaned the file up on exit).

::: warning
The socket path is exactly as dangerous as the port is for TCP. A control socket usually accepts privileged commands, so gate the route on a permission that already implies that power (such as `control.console`), and never let the request pick an arbitrary path; hard-code the socket your extension knows about.
:::

## Wiring It Into a Route

Neither helper is useful on its own; put them behind a [client-server route](./routing.md) so the frontend can render the result. A minimal handler that returns a server's live MOTD:

::: details Full example: route handler
```rs
mod get {
    use compact_str::ToCompactString;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{server::GetServer, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        motd: String,
        players_online: i64,
        players_max: i64,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        ("server" = uuid::Uuid, description = "The server ID"),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
    ) -> ApiResponseResult {
        permissions.has_server_permission("control.console")?;

        let allocation = server
            .allocation
            .as_ref()
            .ok_or_else(|| ApiResponse::error("server has no primary allocation"))?;

        let client = server
            .node
            .fetch_cached(&state.database)
            .await?
            .api_client(&state.database)
            .await?;

        let host = allocation
            .allocation
            .ip_alias
            .clone()
            .unwrap_or_else(|| allocation.allocation.ip.ip().to_compact_string());

        let status = crate::query::query_minecraft(
            &client,
            server.uuid,
            &host,
            allocation.allocation.port as u16,
        )
        .await
        .map_err(|_| ApiResponse::error("could not reach the server"))?;

        ApiResponse::new_serialized(Response {
            motd: status["description"]["text"]
                .as_str()
                .or_else(|| status["description"].as_str())
                .unwrap_or_default()
                .to_string(),
            players_online: status["players"]["online"].as_i64().unwrap_or(0),
            players_max: status["players"]["max"].as_i64().unwrap_or(0),
        })
        .ok()
    }
}
```
:::

::: warning
Querying a game server hits the network and can take up to several seconds when the server is unreachable. Don't do it on a hot path that runs for every server in a list on every page load, or a few unreachable servers will make every page wait several seconds. Cache the result (a short TTL in memory, or a [background task](./background-tasks-and-shutdown-handlers.md) that refreshes known servers on a schedule and stashes the latest MOTD), and have the route read from the cache rather than querying live every time.
:::
