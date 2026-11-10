---
prev: false
next: false
description: Step-by-step guide to migrating a standalone Pterodactyl install to Calagopus with the built-in importer, keeping users, servers, nodes and eggs.
---

# Migrating from Pterodactyl (Standalone)

This guide is for Pterodactyl installs running directly on the host, no Docker, no containers, typically at `/var/www/pterodactyl`. If you're using Docker, use the [Dockerized](./docker.md) guide instead.

You'll install Calagopus alongside your existing Pterodactyl, then point the importer at Pterodactyl's `.env` file. It reads everything from Pterodactyl's database and writes matching records into Calagopus's fresh database. Users log in afterward with the same credentials they already have.

API keys do not migrate. The hashes aren't compatible, and neither is the API, so old keys wouldn't work even if they were imported. See the [intro](../pterodactyl.md) for the full reasoning.

## Prerequisites

Before you start, you'll want:

- Your Pterodactyl `.env` file accessible. You'll point the importer at it.
- Calagopus Panel installed but not yet configured. Stop at the Out-of-Box Experience (OOBE) screen.

## Install Calagopus First

If you haven't installed Calagopus yet, follow the [installation guide](../../../panel/installation/index.md). Once you reach the OOBE screen, **stop**. Don't click through it, don't create the admin user. Just leave it there and come back here.

