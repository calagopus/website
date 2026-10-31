---
description: Install the Calagopus panel with Docker, APT/RPM/APK package managers, a standalone binary, or platform-specific methods like TrueNAS SCALE, Unraid, umbrelOS, Runtipi, and ZimaOS.
---

# Panel Installation

For a fresh Linux VPS, [Your first VPS](./first-vps.md) walks through the All-in-One installation, optional Caddy HTTPS, and your first game server.

Before installing, check the [minimum requirements](../overview.md#minimum-requirements).

Choose your installation method:

::::tabs
=== Docker (Recommended)
See the [Docker Panel Installation](./docker.md) guide. Runs the panel and its dependencies as containers, the recommended path for most deployments, and the only method that supports extensions out of the box.

=== APT / RPM / APK
See the [Package Manager Installation](./pkgmanager.md) guide. Install directly from the Calagopus repository using APT (Debian/Ubuntu), RPM (RHEL/Fedora), or APK (Alpine). Note that this method does not support extensions.

=== Binary
See the [Binary Installation](./binary.md) guide. Download and run the panel binary directly on Linux, macOS, or Windows. Note that this method does not support extensions.

=== External Methods
See the [External Installation Methods](./external-methods/index.md) guide for platform-specific installs on TrueNAS SCALE, Unraid, umbrelOS, Runtipi, ZimaOS, and similar NAS/homelab platforms. Includes Wings in the same container.
::::
