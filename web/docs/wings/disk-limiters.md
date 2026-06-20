# Disk Limiters

Without per-server disk quotas, a malicious user can fill the node's disk entirely - disrupting other servers and potentially crashing the host. This has been a well-known attack vector against Pterodactyl-based panels for years.

Calagopus provides several disk limiter options to prevent this. Not all are applicable to every setup.

- [**Btrfs Subvolume**](./disk-limiters/btrfs-subvolume.md): A native, kernel-enforced disk limiter using Btrfs subvolumes and qgroups. Stable and performant, but requires Btrfs. Existing servers can be converted with the `migrate-disk-limiter` command.
- [**ZFS Dataset**](./disk-limiters/zfs-dataset.md): A native, kernel-enforced disk limiter using ZFS datasets and `refquota`. Stable and performant, but requires ZFS. Existing servers can be converted with the `migrate-disk-limiter` command.
- [**XFS Project Quota**](./disk-limiters/xfs-quota.md): A native disk limiter using XFS project quotas. High performance and works with existing servers, but requires XFS with `prjquota` enabled and has some limitations around setup and shared `/etc/projects` management.
- [**Fusequota**](./disk-limiters/fusequota.md): A user-space disk limiter using FUSE and loopback files. Works on any filesystem and is retroactive for existing servers, but has higher overhead and is less stable than the native options. Use only if the native options are not viable for your setup.
