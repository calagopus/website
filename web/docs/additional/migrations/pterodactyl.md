---
title: Migrating from Pterodactyl
description: How to migrate from Pterodactyl to Calagopus. The built-in importer copies users, servers, nodes, and eggs from your Pterodactyl database to a fresh Calagopus instance with no server data to move.
---

# Migrating from Pterodactyl

Calagopus includes an importer that reads a Pterodactyl database and writes equivalent records into a fresh Calagopus database. After the import, users log in with the same credentials and all servers, nodes, and eggs are intact.

The one thing that does not migrate is API keys. Pterodactyl stores them as hashes using a different algorithm than Calagopus, so the values cannot be carried over. This is also not a practical concern - the Calagopus API is not compatible with Pterodactyl's, so any external scripts using Pterodactyl's API need to be updated for Calagopus regardless. Generate new keys after migration and update your integrations.

This guide covers the panel database migration only. Wings also needs to be updated to point at the new panel. See [Wings Updating](../../wings/updating.md) for that step.

## Pick Your Path

Pterodactyl comes in two flavors and the import process is slightly different for each. Figure out which one you're running and follow the matching guide:

::::tabs
=== Standalone
A normal install on a Linux box, Pterodactyl running directly on the host. Head to the [Standalone](./pterodactyl/standalone.md) guide.

=== Dockerized
Pterodactyl running inside Docker containers, with a `docker-compose.yml` somewhere. Head to the [Dockerized](./pterodactyl/docker.md) guide.
::::

If you're not sure which setup you're using, run `docker compose ps` in your Pterodactyl directory. If it shows a running panel/web container, you're using Docker. Otherwise, you're using Standalone. A `docker-compose.yml` file alone doesn't indicate a Docker setup.

## Troubleshooting the Import

The importer talks to the Pterodactyl database from inside the Calagopus container, which is where most of the trouble comes from. These are the errors people hit most, with the fix that worked. Problems that show up after the import, such as nodes not connecting, are covered on the general [Troubleshooting](../troubleshooting.md) page.

**`failed to connect to pterodactyl database: PoolTimedOut`.** The container can't reach MySQL. Inside the container `127.0.0.1` is the container itself, so `DB_HOST` in the copied `.env` has to be `host.docker.internal` (the compose file maps it to the host) or the database host's real IP. The database also has to listen on something other than `127.0.0.1`, which for MariaDB means `bind-address = 0.0.0.0`, and the user needs a grant from `'%'` as described in the [standalone guide](./pterodactyl/standalone.md). If all of that is in place and it still times out, the host firewall is blocking port `3306` from the Docker network. As a last resort, remove the `ports:` section from the Calagopus compose file, add `network_mode: host` to the `web` service, and connect to `127.0.0.1` directly.

**`Configuration(Utf8Error ...)` while connecting.** `DB_PASSWORD` contains characters such as `#`, `&` or `$` that break the connection URL. URL-encode the password in the copy of the `.env` you pass to the importer.

**`column "startup" of relation "nest_eggs" does not exist`, or another missing column.** You ran the import on a `:nightly` panel whose schema is ahead of the importer. Import on `:latest`. If the nightly image already ran migrations, drop the database and recreate it first.

**`duplicate key value violates unique constraint` on an egg variable.** Only relevant on panels older than 1.0.10, where two variables on the same egg could not share a name. Current versions allow duplicate names, so update before importing rather than editing the Pterodactyl database.

**The import stopped halfway, or only users showed up afterwards.** A failed attempt leaves partial data behind, and the next run trips over it with errors about a unique index or key that already exists. Always drop and recreate the Calagopus database before retrying, as shown under "Install Calagopus First" in the [standalone](./pterodactyl/standalone.md#install-calagopus-first) and [Docker](./pterodactyl/docker.md#install-calagopus-first) guides. The importer never changes the Pterodactyl database, so rerunning is safe on that side.

**`WARN ... slow statement: execution time exceeded alert threshold` during the import.** A warning only. Large `egg_variables` tables take a few seconds to read.

**After logging in, pages are blank with "missing authorization" in a corner, or every request says the session is invalid.** The imported sessions expect the address the old panel used. If Pterodactyl was served over HTTPS, Calagopus must be too, and on the same domain. Set up the [reverse proxy](../reverse-proxies.md) and log in through it. Clearing the browser's cookies for the domain helps when you switched schemes mid-way.

**The Nodes or Servers pages fail with `memory: Too small: expected number to be >=0 [got: -1]`.** Pterodactyl used `-1` for "unlimited" on a node, and Calagopus uses `0`. Imports run on 1.1.1 or newer convert this for you. If you imported on an older version, fix it in the database:

```bash
docker compose exec db psql -U panel panel -c "update nodes set memory = 0 where memory < 0;"
```

**Admin pages for servers, users or databases error out, and the log says a name is too short.** A migrated user has an empty last name. Panels from 1.2.0 accept that. On older versions, find them with `select id, username from users where name_last = '';` and give them a placeholder.

**`APP_ENCRYPTION_KEY`.** Generate a new random value for Calagopus. Don't reuse Pterodactyl's `APP_KEY`, and set the key before running the import, not after.

**Users can't create databases after the import.** Database hosts come over with the address they had in Pterodactyl, often `127.0.0.1`, which now points at the panel container. Change the host's address to something the container can reach, check that **Deployment Enabled** is on, and attach the host to a node or location. See [Database Hosts](../database-hosts/index.md).

**Users can't add allocations they could add before.** Self-assigned allocations are an [egg configuration](../../panel/features/admin/egg-configurations.md) setting in Calagopus and aren't imported. Create a configuration with **User Self Assign** enabled for the eggs that need it.

**Nodes stay offline, and the Wings log shows `github.com/pterodactyl/wings` in a stack trace or `manager: failed to retrieve server configurations`.** The old Pterodactyl Wings is still what runs on the node. Replace it as described in [Updating Wings](../../wings/updating.md) and point `remote:` at the new panel. Existing servers are picked up without any extra step.

**Servers on a migrated node fail with `network calagopus_nw not found`.** The migrated Wings config kept `docker.network.name: pterodactyl_nw` but picked up the new default for `docker.network.mode`. Set `mode` to the same value as `name`. Wings from 1.1.3 on warns about this at boot and names the value to set.

**Servers were imported under the wrong node.** If the old node and the new one are the same machine with the same data paths, point the records at the new node in the database. Replace `new-uuid` and `old-uuid` with the node UUIDs from the admin area:

```bash
docker compose exec db psql -U panel panel
update servers set node_uuid = 'new-uuid' where node_uuid = 'old-uuid';
update node_allocations set node_uuid = 'new-uuid' where node_uuid = 'old-uuid';
```

Don't do this across different machines. It moves nothing, it only changes which node the panel asks for the files.
