---
title: What is Calagopus?
description: Calagopus is an open-source game server management panel built in Rust. How it compares to Pterodactyl and Pelican, and what games it supports.
prev: false
---

![Calagopus Logo](/fulllogo.svg)

# What is Calagopus?

Calagopus is an open-source game server management panel. The backend is written in Rust and the frontend in React. You use it to create, run and maintain game servers, from a single Minecraft server at home to a hosting business with many nodes.

It takes ideas from Pterodactyl, including its egg format, but was written from scratch. The panel can be extended with [extensions](../panel/extensions/index.md), and contributions are welcome on [GitHub](https://github.com/calagopus).

## Frequently Asked Questions

::: details How is Calagopus different from Pterodactyl?
Calagopus is built in Rust, where Pterodactyl uses PHP. That shows in performance: on the public settings endpoint, the one scenario every panel answers with real `200`s, Calagopus serves between 116x and 442x the requests per second Pterodactyl does, depending on hardware and CPU quota, as of v1.2.4 (October 2026). That figure measures control-plane throughput under concurrent load, not game-server tick rate or player capacity. See the [benchmarks page](./benchmarks.md) for the full methodology and the per-system numbers. Extensions are written against a Rust trait API instead of a PHP plugin system. Existing Pterodactyl installs can move over with the [migration guide](../additional/migrations/pterodactyl.md). For a feature-by-feature breakdown, see the full [Calagopus vs Pterodactyl comparison](/compare/calagopus-vs-pterodactyl).
:::

::: details How is Calagopus different from Pelican?
Pelican is a Pterodactyl fork that retains the same PHP/Laravel architecture. Calagopus is a complete rewrite in a different language stack, so the two share goals but very little code. If you're already on Pelican, see the [migration guide](../additional/migrations/pelican.md). For a side-by-side breakdown, see [Calagopus vs Pelican](/compare/calagopus-vs-pelican).
:::

::: details What games does Calagopus support?
Calagopus uses eggs, the same format Pterodactyl uses, to describe how a game is installed and started. Anything that runs in a Linux Docker container can be managed, including Minecraft (Java and Bedrock), Rust, ARK, Valheim, FiveM and Source engine games. See [egg repositories](../panel/next-steps/egg-repos.md) for available presets.
:::

::: details Is Calagopus open source?
Yes. The source is on [GitHub](https://github.com/calagopus). Core components are MIT-licensed; check individual repositories for specifics.
:::

::: details Is Calagopus free to use?
Yes, for personal and commercial use. No features are held back for a paid tier.
:::

::: details Can I migrate from Pterodactyl or Pelican?
Yes. The panel has a built-in importer for both. See the [Pterodactyl migration guide](../additional/migrations/pterodactyl.md) or [Pelican migration guide](../additional/migrations/pelican.md).
:::

::: details Does Calagopus have an Extension API?
Yes. [Extensions](../panel/extensions/index.md) can add backend logic, custom routes, UI elements and database migrations. The backend side is written against a set of Rust traits. See the [Extension Development Guide](../panel/extensions/dev-environment.md) to get started.
:::

::: details Does Calagopus support Blueprint extensions?
No. Blueprint is built for Pterodactyl's PHP codebase and can't run on Calagopus. Calagopus extensions are written against its own [extension API](../panel/extensions/index.md) instead.
:::

::: details What is Calagopus Wings?
[Wings](../wings/index.md) is the node daemon that runs your game servers. It sits on each host, manages the Docker containers on behalf of the panel, and reports status back. One panel can drive many Wings nodes.
:::

::: details Can I run Calagopus on Windows?
The panel runs natively on Windows and via Docker Desktop. [Wings](../wings/index.md) (the daemon that runs game servers) requires Linux. WSL2 works for local testing, but use a real Linux host for anything people depend on.
:::

::: details Can I run Calagopus on a Raspberry Pi?
Yes. Calagopus supports ARM64, and the Docker Compose setup runs on a Raspberry Pi without changes. A Pi runs out of CPU quickly once several demanding game servers share it, though.
:::

::: details Do I need Linux experience to use Calagopus?
Not much. After the initial setup, day-to-day operation happens through the web UI. Some terminal familiarity helps for troubleshooting, but isn't required. The [Discord community](https://discord.gg/uSM8tvTxBV) is there if you get stuck.
:::
