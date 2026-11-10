---
title: Migrating to Standalone
description: Move an existing Calagopus Docker Compose installation to a standalone binary install without losing users, servers, or configuration.
---

# Migrating to Standalone

This guide covers migrating an existing Calagopus Docker Compose installation to a standalone binary install without losing your users, servers, or configuration. You copy your encryption key, then move the PostgreSQL database from Docker into the host's PostgreSQL. No data transformation is required, the schema is identical between installations.

::: info This guide assumes
- You are currently running the standard Docker Compose setup
- You are installing the standard standalone version of Calagopus

If your setup has been modified (for example, external databases or custom container configurations), you may need to adjust the steps accordingly.
:::

## Before You Start

Make sure you have:

- A running Calagopus Docker Compose installation
- Access to your `compose.yml` file
- Calagopus installed on the target host by following the [binary installation guide](../../../panel/installation/binary.md), including PostgreSQL, Valkey, and the service, stopped at the OOBE screen

You don't need to click through the OOBE. If you did, that's fine: the steps below replace the database either way.

## Export the Database from Docker

Run this from the directory containing your `compose.yml`. It dumps the database to `./panel.backup`, prints your encryption key, and stops the stack. Run `sudo -v` first so a password prompt doesn't swallow the rest of the pasted block.

```bash
sudo docker compose exec db pg_dump -U panel -d panel -F c -f /tmp/panel.backup
sudo docker compose cp db:/tmp/panel.backup ./panel.backup
sudo chown "$(id -un)" panel.backup
sudo chmod 600 panel.backup
sudo grep APP_ENCRYPTION_KEY compose.yml
sudo docker compose down
```

::: warning
The `APP_ENCRYPTION_KEY` must be copied exactly as-is. It is used to decrypt sensitive data stored in your database. If it is wrong or missing, that data cannot be recovered. Keep your `compose.yml` until you've verified the migration.
:::

Moving to a different host? Copy `panel.backup` to the target machine before continuing.

## Import the Database into the Host PostgreSQL

From the directory with `panel.backup`, replace `YOUR_ENCRYPTION_KEY` with the key printed above and run this. It stops the panel, sets the key in `/etc/calagopus/.env`, replaces the database with your dump, and starts the panel again:

```bash
sudo systemctl stop calagopus-panel
sudo sed -i 's/^APP_ENCRYPTION_KEY=.*/APP_ENCRYPTION_KEY="YOUR_ENCRYPTION_KEY"/' /etc/calagopus/.env

sudo -u postgres psql <<'SQL'
DROP DATABASE IF EXISTS panel WITH (FORCE);
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
SQL
sudo -u postgres pg_restore -d panel --role=calagopus --no-owner --clean --if-exists < panel.backup

sudo systemctl start calagopus-panel
```

You may see some harmless notices about dropping objects that don't exist yet. That's normal. The restore is successful as long as the command exits without errors.

The panel runs any pending database migrations automatically on first boot.

## Verify the Migration

Open Calagopus in your browser and check:

- You can log in with your existing credentials
- Your servers are visible and intact
- No setup wizard (OOBE) appears (if it does, the database import likely did not work, see below)
- Wings nodes are still connected

Then delete `panel.backup`, or store it somewhere safe. It holds everything in your database.

## Troubleshooting

::: details Setup wizard (OOBE) appears after starting
The database was not imported correctly. Run the import block again and check its output for errors.
:::

::: details Login fails, or encrypted data appears corrupted
The `APP_ENCRYPTION_KEY` in `/etc/calagopus/.env` does not match the one from your Docker installation. Stop the panel, correct the key, and start it again.
:::
