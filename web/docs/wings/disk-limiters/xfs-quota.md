# XFS Quota

## What is it?

The `xfs_quota` disk limiter uses [XFS project quotas](https://man7.org/linux/man-pages/man8/xfs_quota.8.html) to enforce per-server disk limits. Unlike [Btrfs](./btrfs-subvolume.md) and [ZFS](./zfs-dataset.md), which require each server to have its own subvolume or dataset, XFS project quotas apply to an arbitrary *directory tree*. This means existing server directories can be brought under the limiter without any data movement - a Wings restart is enough.

Wings assigns each server a deterministic project ID (derived from the first four bytes of the server UUID), registers it in `/etc/projects`, initializes the tree with `xfs_quota -x -c 'project -s <id>'`, and enforces the limit with `xfs_quota -x -c 'limit -p bsoft=<N>m bhard=<N>m <id>'`. Usage is polled every 5 seconds with `xfs_quota -x -c 'report -p -b -N'`.

## Requirements

- The path you use for server volumes (e.g. `/var/lib/pterodactyl/volumes`) must live on an XFS filesystem.
- That filesystem must be mounted with the `prjquota` mount option. This is a mount-time option - you cannot toggle it on a live mount - so it needs to be set in `/etc/fstab` (or equivalent) and the filesystem remounted. For the root filesystem, this means editing the kernel command line (e.g. `rootflags=prjquota` in GRUB) and rebooting.
- The `xfsprogs` package (providing the `xfs_quota` CLI) must be installed on the host and available in Wings' `PATH`.
- Wings must be able to read and write `/etc/projects`. In practice this means running Wings as root (normal setup).

Verifying `prjquota` is active:

```bash
mount | grep /var/lib/pterodactyl
# /dev/... on /var/lib/pterodactyl type xfs (rw,...,prjquota)
```

If `prjquota` appears in the mount options, the option is active. If it does not, the `xfs_quota` commands will fail when Wings tries to apply a limit.

## Downsides

- **Mount-time setup requirement.** `prjquota` cannot be enabled on a running filesystem. Enabling it on the root filesystem requires a reboot. This is the main friction point compared to Btrfs/ZFS, which can have quotas enabled online.
- **Shared `/etc/projects` file.** Wings atomically rewrites `/etc/projects` each time it adds or removes a server. If you have other tooling on the host that also writes to `/etc/projects`, coordinate carefully - Wings does not merge with unknown entries, but it will preserve any lines it does not own (any line not starting with a project ID Wings manages). A per-server file lock inside Wings prevents concurrent server operations from racing on the file.
- **No `/etc/projid`.** Wings works with numeric project IDs directly and does not touch `/etc/projid`, which is the file that would normally map symbolic names to IDs. This is intentional - there are no symbolic names to manage - but if you go looking for project entries by name, you won't find them there.

## Migrating existing servers

Unlike Btrfs and ZFS, XFS project quotas apply to directories, so **no data movement is required**. When you flip `disk_limiter_mode` to `xfs_quota` and restart Wings, all existing servers will have their project IDs registered and their limits applied on the next startup cycle, in place.

This makes XFS by far the easiest of the native limiters to roll out on an existing node.

## When should I use it?

Use `xfs_quota` if:

- You are running (or are willing to run) XFS for your server volumes, **and**
- You can arrange for `prjquota` to be set as a mount option (which may require a reboot if the volumes live on the root filesystem).

XFS is the right pick if you want maximum raw filesystem performance and don't need snapshots or other volume-manager features. It is also the only native limiter that applies cleanly to existing servers without moving data.

If you need snapshots or other CoW features, [Btrfs](./btrfs-subvolume.md) or [ZFS](./zfs-dataset.md) will serve you better.

## How do I use it?

First, make sure the volumes filesystem is mounted with `prjquota`. Edit `/etc/fstab`:

```
/dev/... /var/lib/pterodactyl xfs defaults,prjquota 0 0
```

Then remount (or reboot, if it's the root filesystem):

```bash
mount -o remount /var/lib/pterodactyl
```

Confirm the option is active:

```bash
mount | grep /var/lib/pterodactyl
```

Then set `disk_limiter_mode` to `xfs_quota` in your wings configuration:

```yaml
system:
  disk_limiter_mode: xfs_quota
```

Restart Wings. New and existing servers will both have their disk limits enforced via XFS project quotas from that point on.