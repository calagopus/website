---
title: Calagopus vs Pterodactyl - Game Server Panel Comparison
description: "Calagopus and Pterodactyl compared: Rust against PHP on performance, features, and extensibility."
head:
  - - meta
    - name: robots
      content: index, follow
pageClass: compare-page compare-versus
---

# Calagopus vs Pterodactyl

Pterodactyl has been the default self-hosted game server panel since 2015. Its Docker-based design, MIT license and large egg ecosystem let people run almost any game without building their own container tooling.

Calagopus uses the same design, a web panel talking to a node daemon that runs servers in Docker, but rebuilds both halves in Rust. Starting from scratch also made room for things that are hard to add to Pterodactyl's PHP codebase, such as a native extension API and more database types for game servers.

## Quick Summary

|                           | Calagopus            | Pterodactyl                                |
| ------------------------- | -------------------- | ------------------------------------------ |
| **Language**              | Rust                 | PHP (Laravel) + Go (Wings)                 |
| **First release**         | June 2025            | December 2015                              |
| **License**               | MIT                  | MIT                                        |
| **Price**                 | Free                 | Free                                       |
| **Extension System**      | Native (Rust traits) | None (Blueprint is a community workaround) |
| **Windows Panel Support** | <Yes />                   | <No />                                         |
| **ARM64 Support**         | <Yes />                   | Limited                                    |

## Which Should You Choose?

::: info Stay on Pterodactyl
If your setup works, you depend on Blueprint extensions, or its decade of production use and larger community matter more to you than anything below.
:::

::: tip Move to Calagopus
If many people use your panel at the same time, you want an extension API that doesn't patch panel source, you need PostgreSQL, MongoDB or Redis for game servers, or you want file history, SSH and event-driven schedules.
:::

## Technology and Performance

Pterodactyl's panel is built with PHP and Laravel, while its Go-based Wings daemon handles Docker orchestration on each node. That design has held up through a decade of production use. The PHP side is still an interpreted, request-per-process web stack, which is fine for a panel people open now and then, and less so when it sits between hundreds of concurrent users and the database.

Calagopus uses Rust throughout, including both the panel backend and node daemon. There's no interpreter, garbage collector, or PHP-FPM worker pool to tune. Memory safety is enforced at compile time rather than discovered at runtime.

On identical hardware and under the same CPU limits, the project's benchmarks show the difference: Calagopus serves between **108x and 447x** Pterodactyl's panel API throughput, depending on the hardware and CPU quota, as of v1.2.8 (November 2026). That figure is measured on the public settings endpoint under concurrent load, the one scenario both panels answer with real `200`s rather than rate-limit rejections, and it is not game-server tick rate or player capacity. The [benchmarks page](/docs/about/benchmarks) provides the full methodology, raw results, and controls for comparing different hardware and CPU-quota configurations.

How much that matters depends heavily on scale. A homelab running four servers for friends probably won't notice much difference in panel request latency. A hosting provider managing hundreds of nodes, on the other hand, sees it in CPU and memory: the panel holds its resting footprint under load where PHP-FPM grows into it, and on the daemon side the file manager's metadata work (directory listings, stat calls) costs several times less CPU per operation, as the [daemon benchmarks](/docs/about/daemon-benchmarks) show.

## Feature Comparison
The table below is based on the [full feature reference](/docs/about/features) and focuses specifically on Calagopus and Pterodactyl.

**Platform**

| Feature | Calagopus | Pterodactyl |
| --- | :---: | :---: |
| Free & Open Source | <Yes /> | <Yes /> |
| Native Extension System | <Yes /> | <No /> |
| Support for Multiple Nodes | <Yes /> | <Yes /> |
| Extra Allocations | <Yes /> | <Yes /> |
| Mount Management | <Yes /> | <Yes /> |
| Private Server-to-Server Network | <Yes /> | <No /> |

**Servers and Files**

| Feature | Calagopus | Pterodactyl |
| --- | :---: | :---: |
| Live Console | <Yes /> | <Yes /> |
| File Manager | <Yes /> | <Yes /> |
| File Edit History | <Yes /> | <No /> |
| Archive Browsing Support | <Yes /> | <No /> |
| SFTP Support | <Yes /> | <Yes /> |
| SSH (Shell) Support | <Yes /> | <No /> |
| Schedule Tasks | <Yes /> | <Yes /> |
| Advanced Schedule Triggers | <Yes /> | <No /> |

**Databases**

| Feature | Calagopus | Pterodactyl |
| --- | :---: | :---: |
| Database Management | <Yes /> | <Yes /> |
| MySQL Server-Database Support | <Yes /> | <Yes /> |
| PostgreSQL Server-Database Support | <Yes /> | <No /> |
| MongoDB Server-Database Support | <Yes /> | <No /> |
| Redis Server-Database Support | <Yes /> | <No /> |
| In-Panel Database Explorer | <Yes /> | <No /> |

