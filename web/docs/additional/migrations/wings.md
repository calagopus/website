---
title: Migrating Wings Nodes
description: Replace Pterodactyl or Pelican Wings with Calagopus Wings on an existing node, keeping its config, server data and running game servers.
---

# Migrating Wings Nodes

Nodes that already run Pterodactyl or Pelican Wings don't need a fresh install. You replace Wings itself and point it at the new panel. Everything else stays where it is. The [Wings installation guide](../../wings/installation/index.md) is only for new nodes.

| Stays the same | Changes |
| --- | --- |
| Config file. Wings finds `/etc/pterodactyl/config.yml` and `/etc/pelican/config.yml` on its own | The Wings binary or Docker image |
| Server files and local backups, at the paths in that config | The service file, on a binary install |
| The node's UUID and token, which the importer copies to the Panel | `remote:` in the config, if the panel's address changed |
| The `pterodactyl` or `pelican` system user and Docker network | |

## Before You Start

Migrate the panel first, using the [Pterodactyl](./pterodactyl.md) or [Pelican](./pelican.md) guide, so the node exists on the new panel when Wings connects.

Start with one node, and check it before moving on to the rest.

::: info What restarts?
Game server containers run independently of Wings and normally keep running while it restarts. Console connections, server controls and SFTP are interrupted until Wings is back.
:::

## Replace Wings

Pick the tab matching how the node runs Wings today. In both, replace `https://panel.example.com` with your Calagopus panel's address, or leave out the `sed` line if the address didn't change. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

:::::tabs
=== Binary

This stops Wings, keeps a copy of the old binary, config and service file, installs Calagopus Wings, points it at the new panel, replaces the service file, and starts it:

::: code-group
```bash [Pterodactyl]
sudo systemctl stop wings
sudo cp -a /usr/local/bin/wings /usr/local/bin/wings.bak
sudo cp -a /etc/pterodactyl/config.yml /etc/pterodactyl/config.yml.bak
sudo cp -a /etc/systemd/system/wings.service /etc/systemd/system/wings.service.bak

sudo curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
sudo chmod +x /usr/local/bin/wings
sudo /usr/local/bin/wings version

sudo sed -i 's|^remote: .*|remote: https://panel.example.com|' /etc/pterodactyl/config.yml
sudo /usr/local/bin/wings service-install --override
sudo systemctl status wings --no-pager
sudo journalctl -u wings -n 50 --no-pager
```
```bash [Pelican]
sudo systemctl stop wings
sudo cp -a /usr/local/bin/wings /usr/local/bin/wings.bak
sudo cp -a /etc/pelican/config.yml /etc/pelican/config.yml.bak
sudo cp -a /etc/systemd/system/wings.service /etc/systemd/system/wings.service.bak

sudo curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
sudo chmod +x /usr/local/bin/wings
sudo /usr/local/bin/wings version

sudo sed -i 's|^remote: .*|remote: https://panel.example.com|' /etc/pelican/config.yml
sudo /usr/local/bin/wings service-install --override
sudo systemctl status wings --no-pager
sudo journalctl -u wings -n 50 --no-pager
```
:::

`--override` matters: the old service file describes itself as Pterodactyl or Pelican Wings, and `service-install` refuses to replace an existing one without it.

=== Docker

Go to the directory with your Wings Compose file and keep a copy of it and the config. Then change three things in the file:

```diff
 services:
   wings:
-    image: ghcr.io/pterodactyl/wings:latest
+    image: calagopus/wings:latest
+    pid: host
+    cgroup: host
     volumes:
-      - "/etc/ssl/certs:/etc/ssl/certs:ro"
```

- **`image`** is `ghcr.io/pelican/wings:latest` on a Pelican node, and changes the same way.
- **`pid` and `cgroup`** let Wings reach server containers for bandwidth limits, resource stats and CFS burst.
- **`/etc/ssl/certs`** has to go, because mounting over that path causes certificate problems inside the container. If your SSL files are in there, move them to `/etc/ssl/certs/wings/` as described in [Securing Wings with SSL](../../wings/next-steps/ssl.md#enable-ssl-in-wings), and mount that folder instead.

Leave the other volumes and the `WINGS_USERNAME` as they are. Wings still needs every directory in its config to be covered by a volume, or it refuses to start.

Point the config at the new panel, then pull the image and recreate the container:

::: code-group
```bash [Pterodactyl]
sudo cp -a /etc/pterodactyl/config.yml /etc/pterodactyl/config.yml.bak
sudo sed -i 's|^remote: .*|remote: https://panel.example.com|' /etc/pterodactyl/config.yml

sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail 50 wings
```
```bash [Pelican]
sudo cp -a /etc/pelican/config.yml /etc/pelican/config.yml.bak
sudo sed -i 's|^remote: .*|remote: https://panel.example.com|' /etc/pelican/config.yml

sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail 50 wings
```
:::

:::::

## Check the Node

1. In the panel, open **Admin → Nodes → (your node) → Overview**. It should show a Wings version number.
2. Open a server's console and confirm it connects.
3. Read the logs from the block above for a warning about `docker.network.mode`. If there is one, fix it as described under [Troubleshooting](#troubleshooting) before starting any servers.

From now on, follow [Updating Wings](../../wings/updating.md) to update the node.

::: details Undo the change
If the old panel is still running, you can put the old Wings back. On a binary install, with the path for your panel:

```bash
sudo systemctl stop wings
sudo mv /usr/local/bin/wings.bak /usr/local/bin/wings
sudo mv /etc/pterodactyl/config.yml.bak /etc/pterodactyl/config.yml
sudo mv /etc/systemd/system/wings.service.bak /etc/systemd/system/wings.service
sudo systemctl daemon-reload
sudo systemctl start wings
```

On Docker, restore your copy of the Compose file and the config, then run `sudo docker compose up -d`.
:::

::: details Move the config to the Calagopus path
The old path keeps working, so this is optional. On a binary install, with the path for your panel:

```bash
sudo mkdir -p /etc/calagopus-wings
sudo mv /etc/pterodactyl/config.yml /etc/calagopus-wings/config.yml
sudo systemctl restart wings
```

The server data stays at the paths in the config, so nothing else moves.
:::

## Troubleshooting

::: details Servers fail with `network calagopus_nw not found`, or Wings warns about `docker.network.mode` at boot
The config keeps `docker.network.name: pterodactyl_nw` (or `pelican_nw`), but picked up the new default for `mode`. Set `docker.network.mode` to the same value as `name`, then restart Wings.
:::

::: details The log shows `github.com/pterodactyl/wings` in a stack trace, or the node stays offline
The old Wings is still what runs. Check `wings version`, and that the service file was replaced.
:::

::: details A JSON parse error naming a missing field such as `oom_disabled`, or `retry attempt N failed ... missing field`
`remote:` still points at the old panel. Set it to the new panel's address and restart Wings.
:::

::: details `service file already exists`
You left out `--override`. Run it again with it:

```bash
sudo wings service-install --override
```
:::

::: details `Start request repeated too quickly`, and the unit says "Pterodactyl Wings Daemon"
The old service file is still in place. Replace it:

```bash
sudo wings service-install --override
```
:::

::: details `address already in use` on port `8080` or `2022`
Another copy of Wings holds the port, usually the old one. Find it and stop it:

```bash
sudo ss -tlnp | grep 8080
```
:::

::: details `system.data_directory '...' is not covered by any mount of the wings container`
A directory from the config isn't inside any volume of the `wings` service. Add a volume for it.
:::

More node problems are on the general [Troubleshooting](../troubleshooting.md#the-panel-can-t-reach-the-node) page.
