---
title: Network
description: The server's networking tab, covering its public allocations, the firewall rules in front of them, and its private connections to other servers.
---

# Network

Everything about how a server can be reached lives under Network, at `/server/<id>/network`. It splits into three tabs, each of which only appears if you hold the permission for it. When you can see only one, the tab bar is hidden and you land straight on that page.

| Tab | What it covers | Permission |
| --- | --- | --- |
| [Allocations](./allocations.md) | The IP and port combinations the server is publicly reachable on, and which of them is primary. | `allocations.read` |
| [Firewall](./firewall.md) | Ordered allow and deny rules deciding who may reach those allocations. | `firewall.read` |
| [Connections](./connections.md) | Private links to other servers, carried node to node instead of over the public internet. | `connections.read` |

The three do different jobs. An allocation is the public way in and the firewall narrows who may use it, while a private connection is neither: it needs no allocation and no firewall rule, because the connection itself is the grant.

Ports are the one place they touch. A port the server holds an allocation on cannot also be used to reach a peer privately, because the server already binds it, so the two sets of ports have to stay out of each other's way.
