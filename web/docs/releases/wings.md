---
title: Wings Releases
description: Changelog for the Calagopus Wings daemon, newest release first.
---

# Wings Releases

## 1.1.0

## Added:
- Added Live File Collaboration support
- Added `docket.network.dns_options` config option
- Added CLI Command for Shell Autocompletions
- Added support for paralellism on the proxmox backup server driver
- Added automatic panel proxy detection for ip passthrough
- Added async backup deletion support
- Added ability to export backups to the file system
- Added ability to query info on used docker ports for a given IP
- Added file progress (in addition to byte process) to tons of operations
- Added global resource usage websocket
- Added direct file renaming support in remote copy
- Added ability to transfer file diff db along with server transfers
- Added automatic docker container path remapping
- Added wings query tunnel to allow websocket-proxied tcp/udp tunnels into servers

## Fixed:
- Improved rootless handling with root remapping
- Cleaned up some response key namings
- Fixed unclear error handling for panel errors
- Fixed issues with extracting certain zip files with broken permissions inside
- Optimized file search to be over 10x faster with 1million+ files
- Optimized Kopia and PBS Backup Browsing speed
- Loads of minor optimizations regarding polling and recursion

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.1.0)

Changelog for the Calagopus Wings daemon. Versions are listed newest first. For the
Panel changelog, see [Panel Releases](./panel.md).

## 1.0.11

### Added

- Added Proxmox Backup Server driver (community contribution)
- Added Kopia backup driver
- Added support for transferring btrfs snapshots in server transfers
- Added support for extracting pxar archives in the file manager
- Added a docker pull image cache to prevent ratelimits
- Added more detailed debug logs on archive creation issues

### Fixed

- Fixed websocket consistency issue when transfers finished
- Fixed slow Wings startups with large servers
- Fixed debug logs containing more info than wikipedia
- Fixed some disk limiter issues with native providers
- Fixed issue in content-disposition parsing
- Fixed issue in the XML wildcard parser
- Fixed CPU live updates when setting to unlimited
- Fixed filesystem performance bottleneck in backup browse / large directories

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.11)

## 1.0.10

### Added

- Added endpoint for retrieving live logs via websocket
- Added endpoint for getting server transfer information via websocket
- Added packet statistics to server resource statistics

### Fixed

- Fixed bug where remote copies / some other actions wouldn't properly update the directory size cache
- Fixed issue in config `increment_ip_or_cidr` not incrementing single IPs properly
- Fixed tons of performance-related stuff regarding locks
- Fixed some filesystem actions not properly chowning until the next server restart

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.10)

## 1.0.9

### Added

- Added `system.sftp.limits.max_connections_per_user`, `system.sftp.limits.max_channels_per_connection`, `system.sftp.limits.max_handles_per_channel` and `system.sftp.limits.max_handles_total` options to be more strict on SSH/SFTP limiting
- Added new `migrate-disk-limiter` command for migrating to the btrfs/zfs disk limiters
- Added support for the `posix-rename@openssh.com` SFTP extension

### Fixed

- Fixed bug where a server was marked as restart-needed when already restarted
- Fixed MIME detection for ddup-bak archive browsing
- Fixed bug in the async filesystem quota writer that could produce duplicate data in high contention scenarios
- Fixed issue with backup deletion on Pterodactyl
- Fixed edgecase where some installations were never marked as finished internally
- Fixed some possible quota overcounting in SFTP code
- Properly chown files when using the sync quota file writer
- Tons of refactoring to reduce the risk of panics via stricter clippy lints

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.9)

## 1.0.8

::: warning Pterodactyl hosts: update immediately
If you are using Pterodactyl and you are a server host, update to this release
**immediately**. If you are using Calagopus, there is no need for an immediate rush.
:::

### Added

- Added `docker.container_apply_seccomp` option to bypass a podman seccomp bug
- Added initial support for restic management endpoints, to remotely manage restic repositories
- Added support for preserving comments in the TOML & INI parser

### Fixed

- Fixed issues with podman CPU usage calculation
- Fixed some further bugs/inconveniences in rootless mode
- Fixed more podman incompatibilities
- Fixed simplex deadlock issue in the script runner stdout stream
- Fixed some double-escaping issues in the INI parser
- Fixed slow startup due to the server manager attaching to all servers before launching the webserver

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.8)

## 1.0.7

::: warning Update the Panel first
Update the Panel **before** updating Wings to this release. This applies to both
Pterodactyl and Calagopus.
:::

### Added

- Added support for recursively chmodding directories via the API
- Added support for a more efficient S3 backup system when working with the Calagopus Panel
- Added special handling for file downloads/similar to prevent invalid HTTP responses in certain race conditions

### Fixed

- Fixed console ratelimit message sending more than once per infraction
- Fixed logic issue in the largest directories check causing invalid listings for subdirectories
- Fixed Docker CPU calculation relying on unsupported podman fields
- Fixed hashing deadlock in `copy_remote` code when transferring across the network
- Fixed reading compressed files sometimes ending the data stream early

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.7)

## 1.0.6

### Added

- Added support for tracking file history (diffs)
- Added support for finding largest directories
- Added proper support for updating the Wings configuration file remotely
- Added automatic SSL cert file reloading
- Added itaf archive support for server transfers, which should allow faster transfer rates (still experimental)

### Fixed

- Fixed some more parsing issues in content-disposition extraction
- Fixed inconsistent transfer abort handling that could cause state to get stuck
- Migrated the config system to `arc_swap` instead of an unsafe mess
- Fixed some more server state edgecases
- Fixed array parsing logic in the configuration parser

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.6)

## 1.0.5

### Added

