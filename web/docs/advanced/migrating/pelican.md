# Migrating from Pelican

So you've been running Pelican and you'd like to switch to Calagopus without losing every server, user, and configuration you've built up. Good news: there's an importer for that. It reads your Pelican database, walks through every record, and writes equivalent rows into a fresh Calagopus database. By the time it's done, your users log in with the same credentials, your servers are still there, your nodes are still there, your eggs are still there.

The only thing that doesn't make the trip is API keys, and that's not us being lazy. Pelican stores them as hashes (not the keys themselves), Calagopus stores them as hashes too but with a different algorithm, so there's no path to migrate the actual values. And honestly it doesn't matter much - the Calagopus API isn't compatible with Pelican's anyway, so any external scripts or integrations that were hitting Pelican's API need to be rewritten for Calagopus regardless of what happens to their API keys. Generate fresh ones after migration, plug them into your scripts, move on.

There's also one thing this guide doesn't cover: the node side. Wings is a drop-in replacement for Pelican's node agent, but you do still need to update Wings to point at the new panel. See [Wings - Updating](../../wings/updating.md) for that part. The panel migration in this guide handles every database record on the panel side; Wings handles itself.

## Pick Your Path

Pelican comes in two flavors and the import process is slightly different for each. Figure out which one you're running and follow the matching guide:

::::tabs
=== Standalone
A normal install on a Linux box, Pelican running directly on the host. Head to the [Standalone](./pelican-standalone.md) guide.

=== Dockerized
Pelican running inside Docker containers, with a `docker-compose.yml` somewhere. Head to the [Dockerized](./pelican-dockerized.md) guide.
::::

If you're not sure which you have, check whether there's a `docker-compose.yml` file in your Pelican directory. If there is, you're Dockerized; if not, you're Standalone.
