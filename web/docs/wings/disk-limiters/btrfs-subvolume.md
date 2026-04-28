# Btrfs Subvolume

## What is it?

The `btrfs_subvolume` disk limiter uses native [Btrfs](https://btrfs.readthedocs.io) subvolumes and qgroups (quota groups) to enforce per-server disk limits. Each server's volume directory becomes its own Btrfs subvolume, and the limit is applied via a qgroup on that subvolume. Because this is kernel-enforced at the filesystem level, there is no user-space overhead, and it is significantly more stable and performant than [Fusequota](./fusequota.md).

Wings drives this by shelling out to the `btrfs` CLI: `btrfs subvolume create` on setup, `btrfs qgroup limit` to enforce limits, and `btrfs qgroup show --raw` on a 5-second interval to collect usage.

## Requirements

- The path you use for server volumes (e.g. `/var/lib/pterodactyl/volumes`) must live on a Btrfs filesystem.
- The `btrfs-progs` package (providing the `btrfs` CLI) must be installed on the host and available in Wings' `PATH`.
- Wings must be able to create subvolumes at the volumes path. In practice this means running Wings as root (or with the appropriate capabilities), which is the normal setup anyway.
- The Btrfs filesystem must have qgroups enabled. Wings will run `btrfs quota enable` automatically the first time it creates a server subvolume, but you can pre-enable it with `btrfs quota enable /path/to/volumes/mount` if you prefer to set it up explicitly.

## Downsides

- **Not retroactive for existing servers.** See [Migrating existing servers](#migrating-existing-servers) below. A server's volume directory only becomes a subvolume when Wings creates it; directories that already exist as plain folders will not be converted in place.
- **Qgroup accounting is filesystem-wide work.** Btrfs has to maintain reference counters across all subvolumes on the filesystem. On very large or heavily-fragmented filesystems, this can make operations like balancing or scrubbing noticeably more expensive. For typical game-server workloads this is not a problem, but it is worth knowing about.
- **Snapshots count against quotas in non-obvious ways.** If you use Btrfs snapshots (for backups or otherwise), be aware that shared extents between a subvolume and its snapshots can show up in qgroup accounting in ways that are not always intuitive. If you don't use Btrfs snapshots outside of what Wings does, you don't need to worry about this.

## Migrating existing servers

Flipping `disk_limiter_mode` from `none` (or `fuse_quota`) to `btrfs_subvolume` will **not** convert existing server directories into subvolumes - they will remain plain directories and will not have quotas enforced. Attaching the limiter to a non-subvolume directory will also fail, because Wings verifies it is looking at an actual Btrfs subvolume (inode number 256) before taking ownership of it.

To bring an existing server under the new limiter, move it off the node and back:

1. Transfer the server to a different node.
2. Transfer it back to the original node.

Wings will create a fresh subvolume on the way back in, and the server will be subject to its disk limit from that point on. There is no in-place conversion path; this is inherent to how Btrfs subvolumes work, not a Wings limitation.

## When should I use it?

Use `btrfs_subvolume` if you are already running (or are happy to run) Btrfs for your server volumes. It is native, kernel-enforced, stable, and has effectively no runtime overhead compared to not using a limiter at all.

If you are setting up a fresh node and choosing a filesystem, Btrfs is a solid choice when you also want cheap snapshots and online resize. If you want maximum raw throughput and don't need those features, [XFS](./xfs-quota.md) is worth considering. If you already use ZFS for other reasons, [ZFS](./zfs-dataset.md) is the obvious pick.

## Docker Compose Setup

Wings needs access to the underlying block device and elevated permissions to create and manage Btrfs subvolumes inside a container. The preferred approach is to pass through the drive and add the required capabilities explicitly rather than running the container as fully privileged:

```diff
 services:
   wings:
+    devices:
+      - /dev/sdb:/dev/sdb # replace with the device your Btrfs filesystem lives on
+      # - /dev/sdc:/dev/sdc # if your Btrfs filesystem spans multiple devices, pass them all through
+    cap_add:
+      - SYS_ADMIN
+      - SYS_RAWIO
```

::: warning Replace the device path
`/dev/sdb` is an example. Use the actual block device that your Btrfs filesystem lives on. You can find it with `lsblk` or `findmnt /var/lib/pterodactyl/volumes` on the host.
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

Set `disk_limiter_mode` to `btrfs_subvolume` in your Wings configuration:

```yaml
system:
  disk_limiter_mode: btrfs_subvolume
```

Then restart Wings. Newly-created servers will be placed on their own Btrfs subvolume with the configured disk limit enforced. For existing servers, see [Migrating existing servers](#migrating-existing-servers).