**Backups**

| Feature | Calagopus | Pterodactyl |
| --- | :---: | :---: |
| Backups | <Yes /> | <Yes /> |
| Backup Browsing Support | <Yes /> | <No /> |
| Advanced Backup Drivers | <Yes /> | <No /> |
| Dynamic Backup Configuration | <Yes /> | <No /> |

**Users and Administration**

| Feature | Calagopus | Pterodactyl |
| --- | :---: | :---: |
| User Management | <Yes /> | <Yes /> |
| Subuser Management | <Yes /> | <Yes /> |
| Role Management | <Yes /> | <No /> |
| WebAuthn Authentication | <Yes /> | <No /> |
| OAuth Support | <Yes /> | <No /> |
| User Impersonation | <Yes /> | <No /> |
| Admin-Action Audit Log | <Yes /> | <No /> |
| Asset Management | <Yes /> | <No /> |

## Where Calagopus Goes Further

### Extension System

Pterodactyl doesn't have a first-party plugin system. To change its behavior you either modify the panel yourself or use [Blueprint](https://blueprint.zip/), an unofficial project that patches PHP source files during installation. A Pterodactyl update can break a Blueprint extension, and an extension can get in the way of a Pterodactyl update.

Calagopus has a native extension API built around Rust traits. Extensions can hook into defined areas such as backend routes, database migrations, UI components (including replacing or intercepting built-in elements), CLI commands, background tasks, and events, all without modifying the core source.

Because extensions go through the API instead of patching the panel, a panel update doesn't need source-level fixes to keep them working. Blueprint extensions don't carry over; what they did has to be rebuilt as a Calagopus extension.

### File Management

Both panels have a browser-based file manager. Calagopus adds file edit history, the ability to browse `.zip`, `.tar`, and `.7z` archives and backup snapshots without extracting them first, cross-server file copying, and direct SSH shell access through the web interface.

Pterodactyl's file manager covers the basics but has none of these.

### Authentication

Pterodactyl supports username-and-password authentication, with optional TOTP-based two-factor authentication. Calagopus supports both and adds **WebAuthn** for passkeys and hardware security keys, plus **OAuth** sign-in through GitHub, Google, Discord, or a generic OAuth2/OIDC provider.

Calagopus can also automatically provision roles and subuser access based on claims returned during OAuth login.

### Scheduling

Both panels run cron-style scheduled tasks. Calagopus adds eight more trigger types, including power-state changes, crashes, backup results, sustained resource thresholds, matching console output, and schedules triggered by the outcome of other schedules. It also supports conditional branching within a schedule.

Pterodactyl's scheduler is time-based, so anything more needs an external script that talks to its API.

### Databases

Pterodactyl supports MySQL/MariaDB as a server database. Calagopus adds PostgreSQL, MongoDB and Redis, provisioned through a dedicated [database agent](/docs/db-agent/overview) rather than manually configured on each node.

### Backups

Both panels support scheduled server backups. Calagopus has several backup drivers, including Btrfs/ZFS snapshots, S3-compatible storage, Restic, Kopia, and dedicated Proxmox Backup Server integration.

Administrators can define several named backup targets and pick one per server, node or location.

### Administration

Calagopus has role-based access control for administrators, an audit log covering admin actions, server activity and account activity, user impersonation for support, and asset management.

Pterodactyl has user and permission management, but no admin roles, audit log or impersonation.

## Where Pterodactyl Is Stronger

- **Track record.** Pterodactyl has been in production since December 2015. Calagopus's first release was June 2025.
- **Community.** More guides and answers are written for Pterodactyl, and its third-party extension catalog is larger.
- **Blueprint.** Blueprint extensions run on Pterodactyl and don't carry over, so anything you depend on has to be rebuilt first.
- **Large file transfers.** Streaming large file transfers is where Wings currently uses less memory than the Calagopus daemon. The [daemon benchmarks](/docs/about/daemon-benchmarks) chart both.

## Migrating from Pterodactyl

Calagopus has a built-in importer that reads a Pterodactyl database and writes the users, servers, nodes and eggs into a fresh Calagopus installation. Existing user logins continue to work, and server data doesn't need to be moved.

API keys are the exception. Pterodactyl hashes them using a different algorithm, so they can't be imported. You need new API keys after the migration anyway, because Calagopus's API isn't wire-compatible with Pterodactyl's.

For the complete standalone and Docker migration walkthroughs, see the [Pterodactyl migration guide](/docs/additional/migrations/pterodactyl). For a new installation, see [installing Calagopus](/docs/panel/installation/).

<CompareFaq />
