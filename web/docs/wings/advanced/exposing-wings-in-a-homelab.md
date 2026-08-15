---
title: Exposing Wings in a Homelab
description: Ways to expose a homelab Wings node to the internet, with the trade-offs of each approach.
---

# Exposing Wings in a Homelab

This guide covers the available methods for exposing a Wings node to the internet from a homelab, along with the trade-offs of each approach.

## Prerequisites

Make sure you have:

- A working Calagopus Panel
- A working Calagopus Wings machine (accessible by the Panel)
- A domain name (optional, but recommended for easier access and SSL certificate generation)

## Methods

:::: tabs
=== Reverse Proxy
A reverse proxy sits in front of your Wings machine and forwards requests to it. This is the recommended method for most users: it makes SSL certificate management easy and adds a layer of security.

| Pros | Cons |
| --- | --- |
| Easy to set up with tools like Nginx or Caddy | Requires additional configuration and maintenance |
| Allows for easy SSL certificate management | May introduce additional latency |
| Provides an additional layer of security | Requires a domain name for best results |
| Can be used to expose multiple services on the same domain | May require additional resources on your server |
| | No support for SFTP (but you can still use SFTP by connecting to the Wings machine directly on the local network) |

See the [Reverse Proxy documentation](../../additional/reverse-proxies.md) for a full setup guide.

Wings uses both HTTP and WebSocket connections, so your reverse proxy must be configured to support both. When entering the URL in the panel, use the reverse proxy URL without a port. For example, if your reverse proxy is at `https://wings.example.com`, enter `https://wings.example.com` - not `https://wings.example.com:8080`.

=== Reverse Proxy + Wings Proxy Mode
This method builds on the Reverse Proxy approach by enabling Wings Proxy Mode in the panel. The panel proxies HTTP/WS connections to Wings directly, letting you use a single domain and port for both (e.g. `https://panel.example.com`). It's a good choice if you want a simpler reverse proxy setup and are comfortable with the panel handling the proxy traffic.

| Pros | Cons |
| --- | --- |
| Simplifies reverse proxy configuration | Requires additional configuration in the panel |
| Allows using the same domain and port for both panel and wings | May introduce additional latency due to the panel proxying connections |
| Provides an additional layer of security | Requires a domain name for best results |
| | Limits bandwidth: all connections to Wings are proxied through the panel, so heavy Wings traffic puts load on the panel |
| | No support for SFTP (but you can still use SFTP by connecting to the Wings machine directly on the local network) |

For the reverse proxy itself, see the [Reverse Proxy documentation](../../additional/reverse-proxies.md).

### Enabling Wings Proxy Mode

Set [`APP_ENABLE_WINGS_PROXY`](../../panel/environment.md#app-enable-wings-proxy) to `true` in your panel's `.env` file, then restart the panel. You can then enter the same URL for both the panel and Wings in the node configuration, and the panel proxies connections to Wings automatically.

If you installed the Panel via Docker, add the variable to the `web` service in `compose.yml`, then run `docker compose up -d`:

```yaml
services:
  web:
    environment:
      - APP_ENABLE_WINGS_PROXY=true
```

### Switching the Node to Proxy Mode

After enabling Wings Proxy Mode in the panel, switch the node to proxy mode. On the node's configuration page, click the globe button at the right of the **Public URL** field - it fills in the correct proxy mode URL automatically. Save the changes.

=== Port Forwarding
Port forwarding forwards the Wings port(s) (default 8080) from your router to your Wings machine. It is less secure than a reverse proxy, since Wings is exposed directly to the internet, but simpler to set up and requires no domain name.

| Pros | Cons |
| --- | --- |
| Simple to set up | Exposes your Wings machine directly to the internet |
| Does not require a domain name | More difficult to manage SSL certificates |
| No additional resources required on your server | May introduce security risks if not properly configured |
| | Usually also requires a static IP or Dynamic DNS setup for best results |

Refer to your router's documentation for the exact steps; they vary by make and model.

When using port forwarding, the Wings URL in the panel must include the port. For example, if port 8080 is forwarded to your Wings machine and your public IP is `217.33.3.3`, enter `http://217.33.3.3:8080`. If you have a Dynamic DNS domain, use that instead (e.g. `http://mywings.dyndns.org:8080`).

::::
