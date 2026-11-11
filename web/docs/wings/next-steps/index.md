---
title: Wings Next Steps
description: 'What to do after installing Wings: set up IP and port allocations so the panel can place game servers on your node.'
---

# Next Steps

Wings is installed and connected to the panel. Next, create allocations for the ports your game servers will use, and serve the node over HTTPS.

## Set Up Allocations

Allocations are the IP and port combinations the panel assigns to game servers so players can connect to them. The Panel also allows creating a server without an allocation after confirmation, but a publicly reachable game server normally needs one. See [Setting up Allocations](./setting-up-allocations.md) to create them.

## Serve Wings over HTTPS

Browsers connect to Wings directly for the console, uploads and downloads, so a panel served over HTTPS needs its nodes on HTTPS too. Most nodes only need Wings' built-in SSL; see [Setting up SSL](./ssl.md). If a proxy already runs on the node, or you want Wings on port 443, see [Setting up a Reverse Proxy](./reverse-proxy.md) instead.
