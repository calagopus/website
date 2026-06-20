# Setting up Database Hosts

Database hosts let your users create databases for their game servers directly from the panel, instead of asking you to do it manually every time. Useful for things like Minecraft plugins that need MySQL, or Node.js servers using MongoDB.

The panel connects using a privileged account and provisions a database and user per server on demand, each with isolated credentials, so no server can see another's data. You can add multiple database hosts if you want, for example, to split load across regions or server types.

Choose a database type:

::::tabs
=== MySQL (MariaDB)
See the [MySQL (MariaDB)](./database-hosts/mysql.md) guide.
=== PostgreSQL
See the [PostgreSQL](./database-hosts/postgres.md) guide.
=== MongoDB
See the [MongoDB](./database-hosts/mongodb.md) guide.
::::
