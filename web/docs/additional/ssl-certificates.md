---
title: SSL Certificates
description: Get a free Let's Encrypt certificate for your Calagopus Panel and Wings nodes with certbot or acme.sh, keep it renewing automatically, and wire it into Wings on bare metal or in Docker.
---

# Generating SSL Certificates

Passkeys, secure session cookies and several browser features only work over HTTPS. The browser connects to the Panel and, unless a node uses Wings Proxy Mode, to each Wings node directly, so each of them needs a certificate that is valid for its hostname. This guide walks you through getting one from [Let's Encrypt](https://letsencrypt.org), which issues certificates for free, using whichever ACME client you prefer. Certificates from [other sources](#other-sources-of-certificates) are covered at the end.

You need this before you:

- Put a [reverse proxy](reverse-proxies.md) in front of the Panel or a node, unless the proxy is Caddy, which fetches its own certificate.
- [Enable SSL directly in Wings](../wings/configuration.md#ssl-configuration) on a node without a proxy.

## What You End Up With

Whichever method you pick, the result is a pair of files:

| File | What it is | Who needs it |
| --- | --- | --- |
| `fullchain.pem` | Your certificate plus the intermediate chain browsers need to verify it | The `cert` side of every configuration |
| `privkey.pem` | The private key. Never share it or commit it anywhere | The `key` side of every configuration |

Certbot stores them under `/etc/letsencrypt/live/<domain>/`; acme.sh copies them wherever you tell it. Let's Encrypt certificates are valid for **90 days**, so the renewal step at the end of each method is not optional. Both tools set up automatic renewal for you; the guide shows how to check that it actually works.

## Before You Begin

- **Decide which hostnames you need.** One for the Panel (`panel.example.com`) and one per Wings node (`node1.example.com`). A single certificate can cover several names, and a wildcard certificate (`*.example.com`) covers every node at once, though wildcards need the DNS challenge.
- **Point the hostnames at the right machines.** Each hostname needs an `A` record (and `AAAA` for IPv6) that resolves to the public IP of the machine that will present the certificate. Let's Encrypt looks the name up during issuance, so this has to be in place first.
- **Pick a challenge type.** Let's Encrypt has to verify you control the domain. The HTTP challenge needs port `80` reachable from the internet on that machine. The DNS challenge needs API access to your DNS provider instead and works anywhere, including behind NAT.

Every command below is run on the machine that will use the certificate: the Panel host for the Panel's certificate, each node for its own.

:::: tabs
=== Method 1: Certbot (HTTP Challenge)

The most common method. Use it when port `80` on the machine is reachable from the internet.

### 1. Install certbot

Commands below are for Debian-based distributions using APT. For other systems, see the [official certbot website](https://certbot.eff.org/instructions).

```bash
sudo apt update
sudo apt install -y certbot
# Only if you use Nginx
sudo apt install -y python3-certbot-nginx
# Only if you use Apache
sudo apt install -y python3-certbot-apache
```

The Nginx and Apache plugins let certbot answer the challenge through your running webserver, so nothing has to be stopped during issuance or renewal. If nothing listens on port 80 yet (a fresh Wings node, for instance), certbot can run its own temporary webserver instead.

### 2. Generate the certificate

Replace `example.com` with the hostname you're issuing a certificate for. To cover multiple hostnames with one certificate, repeat the `-d` flag (e.g. `-d panel.example.com -d node1.example.com`).

```bash
# If Nginx is installed and running on this machine
sudo certbot certonly --nginx -d example.com
# If Apache is installed and running on this machine
sudo certbot certonly --apache -d example.com
# Standalone: nothing else listens on port 80 on this machine
# (typical for a Wings node). Stop nginx/apache first if one is running.
sudo certbot certonly --standalone -d example.com
```

You'll be prompted for an email address, which Let's Encrypt uses for expiry notices, then certbot issues the certificate. The files end up in `/etc/letsencrypt/live/example.com/`:

```bash
sudo ls -l /etc/letsencrypt/live/example.com/
```

Certbot's `live` directory contains symlinks into `/etc/letsencrypt/archive/`; the links are updated on every renewal so configurations that point at `live/` never need to change.

### 3. Renewal

Certbot installs a systemd timer (or cron job) that checks twice a day and renews any certificate within 30 days of expiry. If you used the `--nginx` or `--apache` plugin, that's all you need: the plugin reloads your webserver as part of the renewal.

Wings re-reads its certificate files from disk once a day, so a renewed certificate is picked up on its own within 24 hours. If you would rather have Wings switch immediately, or you used `--standalone` and want a webserver reloaded, add a deploy hook:

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

Certbot runs every script in `renewal-hooks/deploy/` after a successful renewal. Test the whole flow without waiting for the real expiry:

```bash
sudo certbot renew --dry-run
```

If the dry run passes, renewal is working. Check the timer is enabled as well:

```bash
systemctl list-timers certbot.timer
```

### Troubleshooting

An `Insecure Connection` or SSL/TLS error in the browser almost always means the certificate has expired. If `certbot renew` fails with something like:

`Error: Attempting to renew cert (domain) from /etc/letsencrypt/renew/domain.conf produced an unexpected error`

…it's usually because port 80 is already in use. Using the `--nginx` / `--apache` plugin flags (as above) avoids this. Otherwise, stop the webserver, renew, then start it again:

```bash
sudo systemctl stop nginx
sudo certbot renew
sudo systemctl start nginx
```

If Wings doesn't pick up the renewed certificate within a day, restart it manually:

```bash
sudo systemctl restart wings
```

=== Method 2: Certbot (DNS Challenge)

Use this if port 80 can't be exposed to the internet, for example, an internal Wings node behind NAT, or any setup where you'd rather not touch port 80 at all. It is also the only way to get a wildcard certificate.

### Using a DNS plugin (recommended)

DNS plugins automate the dns-01 challenge by creating and removing a `TXT` record via your DNS provider's API with no manual record editing, no exposed port 80, and full automatic renewal.

The plugin for some providers isn't included with the base `certbot` package. Check [certbot's plugin list](https://eff-certbot.readthedocs.io/en/latest/using.html#dns-plugins) for install instructions for yours. For many systems this means using [certbot.eff.org](https://certbot.eff.org)'s install instructions and selecting the **Wildcard** tab, which shows the DNS plugin package for your OS.

For Cloudflare specifically:

```bash
sudo apt install -y python3-certbot-dns-cloudflare
```

Create a credentials file using a restricted [API Token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) (requires `Zone:DNS:Edit` permission for the zone) rather than your Global API Key, since the Global key can access your entire Cloudflare account:

```bash
sudo nano /etc/letsencrypt/cloudflare.ini
```

```ini
dns_cloudflare_api_token = your_api_token_here
```

Restrict its permissions. Certbot will warn on every run if it can't:

```bash
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
```

Then issue the certificate:

```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d example.com
```

For a wildcard that covers every node, request both the bare domain and the wildcard:

```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d example.com -d '*.example.com'
```

If you're issuing through a registrar/CDN that's slow to propagate DNS, you can increase the default 10-second propagation wait:

```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 60 \
  -d example.com
```

The files end up in `/etc/letsencrypt/live/example.com/`, and certbot's systemd timer handles renewal automatically from here. Wings re-reads its certificate files daily, so no deploy hook is required for a native Wings install; add one as shown in the HTTP challenge tab if you want a webserver reloaded or Wings restarted straight away. Confirm renewal works with:

```bash
sudo certbot renew --dry-run
```

### Manual DNS challenge (no plugin)

If your provider doesn't have a plugin, you can complete the challenge manually instead:

```bash
sudo certbot certonly --manual --preferred-challenges dns -d example.com
```

Certbot shows a `TXT` record value to add to your DNS, then waits for you to confirm it's propagated before completing issuance.

::: warning
This manual flow **does not auto-renew**. You'd need to repeat the process and update the TXT record roughly every 60 days. Use a DNS plugin instead wherever one exists for your provider.
:::

=== Method 3: acme.sh

`acme.sh` is a lightweight, dependency-free alternative to certbot. It's useful if you'd rather avoid a Python toolchain. It defaults to ZeroSSL as the certificate authority; the commands below pass `--server letsencrypt` to stay on Let's Encrypt. This example uses Cloudflare's DNS API; see [acme.sh's DNS API docs](https://github.com/acmesh-official/acme.sh/wiki/dnsapi) for other providers.

### 1. Install acme.sh
```bash
curl https://get.acme.sh | sh -s email=you@example.com
source ~/.bashrc
```

### 2. Set your DNS API credentials

```bash
export CF_Token="your_cloudflare_api_token"
export CF_Account_ID="your_cloudflare_account_id"
```

acme.sh saves these to its own configuration after the first successful issue, so they are available to the renewal cron job without exporting them again.

### 3. Issue the certificate

```bash
acme.sh --issue --server letsencrypt --dns dns_cf -d example.com
```

If port 80 is reachable and you would rather skip the DNS API, acme.sh can answer the HTTP challenge with its own temporary listener instead. It needs the `socat` package installed, and nothing else may be bound to port 80 while it runs:

```bash
acme.sh --issue --server letsencrypt --standalone -d example.com
```

### 4. Install it where your services expect it

`acme.sh` keeps certificates in its own directory by default; use `--install-cert` to copy them to standard paths and reload services on renewal:

```bash
acme.sh --install-cert -d example.com \
  --key-file       /etc/ssl/private/example.com.key \
  --fullchain-file /etc/ssl/certs/example.com.crt \
  --reloadcmd      "systemctl restart wings"
```

Use these two paths wherever a configuration asks for the certificate and key, in place of the `/etc/letsencrypt/live/...` paths shown elsewhere in the docs. For Wings in Docker, install into `/etc/ssl/certs/wings/` instead, as described [below](#using-the-certificate-with-wings-in-docker).

### 5. Renewal

`acme.sh` installs its own cron job during setup, renewing automatically around 60 days in (ahead of the 90-day expiry). Your `--reloadcmd` runs after every successful renewal automatically.

Verify the cron job exists:

```bash
crontab -l | grep acme.sh
```

=== Method 4: lego

[lego](https://go-acme.github.io/lego/) is a single static binary written in Go, with built-in support for well over a hundred DNS providers and no runtime dependencies. It is a good fit for minimal systems and for Wings nodes where you do not want certbot's Python stack. This example uses Cloudflare; the [provider list](https://go-acme.github.io/lego/dns/) has the environment variables for every other provider.

### 1. Install lego

Debian and Ubuntu ship it as a package. Elsewhere, download the binary from the [releases page](https://github.com/go-acme/lego/releases) and put it in `/usr/local/bin`.

```bash
sudo apt install -y lego
```

### 2. Issue the certificate

lego reads DNS credentials from environment variables and stores everything under the directory given with `--path`.

::: code-group
```bash [DNS challenge]
export CLOUDFLARE_DNS_API_TOKEN="your_cloudflare_api_token"

sudo -E lego --path /etc/lego --email you@example.com --accept-tos \
  --dns cloudflare -d example.com run
```
```bash [HTTP challenge]
# Needs port 80 free while it runs.
sudo lego --path /etc/lego --email you@example.com --accept-tos \
  --http -d example.com run
```
:::

The files land in `/etc/lego/certificates/`, named after the first domain: `example.com.crt` is the full chain and `example.com.key` the private key. Use those two paths wherever a configuration asks for the certificate and key.

### 3. Renewal

lego has no built-in scheduler, so add a cron job that runs `renew` once a day. `renew` only does anything when the certificate is within the given number of days of expiry, and the hook runs after a successful renewal:

```bash
sudo crontab -e
```

```text
15 3 * * * CLOUDFLARE_DNS_API_TOKEN="your_cloudflare_api_token" /usr/bin/lego --path /etc/lego --email you@example.com --accept-tos --dns cloudflare -d example.com renew --days 30 --renew-hook "systemctl restart wings"
```

Drop the token and swap `--dns cloudflare` for `--http` if you issued with the HTTP challenge. Test that the command works by running it once by hand; with a fresh certificate it prints that no renewal is needed and exits.

::::

## Which Method Should I Use?

| Situation | Recommended method |
| --- | --- |
| Public webserver, port 80 open | Certbot (HTTP Challenge) |
| Internal/NAT'd node, using a provider with a certbot DNS plugin | Certbot (DNS Challenge) |
| One wildcard certificate for every node | Certbot (DNS Challenge) or lego |
| Want a lighter tool without Python | acme.sh (shell script) or lego (single binary) |
| DNS provider without a certbot plugin | lego, which supports far more providers, or acme.sh |
| Using Caddy, Traefik or Nginx Proxy Manager as your reverse proxy | None of the above. The proxy issues and renews its own certificate; see [below](#certificates-issued-by-the-reverse-proxy). |
| Domain proxied through Cloudflare | Let's Encrypt still works. A [Cloudflare Origin certificate](#cloudflare-origin-ca) is an alternative that never needs renewing. |
| Panel and nodes only reachable on your LAN | A [private CA](#private-ca-for-lan-only-setups). Let's Encrypt cannot verify a name that does not resolve publicly. |

## Other Sources of Certificates

Let's Encrypt is the default because it is free and renews itself, but any certificate that browsers trust for the hostname works. Whatever the source, the result is the same pair of files from [What You End Up With](#what-you-end-up-with), and the rest of the docs applies unchanged.

### Certificates Issued by the Reverse Proxy

Caddy, Traefik and Nginx Proxy Manager all talk to Let's Encrypt on their own for every hostname they serve. If the Panel and Wings both sit behind such a proxy, you never touch a certificate file: point the proxy at the hostname and it issues, installs and renews the certificate itself. The [reverse proxy guide](reverse-proxies.md) covers the configuration for each.

The catch is that these proxies keep the certificate in their own storage, in a layout that changes between versions, so reusing it for Wings' [built-in SSL](../wings/configuration.md#ssl-configuration) is fragile. Put Wings behind the proxy as well, or issue a separate certificate for the node with one of the methods above.

### Cloudflare Origin CA

If your domain is proxied through Cloudflare (orange cloud), Cloudflare can issue an **Origin certificate** for it: a free certificate, valid for up to 15 years, that only Cloudflare's edge trusts. Browsers never see it, because they talk to Cloudflare, and Cloudflare presents its own publicly trusted certificate to them.

In the Cloudflare dashboard, open **SSL/TLS → Origin Server → Create Certificate**, keep the defaults, and copy the certificate into `fullchain.pem` and the private key into `privkey.pem`. The key is shown only once. Then set the zone's **SSL/TLS encryption mode** to **Full (strict)**.

This only works for hostnames whose traffic actually passes through Cloudflare. That is fine for the Panel, and for a Wings node whose HTTP hostname is proxied too, since browsers reach Wings through Cloudflare in that case. It does not work for a node that browsers connect to directly, because they will not trust the certificate. SFTP and game ports do not use the certificate at all, so they are unaffected either way.

### A Certificate You Bought

A certificate from a commercial CA arrives as a certificate file, one or more intermediate certificates, and the private key you generated with the request. Combine the certificate and the intermediates, in that order, into the full chain:

```bash
cat your-domain.crt intermediate.crt > /etc/ssl/certs/example.com/fullchain.pem
cp your-domain.key /etc/ssl/certs/example.com/privkey.pem
chmod 600 /etc/ssl/certs/example.com/privkey.pem
```

If you were given a single `.pfx` or `.p12` bundle instead, split it with OpenSSL:

```bash
openssl pkcs12 -in certificate.pfx -nokeys -out fullchain.pem
openssl pkcs12 -in certificate.pfx -nocerts -nodes -out privkey.pem
```

Nothing renews these for you. Put the expiry date in your calendar, and repeat the steps with the new files when the CA reissues the certificate.

### Private CA for LAN-only Setups

When neither the Panel nor the nodes are reachable from the internet, Let's Encrypt cannot verify the hostname. You can still get a certificate browsers trust by running your own certificate authority and installing its root on every device that uses the Panel. Passkeys and everything else that needs HTTPS then works on the LAN.

[mkcert](https://github.com/FiloSottile/mkcert) makes this a two-command job. Run it on your workstation, where it creates a root CA and adds it to the system and browser trust stores, then issue a certificate for each hostname or IP:

```bash
mkcert -install
mkcert panel.lan 192.168.1.10
```

It writes `panel.lan+1.pem` (the certificate, use it as `fullchain.pem`) and `panel.lan+1-key.pem` (the key, use it as `privkey.pem`). Copy them to the Panel host or node and reference them as usual. Every other device that opens the Panel needs the root from `mkcert -CAROOT` imported into its trust store, otherwise it shows a certificate warning. mkcert certificates are valid for about two years; issue a new one before then.

## Using the Certificate with Wings in Docker

The Wings compose file mounts `/etc/ssl/certs/wings/` from the host into the container, and no other certificate directory. Certbot's `/etc/letsencrypt/live/` directory is not visible inside the container, and mounting only `live/` does not work either, because the files in it are symlinks into `archive/`.

Copy the certificate into the mounted directory instead, and let a deploy hook keep the copy fresh:

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

The last line runs the hook once by hand so the files exist right away; certbot runs it after every renewal from then on. Point Wings at the copies in `config/config.yml`:

```yaml
api:
  ssl:
    enabled: true
    cert: /etc/ssl/certs/wings/fullchain.pem
    key: /etc/ssl/certs/wings/privkey.pem
```

Then restart the container from the Wings compose directory:

```bash
docker compose restart wings
```

Wings re-reads the files daily, so renewed certificates are picked up without another restart.
