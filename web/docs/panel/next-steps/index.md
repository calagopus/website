---
title: Panel Next Steps
description: "What to do after installing the Calagopus panel: use your existing node or connect Wings, add game server templates, and serve the panel over HTTPS."
---

# Next Steps

The panel is installed and the OOBE is complete. Next, set up a node, add egg repositories, and put the panel behind HTTPS.

## Add a Node

The panel manages servers, while Wings runs their game containers. If setup already created your node, continue with egg repositories below. The All-in-One image creates **Integrated Node** automatically, so you don't need to register it or install Wings separately.

If you still need a node, follow [Configuring a New Node](../../wings/next-steps/configure-node.md) to register it and connect Wings to the panel.

## Add Egg Repositories

Eggs define how a specific type of game server is installed and configured. Calagopus has a built-in egg repository system that lets you browse and import eggs from Git repositories. See [Adding Egg Repositories](./egg-repos.md) to get started.

## Set Up a Reverse Proxy

Passkeys, secure session cookies and several browser features only work when the panel is served over HTTPS. A reverse proxy in front of the panel serves it on port 443 with a certificate. See [Setting up a Reverse Proxy](./reverse-proxy.md).
