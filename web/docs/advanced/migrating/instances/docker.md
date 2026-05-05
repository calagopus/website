---
prev: false
next:
  text: 'Migrating from Standalone to Docker Compose'
  link: '/docs/advanced/migrating/instances/calagopus-dockerized'
---

# Migrating to Docker

So you've been running Calagopus as a standalone installation and want to move it into Docker without losing your users, servers, or configuration? This is a straightforward migration.

Both setups use the same database schema, so the process comes down to one thing: moving your existing database into the new Docker environment. Your database already contains everything: users, servers, settings etc. so once it's transferred, your Docker setup will pick up exactly where your standalone install left off.

There's no importer, no data conversion, and no format changes involved. You're just changing how the application is deployed.

### The general flow looks like this:

- Stop your standalone installation
- Export your database
- Set up your Docker environment
- Import the database into the Docker database container
- Start the full Docker stack

Once completed, your panel should look and behave exactly the same as before.

### This guide assumes:

- You're using the standard standalone installation
- Your database is running locally (default setup)
- You're moving to the standard Docker Compose setup

If your setup differs significantly (custom database hosts, unusual configurations), you may need to adapt some steps.