---
title: Binary DB Agent Installation
description: How to install Calagopus DB Agent as a standalone binary on Linux. DB Agent manages database Docker containers and exposes a REST API for provisioning.
---

# Binary DB Agent Installation

## Install a Container Runtime

DB Agent requires Docker or Podman to be installed and running on the host to manage database containers.

::::tabs
=== Docker

Verify your installation:

```bash
sudo docker --version
```

::: details Docker isn't installed yet
If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | sudo CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install) for your distribution.
:::

=== Podman

Podman is supported as a drop-in alternative. Install it via your distribution's package manager (e.g. `sudo apt install podman` or `sudo dnf install podman`), then point `docker.socket` in your `config.yml` at the Podman socket. To run DB Agent as a normal user under rootless Podman, follow [Running DB Agent Rootless](../advanced/running-db-agent-rootless.md) instead.

::::

## Install the DB Agent Binary

This downloads the binary and prints its version. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

```bash
sudo curl -L "https://github.com/calagopus/db-agent/releases/latest/download/db-agent-$(uname -m)-linux" -o /usr/local/bin/calagopus-db-agent
sudo chmod +x /usr/local/bin/calagopus-db-agent
sudo /usr/local/bin/calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
sudo ln -s /usr/local/bin/calagopus-db-agent /usr/local/bin/db-agent
```

## Configure DB Agent

Set an API token that clients will use to authenticate against the management API:

```bash
sudo /usr/local/bin/calagopus-db-agent configure --token <TOKEN>
```

This writes the token into the config file at the default path (`/etc/calagopus-db-agent/config.yml`), creating it with defaults first if it doesn't exist yet. See the [Configuration](../configuration.md) reference for every other available option.

Test the configuration by running DB Agent in the foreground:

```bash
sudo /usr/local/bin/calagopus-db-agent
```

Kill it with `Ctrl-C` once you've confirmed it starts without errors.

## Install as a Service

This creates and enables a systemd or OpenRC service (auto-detected) that starts on boot, then shows its status:

::: code-group
```bash [systemd]
sudo /usr/local/bin/calagopus-db-agent service-install
sudo systemctl status db-agent --no-pager
```

```bash [OpenRC (Alpine)]
calagopus-db-agent service-install
rc-service db-agent status
```
:::

## Next Steps

With DB Agent running, connect it to the Panel and secure its connections. See [Next Steps](../next-steps/index.md).
