---
prev: 
  text: 'Database Hosts'
  link: '/docs/advanced/database-hosts'
after: true
---

# Generating SSL Certificates
Passkeys and several other Calagopus features require a valid SSL certificate for your Panel and Wings. This guide walks you through generating one.

This is also a prerequisite if you plan to set up a [Reverse Proxy](reverse-proxies.md) or want to [add an SSL certificate](../wings/configuration.md#ssl-configuration) directly to your Wings machine.

All methods below use [Let's Encrypt](https://letsencrypt.org), which issues free certificates valid for 90 days.

:::: tabs
=== Method 1: Certbot (HTTP Challenge)

This is the most common method and works well if your server has port 80 open to the internet.

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

### 2. Generate the certificate
Replace `example.com` with the domain you're issuing a certificate for. To cover multiple domains, repeat the `-d` flag (e.g. `-d example.com -d www.example.com`).

```bash
# If using Nginx
sudo certbot certonly --nginx -d example.com
# If using Apache
sudo certbot certonly --apache -d example.com
# Standalone — use this if you don't run a webserver or the options above don't work.
# Stop any service already bound to port 80 first (nginx, apache etc.).
sudo certbot certonly --standalone -d example.com
```

You'll be prompted for an email address (used for renewal/expiry notices), then certbot issues the certificate automatically. Certificates are saved to `/etc/letsencrypt/live/example.com/`.

### 3. Renewal
Certbot installs a systemd timer (or cron job) that checks twice daily and renews when the certificate is close to expiry. If you used the `--nginx` or `--apache` plugin, that's all you need. The plugin reloads your webserver as part of the renewal itself.

If you used `--standalone`, or want Wings to also restart so it picks up a renewed certificate, add a deploy hook:

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

Certbot runs every script in `renewal-hooks/deploy/` automatically after a successful renewal. Test the whole flow without waiting for actual expiry:

```bash
sudo certbot renew --dry-run
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

If Wings doesn't pick up the renewed certificate automatically, restart it manually:

```bash
sudo systemctl restart wings
```

=== Method 2: Certbot (DNS Challenge)

Use this if port 80 can't be exposed to the internet, for example, an internal Wings node behind NAT, or any setup where you'd rather not touch port 80 at all.

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

If you're issuing through a registrar/CDN that's slow to propagate DNS, you can increase the default 10-second propagation wait:

```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 60 \
  -d example.com
```

That's it. Certbot's systemd timer handles renewal automatically from here. No deploy hook is required for most setups, including Wings; one is only needed if a service caches the certificate in memory rather than reading it from disk on each use.

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

`acme.sh` is a lightweight, dependency-free alternative to certbot. It's useful if you'd rather avoid a Python toolchain. This example uses Cloudflare; see [acme.sh's DNS API docs](https://github.com/acmesh-official/acme.sh/wiki/dnsapi) for other providers.

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

### 3. Issue the certificate
```bash
acme.sh --issue --dns dns_cf -d example.com
```

### 4. Install it where your services expect it
`acme.sh` keeps certificates in its own directory by default; use `--install-cert` to copy them to standard paths and reload services on renewal:

```bash
acme.sh --install-cert -d example.com \
  --key-file       /etc/ssl/private/example.com.key \
  --fullchain-file /etc/ssl/certs/example.com.crt \
  --reloadcmd      "systemctl restart wings"
```

### 5. Renewal
`acme.sh` installs its own cron job during setup, renewing automatically around 60 days in (ahead of the 90-day expiry). Your `--reloadcmd` runs after every successful renewal automatically.

Verify the cron job exists:

```bash
crontab -l | grep acme.sh
```

::::

## Which method should I use?

| Situation | Recommended method |
|---|---|
| Public webserver, port 80 open | Certbot (HTTP Challenge) |
| Internal/NAT'd node, using a provider with a certbot DNS plugin | Certbot (DNS Challenge) |
| Want a lighter, dependency-free tool? | acme.sh |