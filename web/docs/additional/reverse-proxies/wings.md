---
title: Reverse Proxy for Wings
description: Put Nginx, Apache, Caddy, Traefik or Nginx Proxy Manager in front of a standalone Calagopus Wings node, serve it over HTTPS on port 443, and keep real client IPs working.
---

# Putting Wings Behind a Reverse Proxy

This guide covers standalone Wings nodes. The Wings bundled with the [All-in-One image](../../panel/installation/docker.md#option-a-all-in-one-recommended-for-single-node-setups) is covered by the [Panel guide](./panel.md). For how a proxy fits into the request path, see [Setting up a Reverse Proxy](./index.md).

::: info
These configurations target current releases of each proxy and of Wings. After updating Wings, compare your configuration with this page again; see [Keeping the Configuration Current](./index.md#keeping-the-configuration-current).
:::

You have three ways to secure a standalone node, and most setups only need the first:

| Approach | When to use it |
| --- | --- |
| [Wings' built-in SSL](../../wings/configuration.md#ssl-configuration) | The node runs nothing else on ports 443/8080. Point Wings at the certificate files and you're done. No proxy involved. |
| Reverse proxy in front of Wings (this guide) | A proxy already runs on the node, you want Wings on port 443, or you want one place to manage certificates. |
| [Wings Proxy Mode](../../wings/advanced/exposing-wings-in-a-homelab.md) | The node can't be reached from the internet at all. The Panel relays browser traffic to it. |

With the first two options, browsers connect to Wings directly for the console, file uploads and downloads, so the node's public URL must be reachable from your users' machines. Only Wings Proxy Mode routes that traffic through the Panel instead.

## Prerequisites

- Wings [installed](../../wings/installation/index.md), reachable at `http://<node-ip>:8080`.
- A domain for the node (`<node-domain>` below) with an `A` record, plus `AAAA` for IPv6 pointing at it.
- Ports `80` and `443` open, and forwarded on your router if the node is at home.
- A [TLS certificate](../ssl-certificates.md) for the domain. Caddy, Traefik and Nginx Proxy Manager issue their own.
- The proxy installed on the node, or running in Docker (see [Proxies Running in Docker](./panel.md#proxies-running-in-docker)).

::: warning
A broken proxy configuration makes the node unreachable until it's fixed, so keep a terminal open.
:::

## Step 1: Prepare Wings

Everything in this step happens on the node, mostly in `config.yml` (`/etc/calagopus-wings/config.yml`, or `config/config.yml` in the Wings compose directory). The Panel never pushes `api.host`, `api.port`, `api.ssl` or `api.trusted_proxies`, so they can only be set here. Restart Wings once at the end.

### Turn Off Wings' Own SSL

The proxy terminates TLS and forwards to Wings over plain HTTP. With [`api.ssl`](../../wings/configuration.md#ssl-configuration) still enabled, Wings answers that with a TLS handshake and every request fails with `502`:

```yaml
api:
  ssl:
    enabled: false
```

This is the default on a fresh install, so it only needs changing on a node that ran with its own certificate before.

### Stop Exposing Port 8080

Wings listens on every interface by default ([`api.host`](../../wings/configuration.md) is `0.0.0.0`), so port `8080` stays reachable from the internet even after the proxy is in place. Restrict it to the loopback interface:

::: code-group
```yaml [Wings as a binary or package]
api:
  host: 127.0.0.1
  port: 8080
```
```yaml [Wings in Docker]
# In compose.yml, not config.yml. api.host stays 0.0.0.0 inside the container.
services:
  wings:
    ports:
      - 127.0.0.1:8080:8080
      - 2022:2022 # SFTP does not go through the proxy, keep it public
```
:::

Keep `api.port` at `8080`. It is the port every configuration in Step 2 forwards to.

::: details Using a Unix socket instead
Point `api.host` at a path instead of an IP and Wings serves plain HTTP on a Unix socket, with no TCP port at all. It reports every request as coming from `127.0.0.1`, which is what `api.trusted_proxies` below then needs. `api.ssl` is ignored, and this needs a binary or package install on Unix, where Wings and the proxy share a filesystem.

```yaml
api:
  host: /run/calagopus-wings/api.sock
```

Create the directory first, with permissions the proxy's user can traverse, then point the proxy at the socket:

| Proxy | Target |
| --- | --- |
| Nginx | `server unix:/run/calagopus-wings/api.sock;` in the `upstream` block, in place of `server 127.0.0.1:8080;` |
| Apache | `ProxyPass / unix:/run/calagopus-wings/api.sock\|http://localhost/ retry=0 upgrade=websocket` |
| Caddy | `reverse_proxy unix//run/calagopus-wings/api.sock` |
:::

### Trust the Proxy's Address

Like the Panel, Wings needs to know which address the proxy connects from before it believes the forwarded IP headers. It uses them for its [per-IP WebSocket connection limits](../../wings/configuration.md#system-websocket-unauthenticated-connections-per-ip) and for the IP recorded on file-upload activity, so without this every user shares one budget.

Set [`api.trusted_proxies`](../../wings/configuration.md#api-trusted-proxies):

::: code-group
```yaml [Wings as a binary or package]
# Wings listens on 127.0.0.1, so the proxy connects from the same machine:
api:
  trusted_proxies:
    - 127.0.0.1
```
```yaml [Wings in Docker]
# Print the gateway address inside the Wings compose directory:
#   docker inspect -f '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}' $(docker compose ps -q wings)
api:
  trusted_proxies:
    - 172.20.0.1
```
:::

The list takes IPs or CIDR ranges. When a request arrives from one of them, Wings reads `X-Forwarded-For` (walking the list from the right and skipping every trusted address) and falls back to `X-Real-IP`. When it arrives from anywhere else, both headers are ignored. Trusting too much lets a visitor spoof their IP by sending the header themselves.

You don't need to trust the Panel here. It only relays consoles and uploads in [Wings Proxy Mode](../../wings/advanced/exposing-wings-in-a-homelab.md), and there it authenticates the forwarded IP with the node token, which works as long as the Panel reaches Wings directly. If a proxy-mode node's URL points at this proxy instead, the proxy's `X-Forwarded-For` wins and Wings records the Panel's address.

::: tip Editing a bind-mounted config is awkward
Any configuration key can also be set with a `CALAGOPUS_`-prefixed environment variable, which Wings re-applies after every configuration push from the Panel. On the `wings` service in `compose.yml`:

```yaml
    environment:
      CALAGOPUS_API_TRUSTED_PROXIES: '["172.20.0.1"]'
```
:::

### Apply the Changes

::: code-group
```bash [Binary or package]
sudo systemctl restart wings
```
```bash [Docker]
docker compose up -d
```
:::

Then confirm Wings answers on the loopback address, and only there:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/system
```

A `401` is the expected answer, since the request carries no token. It proves Wings is listening and the proxy will be able to reach it. From another machine, `http://<node-ip>:8080` should now time out or be refused.

## Step 2: Configure the Proxy

Every configuration below does the same things. If you use a proxy that isn't listed, these are the settings to replicate:

| Setting | Why Wings needs it |
| --- | --- |
| Forward to `http://127.0.0.1:8080` | The address Wings listens on after Step 1 |
| Pass `Upgrade` and `Connection` through | The console, live statistics, transfers and the node's system log use WebSockets |
| Allow `HEAD`, `PATCH` and `DELETE` | Resumable uploads need all three: `HEAD` reads the current offset, `PATCH` appends a chunk, `DELETE` discards a cancelled upload |
| No request body limit | Server transfers and file copies from another node arrive as one chunked request per stream, carrying the whole server. Wings lifts its own limit for them, and caps uploads with `api.upload_limit` itself |
| Request buffering off | With it on, the proxy reads a whole upload chunk or transfer to disk before Wings sees a byte of it |
| Response buffering off | Backups and file archives stream from disk and can be many gigabytes. With buffering on, the proxy keeps reading ahead of the client and writing the excess to temporary files |
| Read and write timeouts above 60s | A slow client moving a multi-gigabyte file, or another node transferring a server, holds one connection open far longer than the defaults allow |
| `X-Forwarded-For` or `X-Real-IP` | The client IPs from Step 1 |
| No CORS headers | Wings sets `Access-Control-Allow-Origin` from the Panel URL it was configured with, and exposes `Upload-Offset` for resumable uploads. A second copy from the proxy makes the browser reject every response |
| No `X-Robots-Tag` | Every endpoint answers `401` without a token, so there is nothing to crawl |

Other nodes use this proxy too: a server transfer or file copy to this node is POSTed by the source node's Wings to `/api/transfers` on this node's URL.

Only HTTP goes through the proxy. SFTP (port `2022`), the [private network](../../wings/advanced/private-network.md) tunnel and the game server ports all connect to the node directly, which works as long as the node's hostname resolves to its real IP.

::::tabs
=== Nginx

**1. Add the WebSocket map** to `/etc/nginx/nginx.conf`, inside `http { ... }` and outside any `server { ... }` block, if this node doesn't have it yet:

<<< @/snippets/reverse-proxies/nginx-websocket-map.conf{nginx}

This sends `Connection: upgrade` only on requests that actually ask for a WebSocket. Without it Nginx sends the header on every request, and multipart uploads and other ordinary traffic break.

**2. Create the site** as `/etc/nginx/sites-available/calagopus-wings.conf` on Debian and Ubuntu, or `/etc/nginx/conf.d/calagopus-wings.conf` on RHEL-based systems.

<<< @/snippets/reverse-proxies/wings/nginx.conf{nginx}

The `upstream` block names Wings once, and `keepalive 16` lets each Nginx worker keep up to 16 idle connections to it open for reuse instead of opening a new one for every request. Its name differs from the Panel's, so both sites can share one Nginx.

**3. Enable it and reload.** On Debian and Ubuntu, link the site into `sites-enabled`. On RHEL-based systems the file in `conf.d/` is already active.

```bash
sudo ln -s /etc/nginx/sites-available/calagopus-wings.conf /etc/nginx/sites-enabled/calagopus-wings.conf
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` checks the configuration before anything is reloaded. If it reports an error, fix the file first; the running Nginx keeps its old configuration until the reload succeeds.

::: details Nginx older than 1.25.1
The standalone `http2 on;` directive was added in 1.25.1. On older releases, drop that line and put the parameter back on the listen directives instead:

<<< @/snippets/reverse-proxies/nginx-http2-legacy.conf{nginx}
:::

=== Apache

**1. Enable the modules.**

```bash
sudo a2enmod rewrite headers proxy proxy_http proxy_wstunnel ssl http2
```

On RHEL-based systems the modules are compiled in or loaded already; you can skip this step.

**2. Create the site** as `/etc/apache2/sites-available/calagopus-wings.conf` on Debian and Ubuntu, or `/etc/httpd/conf.d/calagopus-wings.conf` on RHEL-based systems.

<<< @/snippets/reverse-proxies/wings/apache.conf{apache}

**3. Enable it and reload.**

```bash
sudo a2ensite calagopus-wings.conf
sudo apachectl configtest
sudo systemctl reload apache2
```

On RHEL-based systems the file in `conf.d/` is already active; run `apachectl configtest` and `systemctl reload httpd`.

::: details Apache older than 2.4.47
Check with `apache2 -v` (or `httpd -v`). Older releases don't understand the `upgrade=websocket` parameter and reject the configuration. Remove `upgrade=websocket` from the `ProxyPass` line and add these lines above it to route WebSocket requests through `mod_proxy_wstunnel` instead:

<<< @/snippets/reverse-proxies/wings/apache-websocket-legacy.conf{apache}
:::

=== Caddy

Caddy obtains and renews the certificate on its own, passes WebSockets through, sets `X-Forwarded-For`, and neither limits nor buffers a whole body unless you ask it to, so the site block is short. Don't add a `request_body` limit here. It would cut off server transfers. Make sure ports `80` and `443` are reachable from the internet before starting it, because that is how Caddy proves it owns the domain.

Add this to `/etc/caddy/Caddyfile`:

<<< @/snippets/reverse-proxies/wings/Caddyfile{text}

Don't add `encode` to this site block. Wings already streams downloads with a known length, and compressing them again only costs CPU and breaks range requests, which the file manager uses to resume a download.

Then validate and reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

The first reload takes a few seconds longer while Caddy requests the certificate. `journalctl -u caddy -f` shows the progress if the site does not come up right away.

=== Traefik

This assumes Traefik already runs in Docker with the Docker provider enabled, a `websecure` entrypoint on port 443, and a certificate resolver named `letsencrypt`. Adjust those three names to match your Traefik setup. Traefik connects to Wings over a shared Docker network, so complete [Proxies running in Docker](./panel.md#proxies-running-in-docker) first, pointing it at the `wings` service instead of the Panel's `web`; the network below is called `proxy`.

Add the labels and network to the `wings` service in `compose.yml`, and remove the `8080:8080` port mapping while keeping `2022:2022`:

<<< @/snippets/reverse-proxies/wings/traefik-compose.yml{yaml}

Traefik forwards WebSockets, sets `X-Forwarded-For`, and neither buffers nor limits request bodies, so the router itself needs nothing more. One entrypoint default gets in the way: `respondingTimeouts.readTimeout` is `60s` and covers reading the whole request, body included, so slow uploads are cut off, and so is any server transfer that takes longer than the limit. `0` disables it:

<<< @/snippets/reverse-proxies/wings/traefik-entrypoint.yml{yaml}

That applies to every router on the entrypoint. If other services share it, give Wings an entrypoint of its own instead.

Apply the compose change with `docker compose up -d`; Traefik picks the container up within a few seconds. A static configuration change needs Traefik itself restarted.

=== Nginx Proxy Manager

Nginx Proxy Manager runs as a container, so it reaches Wings over a shared Docker network rather than `127.0.0.1`. Complete [Proxies running in Docker](./panel.md#proxies-running-in-docker) first, pointing it at the `wings` service instead of the Panel's `web`, then add a proxy host in the web UI:

1. Open **Hosts → Proxy Hosts → Add Proxy Host**.
2. On the **Details** tab set **Domain Names** to the node's hostname, **Scheme** to `http`, **Forward Hostname / IP** to `wings` (the service name on the shared network) and **Forward Port** to `8080`. Turn on **Websockets Support**.
3. On the **SSL** tab pick **Request a new SSL Certificate**, and enable **Force SSL** and **HTTP/2 Support**.
4. On the **Advanced** tab put this into **Custom Nginx Configuration**:

<<< @/snippets/reverse-proxies/wings/npm-custom.conf{nginx}

5. Save.

Nginx Proxy Manager sets `X-Forwarded-For`, `X-Real-IP` and `X-Forwarded-Proto` on its own. The block above lifts its 2000 MB body limit, which a server transfer exceeds, raises its `90s` timeouts and turns off its response buffering. Don't add a `location /` there; Nginx Proxy Manager generates its own.

::::

## Step 3: Point the Panel at the Proxied URL

In **Admin → Nodes → (your node) → General**, set **URL** to `https://<node-domain>` **without a port**. The proxy listens on `443`, which is what the URL implies. The form warns that no port was given and offers to add `:8080`; ignore it here, since `:8080` would bypass the proxy. Leave **Public URL** empty unless you want browsers to use a different address than the Panel does.

Then open the node's **Configuration** tab and run **Verify Connection**. Both checks have to pass: **Backend to Wings** proves the Panel reaches the node through the proxy, and **Frontend to Wings** proves your browser does, which the console, uploads and downloads depend on.

Finish with a real transfer: open the console, upload a file over 95 MiB so a resumable chunk goes through the proxy, and download a backup. If you move servers between nodes, transfer one to this node too.

## Docker and Cloudflare

If your proxy runs in Docker, or the node sits behind Cloudflare, the same adjustments as the Panel apply, just aimed at Wings' port `8080` instead of the Panel's `8000`:

- [Proxies Running in Docker](./panel.md#proxies-running-in-docker): forward to the Wings service name over a shared Docker network instead of a published port, and trust that network's subnet in `api.trusted_proxies` instead of a single gateway address.
- [Cloudflare](./panel.md#cloudflare): trust Cloudflare's IP ranges in `api.trusted_proxies` alongside your proxy's address, set the zone's SSL/TLS mode to Full (strict), and keep SFTP, game ports and the [private network](../../wings/advanced/private-network.md) tunnel on a DNS-only (grey cloud) hostname, since none of them are HTTP.

Cloudflare is a poor fit for a node hostname either way: its per-plan request size cap applies to uploads, and its request duration limit cuts long backup downloads off with a `524`. A DNS-only record for the node avoids both. See [Backup configurations](../../wings/advanced/backup-configurations.md).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| 502 Bad Gateway, or the proxy's own error page | The proxy can't reach Wings. Check that it's running with `systemctl status wings` or `docker compose ps`, and that `curl -I http://127.0.0.1:8080/api/system` answers on the node. If every request fails immediately, `api.ssl.enabled` is probably still `true` while the proxy forwards plain HTTP; see [Step 1](#turn-off-wings-own-ssl). If the proxy runs in Docker, make sure both containers are on the same network and the forward target is the service name, not `127.0.0.1`. |
| The console stays on "connecting" and live statistics never appear | WebSocket upgrades aren't getting through. On Nginx, confirm the `map` block exists in `nginx.conf` and both `Upgrade` and `Connection` headers are set. On Apache, check the version note above. On Nginx Proxy Manager, enable **Websockets Support**. |
| Uploads, server transfers or file copies to this node fail with `413 Request Entity Too Large` | The proxy still has a body limit. Set `client_max_body_size 0` on Nginx or Nginx Proxy Manager, `LimitRequestBody 0` on Apache, and remove any `request_body` block on Caddy. |
| Uploads fail with `417 Expectation Failed` and a message about the file size | That one is Wings, not the proxy: the file is larger than [`api.upload_limit`](../../wings/configuration.md#api-upload-limit). Raise it in `config.yml` and restart Wings. The proxy's body limit does not need to change with it. |
| Large uploads, downloads or server transfers die partway through, always after about the same time | A proxy timeout. Raise `proxy_read_timeout`, `proxy_send_timeout` and `send_timeout` on Nginx, or `ProxyTimeout` on Apache. On Traefik, set `respondingTimeouts.readTimeout` to `0`, since it counts the whole request rather than the gap between reads. |
| Downloads fill the proxy's disk with temporary files | Response buffering is on. Set `proxy_buffering off` on Nginx, or add it to **Custom Nginx Configuration** on Nginx Proxy Manager. Caddy and Traefik stream by default. |
| An upload resumes from `0` every time, or the browser console complains about a missing `Upload-Offset` header | The proxy is dropping the response header Wings exposes for resumable uploads, or answering the `HEAD` and `PATCH` requests itself. Remove any CORS or method restrictions you added; Wings sets `Access-Control-Expose-Headers: Upload-Offset` itself. |
| Every request fails with a CORS error in the browser console | Either the proxy adds its own `Access-Control-Allow-Origin` next to Wings', which browsers reject, or the Panel URL under **Admin → Settings → Application** no longer matches the address the browser is using. Wings allows exactly the origin the Panel told it about. |
| Rate limits or connection limits trigger for everyone at once, as if every user shares one budget | `api.trusted_proxies` doesn't contain the address the proxy connects from. Re-check [Step 1](#trust-the-proxy-s-address); the address can change if the compose network was recreated. |
| "Frontend to Wings" fails while "Backend to Wings" passes | The Panel can reach the node but your browser can't. Usually the node's certificate isn't valid for the hostname, the hostname doesn't resolve publicly, or port 443 is blocked between you and the node. |
| Browser shows a certificate warning | The certificate has expired or was issued for a different name. See [Generating SSL Certificates](../ssl-certificates.md#troubleshooting) for renewal problems. |

Problems that aren't caused by the proxy, such as the node URL, tokens or clock skew, are collected on the [Troubleshooting](../troubleshooting.md) page.
