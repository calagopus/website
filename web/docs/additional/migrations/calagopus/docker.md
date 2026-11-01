---
title: Migrating to Docker Compose
description: Move an existing standalone Calagopus installation into Docker Compose without losing users, servers, or configuration.
---

# Migrating to Docker Compose

This guide covers migrating an existing Calagopus standalone installation into Docker without losing your users, servers, or configuration. You copy your encryption key, then move your PostgreSQL database into the new Docker-managed one. No data transformation is required, the schema is identical between installations.

::: info
This guide covers the standalone panel compose setup only. If you want to migrate to an All-in-One setup instead, follow the [Docker installation guide](../../../panel/installation/docker.md) first, then return here for the database migration steps.
:::

::: info This guide assumes
- You're using the standard standalone installation
- Your database is running locally (default setup)
- You're moving to the standard Docker Compose setup

If your setup differs significantly (custom database hosts, unusual configurations), you may need to adapt some steps.
:::

## Before You Start

Make sure you have:

- A working standalone Calagopus installation
- Docker and Docker Compose installed on the target host
- Access to `/etc/calagopus/.env` on your standalone system
- `pg_dump` available on your standalone system (it should already be there if PostgreSQL is installed)

::: warning
The `APP_ENCRYPTION_KEY` must be copied exactly as-is. It is used to decrypt sensitive data stored in your database. If it is wrong or missing, that data cannot be recovered. Back up `/etc/calagopus/.env` and your database before you start.
:::

## Import the Database into Docker

Pick the tab that matches where the Docker install will live. Run `sudo -v` first so a password prompt doesn't swallow the rest of the pasted block.

::::tabs
=== Same Machine

This stops the old panel so nothing changes during the move and port `8000` is free, sets up `/opt/calagopus` with the standard Compose file and your existing encryption key, moves the database, and starts the stack:

```bash
sudo systemctl disable --now calagopus-panel

sudo mkdir -p /opt/calagopus
cd /opt/calagopus
sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.yml
KEY=$(sudo grep '^APP_ENCRYPTION_KEY=' /etc/calagopus/.env | cut -d= -f2- | tr -d '"')
sudo sed -i -e "s/CHANGEME/$KEY/g" compose.yml

sudo -u postgres pg_dump -F c panel | sudo tee panel.backup > /dev/null

sudo docker compose up -d db cache
until sudo docker compose exec -T db pg_isready -U panel -d panel; do sleep 2; done
sudo docker compose exec -T db pg_restore -U panel -d panel --no-owner --clean --if-exists < panel.backup

sudo docker compose up -d
sudo docker compose ps
```

=== Another Machine

On your **standalone system**, stop the panel, dump the database, and print the encryption key:

```bash
sudo systemctl disable --now calagopus-panel
sudo -u postgres pg_dump -F c panel | sudo tee /tmp/panel.backup > /dev/null
sudo grep '^APP_ENCRYPTION_KEY=' /etc/calagopus/.env
```

Copy `/tmp/panel.backup` to the target machine, into your home directory for example. Then on the **target machine**, from the directory with `panel.backup`, replace `YOUR_ENCRYPTION_KEY` and run:

```bash
KEY=YOUR_ENCRYPTION_KEY

sudo mkdir -p /opt/calagopus
sudo mv panel.backup /opt/calagopus/
cd /opt/calagopus
sudo curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.yml
sudo sed -i -e "s/CHANGEME/$KEY/g" compose.yml

sudo docker compose up -d db cache
until sudo docker compose exec -T db pg_isready -U panel -d panel; do sleep 2; done
sudo docker compose exec -T db pg_restore -U panel -d panel --no-owner --clean --if-exists < panel.backup

sudo docker compose up -d
sudo docker compose ps
```

::::

You may see some harmless notices about dropping objects that don't exist yet; that's normal. The restore is successful as long as the command exits without errors.

The web container runs any pending database migrations automatically on first boot (`DATABASE_MIGRATE=true`).

## Verify the Migration

Once the stack is up, open Calagopus in your browser and check:

- You can log in with your existing credentials
- Your servers are visible and intact
- No setup wizard (OOBE) appears (if it does, the database import likely did not work; see below)
- Wings nodes are still connected

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Setup wizard (OOBE) appears after starting | The database was not imported correctly, or the wrong database was targeted. Run the `pg_restore` line again from `/opt/calagopus`, then restart with `sudo docker compose restart web`. |
| Login fails, or encrypted data appears corrupted | `APP_ENCRYPTION_KEY` in `compose.yml` probably doesn't match the one from your original installation. Correct the key and run `sudo docker compose up -d` again. |
