# Disk Limiters

Ever heard of "Pterodactyl-Destroyer" or similar Tools? They are all based on the same principle, they abuse the fact that Pterodactyl doesn't have a quota system for disk space, and they create a file that fills up the entire disk, causing other servers on the same node to be affected, and potentially causing the node to crash. This is a common attack vector for malicious users, and it's something that has been a problem for Pterodactyl for a long time.

At Calagopus we have multiple Systems in place that can prevent this, not all are applicable to everyone.

- [**Btrfs Subvolume**](./btrfs-subvolume.md): A native, kernel-enforced disk limiter using Btrfs subvolumes and qgroups. Stable and performant, but requires Btrfs and is not retroactive for existing servers.
- [**ZFS Dataset**](./zfs-dataset.md): A native, kernel-enforced disk limiter using ZFS datasets and `refquota`. Stable and performant, but requires ZFS and is not retroactive for existing servers.
- [**XFS Project Quota**](./xfs-quota.md): A native disk limiter using XFS project quotas. High performance and works with existing servers, but requires XFS with `prjquota` enabled and has some limitations around setup and shared `/etc/projects` management.
- [**Fusequota**](./fusequota.md): A user-space disk limiter using FUSE and loopback files. Works on any filesystem and is retroactive for existing servers, but has higher overhead and is less stable than the native options. Use only if the native options are not viable for your setup.
