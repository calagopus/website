---
title: SSL for Wings
description: Serve a Calagopus Wings node over HTTPS with its built-in SSL on a binary, package or Docker install, point the Panel at it, and keep the certificate renewing.
---

# Securing Wings with SSL

Browsers connect to Wings directly for the console, file uploads and downloads. When the Panel is served over HTTPS, browsers refuse plain `http://` and `ws://` connections from it, so the node has to be served over HTTPS too. SSL is disabled on a fresh Wings install.

## Pick an Approach

You have three ways to secure a standalone node, and most setups only need the first:

| Approach                                                       | When to use it                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Wings' built-in SSL (this guide)                               | The node runs nothing else on ports 443/8080. Point Wings at the certificate files and you're done. No proxy involved. |
| [Reverse proxy](./reverse-proxy.md) in front of Wings          | A proxy already runs on the node, you want Wings on port 443, or you want one place to manage certificates.            |
| [Wings Proxy Mode](../advanced/exposing-wings-in-a-homelab.md) | The node can't be reached from the internet at all. The Panel relays browser traffic to it.                            |

With the first two options, browsers connect to Wings directly for the console, file uploads and downloads, so the node's public URL must be reachable from your users' machines. Only Wings Proxy Mode routes that traffic through the Panel instead.

The Wings bundled with the [All-in-One image](../../panel/installation/docker.md#option-a-all-in-one-recommended-for-single-node-setups) is always reached through the Panel, so it needs no certificate of its own.

## Prerequisites

- A domain for the node (`<node-domain>` below) with an `A` record, plus `AAAA` for IPv6, pointing at it.
- A certificate for that domain, issued on the node itself. [SSL Certificates](../../additional/ssl-certificates.md) covers certbot, acme.sh, lego and other sources. Use the DNS challenge if port 80 on the node isn't reachable from the internet.

## Enable SSL in Wings

The Panel never pushes `api.ssl` to Wings, so it is only ever set in the node's own `config.yml`. Pick the tab that matches how Wings is installed:

:::: tabs
=== Docker

For Wings running from the Wings compose stack.

### 1. Copy the certificate into the mounted directory

The Wings compose file mounts `/etc/ssl/certs/wings/` from the host into the container, and no other certificate directory. Certbot's `/etc/letsencrypt/live/` directory is not visible inside the container, and mounting only `live/` does not work either, because the files in it are symlinks into `archive/`.

Copy the certificate into the mounted directory instead, and let a certbot deploy hook keep the copy fresh. Replace `example.com` with the node's domain:

```bash
sudo mkdir -p /etc/ssl/certs/wings
sudo nano /etc/letsencrypt/renewal-hooks/deploy/wings-certs.sh
```

```bash
#!/bin/bash
cp -L /etc/letsencrypt/live/example.com/fullchain.pem /etc/ssl/certs/wings/fullchain.pem
cp -L /etc/letsencrypt/live/example.com/privkey.pem   /etc/ssl/certs/wings/privkey.pem
chmod 600 /etc/ssl/certs/wings/privkey.pem
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/wings-certs.sh
sudo /etc/letsencrypt/renewal-hooks/deploy/wings-certs.sh
```

The last line runs the hook once by hand so the files exist right away; certbot runs it after every renewal from then on. With acme.sh, pass `--key-file /etc/ssl/certs/wings/privkey.pem` and `--fullchain-file /etc/ssl/certs/wings/fullchain.pem` to `--install-cert` instead. With any other client, copy the full chain and key into the same directory after every renewal.

### 2. Point Wings at the copies

In `config/config.yml` in the Wings compose directory:

```yaml
api:
  ssl:
    enabled: true
    cert: /etc/ssl/certs/wings/fullchain.pem
    key: /etc/ssl/certs/wings/privkey.pem
```

### 3. Restart the container

From the Wings compose directory:

```bash
sudo docker compose restart wings
```

### 4. Renewal

The copy hook from step 1 runs after every certbot renewal, and Wings re-reads the copied files from disk once a day, so a renewed certificate is picked up within 24 hours. To switch immediately, run `sudo docker compose restart wings` in the Wings compose directory.

=== Standalone

For Wings installed as a binary or from a package.

### 1. Point Wings at the certificate

Open `/etc/calagopus-wings/config.yml` and point [`api.ssl`](../configuration.md#api-ssl-enabled) at the certificate. With certbot, the files are in `/etc/letsencrypt/live/<node-domain>/`:

```yaml
api:
  host: 0.0.0.0
  port: 8080
  ssl:
    enabled: true
    cert: /etc/letsencrypt/live/<node-domain>/fullchain.pem
    key: /etc/letsencrypt/live/<node-domain>/privkey.pem
```

With acme.sh, lego or a certificate from another source, use the paths of those files instead.

### 2. Restart Wings

```bash
sudo systemctl restart wings
```

### 3. Renewal

Wings re-reads its certificate files from disk once a day, so a renewed certificate is picked up on its own within 24 hours. If you would rather have Wings switch immediately, restart it from your ACME client after every renewal:

| Client  | How                                                              |
| ------- | ---------------------------------------------------------------- |
| Certbot | A deploy hook, shown below                                       |
| acme.sh | `--reloadcmd "systemctl restart wings"` on `--install-cert`      |
| lego    | `--renew-hook "systemctl restart wings"` on the `renew` cron job |

For certbot, create the hook:

```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-services.sh
```

```bash
#!/bin/bash
systemctl restart wings 2>/dev/null
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-services.sh
```

::::

::: tip Optional: kernel TLS
On Linux, [`api.ssl.ktls_enabled`](../configuration.md#api-ssl-ktls-enabled) hands encryption off to the kernel once the handshake completes, which mainly speeds up large file transfers and backup downloads. Wings falls back to userspace TLS on its own when the kernel can't do it.
:::

## Point the Panel at HTTPS

In **Admin → Nodes → (your node) → General**, change **URL** to `https://<node-domain>:8080`, and **Public URL** too if you set one. Then open the node's **Configuration** tab, click **Reveal Configuration**, and run **Verify Connection**. Both checks have to pass: **Backend to Wings** proves the Panel reaches the node over HTTPS, and **Frontend to Wings** proves your browser does, which the console, uploads and downloads depend on.

## Troubleshooting

::: details `failed to load SSL certificate and key ... No such file or directory`
The paths in `api.ssl` don't exist from Wings' point of view. On Docker, the certificate has to be inside `/etc/ssl/certs/wings/`; see the Docker tab under [Enable SSL in Wings](#enable-ssl-in-wings). Alternatively, add `- /etc/letsencrypt:/etc/letsencrypt:ro` under the `wings` service's `volumes:` and recreate it, so the `live/` symlinks resolve inside the container.
:::

::: details Wings doesn't pick up the renewed certificate within a day
Restart it manually: `sudo systemctl restart wings`, or `sudo docker compose restart wings` in the Wings compose directory.
:::

::: details "Frontend to Wings" fails while "Backend to Wings" passes
The Panel can reach the node but your browser can't. Usually the certificate isn't valid for the hostname in the node's URL, the hostname doesn't resolve publicly, or port `8080` is blocked between you and the node.
:::

::: details The console spins forever, or the browser console shows `Mixed Content`
The node's URL in the Panel still starts with `http://`. Change it as described in [Point the Panel at HTTPS](#point-the-panel-at-https).
:::

::: details Every request through a reverse proxy fails with `502`
`api.ssl` is still enabled while the proxy forwards plain HTTP. Turn it off as described in the [reverse proxy guide](./reverse-proxy.md#turn-off-wings-own-ssl).
:::

::: details Browser shows a certificate warning
The certificate has expired or was issued for a different name. See [SSL Certificates](../../additional/ssl-certificates.md#troubleshooting) for renewal problems.
:::

Other node problems, such as tokens or clock skew, are collected on the [Troubleshooting](../../additional/troubleshooting.md) page.
