---
prev:
  text: 'Migrations'
  link: '/docs/advanced/migrations'
after:
  text: 'SSL Certificates'
  link: '/docs/advanced/ssl-certificates'
---
# Setting up Database Hosts

Database hosts let your users create databases for their game servers directly from the panel. This is useful for game server plugins and applications that need to store data in a relational or document database - for example, Minecraft plugins with MySQL support, or Node.js game servers that use MongoDB.

The panel connects to the database host using a privileged account and provisions databases and users on demand. Each server gets its own isolated credentials.

Choose a database type:

::::tabs
=== MySQL (MariaDB)
See the [MySQL (MariaDB)](./mysql.md) guide.
=== PostgreSQL
See the [PostgreSQL](./postgres.md) guide.
=== MongoDB
See the [MongoDB](./mongodb.md) guide.
::::
