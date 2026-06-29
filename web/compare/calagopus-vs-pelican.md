---
title: Calagopus vs Pelican - Game Server Panel Comparison
description: A detailed comparison of Calagopus and Pelican Panel. Both are open-source Pterodactyl alternatives - here's how they differ in architecture, performance, and features.
head:
  - - meta
    - name: robots
      content: index, follow
  - - meta
    - property: og:title
      content: Calagopus vs Pelican - Game Server Panel Comparison
  - - meta
    - property: og:description
      content: A detailed comparison of Calagopus and Pelican Panel. Both are open-source Pterodactyl alternatives - here's how they differ in architecture, performance, and features.
sidebar: false
aside: false
---

# Calagopus vs Pelican Panel

Pelican and Calagopus are both open-source game server management panels that emerged as successors to Pterodactyl. They share similar goals but take very different approaches: Pelican evolves the existing PHP/Laravel codebase, while Calagopus is a complete rewrite in Rust. This page covers where they overlap, where they diverge, and how to move from one to the other.

## Quick Summary

| | Calagopus | Pelican |
| --- | --- | --- |
| **Language** | Rust | PHP (Laravel) |
| **Based on** | Original rewrite | Pterodactyl fork |
| **License** | MIT | LGPL-3.0 |
| **Price** | Free | Free |
| **Extension System** | Native (Rust traits) | Blueprint-compatible |
| **Windows Panel Support** | ✅ | ❌ |
| **ARM64 Support** | ✅ | Limited |

## Architecture Differences

Pelican is a maintained fork of Pterodactyl. It inherits the PHP/Laravel foundation and improves on Pterodactyl's codebase incrementally - better UI, security patches, and quality-of-life fixes - without changing the underlying runtime.

Calagopus is built in Rust from scratch. There is no shared code with Pterodactyl or Pelican. The Rust stack means Calagopus compiles to native machine code, has no PHP interpreter overhead, and enforces memory safety at compile time. In benchmarks, this produces throughput improvements of over **32,800%** compared to PHP-based panels. See the [benchmarks page](/docs/about/benchmarks) for details.

Both panels use a panel/daemon split: a web-facing control plane plus a node daemon (Wings) running on game server hosts. Calagopus ships its own Wings daemon written in Rust; Pelican uses a Wings variant inherited from Pterodactyl.

## Feature Comparison

| Feature | Calagopus | Pelican |
| --- | --- | --- |
| Free & Open Source | ✅ | ✅ |
| Native Extension System | ✅ | ✅ (Blueprint) |
| Live Console | ✅ | ✅ |
| File Manager | ✅ | ✅ |
| File Edit History | ✅ | ❌ |
| Backup Browsing Support | ✅ | ❌ |
| Archive Browsing Support | ✅ | ❌ |
| SFTP Support | ✅ | ✅ |
| SSH (Shell) Support | ✅ | ❌ |
| Schedule Tasks | ✅ | ✅ |
| Advanced Schedule Triggers | ✅ | ❌ |
| Database Management | ✅ | ✅ |
| Subuser Management | ✅ | ✅ |
| Backups | ✅ | ✅ |
| Advanced Backup Drivers | ✅ | ❌ |
| Extra Allocations | ✅ | ✅ |
| WebAuthn Authentication | ✅ | ❌ |
| OAuth Support | ✅ | ✅ |
| Asset Management | ✅ | ❌ |
| User Management | ✅ | ✅ |
| User Impersonation | ✅ | ❌ |
| Support for Multiple Nodes | ✅ | ✅ |
| Egg Repository System | ✅ | ❌ |
| MySQL Server-Database Support | ✅ | ✅ |
| PostgreSQL Server-Database Support | ✅ | ❌ |
| MongoDB Server-Database Support | ✅ | ❌ |
| Dynamic Backup Configuration | ✅ | ❌ |
| Mount Management | ✅ | ✅ |
| Role Management | ✅ | ✅ |
| Admin Activity Log | ✅ | ❌ |

## Where Calagopus Differs

### Extension Systems

