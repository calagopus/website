---
title: Calagopus vs Pelican Panel - Game Server Panel Comparison
description: A detailed comparison of Calagopus and Pelican Panel. See how the Rust-based Calagopus panel compares to Pelican's PHP/Laravel architecture in performance, features, and extensibility.
head:
  - - meta
    - name: robots
      content: index, follow
sidebar: false
aside: false
---

# Calagopus vs Pelican Panel

Pelican started out in 2024 as a fork of Pterodactyl, but it has grown into much more than a simple maintenance branch. The team rebuilt the interface with Filament, added OAuth and passkey authentication, introduced role-based admin permissions, and launched a first-party plugin system. These are significant improvements over the project it was based on.

Calagopus takes a different approach to the same goal. Rather than building on Pterodactyl's PHP codebase, it was rewritten from the ground up in Rust. That gives it a faster runtime and more flexibility for expanding features, particularly in areas where Pelican remains tied to Laravel's request model and its PHP-based plugin architecture.

## Quick Summary

|                           | Calagopus            | Pelican              |
| ------------------------- | -------------------- | -------------------- |
| **Language**              | Rust                 | PHP (Laravel)        |
| **Based on**              | Original rewrite     | Pterodactyl fork     |
| **First release**         | June 2025            | March 2024           |
| **License**               | MIT                  | AGPL-3.0             |
| **Price**                 | Free                 | Free                 |
| **Extension System**      | Native (Rust traits) | Native (PHP plugins) |
| **Windows Panel Support** | ✅                   | ❌                   |
| **ARM64 Support**         | ✅                   | Limited              |

## Technology and Performance

Pelican inherited Pterodactyl's PHP/Laravel foundation and has modernized it in several areas. The UI now uses Filament, and the panel itself supports PostgreSQL and SQLite in addition to MySQL. Wings, the node daemon responsible for communicating with Docker, is still the Go-based daemon inherited from Pterodactyl rather than a component rewritten specifically for Pelican.

Calagopus takes a completely different route. Both the panel and node daemon are written from scratch in Rust. There's no PHP interpreter or request-per-process worker pool, and memory safety is enforced at compile time rather than being left to runtime checks.

The architectural difference is reflected in the benchmarks. Under the same CPU limits, Calagopus reports throughput improvements of more than **32,800%** compared with PHP-based panels such as Pelican and Pterodactyl. The [benchmarks page](/docs/about/benchmarks) includes the full methodology and raw results, along with options for comparing specific panels and hardware configurations.

Of course, performance only matters when your workload is large enough to expose the difference. A Discord community running a handful of servers probably won't put much pressure on either panel's backend. A hosting provider handling hundreds of simultaneous customer sessions, however, is much more likely to notice the difference.

## Feature Comparison

The table below is based on the [full feature reference](/docs/about/features) and focuses specifically on Calagopus and Pelican.

| Feature                            | Calagopus | Pelican |
| ---------------------------------- | --------- | ------- |
| Free & Open Source                 | ✅        | ✅      |
| Native Extension System            | ✅        | ✅      |
| Live Console                       | ✅        | ✅      |
| File Manager                       | ✅        | ✅      |
| File Edit History                  | ✅        | ❌      |
| Backup Browsing Support            | ✅        | ❌      |
| Archive Browsing Support           | ✅        | ❌      |
| SFTP Support                       | ✅        | ✅      |
| SSH (Shell) Support                | ✅        | ❌      |
| Schedule Tasks                     | ✅        | ✅      |
| Advanced Schedule Triggers         | ✅        | ❌      |
| Database Management                | ✅        | ✅      |
| MySQL Server-Database Support      | ✅        | ✅      |
| PostgreSQL Server-Database Support | ✅        | ❌      |
| MongoDB Server-Database Support    | ✅        | ❌      |
| Redis Server-Database Support      | ✅        | ❌      |
| Subuser Management                 | ✅        | ✅      |
| Role Management                    | ✅        | ✅      |
| Backups                            | ✅        | ✅      |
| Advanced Backup Drivers            | ✅        | ❌      |
| Dynamic Backup Configuration       | ✅        | ✅      |
| Extra Allocations                  | ✅        | ✅      |
| WebAuthn Authentication            | ✅        | ✅      |
| OAuth Support                      | ✅        | ✅      |
| User Management                    | ✅        | ✅      |
| User Impersonation                 | ✅        | ❌      |
| Admin-Action Audit Log             | ✅        | ❌      |
| Asset Management                   | ✅        | ❌      |
| Support for Multiple Nodes         | ✅        | ✅      |
| Mount Management                   | ✅        | ✅      |

