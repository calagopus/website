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

Podman is supported as a drop-in alternative. Install it via your distribution's package manager (e.g. `sudo apt install podman` or `sudo dnf install podman`), then follow the [Running Wings with Podman](../advanced/running-wings-with-podman.md) guide to configure Wings to use the Podman socket.

::::

## Install the Wings Binary

This downloads the binary and prints its version. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

```bash
sudo curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
sudo chmod +x /usr/local/bin/wings
sudo /usr/local/bin/wings version
```

## Configure Wings

On a fresh installation, Wings starts in setup mode when no configuration file exists. You can start it in the foreground:

```bash
sudo /usr/local/bin/wings
```

Read the pairing code printed in the terminal, then follow [Pair a Waiting Node](../next-steps/configure-node.md#pair-a-waiting-node) in the Panel. Keep Wings running while you pair it; it writes its configuration and starts normal operation when pairing succeeds.

To create the node entry first, use the Panel's [enrollment command](../next-steps/configure-node.md#use-an-enrollment-command), or apply the generated YAML or `configure --join-data` command. Existing configurations continue to load normally.

## Install as a Service

Stop any foreground Wings process with `Ctrl+C` before starting the service. The installer creates, enables, and starts a service for the host's init system. An unconfigured installation starts in setup mode; a configured one starts normal operation. On systemd, this also shows its status and the pairing code:

::: code-group
```bash [systemd]
sudo /usr/local/bin/wings service-install
sudo systemctl status wings --no-pager
sudo journalctl -u wings -n 50 --no-pager
```

```bash [OpenRC (Alpine)]
wings service-install
rc-service wings status
```
:::

On Alpine/OpenRC, if the pairing code is not visible in service logs, configure it using the enrollment command before starting the service.

## Optional LXCFS

LXCFS makes selected `/proc` and `/sys` files inside server containers reflect their resource limits. It runs as a separate service on the container host; Wings bind-mounts its files read-only into game server containers. Installer containers do not use these mounts.

Install your distribution's `lxcfs` package first. To create a dedicated service, run:

```bash
sudo /usr/local/bin/wings service-install --lxcfs
```

This installs, enables, and starts **wings-lxcfs** using systemd or OpenRC, with CPU quota awareness (`--enable-cfs`). It installs the lxcfs service only; install the Wings service separately as shown above. If you use a custom Wings configuration path, pass it with `sudo wings --config /path/to/config.yml service-install --lxcfs`.

When a Wings configuration is loaded, the command saves:

```yaml
docker:
  lxcfs:
    enabled: true
    directory: /var/lib/calagopus-wings/lxcfs
```

Without a loaded configuration, add these settings once Wings has been configured. Restart Wings, then restart each server to recreate its container with the mounts. On systemd, check the separate service with `sudo systemctl status wings-lxcfs`; on OpenRC, use `rc-service wings-lxcfs status`.

You can also use an existing host lxcfs service: enable [`docker.lxcfs.enabled`](../configuration.md#docker-lxcfs-enabled) and set `docker.lxcfs.directory` to its mount directory, usually `/var/lib/lxcfs`. That is the configuration default, which differs from the dedicated service's path. Set the directory in the local Wings config; the Panel cannot change it.

If lxcfs stops, existing containers can report `Transport endpoint is not connected` when reading its files. Restore the lxcfs service, then restart affected servers to remount it. Restarting Wings alone does not repair those mounts. When native Wings cannot find a valid lxcfs mount during container creation, it logs a warning and continues without the integration.

## Next Steps

With Wings running, the next step is to set up allocations, the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