::: warning Don't click through the OOBE
This guide uses a fresh Calagopus database. By default, the importer refuses a target that already has users, nodes, servers, nests, or locations. If you already completed the OOBE and need to keep its data, review [`--force`](../pterodactyl.md#import-options) and run a dry run against the occupied target first.

![Calagopus Panel OOBE](../../../panel/oobe.webp)

::: details Resetting a disposable target
Only use these steps if you want to discard everything in the Calagopus database and start fresh. They are not needed after a failed import that reports a rollback. Pick the tab that matches how Calagopus is installed:

::::tabs
=== Docker
Go to the directory with your Calagopus compose file and stop the stack:

```bash
docker compose down
```

Delete the Postgres data directory:

```bash
# This wipes the Calagopus database. Don't run this if you have data you care about.
rm -r postgres
```

Start Calagopus back up:

```bash
docker compose up -d
```

=== APT/RPM, Binary
Stop Calagopus first:

```bash
# Linux
systemctl stop calagopus-panel

# Windows
nssm stop "Calagopus Panel"
```

Connect to Postgres and recreate the database:

```bash
# Linux/MacOS
sudo -u postgres psql

# Windows: see the binary install guide for psql access
# https://calagopus.com/docs/panel/installation/binary#database-configuration
```

```sql
DROP DATABASE panel WITH (FORCE);
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
\q
```

Start Calagopus back up:

```bash
# Linux
systemctl start calagopus-panel

# Windows
nssm start "Calagopus Panel"
```

::::

## Choose Your Calagopus Install Method

The import command depends on how Calagopus itself is installed. Pick the matching tab:

::::tabs
=== Docker

Make a working copy of Pterodactyl's `.env` and point `DB_HOST` at the host machine, since the importer runs inside the Calagopus container. The `web` service maps `host.docker.internal` to the host's gateway, so use that:

```bash
cp /var/www/pterodactyl/.env /tmp/pterodactyl.env
```

Open `/tmp/pterodactyl.env` and change:

```txt
DB_HOST=127.0.0.1
```

to

```txt
DB_HOST=host.docker.internal
```

Copy it into the Calagopus container:

```bash
docker compose cp /tmp/pterodactyl.env web:/.env
```

First validate without importing records:

```bash
docker compose exec web calagopus-panel import pterodactyl --environment /.env --dry-run --on-invalid=abort --report /tmp/pterodactyl-import-report.json
```

Read the reported problems before continuing. With Docker, the report is inside the `web` container; copy it out with `docker compose cp web:/tmp/pterodactyl-import-report.json ./pterodactyl-import-report.json` if needed. Review the [import options](../pterodactyl.md#import-options) to choose fixes or skipped rows. Then run the import interactively:

```bash
docker compose exec web calagopus-panel import pterodactyl --environment /.env
```

This walks through users, servers, nodes, allocations, eggs, and everything else. Small installs finish in seconds, larger ones take longer. The terminal shows validation findings and the planned record counts before the import writes data.

::: warning If the import errors out with a connection or auth error
If it fails immediately with something like _"Host 'X' is not allowed to connect"_ or _"Access denied for user"_, that's MySQL/MariaDB's host-based access control blocking the connection. See [Allowing the Database User to Connect from Docker](#allowing-the-database-user-to-connect-from-docker) below.

Validation errors stop the import before it writes data. If the write phase fails, the importer rolls back the imported records; fix the reported problem and retry. If it says the data was imported but Panel settings could not be saved, keep the imported data and set the URL, name, and mail settings in the admin area. Do not rerun a successful data import just to repair settings.
:::

When the import finishes, restart the stack:

```bash
docker compose down
docker compose up -d
```

Log in with your existing Pterodactyl credentials.

#### Allowing the Database User to Connect from Docker

Only read this if the import failed with a host or auth error. The cause: Pterodactyl's MySQL/MariaDB user is restricted to specific source hosts, usually `localhost` or `127.0.0.1`, but the Calagopus container connects from a different IP, the Docker bridge gateway. To MySQL, `pterodactyl@'localhost'` and `pterodactyl@'172.17.0.1'` are different users, and only the first one exists.

The fix is to grant that user access from any host (`'%'`), run the import, then revoke the grant once you're done.

Connect to your MySQL/MariaDB server (use the real user, password, and database name from Pterodactyl's `.env`):

```bash
mysql -u root -p
```

Grant access from anywhere:

```sql
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'%' IDENTIFIED BY 'your-pterodactyl-password';
FLUSH PRIVILEGES;
```

Then re-run the import.

::: warning Revoke this after the migration
A grant from `'%'` lets the user connect from anywhere the database is reachable, which is far more access than you want long-term. Revoke it as soon as the import finishes:

```sql
REVOKE ALL PRIVILEGES ON panel.* FROM 'pterodactyl'@'%';
DROP USER 'pterodactyl'@'%';
FLUSH PRIVILEGES;
```

This leaves the original `pterodactyl@'localhost'` (or wherever) untouched, so Pterodactyl keeps working if you're running it alongside Calagopus for now. Once Pterodactyl is fully decommissioned, you can drop that user too.
:::

=== APT/RPM, Binary

Go to the directory with your Calagopus `.env` (defaults to `/etc/calagopus` on Linux):

```bash
cd /etc/calagopus
```

Point the importer at Pterodactyl's `.env`, normally `/var/www/pterodactyl/.env`, and validate without importing records:

```bash
calagopus-panel import pterodactyl --environment /var/www/pterodactyl/.env --dry-run --on-invalid=abort --report /tmp/pterodactyl-import-report.json
```

Read the reported problems before continuing. Review the [import options](../pterodactyl.md#import-options) to choose fixes or skipped rows. Then run the import interactively:

```bash
calagopus-panel import pterodactyl --environment /var/www/pterodactyl/.env
```

If Pterodactyl is somewhere else, replace `/var/www/pterodactyl/.env` with the correct path in both commands.

This walks through users, servers, nodes, allocations, eggs, and everything else. Small installs finish in seconds, larger ones take longer. The terminal shows validation findings and the planned record counts before the import writes data.

::: warning If the import errors out
Validation errors stop the import before it writes data. If the write phase fails, the importer rolls back the imported records; fix the reported problem and retry. If it says the data was imported but Panel settings could not be saved, keep the imported data and set the URL, name, and mail settings in the admin area. Do not rerun a successful data import just to repair settings.
:::

When the import finishes, restart Calagopus:

```bash
# Linux
systemctl restart calagopus-panel

# Windows
nssm restart "Calagopus Panel"
```

Log in with your existing Pterodactyl credentials.
::::

## What's Next

Wings also needs to point at the new panel. See [Updating Wings](../../../wings/updating.md) for that step.

After migrating, regenerate any API keys used by external scripts. The old Pterodactyl keys won't work, and the Calagopus API differs from Pterodactyl's, so those integrations need updating regardless.
