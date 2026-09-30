---
title: Proxmox VE LXC Runtime
description: Run Calagopus game servers as native, unprivileged LXC containers on a Proxmox VE host.
---

# Proxmox VE LXC Runtime

The Proxmox VE runtime lets Wings run game servers as native LXCs instead of Docker containers. Calagopus still schedules and manages the server, while Wings translates its lifecycle, resources, files, networking, console and firewall policy into local Proxmox operations.

::: warning Experimental runtime
The LXC backend is still under review. Test it with workloads you can recreate before using it for production servers. The current support limits are listed at the end of this page.
:::

Docker remains the preferred backend when both runtimes are available. On a fresh node, `runtime.backend: auto` probes Docker first and then local Proxmox VE. Wings stores the selection in `system.root_directory/runtime-backend` without rewriting `config.yml`, so installing Docker later does not silently move an existing LXC node. Remove that state file before restarting Wings to run detection again.

## Requirements

- Proxmox VE 9.2 or newer.
- Wings installed directly on the Proxmox host and running as `root`.
- Unprivileged LXC support.
- A Proxmox storage with `vztmpl` content for cached OCI templates.
- At least one active storage with `rootdir` content for LXC root filesystems.
- A bridge that provides connectivity for game-server LXCs.
- An OCI image whose configured process user is not root.

Wings manages only the local Proxmox node. It uses local `pct`, `pvesh`, LXC processes, bind mounts, cgroups and procfs, so pointing it at another cluster member is unsupported.

## How Storage Works

Each server uses two kinds of storage:

| Storage | Contents | Lifetime |
| --- | --- | --- |
| LXC rootfs | The selected OCI image and operating-system files | Replaceable when the image changes |
| `system.data_directory` | Game files mounted at `/home/container` | Persistent across rootfs replacement |

`runtime.pve_lxc.rootfs_storage: auto` chooses the active `rootdir` storage with the most free space that can fit `rootfs_size_gib`. If that storage cannot fit another container, Wings tries the next eligible storage. Set a Proxmox storage name to pin every new LXC to one pool.

The capacity shown to the panel comes from the filesystem containing `system.data_directory`. Adding rootfs storage does not increase the game-data capacity reported by Wings.

## Prepare Networking

Choose one of these models before starting Wings.

### Direct allocations

Use this model when panel allocations are addresses that belong directly to the LXC network. Configure a bridge, optional VLAN, IPv4 prefix and gateway. Wings assigns the server's primary panel allocation through PVE's `net0` property. Additional allocations may use other ports on that address.

```yaml
runtime:
  pve_lxc:
    bridge: vmbr0
    vlan_tag: 30
    network_prefix: 24
    gateway: 10.70.0.1
```

The bridge may connect to the rest of your network, or it may carry an isolated game-server subnet routed by the Proxmox host. Keep game LXCs off a trusted management or home-device subnet.

### Edge forwarding

Use edge forwarding when panel allocations are public addresses on one or more VPS edge hosts. The LXCs receive private DHCP addresses on a hidden bridge, and Wings sends their current address and allocated ports to a restricted forwarding controller over SSH.

Wings chooses the edge from the panel allocation: it compares that public IPv4 address with the current endpoints reported by the configured WireGuard interface. The matching peer's IPv4 `/32` in `AllowedIPs` becomes the SSH control address. This also works when the Proxmox site's public address changes.

```yaml
runtime:
  pve_lxc:
    bridge: vmbr-calagopus
    edge_wireguard_interface: wg-calagopus
    edge_ssh_user: root
    edge_ssh_identity_path: /etc/calagopus-wings/edge-forward
    edge_known_hosts_path: /etc/calagopus-wings/edge-known-hosts
```

The identity must be a root-owned regular file with mode `0600` or stricter. Restrict the public key on each edge to the forwarding controller, for example with an OpenSSH `command="...",restrict` authorized-key entry. Wings clears the server UUID from every known edge before applying a new mapping, preventing stale forwarding rules when an allocation changes.

## Install and Configure Wings

Install Wings directly on the Proxmox host using the [package](./pkgmanager.md) or [binary](./binary.md) installation guide, then pair it with the panel normally.

Add the runtime configuration to `/etc/calagopus-wings/config.yml`:

```yaml
runtime:
  backend: pve_lxc
  pve_lxc:
    template_storage: local
    rootfs_storage: auto
    bridge: vmbr0
    rootfs_size_gib: 8
    console_log_max_bytes: 5242880
    tag_prefix: calagopus
    managed_file_directory: /var/lib/lxc/calagopus-wings-managed
    unprivileged: true
    pids_limit: 512
    firewall:
      backend: auto
      source_file_max_entries: 10000
      source_file_max_bytes: 1048576
```

