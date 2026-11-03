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
- A bridge that provides DHCP and a usable default IPv4 route to game-server and helper LXCs.
- Guest DHCP addresses inside the subnet identified by `runtime.pve_lxc.gateway` and `runtime.pve_lxc.network_prefix`.
- IPv4 forwarding enabled on the host and nftables available at `/usr/sbin/nft`.
- IPv4 panel allocation addresses routed to or otherwise reachable at the Proxmox host.

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

The LXC runtime publishes panel allocations on the Proxmox host in the same way a container engine publishes ports. Each guest receives an address from an isolated DHCP subnet. Wings then manages host-local `nftables` rules that forward every assigned TCP and UDP allocation to that guest on the same port.

Configure the guest bridge, its IPv4 prefix and its gateway. Add `vlan_tag` only when the bridge expects tagged guest traffic:

```yaml
runtime:
  pve_lxc:
    bridge: vmbr0
    # vlan_tag: 30 # optional
    network_prefix: 24
    gateway: 10.0.0.1
```

Enable IPv4 forwarding persistently before starting Wings:

```bash
printf 'net.ipv4.ip_forward=1\n' | sudo tee /etc/sysctl.d/99-calagopus-wings.conf
sudo sysctl --system
```

The allocation address must reach the local Proxmox host. Wings creates and reconciles the `ip wings_pve_forward` table with `/usr/sbin/nft` to publish that address and port to the guest.

Wings adds forwarding when an LXC is running, updates it when allocations change and removes it when the guest stops. It also rebuilds its managed table from running-server state after Wings starts without restarting or stopping adopted guests. Keep game LXCs off a trusted management or home-device subnet.

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
    network_prefix: 24
    gateway: 10.0.0.1
    rootfs_size_gib: 8
    min_vmid: 200
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

Create allocations in the panel using the addresses and ports on the Proxmox host that players should connect to. The allocation address is not assigned to the LXC. Wings resolves the guest's DHCP address in the configured subnet and installs local DNAT, forwarding and masquerade rules for each allocation.

Multiple addresses and ports can target one guest. Wings publishes both TCP and UDP because panel allocations are protocol-neutral. One address-and-port pair can belong to only one server; conflicting assignments fail closed instead of stealing another server's rule.

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

This setting controls the panel's server firewall policy only. Allocation publishing is independent and always uses host nftables, even when panel filtering uses Proxmox or iptables or is disabled.

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

Wings reads the OCI process UID and GID and maps that identity for `/home/container` to the host account configured under `system.user`. This works for images configured to run as root as well as images with a non-root process user; the LXC itself remains unprivileged on the host.

The network-ready wrapper records the game process's real exit code and compares the container's cgroup OOM counter across the process lifetime. This gives the panel the same crash and out-of-memory distinction it receives from a container engine. Wings clears the status marker before every start; a panel-requested hard kill reports exit code `137` without replacing a marker already written by the process wrapper. OOM attribution requires cgroup v2; on a cgroup v1 host Wings still reports the exit code but cannot distinguish an OOM kill.

## Backups and Restores

Wings backup adapters operate on the persistent game-data directory mounted at `/home/container`, just as they do for Docker servers. A backup does not capture the replaceable OCI rootfs or the Proxmox container configuration. Restoring one restores the game data; Wings reconstructs the runtime and rootfs separately from the server configuration and selected image. See [Backup Configurations](../advanced/backup-configurations.md) for the available local and remote adapters.

## Private Networking

Private networking uses the same panel connection model described in [The Private Network](../advanced/private-network.md). With the PVE backend active, Wings deliberately runs Tundra as a native child process and identifies each running LXC with a process-backed reference so Tundra can enter its network namespace through procfs.

The Tundra build must advertise the `process_container_refs` capability. Wings refuses to publish LXC references to a daemon that does not advertise it. Core LXC lifecycle and local allocation forwarding do not depend on private networking; leave Tundra disabled when this capability is unavailable.

## Current Support Limits

The initial backend has these deliberate limits:

- the PVE 9.2 OCI pull endpoint accepts tagged references and exposes no registry-credential inputs, so digest-only references and authenticated private registries are unavailable through this backend;
- allocation publishing currently supports IPv4 addresses and requires the guest subnet to provide DHCP leases that Wings can resolve locally;
- unlimited memory and swap depend on PVE preserving Wings-managed `lxc.cgroup2.*=max` entries when the container starts; this is live-tested against PVE 9.2 by the included smoke test;
- the OCI rootfs remains writable because the runtime has no read-only-rootfs mapping; persistent game data remains separate at `/home/container`; and
- migration or management of a remote PVE cluster node is unsupported.

Unsupported image references and remote-node configurations fail explicitly. Wings manages only the local allocation-to-guest forwarding described above.

## Verify the Host Contracts

The Wings source tree includes `scripts/pve-lxc-smoke-test.sh` for disposable host validation. Run it as root on the PVE node before placing real workloads there:

```bash
sudo TEMPLATE_STORAGE=local \
  ROOTFS_STORAGE=local-lvm \
  BRIDGE=vmbr0 \
  ./scripts/pve-lxc-smoke-test.sh
```

The script creates a tagged disposable CT, verifies OCI import, DHCP, resource status, UID/GID mapping, procfs access, runtime configuration, graceful and hard stops, rootfs replacement and persistent game data, then removes the CT and temporary host data. Override `IMAGE` when the default unprivileged Nginx image is unsuitable for the host.
