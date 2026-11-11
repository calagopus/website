---
title: Docker DB Agent Installation
description: Install the Calagopus DB Agent with Docker. DB Agent is the database proxy and provisioning agent that runs PostgreSQL, MariaDB/MySQL, MongoDB, and Redis containers.
---

# Docker DB Agent Installation

## Docker Image Variants

| Variant       | Description                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:latest`     | The latest stable release. Recommended for production.                                                                                             |
| `:latest-pre` | Latest pre-release, once one has been published. May contain new features not yet in `:latest`, but also new bugs. Not recommended for production. |
| `:nightly`    | Latest development build. Updated frequently, may be unstable. Not recommended for production.                                                     |

## Install Docker

::: info Using Podman instead?
Podman is supported as an alternative to Docker. DB Agent talks to the container engine over the same socket-based API either way, point `docker.socket` at the Podman socket instead.
:::

Verify your Docker installation:

```bash
sudo docker --version
sudo docker compose version # if this says "command not found" you may need to use `docker-compose` instead or update your Docker installation
```

::: details Docker isn't installed yet
If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | sudo CHANNEL=stable bash
```

This installs Docker Compose as well. If not, follow the [Docker Compose installation instructions](https://docs.docker.com/compose/install). Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).
:::

## Download the Compose Stack

This downloads the Compose file and opens `config.yml`. Set at least `api.token` in it, as described under [Configure DB Agent](#configure-db-agent), then save. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

```bash
sudo mkdir calagopus-db-agent
cd calagopus-db-agent

sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/db-agent/refs/heads/main/compose.yml
sudo nano config.yml
```

## Change the Image Variant (Optional)

The compose file uses `:latest` by default. To switch variants, open `compose.yml` and change the image tag on the `db-agent` service.

::: details Example: switching to `:nightly` via sed
```bash
sudo sed -i -e "s/calagopus\/db-agent:latest/calagopus\/db-agent:nightly/g" compose.yml
```
:::

## Configure DB Agent

In `config.yml`, at minimum, set an `api.token` that clients will use to authenticate against the management API. See the [Configuration](../configuration.md) reference for every available option.

::: warning The data directory needs a volume
DB Agent maps its directories to their host paths by inspecting its own container, so you only need to change the host side of a volume to move storage. If you split `/var/lib/calagopus-db-agent` across several mounts, make sure `/var/lib/calagopus-db-agent/data`, where the database files live, is still inside one of them.
:::

## Start DB Agent

This pulls the image, starts DB Agent in detached mode and follows its logs. Press `Ctrl+C` to stop following them, DB Agent keeps running. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

```bash
sudo docker compose up -d
sudo docker compose logs -f db-agent
```

## Next Steps

With DB Agent running, connect it to the Panel and secure its connections. See [Next Steps](../next-steps/index.md).
