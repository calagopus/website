---
title: Migrating from Pelican
description: How to migrate from Pelican to Calagopus. The built-in importer copies users, servers, nodes, and eggs from your Pelican database to a fresh Calagopus instance.
---

# Migrating from Pelican

Calagopus includes an importer that reads a Pelican database and writes equivalent records into a fresh Calagopus database. After the import, users log in with the same credentials and all servers, nodes, and eggs are intact.

The one thing that does not migrate is API keys. Pelican stores them as hashes using a different algorithm than Calagopus, so the values cannot be carried over. This is also not a practical concern - the Calagopus API is not compatible with Pelican's, so any external scripts using Pelican's API need to be updated for Calagopus regardless. Generate new keys after migration and update your integrations.

This guide covers the panel database migration only. Wings also needs to be updated to point at the new panel. See [Wings Updating](../../wings/updating.md) for that step.

## Pick Your Path

Pelican comes in two flavors and the import process is slightly different for each. Figure out which one you're running and follow the matching guide:

::::tabs
=== Standalone
A normal install on a Linux box, Pelican running directly on the host. Head to the [Standalone](./pelican/standalone.md) guide.

=== Dockerized
Pelican running inside Docker containers, with a `docker-compose.yml` somewhere. Head to the [Dockerized](./pelican/docker.md) guide.
::::

If you're not sure which setup you're using, run `docker compose ps` in your Pelican directory. If it shows a running panel/web container, you're using Docker. Otherwise, you're using Standalone. A `docker-compose.yml` file alone doesn't indicate a Docker setup.

## Troubleshooting

The importer shares its code with the Pterodactyl one, so connection and data errors are covered under [Troubleshooting the Import](./pterodactyl.md#troubleshooting-the-import) on that page. Two things are specific to Pelican.

**Wings logs a JSON parse error naming a missing field such as `oom_disabled`, and the panel can't connect.** The `remote:` URL in the Wings config still points at the Pelican panel. Set it to the Calagopus panel's address and restart Wings.

**Config file replacements such as `{{server.environment.SERVER_NAME}}` are written literally, and the Wings log says `unknown server variable: server.environment.SERVER_NAME`.** Calagopus Wings exposes the environment as `server.env`. Wings from 1.1.4 on accepts `server.environment` as an alias. On older versions, edit the egg's config file replacements to use `{{server.env.SERVER_NAME}}`.
