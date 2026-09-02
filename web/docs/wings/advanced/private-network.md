---
title: The Private Network
description: Set up the private network between Wings nodes, so servers reach each other over an encrypted node-to-node tunnel instead of the public internet, whatever way Wings is installed.
---

# The Private Network

Servers on different nodes normally reach each other the same way anyone else does: over the public internet, through published ports. The private network gives them a second path. A server that is connected to another one gets a private hostname and address for it inside its own container, and traffic to that address is carried node to node over an encrypted tunnel that never touches the public internet.

A connection is one-way and explicit. Granting `A -> B` lets A reach the ports B offers; it does not let B reach A.

This guide covers the operator side: what has to be true on each node, how to enable it for every way Wings can be installed, and how to check it works. The panel side of connecting servers is documented under [Connections](../../panel/features/server/network/connections.md).

## What Runs Where

| Component | Where | What it does |
| --- | --- | --- |
| **Panel** | Your panel | Decides which nodes are on the network and which server may reach which. Stores each node's host, port and certificate fingerprint. |
| **Wings** | Every node | Runs the tunnel daemon, in a container it creates and updates itself, and relays the panel's state to it. |
| **Tunnel daemon** (`tundra`) | Every node, container `calagopus-wings-tundra` | Dials the other nodes, binds the private addresses inside server containers and writes their hostnames into each container's `/etc/hosts`. |

You never install or configure the daemon yourself. Wings extracts its binary from a pinned image, writes its configuration, keeps it running and restarts it in place when the binary or the configuration changes, so open connections survive an update.

The daemon container runs with host networking, host PID and privileges, and mounts the tunnel data directory, the vmounts directory and the container engine's socket. Those are needed to reach into other containers' network namespaces; it is the reason the daemon runs as a separate, managed container rather than inside Wings.

Nodes talk to each other directly on a UDP port, `7100` by default. That port has to be reachable **between nodes**. It never needs to be exposed to the internet at large, and nothing else uses it.

## Requirements

