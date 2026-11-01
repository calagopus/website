---
title: SSL for DB Agent
description: Serve the Calagopus DB Agent management API and database proxies over TLS on a Docker or standalone install, point the Panel at it, and keep the certificate renewing.
---

# Securing DB Agent with SSL

DB Agent has two kinds of listeners, and each can use TLS on its own:

| Listener | Default port | Who connects |
| --- | --- | --- |
| Management API (`api`) | `8090` | The Panel, authenticating with the host token |
| Database proxies (`postgres`, `mariadb`, `mongodb`, `redis`) | `5432`, `3306`, `27017`, `6379` | Game servers and users connecting to their databases |

Browsers never connect to DB Agent directly; database consoles and logs go through the Panel. TLS on the management API matters when the Panel reaches the agent over a network you don't trust, such as the internet, because the host token and database data travel over that connection. TLS on the database proxies encrypts users' database connections.

TLS is offered, not enforced: a client that doesn't ask for it still connects in plain text, so existing connections keep working after you turn it on.

## Pick an Approach

| Approach | When to use it |
| --- | --- |
| DB Agent's built-in TLS (this guide) | Works for the management API and the database proxies. Point DB Agent at the certificate files and you're done. |
| [Reverse proxy](./reverse-proxy.md) in front of the management API | A proxy already runs on the machine, or you want one place to manage certificates. It only covers the management API, because the database proxies don't speak HTTP. |

## Prerequisites

- A domain for the agent (`<agent-domain>` below) with an `A` record, plus `AAAA` for IPv6, pointing at it.
- A certificate for that domain, issued on the agent's machine. [SSL Certificates](../../additional/ssl-certificates.md) covers certbot, acme.sh, lego and other sources. Use the DNS challenge if port 80 on the machine isn't reachable from the internet.
- If users reach their databases through a different name, the **Public Host** set on the database agent host in the Panel, the certificate has to cover that name too. Clients that verify the certificate reject it otherwise.

## Enable TLS in DB Agent

