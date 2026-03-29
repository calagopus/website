# Generating a SSL Certificate
For passkeys and some other features to function properly, you must first generate a SSL certificate for your Calagopus Panel and Wings.\
This guide covers creating new SSL certificates for Calagopus Panel and Wings. This guide is based off from [Pterodactyl's documentation](https://pterodactyl.io/tutorials/creating_ssl_certificates.html) with some minor tweaks for users to better understand what are they doing by following this guide.

This guide is useful for people who would like to setup a [Reverse Proxy](reverse-proxies.md) or add a SSL certificate to your Wings machine.

Currently in this guide, there are a total of 3 methods to generate an SSL certificate, although you can always use another method to create one. For this guide, we will be issuing a certificate with [Let's Encrypt](https://letsencrypt.org).

:::: tabs
=== Method 1: Certbot
## Installing certbot
First of all, install `certbot`, which will allow us to create our SSL certificate but also renew them automatically, since Let's Encrypt certificates expire after 90 days. The commands below are made for Debian based distributions which uses APT, however you can also install `certbot` with the help of the [official website](https://certbot.eff.org/instructions).
```bash
sudo apt update
sudo apt install -y certbot
# Run this if you use Nginx
sudo apt install -y python3-certbot-nginx
# Run this if you use Apache
sudo apt install -y python3-certbot-apache
```

## Generating a SSL certificate
After you installed `certbot`, we need to generate a certificate. There are a couple ways to do so, but the easiest way is to use the dedicated web server-specific certbot plugin you just installed. For Wings-only machines that don't need a webserver, use the standalone or DNS method command below.

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

You will be asked to enter your email (preferably a valid email), and `certbot` will automatically create a SSL certificate for you. 

### DNS challenge
DNS challenges requires you to create a new `TXT` DNS record to verify domain ownership, instead of having to export port 80 to the internet.
```bash
certbot -d example.com --manual --preferred-challenges dns certonly
```
Then, follow the instructions that `certbot` gives you.
::: warning
Usually, with DNS challenges, they do not automatically renew, so every 60 days ish, you need to run `certbot renew` and follow the instructions.

To automatically renew your certificate while still using DNS challenge, either use a [DNS Plugin](https://eff-certbot.readthedocs.io/en/latest/using.html#dns-plugins), or use [`acme.sh`](https://github.com/acmesh-official/acme.sh). A guide for `acme.sh` can be found by clicking on Method 2 above.
:::

## Troubleshooting
If you get an `Insecure Connection` or SSL/TLS related error when trying to access your panel or wings, the certificate has likely expired.
This can be easily fixed by renewing the SSL certificate, although using the command `certbot renew` might not do the job if port 80 is in use, as it'll return errors like: `Error: Attempting to renew cert (domain) from /etc/letsencrypt/renew/domain.conf produced an unexpected error`.

This will happen especially if you're running Nginx instead of Apache. The solution for this is to use Nginx or Apache plugins with `--nginx` and `--apache`. Alternatively, you can stop Nginx, then renew the certificate, and finally restart Nginx. Replace `nginx` with your own web server or with `wings` should you be renewing the certificate for Wings.

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

First, install `acme.sh` by running the command below:
```bash
curl https://get.acme.sh | sh
```

Then, we will create an API key for 