- **Linux nodes.** Wings on Windows does not include the tunnel daemon. All-in-One nodes (wings built into the panel container) cannot take part either, and the panel hides the tab for them.
- **A rootful container engine.** Rootless Docker and rootless Podman are not supported: the daemon enters container network namespaces from the host, which a user namespace cannot see into.
- **Direct UDP reachability between every pair of nodes** on their tunnel ports. There is no NAT traversal and no relay, so nodes behind NAT need a port forward.
- **Image access.** Wings pulls `ghcr.io/calagopus/tundra` for the daemon binary and `debian:trixie-slim` as the container base, unless you point [`tundra.binary`](../configuration.md#tundra-binary) at a binary of your own.
- **Wings 1.2.0 or newer** with a panel of the same generation.

## Step 1: Enable the Daemon on Each Node

The daemon is off by default on every node. Turn it on in the node's `config.yml`:

```yaml
tundra:
  enabled: true
```

That is the only key you have to set. The others under `tundra` control where its state lives, which image the binary is taken from and the local metrics port; their defaults are right for a standard install and are described in the [configuration reference](../configuration.md#private-network).

Wings only reads `tundra.enabled` at startup, so restart it afterwards. How that looks depends on the install:

:::: tabs
=== Package Install
The configuration is at `/etc/calagopus-wings/config.yml`.

```bash
sudo systemctl restart wings
```

The daemon's state goes under `/var/lib/calagopus-wings/tundra`, next to the server volumes.

=== Docker Compose
The configuration is `config/config.yml` next to your `compose.yml`.

```bash
docker compose restart wings
```

Wings is itself in a container here, but the daemon is still started on the host's container engine through the mounted Docker socket, exactly as with a package install. The one thing to keep right is paths: Wings tells the engine to mount the daemon's data directory and the vmounts directory by the paths it sees *inside its own container*, so those paths must be mounted at the same location on both sides. The shipped `compose.yml` mounts `/var/lib/calagopus-wings/` to the same path, which covers both, so nothing extra is needed.

If you split `/var/lib/calagopus-wings` into separate volumes, the `tundra` and `vmounts` directories both have to stay covered by one, at an identical absolute path. Mount the **directory** that holds the daemon's control socket, never the socket file itself. A file bind mount pins the inode it was created from, so the daemon would keep talking to a dead socket after Wings restarts and rebinds it.

=== Podman
Only **rootful** Podman can carry the private network; see [Running Wings with Podman](./running-wings-with-podman.md) for the base setup. The daemon container is created through the same Docker-compatible API, and Wings passes the socket path from [`docker.socket`](../configuration.md#docker-socket) to it, so the socket must be one the daemon can reach from the host.

```bash
sudo systemctl restart wings
```

Rootless Podman does not work, whatever `tundra.enabled` says.
::::

After the restart Wings prepares the data directory, its local signing key and the token the daemon authenticates with. It does not start the daemon yet; that happens once the panel lists the node on the network.

## Step 2: Open the Tunnel Port Between Nodes

Every node has to reach every other node on the tunnel port, over **UDP**. The port is `7100` by default and is set per node in the panel in the next step. Open it only towards your other nodes:

```bash
sudo ufw allow from <other node ip> to any port 7100 proto udp
```

Repeat for each peer node, on each node. On cloud providers, do the same in the security group or firewall in front of the machine. Nothing needs to be published in the Wings compose file, because the daemon uses host networking.

Some setups need more than a firewall rule:

- **Nodes behind NAT**, such as a homelab node talking to a node in a datacenter, need the UDP port forwarded on the router to the node, and the node's **Host** in the panel set to the public IP or dynamic DNS name. Two nodes on the same LAN reach each other on their LAN addresses without any of that.
- **Two nodes on one machine** each bind the tunnel port on the host, so give them different ports in the panel. The same goes for [`tundra.metrics_port`](../configuration.md#tundra-metrics-port), which is `7101` on both by default.
- **A reverse proxy or Cloudflare in front of Wings** does not carry UDP. The tunnel host has to be an address that reaches the node directly, not the proxied name you use for the Wings API.

## Step 3: Put the Node on the Network

In the panel, open **Admin → Nodes**, pick the node, and go to its [Private Network](../../panel/features/admin/nodes.md#private-network) tab. It needs the `nodes.tunnel` admin permission.

If the tab shows the node **cannot run the private network**, Wings either still has `tundra.enabled` off or has not been restarted since it was turned on. Fix that first; the panel asks Wings live, so the alert clears as soon as it reports back.

Fill in the two fields other nodes need to find this one:

| Field | Value |
| --- | --- |
| **Host** | The hostname or IP other *nodes* dial this one on. It defaults to the hostname from the node's URL, which is right for a plain install and wrong when that URL goes through a proxy or a tunnel that does not carry UDP. |
| **Port** | The UDP port from step 2. `7100` unless you picked another. |

Click **Enable**. Within a minute the following happens on the node without any input from you:

1. Wings pulls the daemon's images, extracts the binary and starts the `calagopus-wings-tundra` container.
2. The daemon generates a key pair and asks Wings for a certificate, which Wings signs and reports to the panel.
3. The panel publishes the certificate fingerprint, and from then on other nodes accept connections from this one.

**Node State** on the same tab shows the daemon as **Connected** and lists the fingerprint once this has gone through. Until a fingerprint is on file, no peer will accept the node, and the tab says so.

Repeat for every node that should take part. A node that is not on the network can still host servers as before; its servers just cannot join.

## Step 4: Connect Servers

From here on, the work moves to the users of the servers. Each server joins from its own **Network → Connections** tab, which gives it a hostname (`<name>.tunnel`) and a private address. It then lists the ports it offers, and picks which other servers may reach it and which it may reach. The [Connections](../../panel/features/server/network/connections.md) page walks through all of it.

Two things are worth knowing on the operator side:

- **Servers that were already running** when you enabled the daemon need a restart before they can resolve `.tunnel` hostnames. Wings mounts a managed `/etc/hosts` into each server container when the daemon is enabled, and that mount is only added when the container is created.
- **Port planning matters.** A destination's private address is bound *inside the source server's container* on the destination's port, so a server cannot reach a peer on a port the server itself already listens on. Two Minecraft servers both on `25565` cannot be connected to each other on that port. The panel refuses connections and offered ports that would collide, but distinct ports across servers you intend to connect saves the trouble. How many connections and offered ports a server may have is set under [Settings > Server](../../panel/features/admin/settings.md#server).

Traffic over a private connection does not pass through the destination server's [firewall rules](../../panel/features/server/network/firewall.md). The connection itself is the access grant, so removing the connection is how access is closed off.

## Checking That It Works

On the node, the daemon shows up as a normal container:

```bash
docker ps --filter name=calagopus-wings-tundra
docker logs --tail 50 calagopus-wings-tundra
```

Its logs show, in order: a generated key pair, a certificate issued, the control link to Wings coming up and the first state snapshot applied. Once the panel has other nodes on the network, peer connections follow.

The daemon serves its own metrics on the loopback metrics port, which is also what feeds the **Live Peer Links** table on the node's Private Network tab:

```bash
curl -s localhost:7101/metrics.json | jq '.node'
curl -s localhost:7101/metrics.json | jq '.peers[] | {name, rtt: .path.rtt_ms, drops}'
```

`remote_link` should read `up`, `peers_connected` should match the number of other nodes, and every drop counter on a healthy link is zero.

Inside a server that has been granted a connection, the peer's hostname resolves and its ports are bound on a loopback address:

```bash
docker exec <server container> cat /etc/hosts
docker exec <server container> ss -lntu
```

The hosts file has a `# tundra begin` block with a `127.0.x.y <name>.tunnel` line for each reachable peer, plus one for its `<alias>.tunnel` name, and the listening sockets include that address on each port the peer offers. A peer that is missing from both has not granted this server a connection in that direction.

## Day to Day

**Updates.** The daemon version follows [`tundra.source_image`](../configuration.md#tundra-source-image), which is pinned to a release tag. Bump the tag, restart Wings, and it extracts the new binary and restarts the daemon in place; established connections carry over. Restart one node at a time, because two peered nodes handing over at once cannot hold each other's connections open.

**Rotate Identity** on the node's Private Network tab throws away the certificate fingerprint the panel publishes and the token the daemon authenticates to Wings with. Peers drop the node immediately; it enrolls again with a fresh certificate and connections come back on their own, usually within a minute. Use it if you suspect the node's tunnel identity has leaked.

**Taking a node off.** **Disable** on the tab removes the node from the network; every connection to and from its servers is dropped and those servers lose their private addresses. Do that first. To stop running the daemon on the node as well, set `tundra.enabled: false`, restart Wings, and remove the container by hand, because Wings only manages it while the daemon is enabled:

```bash
docker rm -f calagopus-wings-tundra
```

**When the panel is unreachable**, established tunnels keep carrying traffic; the panel is not in the data path. What stops is change: nodes cannot dial a new peer, and connection or port changes made in the panel do not reach them, until it is back. Wings holds the daemon's control link open for three minutes after its last successful panel contact and then drops it, and the daemon reconnects on its own once Wings can reach the panel again.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| The tab says the node **cannot run the private network** | `tundra.enabled` is still `false`, or Wings was not restarted after changing it. On a rootless engine this stays unsupported. |
| The tab says the node **has not reported a certificate** | The daemon never enrolled. Read `docker logs calagopus-wings-tundra`, and the Wings log for image pull errors; a node that cannot pull `ghcr.io/calagopus/tundra` never gets a binary. |
| `container name calagopus-wings-tundra is taken by a container that was not created by wings` in the Wings log | Something else created a container by that name. Remove it; Wings only replaces containers it labelled itself. |
| **Peers Connected** stays at zero | The UDP tunnel port is blocked in one direction or both, or the **Host** in the panel does not reach the node directly. Check both firewalls, and that the host resolves to the node's own address rather than a proxy. |
| A peer's `.tunnel` hostname does not resolve inside a server | The server was started before the daemon was enabled, so restart it. Otherwise no connection has been granted in that direction; both edges being drawn on the graph does not mean both are on. |
| The hostname resolves but every connection is refused | The peer offers no ports, or offers the wrong ones. Ports are opened by the *destination* under **Offered Ports**. |
| `EADDRINUSE` in the daemon log, or a game server that fails to bind its port | A port collision: the server and a peer it reaches use the same port. Give one of them a different port. |
| **Daemon** shows **Disconnected** while the container is running | The daemon's link to Wings dropped, which happens briefly after **Rotate Identity** and after a Wings restart. If it stays down, check that the tunnel data directory is the same path on the host and inside the Wings container, and that it is mounted as a directory. |
