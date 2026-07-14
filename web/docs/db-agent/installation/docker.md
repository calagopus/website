---
title: Docker DB Agent Installation
description: How to install Calagopus DB Agent using Docker. DB Agent is the database proxy and provisioning agent that runs PostgreSQL, MariaDB/MySQL, MongoDB, and Redis containers on your host machines.
---

# Docker DB Agent Installation

## Docker Image Variants

| Variant | Description |
| ------- | ----------- |
| `:latest` | The latest stable release. Recommended for production. |
| `:latest-pre` | Latest pre-release. May contain new features not yet in `:latest`, but also new bugs. Not recommended for production. |
| `:nightly` | Latest development build. Updated frequently, may be unstable. Not recommended for production. |

## Install Docker

::: info Using Podman instead?
Podman is supported as an alternative to Docker. DB Agent talks to the container engine over the same socket-based API either way, point `docker.socket` at the Podman socket instead.
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
mkdir calagopus-db-agent
cd calagopus-db-agent

curl -o compose.yml https://raw.githubusercontent.com/calagopus/db-agent/refs/heads/main/compose.yml
ls -lh # should show you the compose.yml file
```

## Change the Image Variant (Optional)

The compose file uses `:latest` by default. To switch variants, open `compose.yml` and change the image tag on the `db-agent` service.

::: details Example: switching to `:nightly` via sed
```bash
sed -i -e "s/calagopus\/db-agent:latest/calagopus\/db-agent:nightly/g" compose.yml
```
:::

## Configure DB Agent

Create the config file:

```bash
nano config.yml
```

At minimum, set an `api.token` that clients will use to authenticate against the management API. See the [Configuration](../configuration.md) reference for every available option.

::: warning Volume paths must match exactly
If you change any volume locations, the paths in `compose.yml` and `config/config.yml` must be identical and must be absolute paths. DB Agent passes these paths directly to the Docker daemon, which mounts them on the host - mismatched paths will prevent DB Agent from creating database containers correctly.
:::

## Start DB Agent

```bash
docker compose up -d
```

This pulls the image and starts DB Agent in detached mode.

If you run into issues, check the logs:

```bash
docker compose logs -f db-agent
```