- Added ability to see container resources while a server is installing to debug issues better

### Fixed

- Fixed server disk usage not actually being rescanned when requested forcibly
- Fixed server disk usage being unable to fix itself when a server has been stopped for 1-2 disk scan iterations
- Rewrote internal Docker container management to prepare for multiple executor support (e.g. no docker at all)
- Made the script runner system return logs live for possible progress support for certain operations

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.5)

## 1.0.4

### Added

- Added `system.disk_checker_concurrency` configuration
- Added support for chunked file uploads (multiple requests for one file)
- Added clearer server lock messages to make debugging easier
- Added ability to browse mounts that are mounted to `/home/container/`

### Fixed

- Fixed server disk usage being counted using logical space instead of physical space
- Fixed inotify skipping important errors by making it mark all notifiers as untrusted

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.4)

## 1.0.3

::: info 200th release
This was the 200th release of Calagopus Wings.
:::

### Added

- Added `system.machine_id.enabled` configuration
- Added explicit timeouts in transfer code
- Added **initial** support for compiling & running Wings on Windows. **Do not use this unless you know what you are doing** - the Windows implementation still needs work and currently only works with Docker Engine on the WSL2 backend, which does not give many useful benefits over running Wings directly in WSL2. There will be work done on this within the next few versions.
- Added ability to see "virtual" directories in zip/7z archives - these can occur when only paths of files are written to the archive, instead of their directory parents too

### Fixed

- Made ZFS backups properly unmount before deletion (community contribution)
- Made the server filesystem properly unmount before deletion
- Rewrote most VFS code for zip/7z/restic to improve performance for large archives/backups when browsing
- Fixed server pull endpoint being able to query files from blocked CIDRs in certain situations
- Fixed server transfers getting stuck if the remote side closed the connection unexpectedly

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.3)

## 1.0.2

### Added

- Added occasional full disk rescans to prevent slow disk usage skews

### Fixed

- Allow 5 second skew for JWT issued_at to reduce pain and suffering
- Check for host `product_uuid` before mounting into a container
- Fixed Docker registry auth not working
- Bumped buffer size for transfer-related I/O to 4 MB for better performance
- Improved transfer ETA calculation to match the frontend
- Fixed Pterodactyl issue where Wings would finish backups too fast, causing them to 404

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.2)

## 1.0.1

### Added

- Added support for sorting files via the list directory endpoint

### Fixed

- Made BTRFS & ZFS snapshot restores use kernel file copying to use no additional disk space
- Fixed more logic flaws in the `ensure_user` config function
- Skip any chowning if Wings is running in rootless mode (pointless)
- Made the websocket rely on the internal user permissions cache instead of the JWT to allow live updates

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.1)

## 1.0.0

### Added

- Added support for ignoring casing in schedule console line actions
- Added `inner_editable` to the directory entry struct for compressed text files

### Fixed

- Added an explicit check for the root user as a container user and block it

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.0)

## 1.0.0-pre.8

### Fixed

- Do not mount the `product_uuid` sys mount when in rootless mode anymore
- Fixed `control.read-console` permission check in SSH mode by reworking the Calagopus compat permission system
- Cleaned up websocket code, migrated to better permission checks
- Fixed docker user initialization code causing invalid defaults

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.0-pre.8)

## 1.0.0-pre.7

### Added

- Added `editable` to directory entry structs so that Wings can better identify editable files for the panel
- Added ANSI escape code for setting the terminal title when using SSH shell to connect to a server

### Fixed

- Updated ddup-bak for more reliable repo saving
- Cleaned up some websocket code, revoke all ws permissions on transfer finish
- Do not recurse symlinks in the inotify watcher disk checker implementation
- Made the game version endpoint use a different hash order for Java edition

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.0-pre.7)

## 1.0.0-pre.6

### Fixed

- Fixed unchecked cast from `i64` to `u64` being able to cause massive disk usage inflation

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.0-pre.6)

## 1.0.0-pre.5

### Added

- Added endpoint for getting server utilization of the node (instead of needing to fetch full server structs)
- Added endpoint for getting server transfer status of outgoing transfers (instead of requiring ws for this info)
- Added `size_physical` to file entry structs for the new separation of disk tracking

### Fixed

- Further improved the inotify checker
- Fixed how disk usage is propagated in partial disk usage checks
- Properly separate "logical" and "physical" file sizes, using physical for the quota
- Properly preserve ctime in archives and add it for 7z archives
- Adjusted ws transfer progress message to separate archive and network progress

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.0-pre.5)

## 1.0.0-pre.4

### Added

- Added `system.disk_check_use_inotify` config option to use the new inotify-based disk checker instead of forcing full rescans
- Added `ignore_panel_wings_upgrades` config option to disable the remote update binary endpoint of Wings
- Added support for `users-groups-by-id@openssh.com` in the SFTP server
- Added websocket messages for machine-readable server transfer status updates

### Fixed

- Fixed installation logs not capturing some early logs that ran instantly at container creation
- Fixed logic bug in the file move process that caused incorrect disk usage modification guess

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.0-pre.4)

## 1.0.0-pre.1

::: info Release tag change
Starting with this release, the `:latest` docker tag no longer contains all commits from
`main` - only the latest release. Existing releases are no longer patched, so new commits
only land on new version numbers. The `:nightly` docker tag now runs for every commit on
the `main` branch and there is no more dedicated `nightly` branch. All 1.0.0 pre-releases
are available under `:latest`; in the future, pre-releases will only be available on
`:latest-pre`.
:::

Compared to 0.24.9 this has essentially zero notable changes.

[View release on GitHub](https://github.com/calagopus/wings/releases/tag/release-1.0.0-pre.1)
