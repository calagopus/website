---
title: Wings Overview
description: "Overview of Calagopus Wings, the Rust node daemon that runs game servers in Docker containers: minimum requirements, supported CPU architectures, and the technical stack."
---

# Wings

Wings is the node agent that runs on your game server hosts. It manages Docker containers on behalf of the panel, receives instructions over the Wings API, and reports status updates back. Each Wings instance can manage multiple game servers, and a single panel can connect to multiple Wings instances.

## Minimum Requirements

- **Operating System**: Ubuntu 22.04 LTS or later, Debian 11 or later, or any Linux distribution that supports modern Docker versions
- **CPU Architecture**: x86_64, ARM64, RISC-V, or PPC64LE
- **RAM**: 512 MB minimum (1 GB or more recommended)
- **Disk Space**: 256 MB minimum

::: warning Docker is required
Wings uses Docker to run and isolate game server containers. Docker must be installed and running on the host. The minimum requirements above don't include the resources needed by the game servers themselves, those are additive.
:::

## Technical Overview

- **Language**: :crab: Rust
- **Container Management**: Docker/Podman via [`bollard`](https://crates.io/crates/bollard)
- **Web Framework**: [`axum`](https://crates.io/crates/axum)
- **Runtime**: [`tokio`](https://crates.io/crates/tokio)
- **SSH Handling**: [`russh`](https://crates.io/crates/russh)

Official builds are published for Linux only, due to reliance on Unix-specific features. Most functionality is implemented from scratch or via small, focused crates to keep the dependency tree lean.

## Volumes

Wings uses several directories on the host. Knowing where each one is matters for troubleshooting, backups, and disk management.

Most of these live under `root_directory` by default (see [path placeholders](./configuration.md#system-configuration) for how that works), so the paths below are shown already resolved.

| Volume | Description | Default Paths |
| :--- | :--- | :--- |
| `root_directory` | Wings persistent state (server state for restart recovery, and since Wings 1.2.9 the `resource_history.db` behind [Resource History](../panel/features/server/console.md#resource-history)) | **Unix:** `/var/lib/calagopus-wings`<br>**Win:** `C:\ProgramData\Calagopus-Wings` |
| `log_directory` | Wings log files | **Unix:** `/var/log/calagopus-wings`<br>**Win:** `C:\ProgramData\Calagopus-Wings\logs` |
| `data` | Server data, bind-mounted into each server container | **Unix:** `/var/lib/calagopus-wings/volumes`<br>**Win:** `C:\ProgramData\Calagopus-Wings\volumes` |
| `diffs_directory` | Per-server file history/diff databases | **Unix:** `/var/lib/calagopus-wings/diffs`<br>**Win:** `C:\ProgramData\Calagopus-Wings\diffs` |
| `vmount_directory` | Virtual mounts used for hardware UUID spoofing in containers | **Unix:** `/var/lib/calagopus-wings/vmounts`<br>**Win:** `C:\ProgramData\Calagopus-Wings\vmounts` |
| `archive_directory` | Server archives (currently unused, kept for Pterodactyl compatibility) | **Unix:** `/var/lib/calagopus-wings/archives`<br>**Win:** `C:\ProgramData\Calagopus-Wings\archives` |
| `backup_directory` | Local backups (Wings driver, Btrfs, and ZFS snapshots) | **Unix:** `/var/lib/calagopus-wings/backups`<br>**Win:** `C:\ProgramData\Calagopus-Wings\backups` |
| `tmp_directory` | Temporary files | **Unix:** `/var/lib/calagopus-wings/tmp`<br>**Win:** `C:\ProgramData\Calagopus-Wings\tmp` |

::: info
A node migrated from Pterodactyl or Pelican keeps the paths in its existing config, so no server data has to move. See [Migrating Wings Nodes](../additional/migrations/wings.md).
:::
