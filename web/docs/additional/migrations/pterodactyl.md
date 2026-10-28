---
title: Migrating from Pterodactyl
description: How to migrate from Pterodactyl to Calagopus. The built-in importer copies users, servers, nodes, and eggs from your Pterodactyl database to a fresh Calagopus instance with no server data to move.
---

# Migrating from Pterodactyl

Calagopus includes an importer that reads a Pterodactyl database and writes equivalent records into a fresh Calagopus database. The import plan includes users, servers, nodes, and eggs. Review any repaired or skipped records before writing it; users whose accounts import successfully can sign in with their existing credentials.

API keys and active login sessions do not migrate. Users need to sign in again. Generate new API keys and update your integrations: the Calagopus API differs from Pterodactyl's, so existing API scripts also need changes.

This guide covers the panel database migration only. Wings also needs to be updated to point at the new panel. See [Wings Updating](../../wings/updating.md) for that step.

## Pterodactyl 2.x

The importer reads both Pterodactyl 1.x and, from Panel 1.2.6, Pterodactyl 2.x databases. Pterodactyl 2.x organises eggs with tags rather than nests, so the importer works out a nest for every egg:

1. An egg that still points at an existing nest stays in it.
2. Otherwise a tag that was converted from one of the old nests puts the egg back in that nest.
3. Otherwise the egg goes into a nest named after its tag, preferring your own tags over the built-in game tags (`srcds`, `bedrock`, `minecraft`, `rust`, `garrysmod`, `fivem`, `voice`). If a nest with that name already exists, ignoring case, the egg joins it.
4. Eggs without any tag go into a nest called "Pterodactyl".

Nests created this way say in their description which tag they came from. An egg imports into exactly one nest, so an egg with several tags only shows up under one of them. Check the result under [Nests](../../panel/features/admin/nests.md) after the import. Egg variable order carries over on both versions.

## Pick Your Path

Pterodactyl comes in two flavors and the import process is slightly different for each. Figure out which one you're running and follow the matching guide:

::::tabs
=== Standalone
A normal install on a Linux box, Pterodactyl running directly on the host. Head to the [Standalone](./pterodactyl/standalone.md) guide.

=== Dockerized
Pterodactyl running inside Docker containers, with a `docker-compose.yml` somewhere. Head to the [Dockerized](./pterodactyl/docker.md) guide.
::::

If you're not sure which setup you're using, run `docker compose ps` in your Pterodactyl directory. If it shows a running panel/web container, you're using Docker. Otherwise, you're using Standalone. A `docker-compose.yml` file alone doesn't indicate a Docker setup.

## Import Options

The importer reads the source, validates an import plan, and reports problems before writing records. Start with `--dry-run --on-invalid=abort` to inspect that plan. Add the options below to the import command in your installation guide; keep its `--environment` path and Docker prefix where applicable.

| Option | Behavior |
| --- | --- |
| `--dry-run` | Validates and reports without writing imported records or applying the imported Panel settings. |
| `--on-invalid=ask` | Default. Prompts for decisions in a terminal; aborts on unresolved problems when no terminal is attached. |
| `--on-invalid=abort` | Reports validation problems and stops without importing if any are found. |
| `--on-invalid=fix` | Applies suggested repairs where available and skips rows that cannot be repaired. Review the report and planned counts before writing. |
| `--on-invalid=skip` | Skips rows with validation problems. Dependent records may also need to be skipped. |
| `--report /path/report.json` | Writes problems, fixes, and skipped rows to a JSON file on the machine or container running the command. |
| `--unlimited-as 100` | Converts unlimited source database, allocation, and backup limits to this value. Defaults to `100`. |
| `--force` | Allows an occupied target and checks imported rows against its existing records. It does not clear the target or overwrite conflicting records automatically. |
| `--yes` / `-y` | Skips the final confirmation before writing. It does not choose a policy for invalid rows. |

For example, after reviewing an initial report, `--dry-run --on-invalid=fix` previews the proposed repairs and skipped rows. Remove `--dry-run` only when that result is acceptable. For unattended imports, choose an explicit invalid-row policy instead of relying on interactive prompts.

A failed data write rolls back the import. Panel settings are saved after the data commits: if only that step fails, the importer tells you to set the URL, name, and mail settings in the admin area. Keep the imported records and repair those settings rather than running the import again.

## Troubleshooting the Import

The importer talks to the Pterodactyl database from inside the Calagopus container, which is where most of the trouble comes from. These are the errors people hit most, with the fix that worked. Problems that show up after the import, such as nodes not connecting, are covered on the general [Troubleshooting](../troubleshooting.md) page.

