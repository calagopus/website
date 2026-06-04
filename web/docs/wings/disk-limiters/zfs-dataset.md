# ZFS Dataset

## What is it?

The `zfs_dataset` disk limiter uses native [ZFS](https://openzfs.org) datasets and the `refquota` property to enforce per-server disk limits. Each server gets its own child dataset (named `server-<uuid>`) under the ZFS pool covering your volumes path, mounted at the server's normal volume directory. The limit is enforced by setting `refquota` on that dataset, which caps the space referenced by the dataset itself (excluding snapshots and descendants).

Wings drives this by shelling out to the `zfs` CLI: `zfs create` with an explicit `mountpoint` on setup, `zfs set refquota=<N>M` to enforce limits, and `zfs list -H -p -o name,used -t filesystem` on a 5-second interval to collect usage across all tracked datasets.

## Requirements

- The path you use for server volumes (e.g. `/var/lib/pterodactyl/volumes`) must be covered by a ZFS pool. Wings finds the correct pool by walking `zfs list -H -o name,mountpoint` and picking the longest matching mountpoint, then using the pool root as the parent for new datasets.
- OpenZFS must be installed on the host with the `zfs` CLI available in Wings' `PATH`.
- Wings must have permission to create, modify, and destroy datasets under that pool. In practice this means running Wings as root (normal setup) or delegating the required permissions with `zfs allow` (e.g. `zfs allow wings create,destroy,mount,quota,refquota <pool>`).

## Downsides

- **Not retroactive by default for existing servers.** Each server's volume must be its own dataset; directories that exist as plain folders on the pool are not converted automatically. The [`migrate-disk-limiter` command](#migrating-existing-servers) can convert them for you.
- **`refquota`, not `quota`.** Wings uses `refquota`, which counts only data the dataset itself references, not snapshots or descendant datasets. This is almost always what you want for a per-server limit, but if you add your own ZFS snapshots on top, they won't count against the server's limit.
- **Dataset count can grow large.** ZFS is fine with thousands of datasets per pool, but some operations (e.g. `zfs list` without filters) get slower as the list grows. This is rarely a problem in practice but is worth knowing if you run very dense nodes.

## Migrating existing servers

Flipping `disk_limiter_mode` from `none` (or `fuse_quota`) to `zfs_dataset` will **not** automatically convert existing server directories into datasets - they will remain plain directories on the parent dataset and will not have quotas enforced. A dataset is a distinct filesystem, so existing files have to be copied into a freshly-created dataset; there is no way to turn a plain directory into one in place.

Wings ships a `migrate-disk-limiter` command that does this conversion for you. For each server it renames the existing directory aside, creates a new `server-<uuid>` dataset in its place, copies the data back in, applies the `refquota`, and removes the old directory. Servers that are already backed by a dataset are detected and skipped.

::: danger Stop Wings first
The Wings daemon and all running servers **must** be stopped before running the migration. Migrating a server's directory while its container is running can corrupt or lose data.
:::

1. Stop the Wings daemon (e.g. `systemctl stop wings`).
2. Set `disk_limiter_mode: zfs_dataset` in your config (see [How do I use it?](#how-do-i-use-it)). The command uses this as the default target, and Wings needs it set to attach the datasets on the next boot.
3. Run a dry run to see what would be migrated:

   ```bash
   wings migrate-disk-limiter --dry-run
   ```

4. Run the migration:

   ```bash
   wings migrate-disk-limiter
   ```

5. Start the Wings daemon again.

The command pulls the server list and per-server disk limits from the panel, so the node must be configured and able to reach it.

| Flag | Description |
| --- | --- |
| `--mode <btrfs-subvolume\|zfs-dataset>` | Target limiter to migrate to. Defaults to the configured `disk_limiter_mode`. |
| `--server <uuid>` | Only migrate the given server. May be passed multiple times. Defaults to all servers. |
| `--dry-run` | Report what would be migrated without making any changes. |
| `-y`, `--yes` | Skip the confirmation prompt (only the daemon-stopped check; you are still responsible for stopping it). |

If a migration fails partway through, the command rolls back automatically: it destroys the partial dataset and restores the original directory, leaving the server exactly as it was.

::: details Alternative: transfer off the node and back
If you'd rather not run the command, you can also move a server off the node and back - transfer it to another node, then transfer it back. Wings creates a fresh child dataset on the way back in. This is slower and moves data over the network, so the migration command is preferred.
:::

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
