---
title: Calagopus vs Pterodactyl - Game Server Panel Comparison
description: A detailed comparison of Calagopus and Pterodactyl. See how the Rust-based Calagopus panel compares to Pterodactyl's PHP architecture in performance, features, and extensibility.
head:
  - - meta
    - name: robots
      content: index, follow
sidebar: false
aside: false
---

# Calagopus vs Pterodactyl

Pterodactyl has been the go-to choice for self-hosted game server management since 2015, and for good reason. Its clean Docker-based architecture, permissive MIT license, and extensive egg ecosystem have made it possible to run all sorts of games without having to build custom container tooling from scratch.

Calagopus takes the same basic approach, a web panel communicating with a node daemon that runs servers in Docker, but rebuilds the stack in Rust. Starting with a clean slate also gives it room to introduce features that can be harder to add to Pterodactyl's decade-old PHP codebase, including a native extension API, broader database support, and a significantly larger feature set.

## Quick Summary

|                           | Calagopus            | Pterodactyl                                |
| ------------------------- | -------------------- | ------------------------------------------ |
| **Language**              | Rust                 | PHP (Laravel) + Go (Wings)                 |
| **First release**         | June 2025            | December 2015                              |
| **License**               | MIT                  | MIT                                        |
| **Price**                 | Free                 | Free                                       |
| **Extension System**      | Native (Rust traits) | None (Blueprint is a community workaround) |
| **Windows Panel Support** | ✅                   | ❌                                         |
| **ARM64 Support**         | ✅                   | Limited                                    |

## Technology and Performance

Pterodactyl's panel is built with PHP and Laravel, while its Go-based Wings daemon handles Docker orchestration on each node. That architecture has held up well through a decade of production use. The PHP side, however, remains an interpreted, request-per-process web stack. That's perfectly reasonable for a control panel that most users interact with occasionally, but it becomes less ideal when the panel is sitting between hundreds of concurrent users and the database.

Calagopus uses Rust throughout, including both the panel backend and node daemon. There's no interpreter, garbage collector, or PHP-FPM worker pool to tune. Memory safety is enforced at compile time rather than discovered at runtime.

On identical hardware and under the same CPU limits, the difference in runtime architecture shows up clearly in the project's benchmarks: Calagopus reports throughput improvements of more than **32,800%** over Pterodactyl in its benchmarking suite, as of v1.1.0 (August 2026). That figure is panel API throughput, public settings, account, and server-list endpoints under concurrent load, not game-server tick rate or player capacity. The [benchmarks page](/docs/about/benchmarks) provides the full methodology, raw results, and controls for comparing different hardware and CPU-quota configurations.

How much that matters depends heavily on scale. A homelab running four servers for friends probably won't notice much difference in panel request latency. A hosting provider managing hundreds of nodes, on the other hand, can see the impact in CPU and memory usage—and especially when hundreds of customers are using the file manager simultaneously instead of just a handful.

## Feature Comparison
The table below is based on the [full feature reference](/docs/about/features) and focuses specifically on Calagopus and Pterodactyl.

| Feature                            | Calagopus | Pterodactyl |
| ---------------------------------- | --------- | ----------- |
| Free & Open Source                 | ✅        | ✅          |
| Native Extension System            | ✅        | ❌          |
| Live Console                       | ✅        | ✅          |
| File Manager                       | ✅        | ✅          |
| File Edit History                  | ✅        | ❌          |
| Backup Browsing Support            | ✅        | ❌          |
| Archive Browsing Support           | ✅        | ❌          |
| SFTP Support                       | ✅        | ✅          |
| SSH (Shell) Support                | ✅        | ❌          |
| Schedule Tasks                     | ✅        | ✅          |
| Advanced Schedule Triggers         | ✅        | ❌          |
| Database Management                | ✅        | ✅          |
| MySQL Server-Database Support      | ✅        | ✅          |
| PostgreSQL Server-Database Support | ✅        | ❌          |
| MongoDB Server-Database Support    | ✅        | ❌          |
| Redis Server-Database Support      | ✅        | ❌          |
| In-Panel Database Explorer         | ✅        | ❌          |
| Subuser Management                 | ✅        | ✅          |
| Role Management                    | ✅        | ❌          |
| Backups                            | ✅        | ✅          |
| Advanced Backup Drivers            | ✅        | ❌          |
| Dynamic Backup Configuration       | ✅        | ❌          |
| Extra Allocations                  | ✅        | ✅          |
| Private Server-to-Server Network   | ✅        | ❌          |
| WebAuthn Authentication            | ✅        | ❌          |
| OAuth Support                      | ✅        | ❌          |
| User Management                    | ✅        | ✅          |
| User Impersonation                 | ✅        | ❌          |
| Admin-Action Audit Log             | ✅        | ❌          |
| Asset Management                   | ✅        | ❌          |
| Support for Multiple Nodes         | ✅        | ✅          |
| Mount Management                   | ✅        | ✅          |

