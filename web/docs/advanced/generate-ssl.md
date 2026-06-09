# Generating an SSL Certificate

Passkeys and some other features require an SSL certificate for your Calagopus Panel and Wings. This guide walks through creating one, based on [Pterodactyl's documentation](https://pterodactyl.io/tutorials/creating_ssl_certificates.html) with some updates for clarity.

This guide is useful if you want to set up a [Reverse Proxy](reverse-proxy.md) or add an SSL certificate to your Wings machine.

Three methods are covered below, though any standard approach works. All examples use [Let's Encrypt](https://letsencrypt.org).

:::: tabs
=== Method 1: Certbot
## Installing certbot
Install `certbot`, which handles both certificate issuance and automatic renewal (Let's Encrypt certificates expire after 90 days). The commands below are for Debian-based distributions using APT. For other systems, see the [official website](https://certbot.eff.org/instructions).
```bash
sudo apt update
sudo apt install -y certbot
# Run this if you use Nginx
sudo apt install -y python3-certbot-nginx
# Run this if you use Apache
sudo apt install -y python3-certbot-apache
```

## Generating a SSL certificate
Once `certbot` is installed, generate a certificate. There are a couple ways to do so, but the easiest way is to use the dedicated web server-specific certbot plugin you just installed. For Wings-only machines that don't need a webserver, use the standalone or DNS method command below.

In the command below, replace `example.com` with your panel/node domain you would like to generate a certificate for. If you want to generate a certificate for multiple domains, add the `-d anotherdomain.com` flags to the command. You can also generate a wildcard certificate, but this guide will not cover this section.

### HTTP challenge
For this method to work, you must have exposed port 80 to the internet (this is technically already done if you installed Nginx or Apache). If that is impossible, use the [DNS challenge](./generate-ssl.md#dns-challenge) method below or use another method above.
```bash
# If using Nginx
certbot certonly --nginx -d example.com
# If using Apache
certbot certonly --apache -d example.com
# Standalone - Use this if neither works. Make sure to stop your webserver first when using this method.
certbot certonly --standalone -d example.com
```

You will be prompted for your email address, after which `certbot` will issue the certificate automatically.

### DNS challenge
DNS challenges require you to create a new `TXT` DNS record to verify domain ownership, instead of having to export port 80 to the internet.
```bash
certbot -d example.com --manual --preferred-challenges dns certonly
```
Then, follow the instructions that `certbot` gives you.
::: warning
DNS challenges do not automatically renew. You will need to run `certbot renew` and follow the prompts approximately every 60 days.

To automatically renew your certificate while still using DNS challenge, either use a [DNS Plugin](https://eff-certbot.readthedocs.io/en/latest/using.html#dns-plugins), or use [`acme.sh`](https://github.com/acmesh-official/acme.sh). A guide for `acme.sh` can be found by clicking on Method 2 above.
:::

## Troubleshooting
An `Insecure Connection` or SSL/TLS error usually means the certificate has expired. Running `certbot renew` may fail if port 80 is in use, producing an error like `Error: Attempting to renew cert (domain) from /etc/letsencrypt/renew/domain.conf produced an unexpected error`.

This is most common when running Nginx. Use the `--nginx` or `--apache` plugin flags to avoid the issue. Alternatively, stop the web server, renew, then restart. Replace `nginx` below with your own web server, or with `wings` if renewing a Wings certificate.

Stop Nginx:

```bash
systemctl stop nginx
```

Renew the certificate:

```bash
certbot renew
```

Once the process has completed, you can restart the Nginx service:

```bash
systemctl start nginx
```
You may also need to restart Wings as not every service is able to automatically apply an updated certificate:

```bash
systemctl restart wings
```

=== Method 2: acme.sh
If your system does not publicly expose your web server on the internet, you can also use `acme.sh` to generate your SSL certificate.

This guide assumes you are using Cloudflare's DNS to manage your domain, but you can always refer to [acme.sh's](https://github.com/acmesh-official/acme.sh/wiki/dnsapi) documentation for other DNS providers.

THIS GUIDE IS TODO!!!
