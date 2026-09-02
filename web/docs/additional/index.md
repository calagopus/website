---
description: "Optional Calagopus setup guides: self-service database hosts, panel migrations, SSL certificates, reverse proxies, and OAuth login."
prev: false
next: true
---

# Additional Configuration

A collection of optional setup guides that aren't required to get the panel running, but cover common things you'll likely want once it is: enabling self-service databases, moving between deployments, securing traffic, and setting up third-party login.

| Page | Description |
| --- | --- |
| [Database Hosts](./database-hosts/index.md) | Let users provision their own databases for game servers |
| [Migrations](./migrations/index.md) | Moving from another panel, or changing how your Calagopus install is deployed |
| [SSL Certificates](./ssl-certificates.md) | Get a free Let's Encrypt certificate, keep it renewing, and wire it into Wings on bare metal or in Docker |
| [Reverse Proxies](./reverse-proxies.md) | Put Nginx, Apache, Caddy, Traefik or Nginx Proxy Manager in front of the Panel and Wings |
| [Setting up OAuth](./setting-up-oauth/index.md) | Let users sign in with GitHub, Google, Discord, or any OIDC provider |