| Symptom | Fix |
| --- | --- |
| `failed to connect to pterodactyl database: PoolTimedOut` | The container can't reach MySQL. Inside the container `127.0.0.1` is the container itself, so `DB_HOST` in the copied `.env` has to be `host.docker.internal` (the compose file maps it to the host) or the database host's real IP. The database also has to listen on something other than `127.0.0.1`, which for MariaDB means `bind-address = 0.0.0.0`, and the user needs a grant from `'%'` as described in the [standalone guide](./pterodactyl/standalone.md). If all of that is in place and it still times out, the host firewall is blocking port `3306` from the Docker network. As a last resort, remove the `ports:` section from the Calagopus compose file, add `network_mode: host` to the `web` service, and connect to `127.0.0.1` directly. |
| `Configuration(Utf8Error ...)` or authentication errors while connecting | Use the original database password in the copied `.env`, with appropriate quoting for special characters. The importer URL-encodes credentials itself; do not pre-encode `DB_PASSWORD`. Check that the username, host, and password still match the source database. |
| A missing-column or schema error during import | Check that the Calagopus binary matches the target database schema and that its required migrations have completed. Keep a database backup before changing versions. A failed import write rolls back; a schema mismatch alone is not a reason to discard the target database or downgrade it. |
| `duplicate key value violates unique constraint` on an egg variable | Only relevant on panels older than 1.0.10, where two variables on the same egg could not share a name. Current versions allow duplicate names, so update before importing rather than editing the Pterodactyl database. |
| The import fails during validation or writing | Current imports validate before writing and roll back failed data writes. Fix the reported issue and retry. A settings-save warning means the records were imported successfully; repair settings in the admin area. Partial data left by an older importer needs separate review: use a fresh target, or inspect it with `--force --dry-run` before deciding what to keep. |
| `WARN ... slow statement: execution time exceeded alert threshold` during the import | A warning only. Large `egg_variables` tables take a few seconds to read. |
| After logging in, pages are blank with "missing authorization", or requests say the session is invalid | Sign in again: sessions are not imported. Check the Panel URL, HTTPS, and [reverse proxy](../reverse-proxies/panel.md) configuration, then clear stale cookies for the domain if you changed schemes or replaced the old panel. |
| Imported users with two-factor authentication can't finish signing in: the code is refused or the checkpoint errors | Panels before 1.2.7 rejected TOTP secrets shorter than 128 bits, and Pterodactyl and Pelican generate shorter ones. Update the Panel; the imported secrets then work as they are. |
| The Nodes or Servers pages fail with `memory: Too small: expected number to be >=0 [got: -1]` | Pterodactyl used `-1` for "unlimited" on a node, and Calagopus uses `0`. Imports run on 1.1.1 or newer convert this for you. If you imported on an older version, fix it in the database: `docker compose exec db psql -U panel panel -c "update nodes set memory = 0 where memory < 0;"`. |
| Admin pages for servers, users or databases error out, and the log says a name is too short | A migrated user has an empty last name. Panels from 1.2.0 accept that. On older versions, find them with `select id, username from users where name_last = '';` and give them a placeholder. |
| `APP_ENCRYPTION_KEY` | Generate a new random value for Calagopus. Don't reuse Pterodactyl's `APP_KEY`, and set the key before running the import, not after. |
| Users can't create databases after the import | Database hosts come over with the address they had in Pterodactyl, often `127.0.0.1`, which now points at the panel container. Change the host's address to something the container can reach, check that **Deployment Enabled** is on, and attach the host to a node or location. See [Database Hosts](../database-hosts/index.md). |
| Users can't add allocations they could add before | Self-assigned allocations are an [egg configuration](../../panel/features/admin/egg-configurations.md) setting in Calagopus and aren't imported. Create a configuration with **User Self Assign** enabled for the eggs that need it. |
| Nodes stay offline, and the Wings log shows `github.com/pterodactyl/wings` in a stack trace or `manager: failed to retrieve server configurations` | The old Pterodactyl Wings is still what runs on the node. Replace it as described in [Updating Wings](../../wings/updating.md) and point `remote:` at the new panel. Existing servers are picked up without any extra step. |
| Servers on a migrated node fail with `network calagopus_nw not found` | The migrated Wings config kept `docker.network.name: pterodactyl_nw` but picked up the new default for `docker.network.mode`. Set `mode` to the same value as `name`. Wings from 1.1.3 on warns about this at boot and names the value to set. |
| Servers were imported under the wrong node | If the old node and the new one are the same machine with the same data paths, point the records at the new node in the database (replace `new-uuid` and `old-uuid` with the node UUIDs from the admin area): `docker compose exec db psql -U panel panel -c "update servers set node_uuid = 'new-uuid' where node_uuid = 'old-uuid'; update node_allocations set node_uuid = 'new-uuid' where node_uuid = 'old-uuid';"`. Don't do this across different machines, it moves nothing, it only changes which node the panel asks for the files. |
