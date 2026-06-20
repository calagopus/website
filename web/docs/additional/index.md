---
prev: false
next: true
---

# Additional Configuration

A collection of optional setup guides that aren't required to get the panel running, but cover common things you'll likely want once it is: enabling self-service databases, moving between deployments, securing traffic, and setting up third-party login.

::::tabs
=== Database Hosts
Let users provision their own databases for game servers. See the [Database Hosts](./database-hosts/index.md) guide.

=== Migrations
Moving from another panel, or changing how your Calagopus install is deployed. See the [Migrations](./migrations/index.md) guide.

=== SSL Certificates
Generate a certificate for use with a reverse proxy or directly on Wings. See the [SSL Certificates](./ssl-certificates.md) guide.

=== Reverse Proxies
Serve the panel over standard HTTP/HTTPS ports instead of exposing it directly. See the [Reverse Proxies](./reverse-proxies.md) guide.

=== OAuth
Let users sign in with GitHub, Google, Discord, or any OIDC provider. See the [Setting up OAuth](./setting-up-oauth/index.md) guide.
::::