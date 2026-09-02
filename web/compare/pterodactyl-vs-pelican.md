---
title: Pterodactyl vs Pelican - Which Panel Should You Choose in 2026?
description: What the Pelican fork changed from Pterodactyl (Filament UI, plugins, OAuth, roles, panel databases), what stayed the same, and when to look at a third option.
head:
  - - meta
    - name: robots
      content: index, follow
sidebar: false
aside: false
---

# Pterodactyl vs Pelican

Pelican is a fork of Pterodactyl that started in March 2024. If you run Pterodactyl today, the question is not which panel is better in the abstract, but whether Pelican's changes solve the problem you actually have, and whether that problem is one a PHP fork can solve at all.

This page is written by the Calagopus project. Calagopus is a third option, and we cover it at the end, but the comparison between the two PHP panels is on its own terms.

## Quick Summary

|                             | Pterodactyl                     | Pelican                                   |
| --------------------------- | ------------------------------- | ----------------------------------------- |
| **Relationship**            | Original project                | Fork of Pterodactyl                       |
| **First release**           | December 2015                   | March 2024                                |
| **License**                 | MIT                             | AGPL-3.0                                  |
| **Panel language**          | PHP (Laravel)                   | PHP (Laravel)                             |
| **Admin and client UI**     | React client, Blade admin       | Both rebuilt with Filament                |
| **Node daemon (Wings)**     | Go                              | Same Go daemon, inherited                 |
| **Panel database**          | MySQL/MariaDB                   | MySQL, MariaDB (dedicated driver), PostgreSQL, SQLite |
| **Game-server databases**   | MySQL/MariaDB                   | MySQL/MariaDB                             |
| **Extension system**        | None (Blueprint is unofficial)  | First-party plugin system                 |
| **Admin roles**             | No                              | Yes                                       |
| **OAuth login**             | No                              | Yes                                       |
| **Passkeys (WebAuthn)**     | No                              | Yes                                       |
| **Webhooks**                | No                              | Yes                                       |
| **Organization**            | Nests and locations             | Tags                                      |
| **Bot protection**          | Google reCAPTCHA                | Cloudflare Turnstile                      |
| **Egg format**              | Native                          | Compatible                                |

## What Pelican Changed

**The interface.** Both the client and admin areas were rewritten with Filament, and the build moved from Webpack to Vite. This is the most visible difference and the reason Pelican feels like a different product even though the backend lineage is the same.

**A first-party plugin system.** Pterodactyl never shipped one. Blueprint, the community answer, patches PHP source files at install time and can break on either a panel update or a plugin update. Pelican's plugins are installed, updated and removed from the panel itself. Blueprint extensions do not carry over; they have to be rewritten for Pelican's API.

**Authentication and administration.** OAuth login, passkeys, admin roles and permissions, and webhooks are all new. These were the most requested Pterodactyl features that never landed upstream.

**Panel database choice.** Pterodactyl requires MySQL. Pelican's own panel can run on MySQL, MariaDB with a dedicated driver, PostgreSQL or SQLite. Note that this is the panel's database only; databases provisioned for game servers are still MySQL/MariaDB.

**Structure.** Nests and locations were replaced by tags, which is simpler for small deployments and a habit change for large ones.

**License.** Pterodactyl is MIT. Pelican is AGPL-3.0. For most operators this changes nothing. If you modify the panel and offer it to customers over the network, the AGPL requires you to publish your modifications.

## What Stayed the Same

- **Wings.** Pelican uses the Go daemon it inherited. Node behaviour, Docker orchestration and per-server isolation are the same.
- **Eggs.** The format is unchanged, so the whole Pterodactyl egg ecosystem works.
- **The runtime.** Both panels are PHP behind PHP-FPM. Under heavy concurrent use, a Pelican panel behaves like a Pterodactyl panel with a newer front end. If your reason for leaving Pterodactyl is panel CPU or memory under load, the fork does not address it.
- **Game-server databases.** MySQL/MariaDB only, on both.
- **File management, scheduling and backups** are functionally close. Pelican adds dynamic backup targets; neither has file edit history, archive browsing or event-driven schedule triggers.

## Verdict

**Stay on Pterodactyl** if it works and you have no need for plugins, OAuth or roles. It is mature, and the largest body of community knowledge is written for it.

**Move to Pelican** if you want those features without leaving the PHP/Laravel stack, and especially if you already administer Laravel applications. It is the change with the least relearning.

**Look at a third option** if your problem is performance, game-server database types, or how deep extensions can reach. Neither PHP panel changes those.

## The Third Option

Calagopus keeps the egg format and the panel/Wings split but rewrites both in Rust. On the same hardware and CPU limits, the project's [benchmarks](/docs/about/benchmarks) report more than 32,800% higher panel API throughput than Pterodactyl; that is API throughput under concurrent load, not game tick rate, and the methodology and raw numbers are on that page. Beyond speed, it adds PostgreSQL, MongoDB and Redis as game-server databases, an extension API whose extensions can replace built-in UI, event-driven schedule triggers, file edit history, an in-browser SSH shell, and an admin audit log. It runs the panel on Windows and ARM64.

A built-in importer reads a Pterodactyl or Pelican database directly, so if you move to Pelican first and change your mind later, the path to Calagopus is the same. The detailed comparisons are [Calagopus vs Pterodactyl](/compare/calagopus-vs-pterodactyl) and [Calagopus vs Pelican](/compare/calagopus-vs-pelican), and the [alternatives overview](/compare/) puts all of them, plus AMP, on one page.

## Migrating

- **Pterodactyl to Pelican:** the two share a stack, so an in-place move is possible in principle; Pelican's own documentation is the authority on which versions it supports. Blueprint extensions need replacing.
- **Either to Calagopus:** the [Pterodactyl migration guide](/docs/additional/migrations/pterodactyl) and [Pelican migration guide](/docs/additional/migrations/pelican) cover Docker and standalone installs. Users, servers, nodes and eggs import; API keys and Wings are recreated.
