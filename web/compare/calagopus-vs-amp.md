---
title: Calagopus vs AMP - Game Server Panel Comparison
description: A detailed comparison of Calagopus and CubeCoders AMP. See how the free, open-source, Rust-based Calagopus panel compares to AMP's commercial, closed-source C#/.NET platform.
head:
  - - meta
    - name: robots
      content: index, follow
sidebar: false
aside: false
---

# Calagopus vs AMP

AMP (Application Management Panel) by CubeCoders has been in active development since 2014, and it takes a noticeably different approach from the Pterodactyl family. It runs natively on both Windows and Linux, without requiring Docker for most applications, and offers deep, per-game integrations instead of relying on a generic server console. It also includes WebAuthn and OIDC single sign-on out of the box. The trade-off is that AMP is closed-source and commercially licensed, with pricing based on the number of game-server instances rather than being freely available.

Calagopus takes the opposite approach when it comes to licensing: it's MIT-licensed, free to use at any scale, and follows the same Docker-per-server model used by Pterodactyl and Pelican. It's also built from the ground up in Rust. This comparison focuses on the areas that matter most when choosing between the two - licensing, architecture, and feature depth - rather than treating them as identical products solving the problem in exactly the same way.

## Quick Summary

|                           | Calagopus            | AMP                                      |
| ------------------------- | -------------------- | ---------------------------------------- |
| **Language**              | Rust                 | C# (.NET)                                |
| **First release**         | June 2025            | 2014                                     |
| **License**               | MIT (open source)    | Proprietary (closed source)              |
| **Price**                 | Free                 | Paid, per-instance                       |
| **Commercial Use**        | Allowed              | Requires Enterprise Edition              |
| **Extension System**      | ✅                   | ✅                                       |
| **Windows Panel Support** | ✅                   | ✅                                       |
| **ARM64 Support**         | ✅                   | ✅                                       |

## Architecture

Calagopus uses the same basic architecture as Pterodactyl and Pelican: a panel communicates with a Wings node daemon, which runs each game server inside its own Docker container.

AMP takes a different route. By default, it manages applications as native processes on the host operating system and only uses Docker when it's useful for a particular scenario. Neither approach is inherently better. Docker gives Calagopus strong per-server isolation out of the box, while AMP's process-based model avoids Docker for the common case, which can be especially appealing to operators running Windows environments.

AMP isn't included in our [benchmarking suite](/docs/about/benchmarks). It doesn't use the same kind of API-based, scriptable deployment that the suite is designed around, so we don't have a direct throughput comparison like we do for Pterodactyl and Pelican.

## Feature Comparison

The table below is based on the [full feature reference](/docs/about/features) and focuses specifically on Calagopus and AMP.

| Feature                       | Calagopus | AMP |
| ----------------------------- | --------- | --- |
| Free & Open Source            | ✅         | ❌   |
| Live Console                  | ✅         | ✅   |
| File Manager                  | ✅         | ✅   |
| Backup Browsing Support       | ✅         | ✅   |
| Database Management           | ✅         | ✅   |
| Redis Server-Database Support | ✅         | ❌   |
| Backups                       | ✅         | ✅   |
| Schedule Tasks                | ✅         | ✅   |
| Advanced Schedule Triggers    | ✅         | ✅   |
| Extra Allocations             | ✅         | ✅   |
| SFTP Support                  | ✅         | ✅   |
| Collaborative File Editing    | ✅         | ❌   |
| Subuser Management            | ✅         | ✅   |
| WebAuthn Authentication       | ✅         | ✅   |
| OAuth Support                 | ✅         | ✅   |
| User Management               | ✅         | ✅   |
| Support for Multiple Nodes    | ✅         | ✅   |

AMP is particularly strong when it comes to server management. It integrates heavily with the games it supports, while Calagopus offers a more generic approach out of the box.

## Where Calagopus Goes Further

### Licensing and Cost

This is arguably the biggest difference between the two.

Calagopus is MIT-licensed and completely free for personal or commercial use. There are no per-instance fees and no limits on the number of servers or nodes you can operate.

AMP's Standard, Professional, and Advanced editions are one-time purchases rather than subscriptions. They're licensed by instance count, with standard pricing. However, those tiers cannot be used to commercially resell game-server hosting.

Commercial reselling requires AMP Enterprise Edition, which is covered by a separate commercial agreement. So if you're running a hosting business rather than a personal or community server, that distinction is considerably more important than the entry-level price alone.

### File Management

Both panels provide a file manager, but Calagopus goes further with file-edit history and a diff viewer, the ability to browse `.zip`, `.tar`, and `.7z` archives without extracting them first, cross-server file copying, and real-time collaborative file editing.

AMP's file manager doesn't offer these same capabilities, but does have built-in configuration editors tailored to specific games.

### Database Types

Through its dedicated [database agent](/docs/db-agent/overview), Calagopus can provision PostgreSQL, MongoDB, MySQL/MariaDB and Redis as server-attached database types.

AMP can also run these databases (except Redis) as seperate instances, but does offer less flexibility in terms of deployment on seperate servers.

## Migrating from AMP

There isn't currently an automated AMP importer like the ones available for Pterodactyl or Pelican. AMP's instance model doesn't map neatly onto Calagopus's node-and-server structure, so migrating requires setting up Calagopus from scratch and recreating your server configurations.

For most small-to-medium-sized setups, that's a manageable, if somewhat manual, process. The best place to start is the [installation guide](/docs/panel/installation/).

## Ready to Switch?

If you're moving away from AMP because of its cost, closed-source model, or another reason, you can [install Calagopus from scratch](/docs/panel/installation/) and manually recreate your existing server configurations.

On the other hand, if AMP's per-game integrations or native Windows process model are important to your workflow, those are perfectly valid reasons to stick with it. There isn't a reason to pick one over the other, they simply do different things. Pick what is right for you.

**More comparisons:** [Calagopus vs Pterodactyl](/compare/calagopus-vs-pterodactyl) · [Calagopus vs Pelican](/compare/calagopus-vs-pelican)
