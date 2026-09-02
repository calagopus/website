---
title: Pterodactyl Alternatives Compared (2026) - Pelican, AMP and Calagopus
description: Pelican, AMP and Calagopus compared as Pterodactyl alternatives in 2026 on licensing, performance, extensions, databases and migration effort, with a verdict.
head:
  - - meta
    - name: robots
      content: index, follow
sidebar: false
aside: false
---

# Pterodactyl Alternatives Compared (2026)

Pterodactyl has been the default self-hosted game server panel since 2015. Its Docker-per-server model, MIT license and huge egg ecosystem are why most alternatives copy its architecture instead of replacing it. But its PHP panel has no first-party extension system, supports only MySQL, and offers little beyond password and TOTP login, which is why people go looking for something else.

Three projects come up in almost every search for a replacement. **Pelican** is a 2024 fork that keeps Pterodactyl's PHP foundation and modernizes it. **AMP** is a commercial, closed-source panel that predates Pterodactyl and runs games as native processes. **Calagopus** is a from-scratch rewrite in Rust that keeps the egg format and the panel/daemon split. This page compares all four so you can pick based on your situation rather than a feature checklist. Calagopus is our project, so where a competitor is the better choice for a given use, we say so.

## The Short Version

- **Stay on Pterodactyl** if your setup works, you do not need plugins, and you would rather not touch a running system. It is stable and its egg ecosystem is unmatched.
- **Choose Pelican** if you want to stay on PHP/Laravel, keep your existing server without reinstalling it, and mainly want a first-party plugin system, admin roles and OAuth added to what you already know.
- **Choose AMP** if you run Windows game servers natively, want deep per-game configuration editors, and are fine paying per instance under a proprietary license.
- **Choose Calagopus** if panel performance under many concurrent users matters, you want an extension API that can replace built-in UI rather than patch it, you need PostgreSQL, MongoDB or Redis for game servers, or you want SSH, file history and event-driven schedules in the panel.

## At a Glance

|                                  | Pterodactyl                 | Pelican                        | AMP                         | Calagopus                          |
| -------------------------------- | --------------------------- | ------------------------------ | --------------------------- | ---------------------------------- |
| **Language**                     | PHP (Laravel) + Go (Wings)  | PHP (Laravel/Filament) + Go    | C# (.NET)                   | Rust (panel and Wings)             |
| **Origin**                       | Original, 2015              | Pterodactyl fork, 2024         | Original, 2014              | Original rewrite, 2025             |
| **License**                      | MIT                         | AGPL-3.0                       | Proprietary                 | MIT                                |
| **Price**                        | Free                        | Free                           | Paid, per instance          | Free                               |
| **Commercial hosting use**       | Allowed                     | Allowed                        | Enterprise Edition required | Allowed                            |
| **Server isolation**             | Docker per server           | Docker per server              | Native process (Docker optional) | Docker per server             |
| **Pterodactyl eggs**             | Native                      | Compatible                     | Not used                    | Compatible                         |
| **Extension system**             | None (Blueprint, unofficial) | First-party PHP plugins       | Yes                         | Native Rust extension API          |
| **Panel database**               | MySQL/MariaDB               | MySQL, PostgreSQL, SQLite      | Built in                    | PostgreSQL (read replicas supported) |
| **Game-server database types**   | MySQL/MariaDB               | MySQL/MariaDB                  | MySQL, PostgreSQL, MongoDB  | MySQL, PostgreSQL, MongoDB, Redis  |
| **Passkeys / OAuth**             | No / No                     | Yes / Yes                      | Yes / Yes (OIDC)            | Yes / Yes (any OAuth2/OIDC)        |
| **Admin roles / audit log**      | No / No                     | Yes / No                       | Yes / not compared          | Yes / Yes                          |
| **Windows panel host**           | No                          | No                             | Yes                         | Yes                                |
| **ARM64**                        | Limited                     | Limited                        | Yes                         | Yes                                |
| **Importer from Pterodactyl**    | n/a                         | Same PHP stack (see Pelican docs) | No                       | Built-in database importer         |

Feature rows come from the [full feature reference](/docs/about/features) and the three detailed comparisons linked below. "Compatible" for eggs means the format is read without modification.

## Why People Leave Pterodactyl

The complaints that drive most searches for an alternative fall into four groups, and each candidate solves a different subset of them.

**No first-party extension system.** Pterodactyl has no plugin API. Blueprint fills the gap by patching PHP source files during installation, which works until a panel update changes the files it patched. Pelican and Calagopus both ship a real extension system; AMP has one too, though it is a different kind of product.

**Panel performance.** The panel is an interpreted PHP application behind PHP-FPM. That is fine for a homelab, but a hosting provider whose customers all open the file manager at once feels it in CPU and memory. Pelican inherits the same runtime. Calagopus's Rust backend is the only one of the three that changes it: the project's [benchmarks](/docs/about/benchmarks) report more than 32,800% higher panel API throughput than Pterodactyl under identical CPU limits. That figure is API throughput under concurrent load, not game tick rate, so weigh it by how many people use your panel at the same time.

