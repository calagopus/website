---
prev: false
next: false
description: Step-by-step guide to migrating a standalone (non-Docker) Pelican Panel install to Calagopus with the built-in importer, keeping users, servers and nodes.
---

# Migrating from Pelican (Standalone)

This guide is for Pelican installs running directly on the host, no Docker, no containers. If you're using Docker, use the [Dockerized](./docker.md) guide instead.

You'll install Calagopus alongside your existing Pelican, then point the importer at Pelican's `.env` file. It reads everything from Pelican's database and writes matching records into Calagopus's fresh database. Users log in afterward with the same credentials they already have.

API keys do not migrate. The hashes aren't compatible, and neither is the API, so old keys wouldn't work even if they were imported. See the [intro](../pelican.md) for the full reasoning.

## Before You Start

You need access to Pelican's `.env` file and to the database it uses, and Calagopus installed on the same machine. If you haven't installed Calagopus yet, follow the [installation guide](../../../panel/installation/index.md). Once you reach the Out-of-Box Experience (OOBE) screen, **stop**. Don't click through it, don't create the admin user.

::: warning Don't click through the OOBE
This guide uses a fresh Calagopus database. By default, the importer refuses a target that already has users, nodes, servers, nests, or locations. If you already completed the OOBE, either [reset the database](../index.md#resetting-the-calagopus-database), or if you need to keep its data, review [`--force`](../pelican.md#import-options) and run a dry run against the occupied target first.

![Calagopus Panel OOBE](../../../panel/oobe.webp)
:::

## Supported Pelican Databases

The importer can read `mysql`, `mariadb`, `sqlite`, `sqlite3`, `pgsql`, `postgres` and `postgresql` databases. The connection details come from Pelican's `.env`, along with `APP_URL` and `APP_KEY`, so you don't need to type them in separately.

If `DB_DATABASE` is a relative SQLite path (the default), the importer resolves it relative to the `.env` file you pass. As long as your Pelican install hasn't been moved around, there's nothing else to do.

## Run the Import

The commands depend on how Calagopus itself is installed. They assume Pelican is at `/var/www/pelican`, so change the path if it's somewhere else. Pick the matching tab:

:::::tabs
=== Docker

The importer runs inside the Calagopus container, so it needs a working copy of Pelican's `.env`. On MySQL, MariaDB or PostgreSQL, `DB_HOST` has to point at the host machine: the `web` service maps `host.docker.internal` to the host's gateway. If the database runs on another machine, leave out the `sed` line. On SQLite, the database file goes into the container.

From the directory with your Calagopus `compose.yml`, run the block for your database. It makes the copy and puts it in the container. Run `sudo -v` first so a password prompt doesn't swallow the rest of the pasted block.

::: code-group
```bash [MySQL / MariaDB / PostgreSQL]
sudo cp /var/www/pelican/.env /tmp/pelican.env
sudo chmod 600 /tmp/pelican.env
sudo sed -i 's/^DB_HOST=.*/DB_HOST=host.docker.internal/' /tmp/pelican.env
sudo docker compose cp /tmp/pelican.env web:/.env
```

```bash [SQLite]
sudo cp /var/www/pelican/.env /tmp/pelican.env
sudo chmod 600 /tmp/pelican.env
sudo sed -i '/^DB_CONNECTION=/d;/^DB_DATABASE=/d' /tmp/pelican.env
printf '\nDB_CONNECTION=sqlite\nDB_DATABASE=/database.sqlite\n' | sudo tee -a /tmp/pelican.env > /dev/null
sudo docker compose cp /var/www/pelican/database/database.sqlite web:/database.sqlite
sudo docker compose cp /tmp/pelican.env web:/.env
```
:::

Validate without importing records:

```bash
sudo docker compose exec web calagopus-panel import pelican --environment /.env --dry-run --on-invalid=abort --report /tmp/pelican-import-report.json
```

Read the reported problems before continuing. The report is inside the `web` container; copy it out with `sudo docker compose cp web:/tmp/pelican-import-report.json ./pelican-import-report.json` if needed. Review the [import options](../pelican.md#import-options) to choose fixes or skipped rows. If it fails right away with something like _"Host 'X' is not allowed to connect"_ or _"Access denied for user"_, see the **Allowing the Database User to Connect from Docker** dropdown below.

Then run the import interactively:

```bash
sudo docker compose exec web calagopus-panel import pelican --environment /.env
```

When the import finishes, restart the stack and remove the temporary file:

```bash
sudo docker compose down
sudo docker compose up -d
sudo rm /tmp/pelican.env
```

:::: details Allowing the Database User to Connect from Docker

Only read this if the import failed with a host or auth error. The cause: Pelican's MySQL/MariaDB user is restricted to specific source hosts, usually `localhost` or `127.0.0.1`, but the Calagopus container connects from a different IP, the Docker bridge gateway. To MySQL, `pelican@'localhost'` and `pelican@'172.17.0.1'` are different users, and only the first one exists.

The fix is to grant that user access from any host (`'%'`), run the import, then revoke the grant once you're done. Use the real user, password, and database name from Pelican's `.env`:

```bash
sudo mysql -u root -p <<'SQL'
GRANT ALL PRIVILEGES ON pelican.* TO 'pelican'@'%' IDENTIFIED BY 'your-pelican-password';
FLUSH PRIVILEGES;
SQL
```

Then re-run the import.

::: warning Revoke this after the migration
A grant from `'%'` lets the user connect from anywhere the database is reachable, which is far more access than you want long-term. Revoke it as soon as the import finishes:

```bash
sudo mysql -u root -p <<'SQL'
REVOKE ALL PRIVILEGES ON pelican.* FROM 'pelican'@'%';
DROP USER 'pelican'@'%';
FLUSH PRIVILEGES;
SQL
```

This leaves the original `pelican@'localhost'` (or wherever) untouched, so Pelican keeps working if you're running it alongside Calagopus for now. Once Pelican is fully decommissioned, you can drop that user too.
:::
::::

=== APT/RPM, Binary

Run the importer from the folder with your Calagopus `.env`, on the machine where Calagopus is installed. Validate without importing records:

```bash
cd /etc/calagopus
sudo calagopus-panel import pelican --environment /var/www/pelican/.env --dry-run --on-invalid=abort --report /tmp/pelican-import-report.json
```

Read the reported problems before continuing. Review the [import options](../pelican.md#import-options) to choose fixes or skipped rows. Then run the import interactively:

```bash
sudo calagopus-panel import pelican --environment /var/www/pelican/.env
```

When the import finishes, restart Calagopus:

```bash
sudo systemctl restart calagopus-panel
```

On Windows, restart with `nssm restart "Calagopus Panel"` instead.

:::::

The import walks through users, servers, nodes, allocations, eggs, and everything else. Small installs finish in seconds, larger ones can take a few minutes. The terminal shows validation findings and the planned record counts before the import writes data.

::: warning If the import errors out
Validation errors stop the import before it writes data. If the write phase fails, the importer rolls back the imported records; fix the reported problem and retry. If it says the data was imported but Panel settings could not be saved, keep the imported data and set the URL, name, and mail settings in the admin area. Do not rerun a successful data import just to repair settings. See [Troubleshooting](../pelican.md#troubleshooting) for the common errors.
:::

Log in with your existing Pelican credentials.

## What's Next

Your nodes keep their existing Wings install, so don't follow the Wings installation guide. Follow [Migrating Wings Nodes](../wings.md) on each one.

After migrating, regenerate any API keys used by external scripts. The old Pelican keys won't work, and the Calagopus API differs from Pelican's, so those integrations need updating regardless.
