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
