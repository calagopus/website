---
prev: false
next: false
description: Step-by-step guide to migrating a standalone Pterodactyl install to Calagopus with the built-in importer, keeping users, servers, nodes and eggs.
---

# Migrating from Pterodactyl (Standalone)

This guide is for Pterodactyl installs running directly on the host, no Docker, no containers, typically at `/var/www/pterodactyl`. If you're using Docker, use the [Dockerized](./docker.md) guide instead.

You'll install Calagopus alongside your existing Pterodactyl, then point the importer at Pterodactyl's `.env` file. It reads everything from Pterodactyl's database and writes matching records into Calagopus's fresh database. Users log in afterward with the same credentials they already have.

API keys do not migrate. The hashes aren't compatible, and neither is the API, so old keys wouldn't work even if they were imported. See the [intro](../pterodactyl.md) for the full reasoning.

## Before You Start

You need access to Pterodactyl's `.env` file, and Calagopus installed on the same machine. If you haven't installed Calagopus yet, follow the [installation guide](../../../panel/installation/index.md). Once you reach the Out-of-Box Experience (OOBE) screen, **stop**. Don't click through it, don't create the admin user.

::: warning Don't click through the OOBE
This guide uses a fresh Calagopus database. By default, the importer refuses a target that already has users, nodes, servers, nests, or locations. If you already completed the OOBE, either [reset the database](../index.md#resetting-the-calagopus-database), or if you need to keep its data, review [`--force`](../pterodactyl.md#import-options) and run a dry run against the occupied target first.

![Calagopus Panel OOBE](../../../panel/oobe.webp)
:::

## Run the Import

The commands depend on how Calagopus itself is installed. They assume Pterodactyl is at `/var/www/pterodactyl`, so change the path if it's somewhere else. Pick the matching tab:

:::::tabs
=== Docker

The importer runs inside the Calagopus container, so it needs a working copy of Pterodactyl's `.env` with `DB_HOST` pointing at the host machine. The `web` service maps `host.docker.internal` to the host's gateway. If the database runs on another machine, leave out the `sed` line.

From the directory with your Calagopus `compose.yml`, make the copy, put it in the container, and validate without importing records. Run `sudo -v` first so a password prompt doesn't swallow the rest of the pasted block.

```bash
sudo cp /var/www/pterodactyl/.env /tmp/pterodactyl.env
sudo chmod 600 /tmp/pterodactyl.env
sudo sed -i 's/^DB_HOST=.*/DB_HOST=host.docker.internal/' /tmp/pterodactyl.env
sudo docker compose cp /tmp/pterodactyl.env web:/.env
sudo docker compose exec web calagopus-panel import pterodactyl --environment /.env --dry-run --on-invalid=abort --report /tmp/pterodactyl-import-report.json
```

Read the reported problems before continuing. The report is inside the `web` container; copy it out with `sudo docker compose cp web:/tmp/pterodactyl-import-report.json ./pterodactyl-import-report.json` if needed. Review the [import options](../pterodactyl.md#import-options) to choose fixes or skipped rows. If it fails right away with something like *"Host 'X' is not allowed to connect"* or *"Access denied for user"*, see the **Allowing the Database User to Connect from Docker** dropdown below.

Then run the import interactively:

```bash
sudo docker compose exec web calagopus-panel import pterodactyl --environment /.env
```

When the import finishes, restart the stack and remove the temporary file:

```bash
sudo docker compose down
sudo docker compose up -d
sudo rm /tmp/pterodactyl.env
```

:::: details Allowing the Database User to Connect from Docker

Only read this if the import failed with a host or auth error. The cause: Pterodactyl's MySQL/MariaDB user is restricted to specific source hosts, usually `localhost` or `127.0.0.1`, but the Calagopus container connects from a different IP, the Docker bridge gateway. To MySQL, `pterodactyl@'localhost'` and `pterodactyl@'172.17.0.1'` are different users, and only the first one exists.

The fix is to grant that user access from any host (`'%'`), run the import, then revoke the grant once you're done. Use the real user, password, and database name from Pterodactyl's `.env`:

```bash
sudo mysql -u root -p <<'SQL'
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'%' IDENTIFIED BY 'your-pterodactyl-password';
FLUSH PRIVILEGES;
SQL
```

Then re-run the import.

::: warning Revoke this after the migration
A grant from `'%'` lets the user connect from anywhere the database is reachable, which is far more access than you want long-term. Revoke it as soon as the import finishes:

```bash
sudo mysql -u root -p <<'SQL'
REVOKE ALL PRIVILEGES ON panel.* FROM 'pterodactyl'@'%';
DROP USER 'pterodactyl'@'%';
FLUSH PRIVILEGES;
SQL
```

This leaves the original `pterodactyl@'localhost'` (or wherever) untouched, so Pterodactyl keeps working if you're running it alongside Calagopus for now. Once Pterodactyl is fully decommissioned, you can drop that user too.
:::
::::

=== APT/RPM, Binary

Validate without importing records:

```bash
cd /etc/calagopus
sudo calagopus-panel import pterodactyl --environment /var/www/pterodactyl/.env --dry-run --on-invalid=abort --report /tmp/pterodactyl-import-report.json
```

Read the reported problems before continuing. Review the [import options](../pterodactyl.md#import-options) to choose fixes or skipped rows. Then run the import interactively:

```bash
sudo calagopus-panel import pterodactyl --environment /var/www/pterodactyl/.env
```

When the import finishes, restart Calagopus:

```bash
sudo systemctl restart calagopus-panel
```

On Windows, run the import from the folder with your Calagopus `.env`, and restart with `nssm restart "Calagopus Panel"`.

:::::

The import walks through users, servers, nodes, allocations, eggs, and everything else. Small installs finish in seconds, larger ones take longer. The terminal shows validation findings and the planned record counts before the import writes data.

::: warning If the import errors out
Validation errors stop the import before it writes data. If the write phase fails, the importer rolls back the imported records; fix the reported problem and retry. If it says the data was imported but Panel settings could not be saved, keep the imported data and set the URL, name, and mail settings in the admin area. Do not rerun a successful data import just to repair settings. See [Troubleshooting the Import](../pterodactyl.md#troubleshooting-the-import) for the common errors.
:::

Log in with your existing Pterodactyl credentials.

## What's Next

Your nodes keep their existing Wings install, so don't follow the Wings installation guide. Follow [Migrating Wings Nodes](../wings.md) on each one.

After migrating, regenerate any API keys used by external scripts. The old Pterodactyl keys won't work, and the Calagopus API differs from Pterodactyl's, so those integrations need updating regardless.
