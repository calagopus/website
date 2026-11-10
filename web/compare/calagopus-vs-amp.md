---
title: Calagopus vs AMP - Game Server Panel Comparison
description: 'Calagopus and CubeCoders AMP compared: a free, open-source, Rust-based panel against a commercial, closed-source C#/.NET platform.'
head:
  - - meta
    - name: robots
      content: index, follow
pageClass: compare-page compare-versus
---

# Calagopus vs AMP

AMP (Application Management Panel) by CubeCoders has been in development since 2014 and works quite differently from the Pterodactyl family. It runs natively on Windows and Linux, doesn't need Docker for most applications, and has per-game integrations instead of a generic server console. WebAuthn and OIDC single sign-on are built in. In return, AMP is closed source and commercially licensed, priced by the number of game-server instances.

Calagopus is the opposite on licensing: it's MIT-licensed, free at any scale, and uses the same Docker-per-server model as Pterodactyl and Pelican, written from scratch in Rust. The two are different kinds of products, so this page compares them on licensing, architecture and feature depth.

## Quick Summary

|                           | Calagopus         | AMP                         |
| ------------------------- | ----------------- | --------------------------- |
| **Language**              | Rust              | C# (.NET)                   |
| **First release**         | June 2025         | 2014                        |
| **License**               | MIT (open source) | Proprietary (closed source) |
| **Price**                 | Free              | Paid, per-instance          |
| **Commercial Use**        | Allowed           | Requires Enterprise Edition |
| **Extension System**      | <Yes />           | <Yes />                     |
| **Windows Panel Support** | <Yes />           | <Yes />                     |
| **ARM64 Support**         | <Yes />           | <Yes />                     |

## Which Should You Choose?

::: info Choose AMP
If you run game servers as native Windows processes, want configuration editors built for specific games, or need commercial support, and you're fine paying per instance under a proprietary license.
:::

::: tip Choose Calagopus
If you want a free, open-source panel at any scale, Docker isolation for every server, or to resell hosting without a separate commercial agreement.
:::

## Architecture

Calagopus uses the same basic architecture as Pterodactyl and Pelican: a panel communicates with a Wings node daemon, which runs each game server inside its own Docker container.

AMP manages applications as native processes on the host by default and uses Docker only where it helps. Neither approach is better in general. Docker gives Calagopus per-server isolation by default, while AMP's process model avoids Docker in the common case, which suits operators on Windows.

AMP isn't included in our [benchmarking suite](/docs/about/benchmarks). It doesn't use the same kind of API-based, scriptable deployment that the suite is designed around, so we don't have a direct throughput comparison like we do for Pterodactyl and Pelican.

## Feature Comparison

The table below is based on the [full feature reference](/docs/about/features) and focuses specifically on Calagopus and AMP.

**Platform**

| Feature                    | Calagopus |   AMP   |
| -------------------------- | :-------: | :-----: |
| Free & Open Source         |  <Yes />  | <No />  |
| Support for Multiple Nodes |  <Yes />  | <Yes /> |
| Extra Allocations          |  <Yes />  | <Yes /> |

**Servers and Files**

| Feature                    | Calagopus |   AMP   |
| -------------------------- | :-------: | :-----: |
| Live Console               |  <Yes />  | <Yes /> |
| File Manager               |  <Yes />  | <Yes /> |
| Collaborative File Editing |  <Yes />  | <No />  |
| SFTP Support               |  <Yes />  | <Yes /> |
| Schedule Tasks             |  <Yes />  | <Yes /> |
| Advanced Schedule Triggers |  <Yes />  | <Yes /> |

**Databases**

| Feature                       | Calagopus |   AMP   |
| ----------------------------- | :-------: | :-----: |
| Database Management           |  <Yes />  | <Yes /> |
| Redis Server-Database Support |  <Yes />  | <No />  |

**Backups**

| Feature                 | Calagopus |   AMP   |
| ----------------------- | :-------: | :-----: |
| Backups                 |  <Yes />  | <Yes /> |
| Backup Browsing Support |  <Yes />  | <Yes /> |

**Users and Administration**

| Feature                 | Calagopus |   AMP   |
| ----------------------- | :-------: | :-----: |
| User Management         |  <Yes />  | <Yes /> |
| Subuser Management      |  <Yes />  | <Yes /> |
| WebAuthn Authentication |  <Yes />  | <Yes /> |
| OAuth Support           |  <Yes />  | <Yes /> |

## Where Calagopus Goes Further

### Licensing and Cost

This is the biggest difference between the two.

Calagopus is MIT-licensed and free for personal or commercial use. There are no per-instance fees and no limits on the number of servers or nodes you can operate.

AMP's Standard, Professional, and Advanced editions are one-time purchases rather than subscriptions. They're licensed by instance count, but can't be used to resell game-server hosting.

Reselling requires AMP Enterprise Edition under a separate commercial agreement. If you run a hosting business rather than a personal or community server, that matters more than the entry-level price.

### File Management

Both panels have a file manager. Calagopus adds file edit history and a diff viewer, the ability to browse `.zip`, `.tar`, and `.7z` archives without extracting them first, cross-server file copying, and real-time collaborative file editing.

AMP's file manager has none of these, but it does have configuration editors built for specific games.

### Database Types

Through its dedicated [database agent](/docs/db-agent/overview), Calagopus can provision PostgreSQL, MongoDB, MySQL/MariaDB and Redis as server-attached database types.

AMP can run these databases too, except Redis, as separate instances, but is less flexible about placing them on separate servers.

## Where AMP Is Stronger

- **Per-game management.** AMP integrates deeply with the games it supports and has configuration editors built for specific games, where Calagopus treats every game the same way through eggs.
- **Native Windows game servers.** AMP runs games as native Windows processes. Calagopus runs the panel on Windows, but game servers in Docker.
- **Commercial support.** AMP is a commercial product. Calagopus is community supported.
- **Track record.** AMP has been in development since 2014. Calagopus's first release was June 2025.

## Migrating from AMP

There is no AMP importer like the ones for Pterodactyl and Pelican. AMP's instance model doesn't map cleanly onto Calagopus's nodes and servers, so moving means [installing Calagopus](/docs/panel/installation/) and recreating your servers by hand. For small and medium setups that is manageable.

If AMP's per-game integrations or native Windows processes are central to how you work, that is a good reason to stay on it. The two do different things.

<CompareFaq />
