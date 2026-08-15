---
title: Licenses
description: License information for every Calagopus component. Everything is MIT licensed unless stated otherwise.
---

# Licenses

Calagopus is open source. Unless a component states otherwise below, it is
licensed under the **MIT License** (`Copyright (c) Calagopus`).

## Repositories

| Repository | License | Notes |
| --- | --- | --- |
| [`calagopus/panel`](https://github.com/calagopus/panel) | MIT | Core panel (backend, frontend, shared). |
| [`calagopus/wings`](https://github.com/calagopus/wings) | MIT | Node daemon. |
| [`calagopus/website`](https://github.com/calagopus/website) | MIT | Docs and marketing site. |
| [`calagopus/bot`](https://github.com/calagopus/bot) | MIT | Discord Bot integration. |
| [`calagopus/fusequota`](https://github.com/calagopus/fusequota) | GNU GPL-2.0 | FUSE-based quota enforcement for non-native filesystems. |
| [`calagopus/branding`](https://github.com/calagopus/branding) | Creative Commons Zero v1.0 Universal | Branding assets (logos, icons, etc.). |
| [`calagopus/whmcs-module`](https://github.com/calagopus/whmcs-module) | MIT | WHMCS integration module. |
| [`calagopus/paymenter-module`](https://github.com/calagopus/paymenter-module) | MIT | Paymenter integration module. |
| [`calagopus/blesta-module`](https://github.com/calagopus/blesta-module) | MIT | Blesta integration module. |
| [`calagopus/vscode-extension`](https://github.com/calagopus/vscode-extension) | MIT | VSCode extension for Calagopus. |

## Bundled and vendored components

Some repositories vendor or wrap third-party code whose license differs from the
project's MIT license. These need to be called out for anyone redistributing
Calagopus commercially.

| Component | Location | License | Notes |
| --- | --- | --- | --- |
| `unrar-rs` (wrapper) | `wings/unrar-rs` | MIT OR Apache-2.0 | The Rust wrapper is permissive. |
| UnRAR C library | (via `unrar_sys`) | **UnRAR license** | Non-free, restrictive. |

## Full dependency licenses

The complete transitive dependency license list is available from the SBOM.

[See SBOMs here](https://packages.calagopus.com/sbom/).
