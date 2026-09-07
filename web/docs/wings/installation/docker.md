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

::: warning Every data directory needs a volume
Wings maps the directories from `config/config.yml` to their host paths by inspecting its own container, so the host side of a volume can be anywhere. Every directory Wings uses still has to be covered by a volume, though: if you split `/var/lib/calagopus-wings` across several mounts, make sure `volumes`, `diffs`, `vmounts`, `archives` and `backups` are all still inside one of them, or Wings refuses to start.
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

## Troubleshooting

**`failed to load config from /etc/calagopus-wings/config.yml: ... No such file or directory`.** The `config/` directory exists, Docker created it on first start, but `config/config.yml` was never written. Stop the container, write the file with the configuration from the panel as described above, and start again. If you changed the compose file to bind-mount the config file itself rather than the `config/` directory, you can also see `Is a directory (os error 21)`, because Docker created a directory at the file's path. Delete it and write the real file.

**`failed to load SSL certificate and key ... No such file or directory`.** The certificate lives on the host but isn't mounted into the container. Add the certificate directory to the `wings` service and recreate it:

```yaml
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

**The panel can't connect even though Wings logs look fine.** Compare three numbers: `api.port` in `config/config.yml`, the container side of the `ports:` mapping in `compose.yml`, and the port in the node URL on the panel. They must agree, or the host port must map to `api.port`. A compose line of `7777:8080` with a node URL ending in `:8080` connects to nothing.

**`localhost` doesn't work in `remote:`.** Inside the container `localhost` is the container. When the panel runs on the same host, use the host's LAN IP, or `network_mode: host` on the `wings` service.

**`system.data_directory '...' is not covered by any mount of the wings container` at startup.** A directory from `config/config.yml` isn't inside any volume of the `wings` service. Add a volume for it, see the warning above. `bind source path does not exist` during a server install means the same thing on Wings older than 1.1.0, which didn't translate paths yet. Update Wings.

**`Permission denied (os error 13)` on the config or data directory.** `docker compose up` was run as different users at different times. Run it consistently as one user and fix the ownership of the directory.

**A config edit isn't picked up.** `docker compose up -d` doesn't restart a container whose definition hasn't changed. Run `docker compose restart wings` after editing `config/config.yml`.

Other node problems, such as the panel and the browser reaching Wings on different URLs, are collected on the [Troubleshooting](../../additional/troubleshooting.md#the-panel-can-t-reach-the-node) page.

## Next Steps

With Wings running, the next step is to set up allocations - the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
