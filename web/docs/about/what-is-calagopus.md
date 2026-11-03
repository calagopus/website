---
title: What is Calagopus?
description: Calagopus is an open-source game server management panel built in Rust. Learn how it compares to Pterodactyl and Pelican, what games it supports, and why it's a great choice for self-hosted game server hosting.
prev: false
next: true
---

![Calagopus Logo](/fulllogo.svg)

# What is Calagopus?

Calagopus is a modern, open-source game server management panel built with Rust and React. It provides a fast, secure interface for deploying, monitoring, and maintaining game servers - built for everyone from solo homelabbers to large hosting operators.

It draws inspiration from Pterodactyl but is written from scratch in Rust, with a focus on performance, security, and extensibility. The panel includes a rich extension API and welcomes community contributions.

## Frequently Asked Questions

### How is Calagopus different from Pterodactyl?

Calagopus is built in Rust, where Pterodactyl uses PHP. The result is meaningfully better performance: on the public settings endpoint, the one scenario every panel answers with real `200`s, Calagopus serves between 108x and 447x the requests per second Pterodactyl does, depending on hardware and CPU quota, as of v1.2.8 (November 2026). That figure measures control-plane throughput under concurrent load, not game-server tick rate or player capacity. See the [benchmarks page](./benchmarks.md) for the full methodology and the per-system numbers. Calagopus also ships its own extension API designed around Rust traits, rather than the PHP-based plugin systems of older panels. We provide a [migration guide](../additional/migrations/pterodactyl.md) for existing Pterodactyl users. For a feature-by-feature breakdown, see the full [Calagopus vs Pterodactyl comparison](/compare/calagopus-vs-pterodactyl).

### How is Calagopus different from Pelican?

Pelican is a Pterodactyl fork that retains the same PHP/Laravel architecture. Calagopus is a complete rewrite in a different language stack, so the two share goals but very little code. If you're already on Pelican, see the [migration guide](../additional/migrations/pelican.md). For a side-by-side breakdown, see [Calagopus vs Pelican](/compare/calagopus-vs-pelican).

### What games does Calagopus support?

Calagopus uses an "egg" system (compatible with the Pterodactyl ecosystem) to support arbitrary games. Anything that runs in a Linux Docker container can be managed - Minecraft (Java and Bedrock), Rust, ARK, Valheim, FiveM, source-engine games, and many more. See [egg repositories](../panel/next-steps/egg-repos.md) for available presets.

### Is Calagopus open source?

Yes. The source is on [GitHub](https://github.com/calagopus). Core components are MIT-licensed; check individual repositories for specifics.

### Is Calagopus free to use?

Yes - for personal and commercial use, with no feature gating.

### Can I migrate from Pterodactyl or Pelican?

Yes. Calagopus provides migration tooling for both panels. See the [Pterodactyl migration guide](../additional/migrations/pterodactyl.md) or [Pelican migration guide](../additional/migrations/pelican.md).

### Does Calagopus have an Extension API?

Yes. [Extensions](../panel/extensions/index.md) can add backend logic, custom routes, UI elements, database migrations, and more. The API uses Rust traits for type safety and performance. See the [Extension Development Guide](../panel/extensions/dev-environment.md) to get started.

### Does Calagopus support Blueprint extensions?

No. Blueprint targets the PHP-based Pterodactyl architecture and isn't compatible with Calagopus's Rust-based system. Calagopus's native extension API covers the same use cases - and more - with better performance and type safety.

### What is Calagopus Wings?

[Wings](../wings/index.md) is the node daemon that runs your game servers. It sits on each host, manages the Docker containers on behalf of the panel, and reports status back. One panel can drive many Wings nodes.

### Can I run Calagopus on Windows?

The panel runs natively on Windows and via Docker Desktop. [Wings](../wings/index.md) (the daemon that runs game servers) requires Linux - WSL2 works for local testing, but a real Linux host is recommended for anything production-adjacent.

### Can I run Calagopus on a Raspberry Pi?

Yes. Calagopus supports ARM64 and the Docker Compose setup works on a Raspberry Pi out of the box. Resource limits apply - running multiple CPU-intensive game servers on a Pi will hit hardware ceilings quickly.

### Do I need Linux experience to use Calagopus?

Not much. After the initial setup, day-to-day operation happens through the web UI. Some terminal familiarity helps for troubleshooting, but isn't required. The [Discord community](https://discord.gg/uSM8tvTxBV) is there if you get stuck.
