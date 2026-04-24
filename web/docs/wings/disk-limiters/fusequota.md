# Fusequota

## What is it?

The `fuse_quota` disk limiter uses [Fusequota](https://github.com/calagopus/fusequota), a user-space filesystem built on FUSE, to enforce per-server disk limits on *any* underlying filesystem. Unlike [Btrfs](./btrfs-subvolume.md), [ZFS](./zfs-dataset.md), and [XFS](./xfs-quota.md), which all require specific filesystem support on the host, Fusequota works on top of whatever filesystem your server volumes already live on - ext4, XFS without `prjquota`, a network mount, whatever. This makes it the fallback option when no native limiter is available.

Wings spawns a dedicated `fusequota` daemon process per server on startup. The daemon mounts a FUSE filesystem over the server's volume directory, enforces the configured quota, and exposes a local Unix socket for Wings to query and update usage. Wings batches usage deltas and syncs them to the daemon every 10 seconds.

::: warning
Fusequota is **not** a true quota system. It is a workaround that enforces limits from user-space, and it is the slowest, least stable, and least compatible of the available options. Only use it if none of the native limiters ([Btrfs](./btrfs-subvolume.md), [ZFS](./zfs-dataset.md), [XFS](./xfs-quota.md)) are viable on your host.
:::

## Requirements

- The host kernel must support FUSE (the `fuse` module) and `allow_other` mounts (which is the default on most distros, but some hardened kernels disable it - check `/etc/fuse.conf` for `user_allow_other`).
- Wings must be able to mount FUSE filesystems. In practice this means running Wings as root (normal setup).

Fusequota tries to minimize its user-space overhead by using aggressive write caching and - for read-only file descriptors - bypassing the FUSE layer entirely and reading directly from the backing filesystem. This helps, but does not eliminate, the performance cost.

## Downsides

- **Performance.** FUSE operates in user-space, which introduces overhead on every filesystem operation that can't be served from cache. For disk-intensive workloads this means increased latency and reduced throughput. The read-bypass and write-cache optimizations help, but a native limiter will always be faster.
- **Compatibility.** Fusequota works with the vast majority of games, but not all. A small number of games or mods make assumptions about the underlying filesystem that don't hold under FUSE. Test with your specific workload before committing.
- **Stability.** FUSE as a technology has a reputation for occasional instability (stuck mounts, kernel/user-space sync issues under load). We've done what we can to make Fusequota robust, but it is fundamentally less stable than a kernel-level filesystem. Monitor your servers after rolling it out.
- **Complexity.** Fusequota adds a per-server daemon, a Unix socket, and a FUSE mount on top of your normal setup. If something goes wrong, you'll need to be comfortable inspecting mounts, daemons, and sockets to diagnose it.
- **Not a true quota system.** Fusequota tracks usage inside the FUSE layer rather than at the filesystem level. If a server finds a way to write outside the FUSE mount (which shouldn't happen under normal Wings operation, but is worth mentioning), that data won't count against its quota.

## Migrating existing servers

Unlike [Btrfs](./btrfs-subvolume.md) and [ZFS](./zfs-dataset.md), Fusequota does not need to convert server directories into subvolumes or datasets - it simply mounts a FUSE layer over whatever directory already exists. Flipping `disk_limiter_mode` to `fuse_quota` and restarting Wings will bring existing servers under the limiter as they start up. No data movement is required.

## When should I use it?

Use `fuse_quota` if, and generally **only if**, you have no other option:

- **If you run any kind of production or public hosting**, you should be using a native limiter. [Btrfs](./btrfs-subvolume.md), [ZFS](./zfs-dataset.md), and [XFS](./xfs-quota.md) are all substantially better across every axis that matters (performance, stability, simplicity).
- **If you run a small private panel for yourself and a few friends**, you probably don't need a disk limiter at all. The threat model Fusequota exists to counter ("Pterodactyl-Destroyer"-style attacks where a malicious user fills the disk) mostly doesn't apply to trusted users.
- **If you host free or low-trust servers** on a filesystem where no native limiter is available, Fusequota can be worth the trade-off - having a slow-but-protected server is better than having no protection at all.
- **If you host high-performance servers**, Fusequota's overhead may be unacceptable. Move the volumes to a filesystem that supports a native limiter instead.

If you're unsure which limiter is right for your setup, ask in our [Discord](https://discord.gg/uSM8tvTxBV) - we're happy to help you think it through.

## How do I use it?

Set `disk_limiter_mode` to `fuse_quota` in your wings configuration:

```yaml
system:
  disk_limiter_mode: fuse_quota
```

Then restart Wings. Fusequota will be activated for each server the next time that server starts.
