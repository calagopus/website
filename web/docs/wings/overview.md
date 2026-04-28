# Wings

## Minimum Requirements

Before installing the Calagopus Wings Daemon, ensure that your system meets the following minimum requirements:

- **Operating System**: Ubuntu 22.04 LTS or later, Debian 11 or later, or anything that supports modern Docker versions
- **CPU Architecture**: x86_64, ARM64, RISC-V or PPC64LE
- **RAM**: Minimum 512 MB (1 GB or more recommended)
- **Disk Space**: At least 256 MB of free disk space

**Important:** Wings **requires** Docker to be installed and running on the host machine to manage game server containers, these minimum requirements also do not include actual load from game servers which will require additional resources based on the games being hosted.

## Technical Overview

The Calagopus Wings Daemon is a lightweight agent responsible for managing game server containers on behalf of the Calagopus Panel. It communicates securely with the Panel to receive instructions and report status updates.

- **Language**: :crab: Rust
- **Container Management**: Docker/Podman via [`bollard`](https://crates.io/crates/bollard)
- **Web Framework**: [`axum`](https://crates.io/crates/axum)
- **Runtime**: [`tokio`](https://crates.io/crates/tokio)
- **SSH Handling**: [`russh`](https://crates.io/crates/russh)

While Cross-Platform support is a goal for Wings, at this time only Linux/MacOS is officially supported due to the reliance on Unix-specific features.
Most of the other functionality is implemented from scratch or using smaller crates to keep dependencies minimal and avoid bloat.

## Volumes

Wings uses a multitude of volumes to store data, knowing what these volumes are and what they do is crucial for troubleshooting and understanding how Wings works.

| Volume Name | Description | Default Paths |
| :--- | :--- | :--- |
| `root_directory` | This is the root directory where Wings stores its own persistent data (mainly state of servers so it can restore them on restart). | **Unix:** `/var/lib/pterodactyl`<br>**Win:** `C:\ProgramData\Calagopus` |
| `log_directory` | This is the directory where Wings stores its logs. | **Unix:** `/var/log/pterodactyl`<br>**Win:** `C:\ProgramData\Calagopus\logs` |
| `vmount_directory` | This is the directory where Wings stores virtual mounts for servers. Currently mainly used for spoofing hardware UUIDs for containers. | **Unix:** `/var/lib/pterodactyl/vmounts`<br>**Win:** `C:\ProgramData\Calagopus\vmounts` |
| `data` | This is the directory where Wings stores server data. This is the directory that gets bind-mounted to server containers and is where all server files are stored. | **Unix:** `/var/lib/pterodactyl/volumes`<br>**Win:** `C:\ProgramData\Calagopus\volumes` |
| `archive_directory` | This is the directory where Wings stores server archives. This is 100% unused in current code and is simply there for compatibility with Pterodactyl's codebase; it may be used in the future. | **Unix:** `/var/lib/pterodactyl/archives`<br>**Win:** `C:\ProgramData\Calagopus\archives` |
| `backup_directory` | This is the directory where Wings stores server backups. This applies to backups using the `Wings` backup driver; btrfs and zfs backups also use this directory for snapshots. | **Unix:** `/var/lib/pterodactyl/backups`<br>**Win:** `C:\ProgramData\Calagopus\backups` |
| `tmp_directory` | This is the directory where Wings stores temporary files. This is used for various temporary files that Wings needs to create during its operation. | **Unix:** `/tmp/pterodactyl`<br>**Win:** `C:\ProgramData\Calagopus\tmp` |

::: info
You may have noticed that the default paths for the volumes are the same as Pterodactyl's default paths, this is intentional to make it easier for users migrating from Pterodactyl to Calagopus, as they can simply point Wings to their existing Pterodactyl directories and have everything work without having to move any files.
For compatibility reasons, these paths' default values are not planned to change in the future.
:::
