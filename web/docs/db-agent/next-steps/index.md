---
title: DB Agent Next Steps
description: 'What to do after installing DB Agent: connect it to the Panel, then secure the management API and database connections with TLS or a reverse proxy.'
---

# Next Steps

DB Agent is installed. Next, connect it to the Panel and decide how to secure its connections.

## Connect the Agent to the Panel

Register the agent as a database agent host in the Panel and drop the generated configuration onto the machine. See [Database Agent Hosts](../../panel/features/admin/database-agent-hosts.md#connecting-the-agent).

## Secure the Connections

The Panel talks to the agent's management API with the host token, and users connect to their databases through the agent's database proxies. Both can be encrypted with DB Agent's built-in TLS; see [Setting up SSL](./ssl.md). If a proxy already runs on the machine, or you want one place to manage certificates, the management API can sit behind it instead; see [Setting up a Reverse Proxy](./reverse-proxy.md).