Use `backend: auto` if the same Wings build should select Docker when Docker is already reachable. Use `pve_lxc` to require Proxmox and fail startup when its requirements are unavailable. See the [configuration reference](../configuration.md#runtime) for every option.

Restart Wings after changing the backend:

```bash
sudo systemctl restart wings
sudo journalctl -u wings -n 100 --no-pager
```

A successful boot reports the detected PVE version, local node and next available VMID.

## Allocations

Create allocations in the panel using the address players should connect to:

- With direct allocations, use the LXC's address on the bridged game network.
- With edge forwarding, use the public IPv4 address of the edge VPS.

Each server currently uses one primary IPv4 address. Multiple ports can share that address. Wings publishes both TCP and UDP for each allocation because panel allocations are protocol-neutral.

## Firewall Policy

The LXC runtime follows the firewall policy configured in the panel.

With `runtime.pve_lxc.firewall.backend: auto`, Wings uses VM-scoped Proxmox guest rules when the datacenter firewall is enabled. If it is disabled, Wings falls back to host nftables or iptables. Wings does not enable the datacenter firewall itself.

The Proxmox backend:

- writes rules to the guest so they appear in the PVE interface;
- preserves administrator-managed rules and IP sets;
- labels every Wings-managed rule for safe reconciliation;
- keeps the guest input policy at `ACCEPT`, matching the panel's allow-unmatched behavior; and
- emits the panel's terminal “deny everything else” rule as an unrestricted final `DROP`.

Select `proxmox` to require the PVE firewall and fail when the datacenter firewall is unavailable. Select `nftables` or `iptables` to force host filtering.

## Images, Resources and Files

Wings pulls tagged OCI references through Proxmox's OCI registry endpoint and stores deterministic templates in `template_storage`. Mutable tags are periodically refreshed using the Docker image-fetch cache interval. If a tag resolves to new content, Wings prepares a replacement rootfs while preserving `/home/container` on the host.

Panel resources map as follows:

- memory plus configured overhead becomes the LXC RAM limit;
- panel swap becomes additional PVE swap;
- unlimited memory and `-1` swap use cgroup v2 `max` overrides;
- `100%` CPU becomes `cpulimit=1`, `250%` becomes `2.5`;
- `build.threads` becomes both an exact LXC CPU set and the corresponding PVE core count;
- `runtime.pve_lxc.pids_limit` and each server's block-I/O weight become native cgroup v2 limits; when `pids_limit` is omitted, Wings uses the legacy `docker.container_pid_limit` value for compatibility;
- a panel entrypoint replaces the image entrypoint while retaining Wings' network-ready wrapper;
- directory mounts become PVE `mpN` mounts;
- supported character and block devices become PVE `devN` entries; and
- console input and output use the PVE console while Wings retains a bounded host-side log.

Wings reads the OCI process UID and GID and maps `/home/container` to the host account configured under `system.user`. Images that run as root are rejected because this mapping is part of the unprivileged-container isolation model.

The network-ready wrapper records the game process's real exit code and compares the container's cgroup OOM counter across the process lifetime. This gives the panel the same crash and out-of-memory distinction it receives from a container engine. Wings clears the status marker before every start; a panel-requested hard kill reports exit code `137` without replacing a marker already written by the process wrapper. OOM attribution requires cgroup v2; on a cgroup v1 host Wings still reports the exit code but cannot distinguish an OOM kill.

## Private Networking

Private networking uses the same panel connection model described in [The Private Network](../advanced/private-network.md). On an LXC node, Tundra runs as a native child process because Docker is unavailable. Wings identifies each running LXC with a process-backed reference so Tundra can enter its network namespace through procfs.

The Tundra build must advertise the `process_container_refs` capability. Wings refuses to publish LXC references to a daemon that does not advertise it. Core LXC lifecycle, public allocations and edge forwarding do not depend on private networking; leave Tundra disabled when this capability is unavailable.

## Current Support Limits

The initial backend has these deliberate limits:

- the PVE 9.2 OCI pull endpoint accepts tagged references and exposes no registry-credential inputs, so digest-only references and authenticated private registries are unavailable through this backend;
- each server uses one primary IPv4 address; edge forwarding also uses that address to select the WireGuard peer and forwarding controller;
- unlimited memory and swap depend on PVE preserving Wings-managed `lxc.cgroup2.*=max` entries when the container starts; this is live-tested against PVE 9.2 by the included smoke test;
- the LXC rootfs remains writable because PVE's pre-start and host-managed DHCP hooks update files in the rootfs before and after container start; and
- migration or management of a remote PVE cluster node is unsupported.

Unsupported image references and remote-node configurations fail explicitly. The networking and rootfs behavior above is documented so it is not mistaken for Docker parity.

## Verify the Host Contracts

The Wings source tree includes `scripts/pve-lxc-smoke-test.sh` for disposable host validation. Run it as root on the PVE node before placing real workloads there:

```bash
sudo TEMPLATE_STORAGE=local \
  ROOTFS_STORAGE=local-lvm \
  BRIDGE=vmbr0 \
  ./scripts/pve-lxc-smoke-test.sh
```

The script creates a tagged disposable CT, verifies OCI import, DHCP, resource status, UID/GID mapping, procfs access, runtime configuration, graceful and hard stops, rootfs replacement and persistent game data, then removes the CT and temporary host data. Override `IMAGE` when the default unprivileged Nginx image is unsuitable for the host.
