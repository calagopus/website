---
prev: false
next: false
---

# Migrating from Pterodactyl (Standalone)

This guide is for Pterodactyl installs that run directly on the host - no Docker, no containers, just a typical install at `/var/www/pterodactyl` or similar. If you're using Docker, head to the [Dockerized](./pterodactyl-dockerized.md) guide instead.

The plan: install Calagopus alongside your existing Pterodactyl, point the importer at Pterodactyl's `.env` file, let it read everything from Pterodactyl's database, and write equivalent records into Calagopus's fresh database. Your users log in with the same credentials afterwards.

A reminder of what doesn't migrate: API keys. See the [intro](./pterodactyl.md) for the full reasoning - the short version is that the hashes aren't compatible and the API isn't either, so old keys wouldn't work even if we did import them.

## Prerequisites

Before you start, you'll want:

- Your Pterodactyl `.env` file accessible (you'll point the importer at it)
- Calagopus Panel installed but not yet configured - we need to land on the Out-of-Box Experience (OOBE) screen and stop there

## Install Calagopus First

If you haven't installed Calagopus yet, follow the [installation guide](../../panel/installation.md) to get it running. Once you reach the OOBE screen, **stop**. Don't click through it. Don't create the admin user. Just leave it on that screen and come back here.

::: warning Don't click through the OOBE
The importer needs an empty Calagopus database to write into. The OOBE creates initial records (admin user, default settings) that would conflict with what the importer wants to do.

![Calagopus Panel OOBE](../../panel/oobe.webp)

::: details I already clicked through - how do I undo it?
You'll need to drop and recreate the database. Pick the matching tab for how Calagopus is installed:

::::tabs
=== Docker
Head to the directory with your Calagopus compose file and stop the stack:
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

The exact import command depends on how Calagopus itself is installed. Pick the matching tab and follow along:

::::tabs
=== Docker

Copy Pterodactyl's `.env` file into the Calagopus container. Assuming Pterodactyl is at `/var/www/pterodactyl`:

```bash
docker compose cp /var/www/pterodactyl/.env web:/.env
```

Then run the importer:

```bash
docker compose exec web calagopus-panel import pterodactyl --environment /.env
```

This walks through users, servers, nodes, allocations, eggs, and so on. Larger Pterodactyl installs take longer; small ones finish in seconds. Progress is logged to stdout.

::: warning If the import errors out
Treat the database as poisoned. Partial imports leave Calagopus in an inconsistent state. Drop the Postgres data (the steps in the OOBE warning callout above), let Calagopus recreate it empty, and re-run the import.
:::

When the import finishes, restart the stack:

```bash
docker compose down
docker compose up -d
```

Log in with your existing Pterodactyl credentials.

=== APT/RPM, Binary

Head to the directory containing your Calagopus `.env` (defaults to `/etc/calagopus` on Linux):

```bash
cd /etc/calagopus
```

Run the importer pointing at Pterodactyl's `.env`. If Pterodactyl is at the default location of `/var/www/pterodactyl`, the importer finds it without needing the `--environment` flag:

```bash
calagopus-panel import pterodactyl
```

If Pterodactyl is somewhere else, point the importer at its `.env` explicitly:

```bash
calagopus-panel import pterodactyl --environment /path/to/pterodactyl/.env
```

This walks through users, servers, nodes, allocations, eggs, and so on. Larger Pterodactyl installs take longer; small ones finish in seconds. Progress is logged to stdout.

::: warning If the import errors out
Treat the database as poisoned. Partial imports leave Calagopus in an inconsistent state. Drop the Postgres database (the steps in the OOBE warning callout above), recreate it, and re-run.
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

Don't forget the node side. Calagopus uses Wings as its node agent, but it needs to be pointed at the new panel rather than the old one. See [Wings - Updating](../../wings/updating.md) for the swap.

After that, regenerate any API keys your external scripts were using. The old Pterodactyl keys won't work and the API itself is different anyway, so you're rewriting those scripts regardless.
