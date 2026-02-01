# Reverse Proxy

This guide explains how to configure Nginx as a reverse proxy for the Calagopus Panel Docker installation. Reverse proxying allows the internal HTTP webserver (default port 8000) to be served over standard HTTP/HTTPS ports with SSL.

::: warning
Ensure that the Panel is already installed and running before continuing. Misconfigured proxy settings may make the Panel inaccessible.
:::

::: info
We assume you already have Let’s Encrypt certificates generated for your domain. All &lt;domain&gt; placeholders should be replaced with your actual domain name.
:::

### APP_TRUSTED_PROXIES

When running the Panel behind a reverse proxy, you must configure the [APP_TRUSTED_PROXIES](../panel/reverse-proxy.md#app-trusted-proxies) variable. This ensures that the Panel logs correct client IP addresses and operates securely.

```yaml
services:
  panel:
    environment:
      APP_TRUSTED_PROXIES="172.18.0.1"
```

## Getting Started

Create `/etc/nginx/sites-available/panel.conf` (or `/etc/nginx/conf.d/panel.conf` on RHEL-based systems) with the following content:

::: code-group
```nginx [Nginx With SSL]
server {
    listen 80;
    listen [::]:80;
    server_name <domain>;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name &lt;domain&gt;;

    access_log /var/log/nginx/calagopus.app-access.log;
    error_log  /var/log/nginx/calagopus.app-error.log error;

    sendfile off;

    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    ssl_session_cache shared:SSL:30m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Optional DH params and ECDH curve can be uncommented if needed
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    # ssl_ecdh_curve X25519:secp384r1:secp256r1;
    ssl_session_timeout 10m;
    ssl_session_tickets on;

    # See https://hstspreload.org/ before uncommenting the line below.
    # add_header Strict-Transport-Security "max-age=15768000; preload;";
    add_header X-XSS-Protection "1; mode=block";
    # Prevent search engines from indexing or following links
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), fullscreen=(self), clipboard-read=(self)" always;
    add_header Referrer-Policy "same-origin";

    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://172.18.0.1:8000;

        # Pass headers from internal webserver
        proxy_pass_header Content-Type;
        proxy_pass_header Content-Length;
        proxy_pass_header ETag;
        proxy_pass_header Last-Modified;
        proxy_pass_header Content-Security-Policy;
        proxy_pass_header Location;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

```nginx [Nginx Without SSL]
server {
    listen 80;
    listen [::]:80;
    server_name <domain>;

    access_log /var/log/nginx/calagopus.app-access.log;
    error_log  /var/log/nginx/calagopus.app-error.log error;

    sendfile off;

    add_header X-XSS-Protection "1; mode=block";
    # Prevent search engines from indexing or following links
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), fullscreen=(self), clipboard-read=(self)" always;
    add_header Referrer-Policy "same-origin";

    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://172.18.0.1:8000;

        # Pass headers from internal webserver
        proxy_pass_header Content-Type;
        proxy_pass_header Content-Length;
        proxy_pass_header ETag;
        proxy_pass_header Last-Modified;
        proxy_pass_header Content-Security-Policy;
        proxy_pass_header Location;
    }

    location ~ /\.ht {
        deny all;
    }
}
```
:::

## Enabling Configuration

```bash
# On RHEL-based systems, placing the file in /etc/nginx/conf.d/ is sufficient, so no symlink is needed.
sudo ln -s /etc/nginx/sites-available/panel.conf /etc/nginx/sites-enabled/panel.conf

# Finally restart nginx regardless of the OS.
sudo systemctl restart nginx
```

## Verify Access

Visit https://&lt;domain&gt; in your browser. You should now see the Panel login page served via Nginx.

## Set Server URL

After verifying access, go to your Panels Admin page, set your server URL, hit Save and you’re done. This URL is used for links, API calls, and Wings node connections.

![Calagopus Panel URL](./server-url.png)
