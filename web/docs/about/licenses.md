---
title: Licenses
description: License information for every Calagopus repository, including the non-MIT and currently unlicensed ones, plus the vendored third-party components that affect redistribution.
---

# Licenses

Calagopus is open source, and most repositories are licensed under the **MIT
License**. The copyright holder varies between repositories (`Calagopus`,
`Calagopus, 0x7d8`, and in one case an outside contributor), and a handful of
repositories are not MIT at all. The tables below are authoritative; when in
doubt, read the `LICENSE` file in the repository itself.

## Repositories

### Core components

| Repository | License | Notes |
| --- | --- | --- |
| [`calagopus/panel`](https://github.com/calagopus/panel) | MIT | Core panel (backend, frontend, shared). |
| [`calagopus/wings`](https://github.com/calagopus/wings) | MIT | Node daemon. See [bundled and vendored components](#bundled-and-vendored-components). |
| [`calagopus/db-agent`](https://github.com/calagopus/db-agent) | MIT | Database provisioning agent and proxy. |
| [`calagopus/tundra`](https://github.com/calagopus/tundra) | MIT | Cross-node game server tunnels over QUIC. |
| [`calagopus/fusequota`](https://github.com/calagopus/fusequota) | GNU GPL-2.0 | FUSE-based quota enforcement for non-native filesystems. |

### Integrations and tooling

| Repository | License | Notes |
| --- | --- | --- |
| [`calagopus/whmcs-module`](https://github.com/calagopus/whmcs-module) | MIT | WHMCS integration module. |
| [`calagopus/paymenter-module`](https://github.com/calagopus/paymenter-module) | MIT | Paymenter integration module. |
| [`calagopus/blesta-module`](https://github.com/calagopus/blesta-module) | MIT | Blesta integration module. |
| [`calagopus/vscode-extension`](https://github.com/calagopus/vscode-extension) | MIT | VS Code extension for server management. |
| [`calagopus/bot`](https://github.com/calagopus/bot) | MIT | Discord bot for the community server. |
| [`calagopus/benchmarking`](https://github.com/calagopus/benchmarking) | MIT | Benchmarking suite behind the [benchmarks page](./benchmarks.md). |
| [`calagopus/website`](https://github.com/calagopus/website) | MIT | Docs and marketing site. |
| [`calagopus/branding`](https://github.com/calagopus/branding) | CC0-1.0 | Branding assets (logos, icons, banners). |
| [`calagopus/branding-generator`](https://github.com/calagopus/branding-generator) | CC0-1.0 | Web generator for branding assets. |

### Deployment recipes

| Repository | License | Notes |
| --- | --- | --- |
| [`calagopus/nix`](https://github.com/calagopus/nix) | MIT | Nix flake for the Panel and Wings. Copyright is held by an outside contributor, not Calagopus. |
| [`calagopus/unraid`](https://github.com/calagopus/unraid) | MIT | Unraid templates and Community Applications profile. |
| [`calagopus/tipi-appstore`](https://github.com/calagopus/tipi-appstore) | WTFPL | Runtipi app store entries. |

### Container images

These repositories contain only packaging - a `Dockerfile` and a build workflow.
The license shown covers that packaging; the software inside the published
images remains under its own upstream license.

| Repository | License | Notes |
| --- | --- | --- |
| [`calagopus/valkey`](https://github.com/calagopus/valkey) | BSD-3-Clause | Multi-arch image for Valkey. |
| [`calagopus/kopia`](https://github.com/calagopus/kopia) | Apache-2.0 | Multi-arch image for Kopia. |
| [`calagopus/pgautoupgrade`](https://github.com/calagopus/pgautoupgrade) | MIT | Multi-arch image for pgautoupgrade. Downstream of the official Postgres image, so copyright remains with the Docker PostgreSQL Authors. |

## Bundled and vendored components

Some repositories vendor or wrap third-party code whose license differs from the
project's MIT license. These need to be called out for anyone redistributing
Calagopus commercially.

| Component | Location | License | Notes |
| --- | --- | --- | --- |
| `unrar-ng` (wrapper) | [`0x7d8/unrar.rs`](https://github.com/0x7d8/unrar.rs), a Git dependency of Wings | MIT OR Apache-2.0 | The Rust wrapper is permissive. |
| UnRAR C library | `unrar_sys/vendor/unrar` in the same repository | **UnRAR license** | Non-free and restrictive. See below. |

The UnRAR dependency is unconditional, so every Wings binary contains it. Its
license permits using the source to *unpack* RAR archives, but explicitly
forbids using it to build a RAR-compatible archiver, and requires the license
text to travel with any redistribution. Read
[`vendor/unrar/license.txt`](https://github.com/0x7d8/unrar.rs/blob/1a57ca302207b12c7cb1b12dbedf5d7b1eeadce2/unrar_sys/vendor/unrar/license.txt)
before shipping Wings as part of a commercial product. Wings 1.2.6 and older vendored the
wrapper in the Wings repository itself.

Wings also contains a `pbs-client` crate used for
[Proxmox Backup Server backups](../wings/advanced/backup-configurations.md). It
is a first-party implementation of the PBS wire protocol - no Proxmox source is
vendored - and is covered by the Wings MIT license, not by Proxmox's AGPL.

## Full dependency licenses

The complete transitive dependency license list for the Panel, Wings and the
DB Agent is available from their SBOMs. See
[Software Bill of Materials](./architecture.md#software-bill-of-materials-sbom)
for what an SBOM is and why we publish them.

[See SBOMs here](https://packages.calagopus.com/sbom/).
