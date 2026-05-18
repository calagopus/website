---
prev: false
next: false
---

# Migrating from Pelican (Standalone)

This guide is for Pelican installs that run directly on the host - no Docker, no containers. If you're using Docker, head to the [Dockerized](./pelican-dockerized.md) guide instead.

The process involves installing Calagopus alongside your existing Pelican, pointing the importer at Pelican's `.env` file, and letting it read everything from Pelican's database and write equivalent records into Calagopus's fresh database. Users log in with the same credentials afterwards.

API keys do not migrate. See the [intro](./pelican.md) for the full reasoning - in short, the hashes are not compatible and the API is not either, so old keys would not work even if they were imported.

## Prerequisites

Before you start, you'll want:

- Your Pelican `.env` file accessible (you'll point the importer at it)
- Calagopus Panel installed but not yet configured - we need to land on the Out-of-Box Experience (OOBE) screen and stop there
- Access to the database Pelican is using (MySQL, MariaDB, or SQLite3)

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

## Supported Pelican Databases

The importer can read from any of these database backends:

- `mysql`
- `mariadb`
- `sqlite`
- `sqlite3`

The connection details come from Pelican's `.env` file - you don't need to type them in separately, just point the importer at the file with `--environment` and it figures the rest out.

### MySQL or MariaDB

Your Pelican `.env` should have entries like:

```bash
APP_URL=https://panel.example.com
APP_KEY=base64:...
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pelican
DB_USERNAME=pelican
DB_PASSWORD=secret
```

Nothing special to do here - the importer reads these directly.

### SQLite3

Your Pelican `.env` should have entries like:

```bash
APP_URL=https://panel.example.com
APP_KEY=base64:...
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

If `DB_DATABASE` is a relative path (the default), the importer resolves it relative to the location of the `.env` file you pass. So as long as your Pelican install hasn't been moved around, you don't need to do anything.

## Choose Your Calagopus Install Method

The exact import command depends on how Calagopus itself is installed. Pick the matching tab and follow along:

::::tabs
=== Docker

Make a working copy of Pelican's `.env` and edit `DB_HOST` to point at the host from inside the Calagopus container. The `web` service ships with `host.docker.internal` mapped to the host's gateway, so that's the value to use:

```bash
cp /var/www/pelican/.env /tmp/pelican.env
# Open /tmp/pelican.env in your editor and change:
#   DB_HOST=127.0.0.1   →   DB_HOST=host.docker.internal
```

If Pelican is using SQLite3, copy the database file into the container and update the `.env` accordingly:

```bash
docker compose cp /var/www/pelican/database/database.sqlite web:/database.sqlite
# Open /tmp/pelican.env in your editor and change:
#   DB_CONNECTION=sqlite
#   DB_DATABASE=/database.sqlite
```

Then copy `pelican.env` into the Calagopus container:

```bash
docker compose cp /tmp/pelican.env web:/.env
```

Now run the importer:

```bash
docker compose exec web calagopus-panel import pelican --environment /.env
```

The importer walks through users, servers, nodes, allocations, eggs, and so on. How long it takes depends on the amount of data - small installs finish in seconds, larger ones can take a few minutes. Progress is logged to stdout.

::: warning If the import errors out with a connection or auth error
If the importer fails immediately with something like *"Host 'X' is not allowed to connect"* or *"Access denied for user"*, you've hit MySQL/MariaDB's host-based access control. See [Allowing the Database User to Connect from Docker](#allowing-the-database-user-to-connect-from-docker) below.

If it fails partway through with a different error, treat the database as poisoned. Partial imports leave Calagopus in an inconsistent state. Drop the Postgres data (the steps in the OOBE warning callout above), let Calagopus recreate it empty, and re-run the import.
:::

When the import finishes, restart the stack:

```bash
docker compose down
docker compose up -d
```

Log in with your existing Pelican credentials.

#### Allowing the Database User to Connect from Docker

If you're only seeing this section because the import failed with a host or auth error: the cause is that Pelican's MySQL/MariaDB user is restricted to specific source hosts (typically `localhost` or `127.0.0.1`), and the Calagopus container connects from a *different* IP - the Docker bridge gateway. From MySQL's perspective, `pelican@'localhost'` and `pelican@'172.17.0.1'` are different users, and only the first one exists.

The fix is to grant the same user access from any host (`'%'`), run the import, then revoke that broad grant once you're done.

Connect to your MySQL/MariaDB server (substituting the actual user, password, and database name from Pelican's `.env`):

```bash
mysql -u root -p
```

Grant the user access from anywhere:

```sql
GRANT ALL PRIVILEGES ON pelican.* TO 'pelican'@'%' IDENTIFIED BY 'your-pelican-password';
FLUSH PRIVILEGES;
```

Then go back and re-run the import.

::: warning Revoke this after the migration
A grant from `'%'` lets the user connect from anywhere on any network the database is reachable on, which is far broader than you want for normal operation. Revert it as soon as the import finishes:

```sql
REVOKE ALL PRIVILEGES ON pelican.* FROM 'pelican'@'%';
DROP USER 'pelican'@'%';
FLUSH PRIVILEGES;
```

This leaves the original `pelican@'localhost'` (or wherever) untouched, so Pelican itself keeps working if you're keeping it running side-by-side. After Pelican is fully decommissioned, you can drop that user too.
:::

=== APT/RPM, Binary

Run the importer from the machine where Calagopus is installed. Assuming Pelican is at `/var/www/pelican`:

```bash
calagopus-panel import pelican --environment /var/www/pelican/.env
```

The importer walks through users, servers, nodes, allocations, eggs, and so on. How long it takes depends on the amount of data - small installs finish in seconds, larger ones can take a few minutes. Progress is logged to stdout.

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

Log in with your existing Pelican credentials.
::::

## What's Next

Wings also needs to be updated to point at the new panel. See [Wings - Updating](../../wings/updating.md) for that step.

After the migration, regenerate any API keys used by external scripts. The old Pelican keys will not work, and the Calagopus API differs from Pelican's, so those integrations will need to be updated regardless.
