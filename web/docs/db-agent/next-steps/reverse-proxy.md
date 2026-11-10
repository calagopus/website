---
title: Reverse Proxy for DB Agent
description: Put Nginx, Apache or Caddy in front of the Calagopus DB Agent management API, serve it over HTTPS on port 443, and keep client IPs working.
---

# Putting DB Agent Behind a Reverse Proxy

A reverse proxy can only front DB Agent's management API, the HTTP connection the Panel uses to manage the agent. The database proxies on ports `5432`, `3306`, `27017` and `6379` speak the databases' own protocols, not HTTP, so they stay on their own ports; encrypt them with [DB Agent's built-in TLS](./ssl.md) instead. For how a proxy fits into the request path in general, see [Setting up a Reverse Proxy](../../additional/reverse-proxies.md).

Most agents don't need a proxy at all: DB Agent can serve HTTPS itself. Use a proxy when one already runs on the machine, or you want one place to manage certificates.

## Prerequisites

- DB Agent [installed](../installation/index.md), reachable at `http://<agent-ip>:8090`.
- A domain for the agent (`<agent-domain>` below) with an `A` record, plus `AAAA` for IPv6, pointing at it.
- Ports `80` and `443` open, and forwarded on your router if the machine is at home.
- A [TLS certificate](../../additional/ssl-certificates.md) for the domain from a public CA. Caddy issues its own.
- The proxy installed on the same machine.

::: warning
A broken proxy configuration makes the agent unreachable for the Panel until it's fixed, so keep a terminal open. Existing database connections are not affected, since they don't go through the proxy. Step 1 restarts DB Agent, which does drop them.
:::

## Step 1: Prepare DB Agent

Everything in this step happens on the agent's machine. The Panel never pushes `api.bind`, `api.tls` or `api.trusted_proxies`, so they can only be set there.

Merge the `config.yml` snippets below into the existing `api:` block. DB Agent won't start if `api:` appears twice.

Pick the tab that matches how DB Agent is installed:

:::: tabs
=== Docker

The changes go into `config.yml` in the DB Agent compose directory, plus one change in `compose.yml`.

### Turn Off DB Agent's Own TLS

The proxy terminates TLS and forwards to DB Agent over plain HTTP. With [`api.tls`](./ssl.md) still enabled, DB Agent rejects plain HTTP and every request fails. In `config.yml`:

```yaml
api:
  tls:
    enabled: false
```

This is the default on a fresh install, so it only needs changing on an agent that ran with its own certificate before.

### Stop Exposing Port 8090

The compose file publishes port `8090` on every interface of the host, so it stays reachable from the internet even after the proxy is in place. Restrict it to the loopback interface in `compose.yml`, and leave the database ports alone. `api.bind` stays `0.0.0.0:8090` inside the container:

```yaml
services:
  db-agent:
    ports:
      - 5432:5432
      - 3306:3306
      - 27017:27017
      - 6379:6379
      - 127.0.0.1:8090:8090
```

### Trust the Proxy's Address

Connections from the proxy arrive from the gateway of the DB Agent container's Docker network. Print that address inside the DB Agent compose directory:

```bash
sudo docker inspect -f '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}' $(sudo docker compose ps -q db-agent)
```

Then set [`api.trusted_proxies`](../configuration.md#api-trusted-proxies) to it in `config.yml`:

```yaml
api:
  trusted_proxies:
    - 172.20.0.1
```

### Apply the Changes

```bash
sudo docker compose up -d --force-recreate
```

=== Standalone

For DB Agent installed as a binary or from a package. The changes go into `/etc/calagopus-db-agent/config.yml`.

### Turn Off DB Agent's Own TLS

The proxy terminates TLS and forwards to DB Agent over plain HTTP. With [`api.tls`](./ssl.md) still enabled, DB Agent rejects plain HTTP and every request fails:

```yaml
api:
  tls:
    enabled: false
```

This is the default on a fresh install, so it only needs changing on an agent that ran with its own certificate before.

### Stop Exposing Port 8090

DB Agent's management API listens on every interface by default ([`api.bind`](../configuration.md#api-bind) is `0.0.0.0:8090`), so port `8090` stays reachable from the internet even after the proxy is in place. Restrict it to the loopback interface:

```yaml
api:
  bind: 127.0.0.1:8090
```

Keep the port at `8090`. It is the port every configuration in Step 2 forwards to. The database proxies have their own `bind` settings and are not affected.

### Trust the Proxy's Address

The proxy runs on the same machine and the API listens on `127.0.0.1`, so the proxy connects from the loopback address. Set [`api.trusted_proxies`](../configuration.md#api-trusted-proxies) to it:

```yaml
api:
  trusted_proxies:
    - 127.0.0.1
```

### Apply the Changes

```bash
sudo systemctl restart db-agent
```

On OpenRC (Alpine), run `rc-service db-agent restart` instead.

::::

When a request arrives from a trusted address, DB Agent reads the client's IP from `X-Forwarded-For` (walking the list from the right and skipping every trusted address) and falls back to `X-Real-IP`. From anywhere else, both headers are ignored. Only list addresses you control.

Then confirm the API answers on the loopback address, and only there:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/api/status
```

A `401` is the expected answer, since the request carries no token. It proves DB Agent is listening and the proxy will be able to reach it. A `000` means DB Agent isn't running or `api.tls.enabled` is still `true`. From another machine, `http://<agent-ip>:8090` should now time out or be refused.

## Step 2: Configure the Proxy

Every configuration below does the same things. If you use a proxy that isn't listed, these are the settings to replicate:

| Setting                                 | Why DB Agent needs it                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| Forward to `http://127.0.0.1:8090`      | The address the management API listens on after Step 1                                |
| Pass `Upgrade` and `Connection` through | The Panel streams instance logs and statistics over WebSockets                        |
| No request body limit                   | A database import arrives as one streamed request carrying the whole dump             |
| Request and response buffering off      | Imports and exports stream; with buffering on, the proxy spools them to disk first    |
| Read and write timeouts above 60s       | A large import or export holds one connection open far longer than the defaults allow |
| `X-Forwarded-For` or `X-Real-IP`        | The client IPs from Step 1                                                            |

::::: tabs
=== Nginx

:::: tabs key:proxy-os
==== Debian / Ubuntu

**1. Add the WebSocket map** to `/etc/nginx/nginx.conf`, inside `http { ... }` and outside any `server { ... }` block, if this machine doesn't have it yet:

<<< @/snippets/reverse-proxies/nginx-websocket-map.conf{nginx}

**2. Create the site** as `/etc/nginx/sites-available/calagopus-db-agent.conf`. With nginx.org packages, use `/etc/nginx/conf.d/calagopus-db-agent.conf` instead and skip the `ln` line in step 3.

<<< @/snippets/reverse-proxies/db-agent/nginx.conf{nginx}

**3. Enable it and reload.** Link the site into `sites-enabled`.

```bash
sudo ln -s /etc/nginx/sites-available/calagopus-db-agent.conf /etc/nginx/sites-enabled/calagopus-db-agent.conf
sudo nginx -t
sudo systemctl reload nginx
```

==== RHEL / Fedora / Rocky / Alma

**1. Add the WebSocket map** to `/etc/nginx/nginx.conf`, inside `http { ... }` and outside any `server { ... }` block, if this machine doesn't have it yet:

<<< @/snippets/reverse-proxies/nginx-websocket-map.conf{nginx}

**2. Create the site** as `/etc/nginx/conf.d/calagopus-db-agent.conf`. If `nginx -v` shows a version older than 1.25.1, as RHEL 9's default does, apply the note below the tabs.

<<< @/snippets/reverse-proxies/db-agent/nginx.conf{nginx}

**3. Let Nginx reach DB Agent.** SELinux blocks Nginx from connecting to port `8090` by default. Skip this if `getenforce` prints `Disabled`.

```bash
sudo setsebool -P httpd_can_network_connect 1
```

**4. Test it and start Nginx.** The file in `conf.d/` is already active.

```bash
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

::::

::: details Nginx older than 1.25.1
The standalone `http2 on;` directive was added in 1.25.1. On older releases, drop that line and put the parameter back on the listen directives instead:

<<< @/snippets/reverse-proxies/nginx-http2-legacy.conf{nginx}
:::

=== Apache

:::: tabs key:proxy-os
==== Debian / Ubuntu

**1. Enable the modules.**

```bash
sudo a2enmod rewrite headers proxy proxy_http proxy_wstunnel ssl http2
```

**2. Create the site** as `/etc/apache2/sites-available/calagopus-db-agent.conf`.

<<< @/snippets/reverse-proxies/db-agent/apache.conf{apache}

**3. Enable it and reload.**

```bash
sudo a2ensite calagopus-db-agent.conf
sudo apachectl configtest
sudo systemctl reload apache2
```

==== RHEL / Fedora / Rocky / Alma

**1. Let Apache reach DB Agent.** SELinux blocks Apache from connecting to port `8090` by default. Skip this if `getenforce` prints `Disabled`.

```bash
sudo setsebool -P httpd_can_network_connect 1
```

**2. Install the TLS module and start Apache.** The first start generates a default certificate that the test in step 4 needs.

```bash
sudo dnf install mod_ssl
sudo systemctl enable --now httpd
```

**3. Create the site** as `/etc/httpd/conf.d/calagopus-db-agent.conf`.

<<< @/snippets/reverse-proxies/db-agent/apache-rhel.conf{apache}

**4. Test it and reload.** The file in `conf.d/` is already active.

```bash
sudo apachectl configtest
sudo systemctl reload httpd
```

::::

::: details Apache older than 2.4.47
Check with `apache2 -v` (or `httpd -v`). Older releases don't understand the `upgrade=websocket` parameter and reject the configuration. Remove `upgrade=websocket` from the `ProxyPass` line and add these lines above it to route WebSocket requests through `mod_proxy_wstunnel` instead:

<<< @/snippets/reverse-proxies/db-agent/apache-websocket-legacy.conf{apache}
:::

=== Caddy

Caddy obtains and renews the certificate on its own, passes WebSockets through, sets `X-Forwarded-For`, and neither limits nor buffers a whole body unless you ask it to. Make sure ports `80` and `443` are reachable from the internet before starting it, because that is how Caddy proves it owns the domain.

Add this to `/etc/caddy/Caddyfile`:

<<< @/snippets/reverse-proxies/db-agent/Caddyfile{text}

Then validate and reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

:::::

## Step 3: Point the Panel at the Proxied URL

In **Admin → Database Agent Hosts → (your host) → General**, set **URL** to `https://<agent-domain>` **without a port**. The proxy listens on `443`, which is what the URL implies. The form warns that no port was given and offers to add `:8090`; ignore it here, since `:8090` would bypass the proxy.

Then open the host's **Configuration** tab, click **Reveal Configuration**, and click **Verify Connection**; the result appears in the **Backend to DB Agent** box. The tab's port mismatch warning is expected behind a proxy.

::: warning Don't re-apply the generated configuration
It sets `api.bind` back to `0.0.0.0:8090`, which undoes Step 1 on a standalone install, and pasting it over `config.yml` removes your other settings. After **Reset Token**, change only the token:

- **Standalone:** run `sudo calagopus-db-agent configure --token <TOKEN>`, then restart the service.
- **Docker:** set `api.token` in `config.yml`, then run `sudo docker compose restart db-agent`.
:::

## Troubleshooting

::: details 502 Bad Gateway, or the proxy's own error page
The proxy can't reach DB Agent. Check that it's running with `sudo systemctl status db-agent` or `sudo docker compose ps`, and that `curl -I http://127.0.0.1:8090/api/status` answers on the machine. If every request fails immediately, `api.tls.enabled` is probably still `true` while the proxy forwards plain HTTP.

`Permission denied` in the proxy's error log means SELinux is blocking it; see the RHEL tab in Step 2.
:::

::: details DB Agent exits on startup with `duplicate mapping key: api`
`config.yml` contains `api:` more than once. Merge the settings from Step 1 into a single block.
:::

::: details Instance logs and statistics in the Panel stay empty
WebSocket upgrades aren't getting through. On Nginx, confirm the `map` block exists in `nginx.conf` and both `Upgrade` and `Connection` headers are set. On Apache, check the version note above. If **Verify Connection** passes, check the certificate: the Panel's WebSocket client only trusts public CAs.
:::

::: details A database import fails with `413 Request Entity Too Large`
The proxy still has a body limit. Set `client_max_body_size 0` on Nginx or `LimitRequestBody 0` on Apache, and remove any `request_body` block on Caddy.
:::

::: details Large imports or exports die partway through, always after about the same time
A proxy timeout. Raise `proxy_read_timeout`, `proxy_send_timeout` and `send_timeout` on Nginx, or `ProxyTimeout` on Apache.
:::

::: details **Verify Connection** fails
The URL still has `:8090` or `http://`, the certificate isn't valid for the hostname, or port `443` is blocked between the Panel and the agent.
:::
