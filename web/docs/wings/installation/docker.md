---
title: Docker Wings Installation
description: How to install Calagopus Wings using Docker. Wings is the node daemon that runs game server containers on your host machines.
---

# Docker Wings Installation

## Docker Image Variants

| Variant | Description |
| ------- | ----------- |
| `:latest` | The latest stable release. Recommended for production. |
| `:latest-pre` | Latest pre-release. May contain new features not yet in `:latest`, but also new bugs. Not recommended for production. |
| `:nightly` | Latest development build. Updated frequently, may be unstable. Not recommended for production. |

## Install Docker


::: info Using Podman instead?
Podman is supported as an alternative to Docker. If you'd prefer to use Podman, install Wings via the [Docker](../../wings/installation/docker.md#configure-wings), [Binary](../../wings/installation/binary.md#configure-wings), or [Package Manager](../../wings/installation/pkgmanager.md#configure-wings) method and follow the [Running Wings with Podman](../../wings/advanced/running-wings-with-podman.md) guide. The Docker Compose method requires Docker.
:::

Verify your Docker installation:

```bash
docker --version
docker compose version # if this says "command not found" you may need to use `docker-compose` instead or update your Docker installation
```

If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

This installs Docker Compose as well. If not, follow the [Docker Compose installation instructions](https://docs.docker.com/compose/install). Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

## Download the Compose Stack

```bash
mkdir calagopus-wings
cd calagopus-wings

curl -o compose.yml https://raw.githubusercontent.com/calagopus/wings/refs/heads/main/compose.local.yml
ls -lh # should show you the compose.yml file
```

## Change the Image Variant (Optional)

The compose file uses `:latest` by default. To switch variants, open `compose.yml` and change the image tag on the `wings` service.

::: details Example: switching to `:nightly` via sed
```bash
sed -i -e "s/calagopus\/wings:latest/calagopus\/wings:nightly/g" compose.yml
```
:::


## Configure Wings

Before starting Wings, you need to register the node in the panel and get its configuration. Follow the [Configuring a New Node](../../wings/next-steps/configure-node.md) guide to create the node, then copy the configuration content from the Node Configuration page in the panel.

Create the config directory and file:

```bash
mkdir config
nano config/config.yml
```

Paste the configuration from the panel and save.

::: warning Volume paths must match exactly
If you change any volume locations, the paths in `compose.yml` and `config/config.yml` must be identical and must be absolute paths. Wings passes these paths directly to the Docker daemon, which mounts them on the host - mismatched paths will prevent Wings from creating server containers correctly.
:::

## Start Wings

```bash
docker compose up -d
```

This pulls the image and starts Wings in detached mode. Once running, the panel should show the node as connected.

If you run into issues, check the logs:

```bash
docker compose logs -f wings
```

## Next Steps

With Wings running, the next step is to set up allocations - the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