Pelican has closed many of the gaps that separated Pterodactyl-based panels from Calagopus. WebAuthn, OAuth, role management, and dynamic backup configuration are now all available. The bigger differences are in the depth of certain features, particularly file management, scheduling, database options, and administrative accountability.

## Where Calagopus Goes Further

### Extension System

Pelican's plugin system is a genuine first-party feature rather than a community workaround like Pterodactyl's Blueprint. Plugins can be installed, updated, and removed directly from the panel, with queued jobs and a dedicated administration interface handling the process.

Calagopus gives extensions a broader range of capabilities. In addition to backend routes, database migrations, and CLI commands, extensions can intercept or completely replace built-in UI components instead of being limited to predefined plugin slots. They can also provide theme overrides through a dedicated theming API and communicate with one another through a shared inter-extension API.

### File Management

Both panels provide a browser-based file manager. Calagopus takes things further with file edit history and a side-by-side diff viewer, support for browsing `.zip`, `.tar`, and `.7z` archives and backup snapshots without extracting them first, cross-server file copying, and direct SSH shell access from the web interface.

Pelican's file manager handles the essentials, uploads, downloads, and in-browser editing, but doesn't currently offer those additional capabilities.

### Authentication

On paper, Pelican's authentication features are fairly close to Calagopus. It supports passkeys and includes OAuth integrations.

Calagopus also supports WebAuthn and OAuth, but it works with any generic OAuth2/OIDC provider rather than a fixed list. It also adds claim-based automatic provisioning: OAuth claims can automatically assign a user's role or subuser access when they log in for the first time. With Pelican, that setup still has to be handled manually by an administrator.

### Scheduling

Both panels support scheduled tasks using cron-style triggers. Calagopus expands on that with eight additional trigger types, including power-state changes, crashes, backup results, sustained resource thresholds, matching console output, and triggers based on the result of another schedule. It also supports conditional branching within a schedule's steps.

Pelican's scheduler remains primarily time-based. If you need event-driven behavior, you'll currently have to handle it externally by scripting against its API.

### Databases

Pelican's own panel database can now use MySQL, PostgreSQL, or SQLite, which is a significant modernization compared with Pterodactyl's MySQL-only requirement.

For databases provisioned **for game servers**, however, Pelican still limits the available options to MySQL/MariaDB.

Calagopus adds PostgreSQL, MongoDB, and Redis as additional server-database options. These are provisioned and managed through a dedicated [database agent](/docs/db-agent/overview), rather than requiring manual configuration on each node.

### Backups

Pelican already supports dynamic backup configuration, allowing administrators to define multiple backup targets and determine which one a server should use.

Where Calagopus improves is in backup driver support. It offers eight drivers, including Btrfs/ZFS snapshots, S3-compatible storage, Restic, Kopia, and dedicated Proxmox Backup Server integration. It also lets you browse the contents of a backup or archive directly from the file manager without restoring it first.

## Migrating from Pelican

Calagopus includes a built-in importer that can read directly from a Pelican database and transfer equivalent users, servers, nodes, and eggs to a fresh Calagopus installation. Existing user logins continue to work, and server data doesn't need to be moved separately.

API keys are the main exception. Pelican hashes them using a different algorithm, so they can't be imported. You'll need to generate new API keys after migrating, especially since Calagopus's API isn't compatible with Pelican's.

For the complete standalone and Docker migration instructions, see the [Pelican migration guide](/docs/additional/migrations/pelican).

## Ready to Switch?

If you're thinking about making the move, the [Pelican migration guide](/docs/additional/migrations/pelican) is a good place to start. If you're setting up a brand-new installation, you can also [install Calagopus from scratch](/docs/panel/installation/).

**More comparisons:** [Calagopus vs Pterodactyl](/compare/calagopus-vs-pterodactyl) · [Calagopus vs AMP](/compare/calagopus-vs-amp)
