---
title: Docker Panel Installation
description: Step-by-step guide to installing the Calagopus Panel with Docker. Covers the All-in-One image for single-node setups and standalone images for multi-node deployments.
---

# Docker Panel Installation

Before installing, check the [Minimum Requirements](../overview.md#minimum-requirements) section in the Panel Overview.

Those requirements cover the Panel itself. For an AIO host, also leave room for Ubuntu or your chosen OS, PostgreSQL, Valkey, container images, backups, and the games you plan to run. [Your first VPS](./first-vps.md#before-you-start) includes an example resource budget.

## Which image should I use?

If you only plan to run a **single node** (Panel + Wings on the same host), use the **All-in-One (AIO)** image. It ships the Panel and Wings together in one container, which makes the setup noticeably simpler: one compose file, one service to start, no separate node to register, no additional Wings reverse proxy configuration. **This is the recommended path for most users.**

If you plan to run **multiple nodes**, or want to keep the Panel and Wings on separate hosts, use one of the standalone Panel images (`:latest` or `:heavy`) and install Wings separately following the [Wings Docker Installation](../../wings/installation/docker.md) guide.

::: warning Migrating from Pterodactyl or Pelican? Usually skip AIO
A migration keeps your existing Wings nodes, and your servers stay on them. AIO only makes sense if you want this host to become an extra node as well. Its bundled Wings also takes port `2022`, so it collides with a Wings already running on the same host.

On first start the AIO image also creates an "Integrated Node", an "Integrated Location", and a backup configuration. The node can't be deleted while you run an `-aio` image. The [importer](../../additional/migrations/index.md) refuses a target that already has nodes or locations, so you'd need `--force` and end up with an extra node next to the imported ones. For most migrations, use a standalone image (Option B).
:::

Use a **heavy** variant (AIO or standalone) only if you intend to install [extensions](../extensions/index.md). It bundles the build tooling needed to compile them. Otherwise stick with the non-heavy image; it has a smaller footprint.

## Docker Image Variants

The Calagopus Panel Docker image comes in several variants:

### Standalone Panel images

Use these if you are running the Panel on its own and Wings on separate hosts.

| Variant | Description |
| --- | --- |
| `:latest` | The latest stable release of the Calagopus Panel. Optimized for production use and does not include development tools. |
| `:latest-pre` | The latest pre-release version. May contain new features and bug fixes not yet in `:latest`, but also potentially new bugs. Not recommended for production. |
| `:nightly` | The latest development build. Updated frequently, may contain new features and bug fixes not yet in `:latest` or `:latest-pre`. Not recommended for production. |
| `:heavy` | The official image for installing [extensions](../extensions/index.md) in Docker deployments. Includes the build tools and dependencies needed to compile and run them. |
| `:heavy-pre` | Pre-release variant of `:heavy`. Same trade-offs as `:latest-pre`. |
| `:nightly-heavy` | Development-build variant of `:heavy`. Same trade-offs as `:nightly`. |

### All-in-One (AIO) images

These bundle the Panel and Wings in a single container. Pick one of these if you only need a single node.

| Variant | Description |
| --- | --- |
| `:aio` | The latest stable release of the Panel and Wings bundled together. Recommended for single-node setups. |
| `:heavy-aio` | AIO variant with the development tools needed for extensions. Use if you plan to install extensions on a single-node setup. |
| `:nightly-aio` | Development-build AIO variant. Same trade-offs as `:nightly`. |
| `:nightly-heavy-aio` | Development-build AIO variant with extension support. |

## Getting Started

### Install Docker

You need Docker and Docker Compose installed on your system. You can validate your Docker installation by running:

```bash
sudo docker --version
sudo docker compose version # if this says "command not found" you may need to use `docker-compose` instead or update your docker installation
```

::: details Docker isn't installed yet
If Docker is not installed, see the [official Docker installation guide](https://docs.docker.com/engine/install) for your operating system.
In many cases running Docker's installation script is the easiest way to get started:

```bash
curl -sSL https://get.docker.com/ | sudo CHANNEL=stable bash
```

This should automatically install Docker Compose as well. If not, you can follow the [Docker Compose installation instructions](https://docs.docker.com/compose/install).
:::

## Option A: All-in-One (recommended for single-node setups)

The AIO image runs the Panel and Wings inside the same container. You do not need to install Wings separately or register a node manually; the bundled Wings is connected to the Panel automatically.

### 1. Download and Start the Stack

Pick the compose file that matches your needs. Each block downloads it, sets `APP_ENCRYPTION_KEY` to a random value, and starts the stack. Run it once: running it again replaces `compose.yml` and its encryption key. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

::: code-group

```bash [Basic AIO]
sudo mkdir calagopus-panel
cd calagopus-panel

sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.aio.yml
echo 'app_name: Calagopus' | sudo tee wings-config.yml > /dev/null
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
sudo sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml

sudo docker compose up -d
```

```bash [Heavy AIO for Extension Support]
sudo mkdir calagopus-panel
cd calagopus-panel

sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.heavy.aio.yml
echo 'app_name: Calagopus' | sudo tee wings-config.yml > /dev/null
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
sudo sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml

sudo docker compose up -d
```

:::

The **Basic AIO** compose uses the `:aio` image and is the right choice for most single-node installations.
The **Heavy AIO** compose uses the `:heavy-aio` image and adds the volume mounts needed to install [extensions](../extensions/index.md). Only pick it if you'll use extensions.

::: warning Keep the `wings-config.yml` line
The compose file mounts `./wings-config.yml` into the container as a file, and it has to exist **before the first `docker compose up`**. If it doesn't, Docker creates it as a **directory**, which breaks the container. The AIO container fills it on first startup.
:::

Once it's up, navigate to `http://<your-server-ip>:8000` in your web browser and you'll see the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

### 2. Change the Configuration (Optional)

The defaults work for most installs. To change something, edit the file with `sudo nano compose.yml` and run `sudo docker compose up -d` again.

To use a different tag than what your chosen compose file ships with (for example `:nightly-aio`, or `:nightly-heavy-aio` on the heavy stack), change the image tag on the `web` service. [See the Docker Image Variants section above](#docker-image-variants) for details on each.

For the other settings, review the environment variables on the `web` service. See the [Environment Configuration documentation](../environment.md) for details on each variable.

::: warning Switching between the AIO and Heavy AIO tracks needs more than the tag
`:heavy-aio` also needs four extra volume mounts for the build artifacts it produces. Without them the container refuses to start and tells you which path is missing. If you started on the Basic AIO compose and later want extensions, don't just retag - follow [Switching to the Heavy Image](../extensions/switching-to-the-heavy-image.md), which lists the mounts to add.
:::

## Option B: Standalone Panel (multi-node or split-host setups)

Use this option if you want the Panel on one host and Wings on one or more separate hosts.

### 1. Download and Start the Stack

Pick the compose file that matches your needs. Each block downloads it, sets `APP_ENCRYPTION_KEY` to a random value, and starts the Panel. Run it once: running it again replaces `compose.yml` and its encryption key. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

::: code-group

```bash [Basic]
sudo mkdir calagopus-panel
cd calagopus-panel

sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.yml
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
sudo sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml

sudo docker compose up -d
```

```bash [Basic with automatic Database Backups]
sudo mkdir calagopus-panel
cd calagopus-panel

sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.with-db-backups.yml
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
sudo sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml

sudo docker compose up -d
```

```bash [Heavy Image for Extension Support]
sudo mkdir calagopus-panel
cd calagopus-panel

sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.heavy.yml
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
sudo sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml

sudo docker compose up -d
```

:::

The **Basic** compose uses the `:latest` image and is the right choice for most standalone Panel installations.
The **Basic with automatic Database Backups** variant adds a small sidecar that periodically backs up the Postgres database.
The **Heavy** compose uses the `:heavy` image and includes the volume mounts needed to install [extensions](../extensions/index.md). Only pick it if you'll use extensions.

Once it's up, navigate to `http://<your-server-ip>:8000` in your web browser to see the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

### 2. Change the Configuration (Optional)

The defaults work for most installs. To change something, edit the file with `sudo nano compose.yml` and run `sudo docker compose up -d` again.

To use a different tag than what your chosen compose file ships with (for example `:nightly` or `:latest-pre`), change the image tag on the `web` service. [See the Docker Image Variants section above](#docker-image-variants) for details.

For the other settings, see the [Environment Configuration documentation](../environment.md).

::: warning
If you switch from a non-heavy variant to a heavy variant after the fact, you will also need to add the compose mounts required for extensions to work. See the [`compose.heavy.yml`](https://github.com/calagopus/panel/blob/main/compose.heavy.yml) file for reference.
:::

### 3. Install Wings

Since this is a split-host setup, you now need to install Wings on each node that will actually run game servers. Follow the [Wings Docker Installation](../../wings/installation/docker.md) guide on each node host.
