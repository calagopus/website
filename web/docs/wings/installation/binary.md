---
title: Binary Wings Installation
description: How to install Calagopus Wings as a standalone binary on Linux. Wings manages game server Docker containers on behalf of the Calagopus Panel.
---

# Binary Wings Installation

## Install a Container Runtime

Wings requires Docker or Podman to be installed and running on the host to manage game server containers.

::::tabs
=== Docker

Verify your installation:

```bash
docker --version
```

If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install) for your distribution.

=== Podman

Podman is supported as a drop-in alternative. Install it via your distribution's package manager (e.g. `apt install podman` or `dnf install podman`), then follow the [Running Wings with Podman](../advanced/running-wings-with-podman.md) guide to configure Wings to use the Podman socket.

::::

## Install the Wings Binary

```bash
curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings
```

Verify the installation:

```bash
wings version
```

## Configure Wings

Before starting Wings, you need to register the node in the panel and generate its configuration. Follow the [Configuring a New Node](../../wings/next-steps/configure-node.md) guide to create the node, then run the auto-deploy command the panel provides:

```bash
wings configure --join-data xxxxxx
```

Test the configuration by running Wings in the foreground - you should see it connect to the panel:

```bash
wings
```

Kill it with `Ctrl-C` once you've confirmed it connects.

## Install as a Service

```bash
wings service-install
```

This creates and enables a systemd service that starts on boot. Check its status with:

```bash
systemctl status wings
```

## Next Steps

With Wings running, the next step is to set up allocations - the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
