---
title: Reverse Proxies
description: Put Nginx, Apache, Caddy, Traefik or Nginx Proxy Manager in front of the Calagopus Panel and Wings, serve them over HTTPS on port 443, and keep real client IPs working.
---

# Setting up a Reverse Proxy

A reverse proxy is a web server that sits between the internet and the Panel or a Wings node. Visitors talk to the proxy on the standard HTTPS port (443), and the proxy forwards each request to the service behind it, which keeps listening on its own port where nobody else can reach it.

You want one because it:

- Serves the Panel or a node at `https://panel.example.com` instead of `http://1.2.3.4:8000`.
- Terminates TLS in one place, so the Panel or Wings itself never has to handle certificates.
- Lets one machine host the Panel next to other websites on the same ports.
- Enables features that need a secure origin, such as [passkeys](../../panel/features/dashboard/security-keys.md).

## How It Fits Together

```mermaid
graph LR
  classDef client fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
  classDef proxy fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
  classDef app fill:#e1f5fe,stroke:#01579b,stroke-width:2px;

  Browser[Browser]:::client

  subgraph Host [Your server]
    direction LR
    Proxy{{"Reverse proxy<br/>Nginx, Caddy, …"}}:::proxy
    App["Panel or Wings<br/>127.0.0.1:port"]:::app
  end

  Browser -- "HTTPS :443" --> Proxy
  Proxy -- "HTTP :port<br/>+ X-Forwarded-For" --> App
```

Three things happen at the proxy on every request:

1. It decrypts the HTTPS connection using your certificate.
2. It adds headers that tell the Panel or Wings who the real visitor is (`X-Forwarded-For`, `X-Real-IP`).
3. It forwards the request over plain HTTP to the service on the loopback address, and streams the response back.

Because every request now arrives *from the proxy*, the Panel or Wings has to be told which address the proxy uses. Otherwise every visitor looks like they come from the same IP, which breaks per-IP rate limiting and fills the activity log with the proxy's address. Both guides start with that, along with closing off the port the service used to answer on directly.

::: info All-in-One image
On the [All-in-One image](../../panel/installation/docker.md#option-a-all-in-one-recommended-for-single-node-setups), the bundled Wings is reached through the Panel, so the Panel guide covers both; see [All-in-One and Wings Proxy Mode](./panel.md#all-in-one-and-wings-proxy-mode). Only SFTP (port `2022`) stays direct, because it is not HTTP.
:::

## Pick a Guide

| Guide | Set up | Covers |
| --- | --- | --- |
| [Panel](./panel.md) | Once | The login page, dashboard and admin area, and on the All-in-One image the bundled Wings |
| [Wings](./wings.md) | Per standalone node | The browser's direct connections to the node: console, file manager, uploads and downloads |

## Keeping the Configuration Current

The examples are written for the current stable release of each proxy. An older release can lack a directive or behave differently. The guides call out the differences that matter, such as Nginx before 1.25.1 and Apache before 2.4.47.

The Panel and Wings change too. A release can add an endpoint, a WebSocket route or a larger request that the proxy has to let through, so a configuration that worked before an update can stop working after it. Whenever you update the Panel or Wings, come back to its guide and compare your configuration with the current example.
