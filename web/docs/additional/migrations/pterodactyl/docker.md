---
prev: false
next: false
description: Step-by-step guide to migrating a Dockerized Pterodactyl or Blueprint install to Calagopus with the built-in importer and your existing .env file.
---

# Migrating from Pterodactyl (Dockerized)

This guide is for Pterodactyl installs running in Docker. If Pterodactyl runs directly on the host without containers, use the [Standalone](./standalone.md) guide instead. It works with Pterodactyl's standard [Docker compose setup](https://github.com/pterodactyl/panel/blob/1.0-develop/docker-compose.example.yml) and Blueprint's [Docker compose variant](https://github.com/BlueprintFramework/framework-docker/blob/Master/docker-compose.yml).

You point the Calagopus importer at a `.env` file with Pterodactyl's database connection details, and it reads everything across. The Docker-specific part is building that file, because the database hostname inside Pterodactyl's Docker network doesn't work from anywhere else.

API keys do not migrate. The hashes aren't compatible, and neither is the API, so old keys wouldn't work even if they were imported. See the [intro](../pterodactyl.md) for the full reasoning.

## Before You Start

You need access to your Dockerized Pterodactyl install, with its containers running, and Calagopus installed on the same machine. If you haven't installed Calagopus yet, follow the [installation guide](../../../panel/installation/index.md). Once you reach the Out-of-Box Experience (OOBE) screen, **stop**. Don't click through it, don't create the admin user.

::: warning Don't click through the OOBE
This guide uses a fresh Calagopus database. By default, the importer refuses a target that already has users, nodes, servers, nests, or locations. If you already completed the OOBE, either [reset the database](../index.md#resetting-the-calagopus-database), or if you need to keep its data, review [`--force`](../pterodactyl.md#import-options) and run a dry run against the occupied target first.

![Calagopus Panel OOBE](../../../panel/oobe.webp)
:::

## Create the Environment File

Run this from the directory with Pterodactyl's compose file. It collects what the importer needs into `/tmp/ptero.env` and prints it so you can check it. If Pterodactyl's host mount isn't at `/srv/pterodactyl`, change the first line. Run `sudo -v` first so a password prompt doesn't swallow the rest of the pasted block.

```bash
PTERODACTYL_DIRECTORY=/srv/pterodactyl

install -m 600 /dev/null /tmp/ptero.env
{
  echo "APP_URL=$(sudo docker compose exec -T panel printenv APP_URL)"
  sudo grep '^APP_KEY=' "$PTERODACTYL_DIRECTORY/var/.env"
  echo "DB_HOST=$(sudo docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(sudo docker compose ps -q database))"
  echo "DB_PORT=3306"
  echo "DB_DATABASE=panel"
  echo "DB_USERNAME=pterodactyl"
  echo "DB_PASSWORD=$(sudo docker compose exec -T panel printenv DB_PASSWORD)"
} > /tmp/ptero.env
cat /tmp/ptero.env
```

The result looks like this, and all seven lines need a value:

```sh
APP_URL=https://panel.example.com
APP_KEY=xc5QXq4u3Qgi3zRP0Q9qq32mnZvl0lVY
DB_HOST=172.20.0.4
DB_PORT=3306
DB_DATABASE=panel
DB_USERNAME=pterodactyl
DB_PASSWORD=mZCcs8KInMWexDRe704T6C8swXmbP8W2M+kCpbnQuv4=
```

`DB_PORT`, `DB_DATABASE` and `DB_USERNAME` are the defaults from Pterodactyl's compose file. If you've customized them, edit the file to match Pterodactyl's `.env`. If the database is bound to a host port and Calagopus isn't in Docker, you can also use `127.0.0.1` for `DB_HOST`.

::: details Running Pterodactyl on Windows
Create `ptero.env` by hand with the seven values above. `APP_KEY` is in Pterodactyl's `var/.env`, `APP_URL` and the password are in its compose file (`MYSQL_PASSWORD`, or `MARIADB_USER_PASS` on Blueprint), and this prints `DB_HOST`:

```powershell
echo "DB_HOST=$($(docker compose ps -q database) | foreach { docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $_ })"
```
:::

## Run the Import

The commands depend on how Calagopus itself is installed. Pick the matching tab:

::::tabs
=== Docker

From the directory with your Calagopus `compose.yml`, copy the file into the container and validate without importing records:

```bash
sudo docker compose cp /tmp/ptero.env web:/.env
sudo docker compose exec web calagopus-panel import pterodactyl --environment /.env --dry-run --on-invalid=abort --report /tmp/pterodactyl-import-report.json
```

Read the reported problems before continuing. The report is inside the `web` container; copy it out with `sudo docker compose cp web:/tmp/pterodactyl-import-report.json ./pterodactyl-import-report.json` if needed. Review the [import options](../pterodactyl.md#import-options) to choose fixes or skipped rows. Then run the import interactively:

```bash
sudo docker compose exec web calagopus-panel import pterodactyl --environment /.env
```

When the import finishes, restart the stack and remove the temporary file:

```bash
sudo docker compose down
sudo docker compose up -d
rm /tmp/ptero.env
```

=== APT/RPM, Binary

Validate without importing records:

```bash
cd /etc/calagopus
sudo calagopus-panel import pterodactyl --environment /tmp/ptero.env --dry-run --on-invalid=abort --report /tmp/pterodactyl-import-report.json
```

Read the reported problems before continuing. Review the [import options](../pterodactyl.md#import-options) to choose fixes or skipped rows. Then run the import interactively:

```bash
sudo calagopus-panel import pterodactyl --environment /tmp/ptero.env
```

When the import finishes, restart Calagopus and remove the temporary file:

```bash
sudo systemctl restart calagopus-panel
rm /tmp/ptero.env
```

On Windows, save `ptero.env` next to your Calagopus `.env`, use `--environment ptero.env` from that folder, and restart with `nssm restart "Calagopus Panel"`.

::::

The import walks through users, servers, nodes, allocations, eggs, and everything else. Small installs finish in seconds, larger ones take longer. The terminal shows validation findings and the planned record counts before the import writes data.

::: warning If the import errors out
Validation errors stop the import before it writes data. If the write phase fails, the importer rolls back the imported records; fix the reported problem and retry. If it says the data was imported but Panel settings could not be saved, keep the imported data and set the URL, name, and mail settings in the admin area. Do not rerun a successful data import just to repair settings. See [Troubleshooting the Import](../pterodactyl.md#troubleshooting-the-import) for the common errors.
:::

Log in with your existing Pterodactyl credentials.

## What's Next

Your nodes keep their existing Wings install, so don't follow the Wings installation guide. Follow [Migrating Wings Nodes](../wings.md) on each one.

After migrating, regenerate any API keys used by external scripts. The old Pterodactyl keys won't work, and the Calagopus API differs from Pterodactyl's, so those integrations need updating regardless.
