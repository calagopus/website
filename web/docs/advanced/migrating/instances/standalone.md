---
prev: false
next:
  text: 'Migrating from Docker Compose to Standalone'
  link: '/docs/advanced/migrating/instances/calagopus-standalone'
---

# Migrating to Standalone

So you've been running Calagopus in Docker and want to move to a standalone installation without losing your users, servers, or configuration? This is a straightforward migration.

Both setups use the same database schema, so the process comes down to one thing: exporting your existing database from Docker and importing it into a fresh standalone installation. Once the data is in place, the panel will pick up exactly where it left off.

There's no importer, no data conversion, and no format changes involved. You're just changing how the application is deployed.

**The general flow looks like this:**

- Export the database from your Docker setup
- Stop your Docker stack
- Set up a fresh standalone installation
- Import the database into the standalone database
- Start the standalone panel

Once completed, your panel should look and behave exactly the same as before.

**This guide assumes:**

- You are currently running the standard Docker Compose setup
- You are installing the standard standalone version of Calagopus

If your setup has been modified (for example, external databases or custom container configurations), you may need to adjust the steps accordingly.