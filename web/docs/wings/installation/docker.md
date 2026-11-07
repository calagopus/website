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
Podman is supported as an alternative to Docker. If you'd prefer to use Podman, install Wings via the [Docker](./docker.md#configure-wings), [Binary](./binary.md#configure-wings), or [Package Manager](./pkgmanager.md) method and follow the [Running Wings with Podman](../advanced/running-wings-with-podman.md) guide. The Docker Compose method requires Docker.
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

```bash
sudo mkdir calagopus-wings
cd calagopus-wings

sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/wings/refs/heads/main/compose.local.yml
sudo mkdir -p config
```

## Change the Image Variant (Optional)

The compose file uses `:latest` by default. To switch variants, open `compose.yml` and change the image tag on the `wings` service.

::: details Example: switching to `:nightly` via sed
```bash
sudo sed -i -e "s/calagopus\/wings:latest/calagopus\/wings:nightly/g" compose.yml
```
:::


## Configure Wings

For a fresh installation, leave the `config` directory empty and continue to [Start Wings](#start-wings). Wings waits for pairing and prints a code in its logs. In the Panel, use [Pair a Waiting Node](../next-steps/configure-node.md#pair-a-waiting-node) to connect it.

### Automatic Enrollment

If you have already created the node entry, generate an enrollment command from its **Configuration** tab. Put its Panel URL and code in the `environment` block of your existing `wings` service before the first start:

```yaml
environment:
  WINGS_ENROLL_PANEL_URL: "https://panel.example.com"
  WINGS_ENROLL_CODE: "CODE_FROM_PANEL"
```

The code expires after 30 minutes and can be used once. These variables are read only when no configuration file exists. Wings saves the resulting configuration in `config/config.yml` and starts normally; if enrollment fails, it logs the error and waits for pairing instead. Remove the enrollment variables from Compose after success. Keep the `config/` volume so restarts retain the node identity.

For other first-start settings, use [environment overrides](../configuration.md#environment-overrides), for example `CALAGOPUS_API_PORT: "8080"`. Match the container side of any port mapping to that listener port. Automatic enrollment preserves local API/SFTP listener ports.

### Manual Configuration

You can still copy the generated YAML from **Admin → Nodes → (your node) → Configuration** into `config/config.yml` before starting Wings:

```bash
sudo nano config/config.yml
```

Existing installations keep using their saved file. Do not remove a working configuration to force pairing.

::: warning Every data directory needs a volume
Wings maps the directories from `config/config.yml` to their host paths by inspecting its own container, so the host side of a volume can be anywhere. Every directory Wings uses still has to be covered by a volume, though: if you split `/var/lib/calagopus-wings` across several mounts, make sure `volumes`, `diffs`, `vmounts`, `archives` and `backups` are all still inside one of them, or Wings refuses to start.
:::

## Start Wings

This pulls the image, starts Wings in detached mode and follows its logs. Press `Ctrl+C` to stop following them, Wings keeps running. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

```bash
sudo docker compose up -d
sudo docker compose logs -f wings
```

A fresh installation waits for pairing and prints its code here; an enrolled or manually configured installation connects to the Panel.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `failed to load config from /etc/calagopus-wings/config.yml: ... No such file or directory` | On current Wings, a missing config normally starts pairing mode. This error can indicate an older build or `--no-setup`; update Wings or write the file manually as described above. If you changed the compose file to bind-mount the config file itself rather than the `config/` directory, you can also see `Is a directory (os error 21)`, because Docker created a directory at the file's path; delete it and write the real file. |
| `failed to load SSL certificate and key ... No such file or directory` | The certificate lives on the host but isn't mounted into the container. Copy it into `/etc/ssl/certs/wings/` as described in the Docker tab of [Securing Wings with SSL](../next-steps/ssl.md#enable-ssl-in-wings), or add `- /etc/letsencrypt:/etc/letsencrypt:ro` under the `wings` service's `volumes:` and recreate it. |
| The panel can't connect even though Wings logs look fine | Compare three numbers: `api.port` in `config/config.yml`, the container side of the `ports:` mapping in `compose.yml`, and the port in the node URL on the panel. They must agree, or the host port must map to `api.port`. A compose line of `7777:8080` with a node URL ending in `:8080` connects to nothing. |
| `localhost` doesn't work in `remote:` | Inside the container `localhost` is the container. When the panel runs on the same host, use the host's LAN IP, or `network_mode: host` on the `wings` service. |
| `system.data_directory '...' is not covered by any mount of the wings container` at startup | A directory from `config/config.yml` isn't inside any volume of the `wings` service. Add a volume for it, see the warning above. `bind source path does not exist` during a server install means the same thing on Wings older than 1.1.0, which didn't translate paths yet; update Wings. |
| `Permission denied (os error 13)` on the config or data directory | `docker compose up` was run as different users at different times. Run it consistently as one user and fix the ownership of the directory. |
| A config edit isn't picked up | `sudo docker compose up -d` doesn't restart a container whose definition hasn't changed. Run `sudo docker compose restart wings` after editing `config/config.yml`. |

Other node problems, such as the panel and the browser reaching Wings on different URLs, are collected on the [Troubleshooting](../../additional/troubleshooting.md#the-panel-can-t-reach-the-node) page.

## Next Steps

With Wings running, the next step is to set up allocations, the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