**Database and authentication limits.** MySQL only, for the panel and for game servers, and no passkeys or single sign-on. Pelican adds PostgreSQL and SQLite for the panel and OAuth and passkeys for login. Calagopus runs its panel on PostgreSQL, adds passkeys and any OAuth2/OIDC provider, and provisions PostgreSQL, MongoDB and Redis as game-server databases through its [database agent](/docs/db-agent/overview). AMP has had OIDC and WebAuthn for years.

**Administration at scale.** Pterodactyl's admin side has user and permission management but no roles, no audit trail and no impersonation. Pelican adds roles. Calagopus adds roles, a full admin and account audit log, and user impersonation for support.

## The Candidates

### Pelican

Pelican is the lowest-friction move. It started as a fork, so the egg format, Wings and Docker model are the same, and the people who know Pterodactyl already know most of Pelican. The interface was rebuilt with Filament, and the fork added OAuth, passkeys, admin roles, webhooks, a plugin system and a wider choice of panel databases. What did not change is the PHP runtime and the MySQL-only limit for game-server databases. If your problem with Pterodactyl was features rather than performance, Pelican fixes most of it without a rewrite. Note the license changed from MIT to AGPL-3.0, which matters if you modify the panel and offer it as a service.

Read the detailed [Calagopus vs Pelican](/compare/calagopus-vs-pelican) comparison, or the neutral [Pterodactyl vs Pelican](/compare/pterodactyl-vs-pelican) page if you are deciding between those two.

### AMP

AMP by CubeCoders is the odd one out. It is closed source, licensed per instance, and runs games as native processes on Windows or Linux rather than in Docker by default. In exchange you get per-game integrations and configuration editors that the egg-based panels cannot match, and it has offered OIDC and WebAuthn for a long time. Personal and community licenses are one-time purchases; reselling hosting needs the Enterprise Edition. There is no importer from Pterodactyl, so a move means recreating servers by hand.

Read the detailed [Calagopus vs AMP](/compare/calagopus-vs-amp) comparison.

### Calagopus

Calagopus keeps what works about Pterodactyl, the egg format and the panel/Wings split, and rewrites both halves in Rust. The practical differences are a native extension API whose extensions can replace built-in UI instead of patching it, event-driven schedule triggers (crashes, resource thresholds, console output, other schedules), file edit history with diffs, archive and backup browsing, an in-browser SSH shell, eight backup drivers, and role-based admin with an audit log. It also runs the panel on Windows and ARM64. The trade-off is age: the first release was June 2025, so the community and third-party extension catalog are smaller than Pterodactyl's. A built-in importer reads a Pterodactyl or Pelican database directly, so users, servers, nodes and eggs come across without moving server data.

Read the detailed [Calagopus vs Pterodactyl](/compare/calagopus-vs-pterodactyl) comparison.

## How to Decide

| Your situation                                                | Best fit                    | Why                                                                                          |
| ------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| Homelab, a few servers, Pterodactyl works                     | Stay, or Pelican            | Nothing to gain from a migration; Pelican if you want plugins and OAuth on the same stack     |
| Community with many subusers and schedules                    | Calagopus                   | Event-driven triggers, role management, file history and collaborative editing               |
| Hosting business on Linux                                     | Calagopus or Pelican        | Both are free for commercial use; Calagopus if panel load or PostgreSQL/Redis provisioning matters |
| Windows-native game servers                                   | AMP or Calagopus            | AMP runs games as native Windows processes; Calagopus runs the panel on Windows but servers in Docker |
| You rely on Blueprint extensions                              | Pelican or Calagopus        | Neither runs Blueprint; both offer a supported extension API to rebuild against              |
| You need commercial support with an SLA                       | AMP                         | The open-source panels are community supported                                               |

## Migration Effort

| From Pterodactyl to | What moves                                              | What you redo                                    |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Pelican             | Same PHP stack; check Pelican's docs for the in-place path | Blueprint extensions, some config              |
| AMP                 | Nothing automatically                                    | Every server, by hand                            |
| Calagopus           | Users, servers, nodes, eggs via the built-in importer    | API keys, Wings on each node, Blueprint extensions |

The Calagopus importer is documented step by step for [Pterodactyl](/docs/additional/migrations/pterodactyl) and [Pelican](/docs/additional/migrations/pelican), including Docker and standalone installs, and you can run both panels side by side while you move nodes one at a time.

## Next Steps

- [Calagopus vs Pterodactyl](/compare/calagopus-vs-pterodactyl)
- [Calagopus vs Pelican](/compare/calagopus-vs-pelican)
- [Calagopus vs AMP](/compare/calagopus-vs-amp)
- [Pterodactyl vs Pelican](/compare/pterodactyl-vs-pelican)
- [Benchmarks and methodology](/docs/about/benchmarks)
- [Install Calagopus](/docs/panel/installation/)
