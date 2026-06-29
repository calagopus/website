---
title: Calagopus vs Pterodactyl - Game Server Panel Comparison
description: A detailed comparison of Calagopus and Pterodactyl. See how the Rust-based Calagopus panel compares to Pterodactyl's PHP architecture in performance, features, and extensibility.
head:
  - - meta
    - name: robots
      content: index, follow
  - - meta
    - property: og:title
      content: Calagopus vs Pterodactyl - Game Server Panel Comparison
  - - meta
    - property: og:description
      content: A detailed comparison of Calagopus and Pterodactyl. See how the Rust-based Calagopus panel compares to Pterodactyl's PHP architecture in performance, features, and extensibility.
sidebar: false
aside: false
---

# Calagopus vs Pterodactyl

Pterodactyl is the most widely-deployed open-source game server management panel. Calagopus is a from-scratch rewrite that targets the same use case with a fundamentally different technology stack and a substantially expanded feature set. This page covers what's different between the two, why those differences matter, and how to switch.

## Quick Summary

| | Calagopus | Pterodactyl |
| --- | --- | --- |
| **Language** | Rust | PHP (Laravel) |
| **License** | MIT | MIT |
| **Price** | Free | Free |
| **Extension System** | Native (Rust traits) | None (Blueprint is a community workaround) |
| **Windows Panel Support** | ✅ | ❌ |
| **ARM64 Support** | ✅ | Limited |

## Technology and Performance

Pterodactyl's panel is built on PHP and Laravel - a stack that works fine for general web applications but introduces runtime overhead in a context where the panel itself can be a bottleneck for hosts running many concurrent users.

Calagopus is written in Rust end-to-end: both the panel backend and the Wings node daemon. Rust compiles to native machine code, has no garbage collector, and enforces memory safety at compile time rather than runtime. In internal benchmarks, Calagopus achieves throughput improvements of over **32,800%** compared to Pterodactyl under the same hardware. See the [benchmarks page](/docs/about/benchmarks) for methodology and results.

For smaller deployments these numbers may feel academic. For hosting providers with dozens of nodes and hundreds of simultaneous users, the difference in CPU and memory footprint is real operating cost.

## Feature Comparison

The table below covers every feature tracked in the [full feature reference](/docs/about/features), limited to the Calagopus/Pterodactyl columns.

| Feature | Calagopus | Pterodactyl |
| --- | --- | --- |
| Free & Open Source | ✅ | ✅ |
| Native Extension System | ✅ | ❌ |
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
| OAuth Support | ✅ | ❌ |
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
| Role Management | ✅ | ❌ |
| Admin Activity Log | ✅ | ❌ |

## Where Calagopus Goes Further

### File Management

Calagopus extends Pterodactyl's file manager with file edit history (see and restore earlier versions of any file), browsing inside archives and backups without extracting them first, and direct SSH shell access - all from the web UI.

### Authentication

Pterodactyl offers username/password login. Calagopus adds **WebAuthn** (passkeys, hardware security keys, biometrics) and **OAuth** sign-in via GitHub, Google, Discord, or any generic OAuth2/OIDC provider. Both reduce friction for end users and give administrators stronger authentication options.

### Extension System

Pterodactyl has no official plugin system. The community-maintained Blueprint project works around this by patching PHP files at install time - a fragile approach that breaks on updates. Calagopus ships a **native extension API** built on Rust traits: extensions can add backend routes, database migrations, UI elements, CLI commands, custom events, and more, all without modifying core files. Extensions survive updates cleanly.

### Scheduling

Both panels support time-based task scheduling. Calagopus adds **advanced schedule triggers**: chains, event-based firing, and conditional logic - making it possible to automate workflows that would require external scripting in Pterodactyl.

### Backups

Both panels support server backups. Calagopus supports additional backup drivers (S3-compatible storage, custom endpoints) and a dynamic backup configuration system that lets administrators define multiple named backup targets per server. Calagopus also lets users browse inside backup archives directly from the file manager.

### Database Support

Pterodactyl supports MySQL/MariaDB as a server-managed database type. Calagopus adds **PostgreSQL** and **MongoDB** as additional options - useful for game modes or applications that require a specific database engine.

### Administration

Calagopus adds **role-based access control** for admin users, a **full admin activity log**, and **user impersonation** (let an admin view the panel as any user, useful for support). Pterodactyl has none of these.

### Egg Repository System

Calagopus includes a built-in egg repository browser: administrators can browse, install, and sync eggs from community repositories directly from the admin panel, without manually downloading and importing JSON files. Pterodactyl requires the manual import workflow.

## Migrating from Pterodactyl

Calagopus provides a guided migration path from both Pterodactyl's Docker and standalone deployments. Configuration, servers, users, and allocations are all migrated. See the [Pterodactyl migration guide](/docs/additional/migrations/pterodactyl) for step-by-step instructions.

## Frequently Asked Questions

### Is Calagopus a fork of Pterodactyl?

No. Calagopus is a complete rewrite in a different language (Rust vs PHP). It draws on Pterodactyl's concepts - the egg system, Wings architecture, and panel/daemon split - but shares no code.

### Does Calagopus support Pterodactyl eggs?

Yes. The egg format is compatible, so eggs from the [Pterodactyl community](https://github.com/parkervcp/eggs) and other sources work in Calagopus without modification.

### Does Calagopus support Blueprint extensions?

No. Blueprint targets Pterodactyl's PHP architecture and isn't compatible with Calagopus. Calagopus's native extension API covers all of the same use cases with better performance, type safety, and upgrade stability.

### Can I run both panels simultaneously during migration?

Yes. You can run a Calagopus instance alongside an existing Pterodactyl install, migrate nodes one at a time, and decommission Pterodactyl when ready.

### Is Wings compatible between the two?

Calagopus ships its own Wings daemon (also written in Rust). You will need to install the Calagopus-flavored Wings on each node as part of migration. The process is documented in the migration guide.

---

Ready to switch? Start with the [Pterodactyl migration guide](/docs/additional/migrations/pterodactyl) or [install Calagopus from scratch](/docs/panel/installation/).