Both panels have extension systems, but they work differently. Pelican uses Blueprint, a community-maintained tool that patches PHP source files to install extensions. Patches are applied on top of core files, which means extensions can conflict with each other and need to be re-applied after panel updates.

Calagopus's native extension system uses Rust traits. Extensions are compiled artifacts that hook into defined extension points: backend routes, database migrations, UI injection points, CLI commands, event hooks, custom settings, and more. They don't modify core files, survive updates cleanly, and benefit from Rust's type system to prevent entire classes of integration bugs at compile time.

### File Management

Both panels include a file manager. Calagopus adds:
- **File edit history** - view and restore previous versions of any file
- **Archive browsing** - browse the contents of `.zip`, `.tar.gz`, and other archive formats directly in the browser without extracting them
- **Backup browsing** - browse inside backup snapshots the same way
- **SSH shell access** - open a real shell session to a server from the web UI

### Authentication

Pelican supports OAuth (GitHub, Discord, Google, and generic OIDC). Calagopus also supports OAuth via the same providers, and additionally supports **WebAuthn**: users can authenticate with passkeys, biometrics (Face ID, Touch ID), or FIDO2 hardware security keys. This is especially relevant for hosting providers who need to enforce strong authentication policies without managing separate MFA tooling.

### Scheduling

Both panels support time-based scheduling. Calagopus adds **advanced schedule triggers** - event-driven execution, conditional chains, and server-state-aware triggers - making it possible to build automated management workflows that would otherwise require external scripting.

### Backup Infrastructure

Both support backups. Calagopus also supports:
- **Advanced backup drivers** including S3-compatible storage and custom endpoints
- **Dynamic backup configuration** - administrators define multiple named backup targets; servers can be assigned to specific targets

### Database Types

Pelican supports MySQL/MariaDB as a game server database type. Calagopus adds **PostgreSQL** and **MongoDB** support, making it possible to offer any of the three as server-managed database options.

### Asset Management and Administration

Calagopus adds **asset management** (track and assign assets like game licenses or additional IPs to servers), **user impersonation** (admins can view the panel as any user for support purposes), and an **admin activity log** that records all admin-level actions.

### Egg Repository System

Calagopus ships a built-in egg repository browser: administrators can discover, install, and update eggs from community repositories directly in the admin panel. Pelican requires manually downloading and importing egg JSON files.

### Panel Portability

Calagopus runs natively on Linux, macOS, and **Windows** - as a binary or via Docker. Pelican requires Linux or Docker and does not have a native Windows path.

## Migrating from Pelican

Calagopus provides tooling for migrating from Pelican - both the Docker and standalone variants. The process transfers servers, users, nodes, allocations, and configuration. See the [Pelican migration guide](/docs/additional/migrations/pelican) for step-by-step instructions.

## Frequently Asked Questions

### Is Calagopus compatible with Pelican eggs?

Yes. Pelican inherits Pterodactyl's egg format, and Calagopus is compatible with it. Community eggs from existing repositories work in Calagopus without modification.

### Can I use Blueprint extensions with Calagopus?

No. Blueprint targets the PHP/Laravel internals of Pelican and Pterodactyl. Calagopus uses a native Rust extension API instead - see the [extension development guide](/docs/panel/extensions/) for how to build extensions for Calagopus.

### Does Calagopus use the same Wings as Pelican?

No. Calagopus ships its own Wings daemon, rewritten in Rust. You will need to install Calagopus Wings on each node as part of migration. The migration guide walks through this.

### Which panel is easier to set up?

Both panels offer Docker Compose setups that get a panel running in a few commands. Calagopus additionally provides binary and package manager installation options and runs natively on Windows, which can simplify homelab deployments.

### Which panel has better performance?

Calagopus, by a significant margin. The Rust-based backend produces over 32,800% higher throughput than PHP-based panels in benchmarks. For small deployments the difference is less critical; for production hosting providers it translates directly to hardware savings.

---

Ready to switch? Start with the [Pelican migration guide](/docs/additional/migrations/pelican) or [install Calagopus from scratch](/docs/panel/installation/).
