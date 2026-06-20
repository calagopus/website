---
prev: false
next: false
---
# Migrating from Pelican
Calagopus includes an importer that reads a Pelican database and writes equivalent records into a fresh Calagopus database. After the import, users log in with the same credentials and all servers, nodes, and eggs are intact.

The one thing that does not migrate is API keys. Pelican stores them as hashes using a different algorithm than Calagopus, so the values cannot be carried over. This is also not a practical concern - the Calagopus API is not compatible with Pelican's, so any external scripts using Pelican's API need to be updated for Calagopus regardless. Generate new keys after migration and update your integrations.

This guide covers the panel database migration only. Wings also needs to be updated to point at the new panel. See [Wings Updating](../../wings/updating.md) for that step.

## Pick Your Path
Pelican comes in two flavors and the import process is slightly different for each. Figure out which one you're running and follow the matching guide:

::::tabs
=== Standalone
A normal install on a Linux box, Pelican running directly on the host. Head to the [Standalone](./pelican-standalone.md) guide.

=== Dockerized
Pelican running inside Docker containers, with a `docker-compose.yml` somewhere. Head to the [Dockerized](./pelican-dockerized.md) guide.
::::

If you're not sure which you have, check whether there's a `docker-compose.yml` file in your Pelican directory. If there is, you're Dockerized; if not, you're Standalone.
