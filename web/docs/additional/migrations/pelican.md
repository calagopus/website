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

If you're not sure which you have, check what's actually running. Run `docker compose ps` in your Pelican directory: if it lists an active panel/web container, you're Dockerized. If the panel is served by a regular webserver instead, you're Standalone. The presence of a `docker-compose.yml` file alone doesn't tell you anything, the standard install pulls it from the repo either way.