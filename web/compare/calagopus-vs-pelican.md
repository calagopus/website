---
title: Calagopus vs Pelican Panel - Game Server Panel Comparison
description: "Calagopus and Pelican Panel compared: Rust against PHP/Laravel on performance, features, and extensibility."
head:
  - - meta
    - name: robots
      content: index, follow
pageClass: compare-page compare-versus
---

# Calagopus vs Pelican Panel

Pelican started in 2024 as a fork of Pterodactyl and has grown well past a maintenance branch. The team rebuilt the interface with Filament, added OAuth and passkey login, role-based admin permissions and a first-party plugin system.

Calagopus aims at the same goal from a different starting point. Instead of building on Pterodactyl's PHP codebase, it was written from scratch in Rust. That gives it a faster runtime, and its extensions aren't bound to Laravel's request model or a PHP plugin architecture.

## Quick Summary

|                           | Calagopus            | Pelican              |
| ------------------------- | -------------------- | -------------------- |
| **Language**              | Rust                 | PHP (Laravel)        |
| **Based on**              | Original rewrite     | Pterodactyl fork     |
| **First release**         | June 2025            | March 2024           |
| **License**               | MIT                  | AGPL-3.0             |
| **Price**                 | Free                 | Free                 |
| **Extension System**      | Native (Rust traits) | Native (PHP plugins) |
| **Windows Panel Support** | <Yes />                   | <No />                   |
| **ARM64 Support**         | <Yes />                   | Limited              |

## Which Should You Choose?

::: info Stay on Pelican
If you want to keep PHP/Laravel, you already administer Laravel applications, or you need the panel itself on MySQL or SQLite.
:::

::: tip Move to Calagopus
If many people use your panel at the same time, you want extensions that can replace built-in UI, you need PostgreSQL, MongoDB or Redis for game servers, or you want file history, SSH, event-driven schedules and an admin audit log.
:::

## Technology and Performance

Pelican inherited Pterodactyl's PHP/Laravel foundation and has modernized parts of it. The UI now uses Filament, and the panel itself supports PostgreSQL and SQLite in addition to MySQL. Wings, the node daemon responsible for communicating with Docker, is still the Go-based daemon inherited from Pterodactyl rather than a component rewritten specifically for Pelican.

In Calagopus, both the panel and the node daemon are written from scratch in Rust. There's no PHP interpreter or request-per-process worker pool, and memory safety is enforced at compile time instead of being left to runtime checks.

The benchmarks show the difference. Under the same CPU limits, Calagopus serves between **229x and 1073x** Pelican's panel API throughput, depending on the hardware, as of v1.2.8 (November 2026). That figure is measured on the public settings endpoint under concurrent load, the one scenario both panels answer with real `200`s rather than rate-limit rejections, and it is not game-server tick rate or player capacity. The [benchmarks page](/docs/about/benchmarks) has the full methodology and raw results, and lets you compare specific panels and hardware.

This only matters once the workload is large enough. A Discord community running a handful of servers won't put much load on either panel. A hosting provider with hundreds of customers online at once is far more likely to notice.

## Feature Comparison

The table below is based on the [full feature reference](/docs/about/features) and focuses specifically on Calagopus and Pelican.

**Platform**

| Feature | Calagopus | Pelican |
| --- | :---: | :---: |
| Free & Open Source | <Yes /> | <Yes /> |
| Native Extension System | <Yes /> | <Yes /> |
| Support for Multiple Nodes | <Yes /> | <Yes /> |
| Extra Allocations | <Yes /> | <Yes /> |
| Mount Management | <Yes /> | <Yes /> |
| Private Server-to-Server Network | <Yes /> | <No /> |

**Servers and Files**

| Feature | Calagopus | Pelican |
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

| Feature | Calagopus | Pelican |
| --- | :---: | :---: |
| Database Management | <Yes /> | <Yes /> |
| MySQL Server-Database Support | <Yes /> | <Yes /> |
| PostgreSQL Server-Database Support | <Yes /> | <No /> |
| MongoDB Server-Database Support | <Yes /> | <No /> |
| Redis Server-Database Support | <Yes /> | <No /> |
| In-Panel Database Explorer | <Yes /> | <No /> |

**Backups**

