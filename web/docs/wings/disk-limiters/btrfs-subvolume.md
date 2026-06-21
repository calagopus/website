# BTRFS subvolume

## What is it?

The `btrfs_subvolume` disk limiter uses native [Btrfs](https://btrfs.readthedocs.io) subvolumes and qgroups (quota groups) to enforce per-server disk limits. Each server's volume directory becomes its own Btrfs subvolume, and the limit is applied via a qgroup on that subvolume. Because this is kernel-enforced at the filesystem level, there is no user-space overhead, and it is significantly more stable and performant than [Fusequota](./fusequota.md).

Wings drives this by shelling out to the `btrfs` CLI: `btrfs subvolume create` on setup, `btrfs qgroup limit` to enforce limits, and `btrfs qgroup show --raw` on a 5-second interval to collect usage.

## Requirements

- The path you use for server volumes (e.g. `/var/lib/pterodactyl/volumes`) must live on a Btrfs filesystem.
- The `btrfs-progs` package (providing the `btrfs` CLI) must be installed on the host and available in Wings' `PATH`.
- Wings must be able to create subvolumes at the volumes path. In practice this means running Wings as root (or with the appropriate capabilities), which is the normal setup anyway.
- The Btrfs filesystem must have qgroups enabled. Wings will run `btrfs quota enable` automatically the first time it creates a server subvolume, but you can pre-enable it with `btrfs quota enable /path/to/volumes/mount` if you prefer to set it up explicitly.

## Downsides

- **Not retroactive by default for existing servers.** A server's volume directory only becomes a subvolume when Wings creates it; directories that already exist as plain folders are not converted automatically. The [`migrate-disk-limiter` command](#migrating-existing-servers) can convert them for you.
- **Qgroup accounting is filesystem-wide work.** Btrfs has to maintain reference counters across all subvolumes on the filesystem. On very large or heavily-fragmented filesystems, this can make operations like balancing or scrubbing noticeably more expensive. For typical game-server workloads this is not a problem, but it is worth knowing about.
- **Snapshots count against quotas in non-obvious ways.** If you use Btrfs snapshots (for backups or otherwise), be aware that shared extents between a subvolume and its snapshots can show up in qgroup accounting in ways that are not always intuitive. If you don't use Btrfs snapshots outside of what Wings does, you don't need to worry about this.

## Migrating existing servers

Flipping `disk_limiter_mode` from `none` (or `fuse_quota`) to `btrfs_subvolume` will **not** automatically convert existing server directories into subvolumes - they will remain plain directories and will not have quotas enforced. A subvolume is a distinct filesystem object, so existing files have to be copied into a freshly-created subvolume; there is no way to turn a plain directory into one in place.

Wings ships a `migrate-disk-limiter` command that does this conversion for you. For each server it renames the existing directory aside, creates a new subvolume in its place, copies the data back in (using reflinks where possible, so on the same Btrfs filesystem this is fast and uses almost no extra space), applies the disk limit, and removes the old directory. Servers that are already subvolumes are detected and skipped.

::: danger Stop Wings first
The Wings daemon and all running servers **must** be stopped before running the migration. Migrating a server's directory while its container is running can corrupt or lose data.
:::

1. Stop the Wings daemon (e.g. `systemctl stop wings`).
2. Set `disk_limiter_mode: btrfs_subvolume` in your config (see [How do I use it?](#how-do-i-use-it)). The command uses this as the default target, and Wings needs it set to attach the subvolumes on the next boot.
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

If a migration fails partway through, the command rolls back automatically: it destroys the partial subvolume and restores the original directory, leaving the server exactly as it was.

::: details Alternative: transfer off the node and back
If you'd rather not run the command, you can also move a server off the node and back - transfer it to another node, then transfer it back. Wings creates a fresh subvolume on the way back in. This is slower and moves data over the network, so the migration command is preferred.
:::

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
