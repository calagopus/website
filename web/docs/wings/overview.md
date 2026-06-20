---
prev: false
next: true
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

Only Linux and macOS are officially supported, due to reliance on Unix-specific features. Most functionality is implemented from scratch or via small, focused crates to keep the dependency tree lean.

## Volumes

Wings uses several directories on the host. Knowing where each one is matters for troubleshooting, backups, and disk management.

| Volume | Description | Default Paths |
| :--- | :--- | :--- |
| `root_directory` | Wings persistent state (server state for restart recovery) | **Unix:** `/var/lib/pterodactyl`<br>**Win:** `C:\ProgramData\Calagopus` |
| `log_directory` | Wings log files | **Unix:** `/var/log/pterodactyl`<br>**Win:** `C:\ProgramData\Calagopus\logs` |
| `vmount_directory` | Virtual mounts used for hardware UUID spoofing in containers | **Unix:** `/var/lib/pterodactyl/vmounts`<br>**Win:** `C:\ProgramData\Calagopus\vmounts` |
| `data` | Server data, bind-mounted into each server container | **Unix:** `/var/lib/pterodactyl/volumes`<br>**Win:** `C:\ProgramData\Calagopus\volumes` |
| `archive_directory` | Server archives (currently unused, kept for Pterodactyl compatibility) | **Unix:** `/var/lib/pterodactyl/archives`<br>**Win:** `C:\ProgramData\Calagopus\archives` |
| `backup_directory` | Local backups (Wings driver, Btrfs, and ZFS snapshots) | **Unix:** `/var/lib/pterodactyl/backups`<br>**Win:** `C:\ProgramData\Calagopus\backups` |
| `tmp_directory` | Temporary files | **Unix:** `/tmp/pterodactyl`<br>**Win:** `C:\ProgramData\Calagopus\tmp` |

::: info
The default paths intentionally match Pterodactyl's defaults, so migrating from Pterodactyl to Calagopus doesn't require moving any server data, Wings will find everything where it already is. These defaults are not planned to change.
:::