Every listener has its own [`tls` block](../configuration.md#tls-configuration). The Panel never pushes `api.tls`, so it is only ever set in the agent's own `config.yml`. Pick the tab that matches how DB Agent is installed:

:::: tabs
=== Docker

For DB Agent running from the DB Agent compose stack.

### 1. Copy the certificate into the mounted directory

The DB Agent compose file mounts `/etc/ssl/certs/db-agent/` from the host into the container, and no other certificate directory. Certbot's `/etc/letsencrypt/live/` directory is not visible inside the container, and mounting only `live/` does not work either, because the files in it are symlinks into `archive/`.

Copy the certificate into the mounted directory instead, and let a certbot deploy hook keep the copy fresh. Replace `example.com` with the agent's domain:

```bash
sudo mkdir -p /etc/ssl/certs/db-agent
sudo nano /etc/letsencrypt/renewal-hooks/deploy/db-agent-certs.sh
```

```bash
#!/bin/bash
cp -L /etc/letsencrypt/live/example.com/fullchain.pem /etc/ssl/certs/db-agent/fullchain.pem
cp -L /etc/letsencrypt/live/example.com/privkey.pem   /etc/ssl/certs/db-agent/privkey.pem
chmod 600 /etc/ssl/certs/db-agent/privkey.pem
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/db-agent-certs.sh
sudo /etc/letsencrypt/renewal-hooks/deploy/db-agent-certs.sh
```

The last line runs the hook once by hand so the files exist right away; certbot runs it after every renewal from then on. With acme.sh, pass `--key-file /etc/ssl/certs/db-agent/privkey.pem` and `--fullchain-file /etc/ssl/certs/db-agent/fullchain.pem` to `--install-cert` instead. With any other client, copy the full chain and key into the same directory after every renewal.

### 2. Point DB Agent at the copies

In `config.yml` in the DB Agent compose directory, enable TLS on the management API:

```yaml
api:
  tls:
    enabled: true
    cert: /etc/ssl/certs/db-agent/fullchain.pem
    key: /etc/ssl/certs/db-agent/privkey.pem
```

Add the same `tls` block under each database proxy you want to encrypt. They can all share one certificate:

```yaml
postgres:
  tls:
    enabled: true
    cert: /etc/ssl/certs/db-agent/fullchain.pem
    key: /etc/ssl/certs/db-agent/privkey.pem
```

`mariadb`, `mongodb` and `redis` take the same block.

### 3. Restart the container

From the DB Agent compose directory:

```bash
sudo docker compose restart db-agent
```

### 4. Renewal

The copy hook from step 1 runs after every certbot renewal, and DB Agent re-reads every listener's certificate files from disk once a day, so a renewed certificate is picked up within 24 hours. To switch immediately, run `sudo docker compose restart db-agent` in the DB Agent compose directory.

=== Standalone

For DB Agent installed as a binary or from a package. The changes go into `/etc/calagopus-db-agent/config.yml`.

### 1. Point DB Agent at the certificate

Enable TLS on the management API. With certbot, the files are in `/etc/letsencrypt/live/<agent-domain>/`:

```yaml
api:
  tls:
    enabled: true
    cert: /etc/letsencrypt/live/<agent-domain>/fullchain.pem
    key: /etc/letsencrypt/live/<agent-domain>/privkey.pem
```

Add the same `tls` block under each database proxy you want to encrypt. They can all share one certificate:

```yaml
postgres:
  tls:
    enabled: true
    cert: /etc/letsencrypt/live/<agent-domain>/fullchain.pem
    key: /etc/letsencrypt/live/<agent-domain>/privkey.pem
```

`mariadb`, `mongodb` and `redis` take the same block. With acme.sh, lego or a certificate from another source, use the paths of those files instead.

### 2. Restart DB Agent

```bash
sudo systemctl restart db-agent
```

On OpenRC (Alpine), run `rc-service db-agent restart` instead.

### 3. Renewal

DB Agent re-reads every listener's certificate files from disk once a day, so a renewed certificate is picked up on its own within 24 hours. If you would rather have it switch immediately, restart it from your ACME client after every renewal:

| Client | How |
| --- | --- |
| Certbot | A deploy hook, shown below |
| acme.sh | `--reloadcmd "systemctl restart db-agent"` on `--install-cert` |
| lego | `--renew-hook "systemctl restart db-agent"` on the `renew` cron job |

For certbot, create the hook:

```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-db-agent.sh
```

```bash
#!/bin/bash
systemctl restart db-agent 2>/dev/null
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-db-agent.sh
```

::::

::: tip Optional: kernel TLS
On Linux, [`tls.ktls_enabled`](../configuration.md#tls-ktls-enabled) hands encryption off to the kernel once the handshake completes, which mainly helps with bulk transfers. It is set per listener, and DB Agent falls back to userspace TLS on its own when the kernel can't do it.
:::

## Point the Panel at HTTPS

Once the management API uses TLS, open **Admin → Database Agent Hosts → (your host) → General** and change **URL** to `https://<agent-domain>:8090`. Then open the host's **Configuration** tab and click **Verify Connection**; the result appears in the **Backend to DB Agent** box.

## Connecting to Databases over TLS

With TLS on a database proxy, clients turn it on in their own connection settings, for example `sslmode=require` for PostgreSQL, the `--ssl` option of the MariaDB client, `tls=true` for MongoDB, or a `rediss://` URL for Redis.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| DB Agent exits on startup with `failed to load TLS certificate and key` | The paths in `api.tls` don't exist from DB Agent's point of view. On Docker, the certificate has to be inside `/etc/ssl/certs/db-agent/`; see the Docker tab under [Enable TLS in DB Agent](#enable-tls-in-db-agent). |
| **Verify Connection** fails after turning on TLS | The host's URL in the Panel still starts with `http://`, the certificate isn't valid for the hostname in the URL, or port `8090` is blocked between the Panel and the agent. |
| A database client rejects the certificate | The client connects through a name the certificate doesn't cover, usually the **Public Host**. Issue a certificate that includes that name. |
| DB Agent doesn't pick up the renewed certificate within a day | Restart it manually: `sudo systemctl restart db-agent`, or `sudo docker compose restart db-agent` in the DB Agent compose directory. |
| Every request through a reverse proxy fails | `api.tls` is still enabled while the proxy forwards plain HTTP. Turn it off as described in the [reverse proxy guide](./reverse-proxy.md#step-1-prepare-db-agent). |
