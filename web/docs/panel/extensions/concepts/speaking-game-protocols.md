# Speaking Game Protocols

Most of what an extension does to a server goes through the high-level Wings API - start it, stop it, read a file, pull a backup. But sometimes you want to talk to the *game* running inside the container, not the container itself. Render a live Minecraft MOTD on a server card, scrape the current player count for a stats page, ping a server to check whether it's actually accepting connections rather than just "running" from Docker's point of view - all of these mean speaking the game's own wire protocol over a raw socket.

The problem is that the game server's port lives on the node, behind whatever firewall the operator set up, and your extension runs inside the Panel - which may be on a completely different machine. You can't just `TcpStream::connect` to it. That's what **query tunnels** are for: you ask Wings to open a socket to one of the server's ports *from the node's side*, and Wings proxies the bytes back to you over a WebSocket. From your extension's perspective you get a normal async socket; the fact that it's tunnelled through Wings is invisible.

This page covers the tunnel API and walks through two complete examples - a Minecraft Server List Ping over TCP, and a GameSpy query over UDP.

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

The client exposes two methods, one per transport:

| Method | Returns | Shape |
| ------ | ------- | ----- |
| `open_tunnel_tcp(server, port)` | `QueryTcpTunnel` | Implements `AsyncRead` + `AsyncWrite` - use it like any `tokio` socket |
| `open_tunnel_udp(server, port)` | `QueryUdpTunnel` | A datagram socket with `send(&[u8])` / `recv(&mut [u8])` |

Both take the server's `uuid` and a `u16` port. **The port is the port the game is listening on inside the container** - in almost every case that's the server's primary allocation, which you can read off the server model:

```rs
let allocation = server
    .allocation
    .as_ref()
    .ok_or_else(|| ApiResponse::error("server has no primary allocation"))?;

let port = allocation.allocation.port as u16; // stored as i32, narrow to u16
```

A few things to know before you start writing protocol code:

- **The TCP tunnel is a real `AsyncRead + AsyncWrite`.** Bring `tokio::io::{AsyncReadExt, AsyncWriteExt}` into scope and you get `read_exact`, `write_all`, `read_u8`, and friends for free. Internally each WebSocket binary frame becomes a chunk of the read stream, so a single `read_exact(&mut buf)` may span several frames or stop partway through one - exactly like a normal TCP socket. Don't assume one `read` equals one logical message; frame your reads yourself.
- **The UDP tunnel is message-oriented.** `send` writes one datagram, `recv` reads one datagram into your buffer and returns the number of bytes. There's no stream reassembly because UDP has no stream.
- **`recv` on the UDP tunnel has a built-in 5-second timeout.** If the node doesn't get a reply in time you get an `io::ErrorKind::TimedOut`. This is deliberate - a UDP query to a dead server would otherwise hang forever, since there's no connection to break. The TCP tunnel has no such timeout; wrap it in `tokio::time::timeout` yourself if you need one.
- **A refused UDP connection surfaces as `io::ErrorKind::ConnectionRefused`.** If Wings can't reach the port at all, the first `recv` returns this rather than timing out. Handle it as "server is down" rather than bubbling a raw 500.
- **Datagrams are capped at `MAX_DATAGRAM_SIZE` (64 KiB).** That's `wings_api::tunnel::MAX_DATAGRAM_SIZE`. Size your `recv` buffer to it and you'll never truncate a reply.

::: info
Query tunnels are read-write sockets, not a read-only "status" API. Nothing stops you from sending arbitrary bytes to the game port - which is exactly what makes them useful for protocols that need a handshake. With that power comes the usual footgun: don't expose an endpoint that lets an untrusted user pick the port and shovel arbitrary bytes into it, or you've built an SSRF gadget pointed at the node's network. Pin the port to the server's own allocation like the examples below do.
:::

## Example: Minecraft MOTD over TCP (Server List Ping)

Modern Minecraft (Java Edition) answers the [Server List Ping](https://minecraft.wiki/w/Java_Edition_protocol/Server_List_Ping) on its normal game port over TCP. The flow is: send a *handshake* packet asking to move into the status state, send an empty *status request*, then read back a single JSON blob describing the server - including its MOTD, player counts, and version.

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
        .map_err(std::io::Error::other)?;

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

A couple of things worth pointing out:

- **The `host` you pass into the handshake is cosmetic for most servers** - vanilla ignores it, but servers behind a proxy (BungeeCord, Velvet, forced-host setups) route on it, so pass the address players actually connect with. The server's allocation IP is a reasonable default.
- **We send the protocol version as `-1`.** When you only want the status, you don't have to pretend to be a specific client version; `-1` is the conventional "I'm just pinging" value and avoids "outdated client/server" rejections.
- **`read_exact` does the framing for us.** Because the tunnel is a real `AsyncRead`, we can read the exact JSON length even if it arrives split across multiple WebSocket frames - the `tokio` extension trait loops until it has every byte.

The MOTD is the `description` field of the returned JSON. Depending on the server it's either a plain string or a [chat component](https://minecraft.wiki/w/Raw_JSON_text_format) object, so handle both:

```rs
let status = query_minecraft(&client, server.uuid, &allocation.allocation.ip, port).await?;

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
        .map_err(std::io::Error::other)?;

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

Notes specific to the GameSpy flow:

- **The challenge token must be echoed as a big-endian `i32`.** The server sends it back as an ASCII *string* in the handshake response (e.g. `"9513307"`), and you parse it to an integer and re-encode it as four bytes. Forgetting the string→int→bytes round-trip is the single most common mistake here.
- **Lean on the built-in timeout.** Notice there's no `tokio::time::timeout` wrapping these `recv` calls - the UDP tunnel already gives up after 5 seconds and hands you a `TimedOut`. For a query that's the right behavior: a server that doesn't answer in 5 seconds isn't going to.
- **The "basic" stat only gives you a handful of fields.** MOTD, game type, map, player count, max players, and host. There's also a "full" stat (send `0x00` followed by four extra `0x00` padding bytes) that returns a richer key/value section plus the player list - same tunnel, just a longer request and a more involved parse.

## Wiring It Into a Route

Neither helper is useful on its own - put them behind a [client-server route](./routing.md) so the frontend can render the result. A minimal handler that returns a server's live MOTD:

```rs
mod get {
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

        let status = crate::query::query_minecraft(
            &client,
            server.uuid,
            &allocation.allocation.ip,
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

::: warning
Querying a game server hits the network and can take up to several seconds when the server is unreachable. Don't do it on a hot path that's called for every server in a list on every page load - you'll serialize a pile of multi-second timeouts and make the whole Panel feel broken. Cache the result (a short TTL in memory, or a [background task](./background-tasks-and-shutdown-handlers.md) that refreshes known servers on a schedule and stashes the latest MOTD), and have the route read from the cache rather than querying live every time.
:::
