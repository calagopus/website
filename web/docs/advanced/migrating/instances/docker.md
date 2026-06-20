---
prev: false
next: false
---

# Migrating to Docker Compose
This guide covers migrating an existing Calagopus standalone installation into Docker without losing your users, servers, or configuration.

Both setups use the same database schema, so the process comes down to one thing: moving your existing database into the new Docker environment. Your database contains everything - users, servers, settings - so once it is transferred, your Docker setup will pick up exactly where the standalone install left off.

There's no importer, no data conversion, and no format changes involved. You're just changing how the application is deployed.

### The general flow looks like this
- Stop your standalone installation
- Export your database
- Set up your Docker environment
- Import the database into the Docker database container
- Start the full Docker stack

Once completed, your panel should look and behave exactly the same as before.

### This guide assumes
- You're using the standard standalone installation
- Your database is running locally (default setup)
- You're moving to the standard Docker Compose setup

If your setup differs significantly (custom database hosts, unusual configurations), you may need to adapt some steps.


::::tabs
=== Docker
Migrating from Standalone to Docker Compose. Head to the [Standalone](./calagopus-dockerized.md#migrating-from-standalone-to-docker-compose) guide.
::::