## Where Calagopus Goes Further

### Extension System

The extension system is arguably the biggest architectural difference between the two projects.

Pterodactyl doesn't have a first-party plugin system. When you need behavior beyond what the panel already supports, you're generally left with either modifying the panel yourself or using [Blueprint](https://blueprint.zip/), a well-regarded but unofficial project that patches PHP source files during installation. The downside is that this approach is inherently fragile: an update to Pterodactyl can break a Blueprint extension, while an extension can also interfere with a future Pterodactyl update.

Calagopus takes a different approach with a native extension API built around Rust traits. Extensions can hook into defined areas such as backend routes, database migrations, UI components—including replacing or intercepting built-in elements—CLI commands, background tasks, and events, all without modifying the core source.

Because extensions integrate through the API rather than patching the panel itself, they can survive panel updates without requiring the same kind of source-level work. If you're currently using Blueprint extensions and considering a migration, the existing workflow won't transfer directly, but the underlying use cases can generally be handled through Calagopus's native API.

### File Management

Both panels provide a browser-based file manager. Calagopus builds on that foundation with several additional capabilities: file edit history, the ability to browse `.zip`, `.tar`, and `.7z` archives and backup snapshots without extracting them first, cross-server file copying, and direct SSH shell access through the web interface.

Pterodactyl's file manager handles the fundamentals well, but it doesn't currently offer those additional features.

### Authentication

Pterodactyl supports username-and-password authentication, with optional TOTP-based two-factor authentication. Calagopus supports those options as well, while adding **WebAuthn** for passkeys, hardware security keys, along with **OAuth** sign-in through GitHub, Google, Discord, or a generic OAuth2/OIDC provider.

Calagopus can also automatically provision roles and subuser access based on claims returned during OAuth login.

### Scheduling

Both panels support scheduled tasks through cron-style scheduling. Calagopus goes further with eight additional trigger types, including power-state changes, crashes, backup results, sustained resource thresholds, matching console output, and schedules triggered by the outcome of other schedules. It also supports conditional branching within a schedule.

Pterodactyl's scheduler is primarily time-based, so more advanced workflows generally require external scripts that interact with its API.

### Databases

Pterodactyl supports MySQL/MariaDB as a server-attached database type. Calagopus expands that with PostgreSQL, MongoDB, and Redis, with these additional database options provisioned and managed through a dedicated [database agent](https://calagopus.com/docs/db-agent/overview) rather than manually configured on each node.

### Backups

Both panels support scheduled server backups. Calagopus offers several backup drivers, including Btrfs/ZFS snapshots, S3-compatible storage, Restic, Kopia, and dedicated Proxmox Backup Server integration.

It also includes dynamic backup configuration, allowing administrators to define multiple named backup targets and resolve which target to use based on the server, node, or location.

### Administration

Calagopus also puts more emphasis on administration and accountability. It provides role-based access control for administrators, a deep audit log covering admin actions, server activity, and account activity, user impersonation for support scenarios, and asset management.

Pterodactyl offers user and permission management, but its administrative tooling is more limited in these areas and doesn't provide the same audit or impersonation capabilities.

## Migrating from Pterodactyl

Calagopus includes a built-in importer that reads directly from a Pterodactyl database and brings over equivalent users, servers, nodes, and eggs to a fresh Calagopus installation. Existing user logins continue to work, and server data doesn't need to be moved.

API keys are the exception. Pterodactyl hashes them using a different algorithm, so they can't be imported. You'll need to generate new API keys after the migration anyway, since Calagopus's API isn't wire-compatible with Pterodactyl's.

For the complete standalone and Docker migration walkthroughs, see the [Pterodactyl migration guide](/docs/additional/migrations/pterodactyl).

## Ready to Switch?

If you're considering the move, the [Pterodactyl migration guide](/docs/additional/migrations/pterodactyl) is a good place to start. If you're setting up a new installation, you can also [install Calagopus from scratch](/docs/panel/installation/).

**More comparisons:** [All Pterodactyl alternatives](/compare/) · [Calagopus vs Pelican](/compare/calagopus-vs-pelican) · [Calagopus vs AMP](/compare/calagopus-vs-amp) · [Pterodactyl vs Pelican](/compare/pterodactyl-vs-pelican)