| Feature | Calagopus | Pelican |
| --- | :---: | :---: |
| Backups | <Yes /> | <Yes /> |
| Backup Browsing Support | <Yes /> | <No /> |
| Advanced Backup Drivers | <Yes /> | <No /> |
| Dynamic Backup Configuration | <Yes /> | <Yes /> |

**Users and Administration**

| Feature | Calagopus | Pelican |
| --- | :---: | :---: |
| User Management | <Yes /> | <Yes /> |
| Subuser Management | <Yes /> | <Yes /> |
| Role Management | <Yes /> | <Yes /> |
| WebAuthn Authentication | <Yes /> | <Yes /> |
| OAuth Support | <Yes /> | <Yes /> |
| User Impersonation | <Yes /> | <No /> |
| Admin-Action Audit Log | <Yes /> | <No /> |
| Asset Management | <Yes /> | <No /> |

Pelican has closed many of the gaps between Pterodactyl-based panels and Calagopus: WebAuthn, OAuth, role management and dynamic backup configuration are all there now. The remaining differences are in file management, scheduling, database options and admin audit logging.

## Where Calagopus Goes Further

### Extension System

Pelican's plugin system is a real first-party feature, not a community workaround like Pterodactyl's Blueprint. Plugins are installed, updated and removed from the panel, with queued jobs and an admin interface handling the process.

Calagopus extensions can reach further. Besides backend routes, database migrations, and CLI commands, extensions can intercept or completely replace built-in UI components instead of being limited to predefined plugin slots. They can also provide theme overrides through a dedicated theming API and communicate with one another through a shared inter-extension API.

### File Management

Both panels have a browser-based file manager. Calagopus adds file edit history and a side-by-side diff viewer, support for browsing `.zip`, `.tar`, and `.7z` archives and backup snapshots without extracting them first, cross-server file copying, and direct SSH shell access from the web interface.

Pelican's file manager covers uploads, downloads and in-browser editing, but none of the above.

### Authentication

Pelican's login options are close to Calagopus: it supports passkeys and has OAuth integrations.

Calagopus supports WebAuthn and OAuth too, but works with any OAuth2/OIDC provider instead of a fixed list. OAuth claims can also assign a user's role or subuser access on first login. On Pelican, an administrator sets that up by hand.

### Scheduling

Both panels run scheduled tasks on cron-style triggers. Calagopus adds eight more trigger types, including power-state changes, crashes, backup results, sustained resource thresholds, matching console output, and triggers based on the result of another schedule. It also supports conditional branching within a schedule's steps.

Pelican's scheduler is time-based. Anything event-driven needs an external script that talks to its API.

### Databases

Pelican's own panel database can use MySQL, PostgreSQL or SQLite, where Pterodactyl requires MySQL.

For databases provisioned **for game servers**, however, Pelican still limits the available options to MySQL/MariaDB.

Calagopus adds PostgreSQL, MongoDB and Redis as server databases, provisioned through a dedicated [database agent](/docs/db-agent/overview) instead of being configured by hand on each node.

### Backups

Pelican already supports dynamic backup configuration, so administrators can define several backup targets and choose one per server.

Calagopus has more backup drivers, eight in total, including Btrfs/ZFS snapshots, S3-compatible storage, Restic, Kopia, and dedicated Proxmox Backup Server integration. It also lets you browse the contents of a backup or archive directly from the file manager without restoring it first.

## Where Pelican Is Stronger

- **Familiar stack.** Pelican is PHP/Laravel. If you already administer Laravel applications or know Pterodactyl, there is little to relearn.
- **Panel database choice.** Pelican's panel can run on MySQL, MariaDB, PostgreSQL or SQLite. Calagopus's panel needs PostgreSQL.
- **Track record.** Pelican's first release was March 2024, and its lineage goes back to Pterodactyl. Calagopus's first release was June 2025.

## Migrating from Pelican

Calagopus has a built-in importer that reads a Pelican database and writes the users, servers, nodes and eggs into a fresh Calagopus installation. Existing user logins keep working, and server data doesn't need to be moved.

API keys are the exception. Pelican hashes them with a different algorithm, so they can't be imported, and Calagopus's API isn't compatible with Pelican's anyway. Generate new keys after migrating.

For the complete standalone and Docker migration instructions, see the [Pelican migration guide](/docs/additional/migrations/pelican). For a new installation, see [installing Calagopus](/docs/panel/installation/).

<CompareFaq />
