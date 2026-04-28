# ZFS Dataset

## What is it?

The `zfs_dataset` disk limiter uses native [ZFS](https://openzfs.org) datasets and the `refquota` property to enforce per-server disk limits. Each server gets its own child dataset (named `server-<uuid>`) under the ZFS pool covering your volumes path, mounted at the server's normal volume directory. The limit is enforced by setting `refquota` on that dataset, which caps the space referenced by the dataset itself (excluding snapshots and descendants).

Wings drives this by shelling out to the `zfs` CLI: `zfs create` with an explicit `mountpoint` on setup, `zfs set refquota=<N>M` to enforce limits, and `zfs list -H -p -o name,used -t filesystem` on a 5-second interval to collect usage across all tracked datasets.

## Requirements

- The path you use for server volumes (e.g. `/var/lib/pterodactyl/volumes`) must be covered by a ZFS pool. Wings finds the correct pool by walking `zfs list -H -o name,mountpoint` and picking the longest matching mountpoint, then using the pool root as the parent for new datasets.
- OpenZFS must be installed on the host with the `zfs` CLI available in Wings' `PATH`.
- Wings must have permission to create, modify, and destroy datasets under that pool. In practice this means running Wings as root (normal setup) or delegating the required permissions with `zfs allow` (e.g. `zfs allow wings create,destroy,mount,quota,refquota <pool>`).

## Downsides

- **Not retroactive for existing servers.** See [Migrating existing servers](#migrating-existing-servers) below. Each server's volume must be its own dataset; directories that exist as plain folders on the pool will not be converted in place.
- **`refquota`, not `quota`.** Wings uses `refquota`, which counts only data the dataset itself references, not snapshots or descendant datasets. This is almost always what you want for a per-server limit, but if you add your own ZFS snapshots on top, they won't count against the server's limit.
- **Dataset count can grow large.** ZFS is fine with thousands of datasets per pool, but some operations (e.g. `zfs list` without filters) get slower as the list grows. This is rarely a problem in practice but is worth knowing if you run very dense nodes.

## Migrating existing servers

Flipping `disk_limiter_mode` from `none` (or `fuse_quota`) to `zfs_dataset` will **not** convert existing server directories into datasets - they will remain plain directories on the parent dataset and will not have quotas enforced.

To bring an existing server under the new limiter, move it off the node and back:

1. Transfer the server to a different node.
2. Transfer it back to the original node.

Wings will create a fresh child dataset on the way back in, and the server will be subject to its `refquota` from that point on. There is no in-place conversion path; this is inherent to how ZFS datasets work, not a Wings limitation.

## When should I use it?

Use `zfs_dataset` if you are already running (or want to run) ZFS for your server volumes. It is native, kernel-enforced (or kernel-module-enforced, depending on your distribution), stable, and has effectively no runtime overhead compared to not using a limiter at all.

ZFS is particularly attractive if you also want its other features - RAID-Z, cheap snapshots, send/receive for backups, dataset-level compression, ARC caching. If you don't care about any of those, [Btrfs](./btrfs-subvolume.md) gives you a similar feature set without needing an out-of-tree kernel module on most distros, and [XFS](./xfs-quota.md) gives you the best raw performance if you don't need snapshots at all.

## Docker Compose Setup

Wings needs access to the pool's underlying drives and elevated permissions to create and manage ZFS datasets inside a container. The preferred approach is to pass through the drives and add the required capabilities explicitly rather than running the container as fully privileged:

```diff
 services:
   wings:
+    devices:
+      - /dev/sdb:/dev/sdb # replace with the device your ZFS pool lives on
+      # - /dev/sdc:/dev/sdc # if your ZFS pool spans multiple drives, pass them all through
+    cap_add:
+      - SYS_ADMIN
+      - SYS_RAWIO
```

::: warning Add every drive in the pool
All physical drives that make up the ZFS pool must be passed through - not just one. Run `zpool status` on the host to see which devices belong to your pool, then add a `devices` entry for each one.
:::

::: details Alternatively: privileged mode
If you'd rather not manage individual capabilities and device paths, `privileged: true` works too - it grants everything Wings needs. It is broader than necessary, so the approach above is preferred.

```diff
 services:
   wings:
+    privileged: true
```
:::

After making either change, restart the stack:

```bash
docker compose down
docker compose up -d
```

## How do I use it?

Set `disk_limiter_mode` to `zfs_dataset` in your Wings configuration:

```yaml
system:
  disk_limiter_mode: zfs_dataset
```

Then restart Wings. Newly-created servers will be placed on their own `server-<uuid>` dataset with the configured disk limit enforced via `refquota`. For existing servers, see [Migrating existing servers](#migrating-existing-servers).
