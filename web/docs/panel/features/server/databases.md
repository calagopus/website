---
title: Databases
description: Create classic databases on shared database hosts or fully managed database instances, with connection details, imports, exports, users, and logs.
---

# Databases

Calagopus has two kinds of server databases. **Classic Databases** are single databases provisioned on a shared database host, the familiar setup from other panels. **Managed Databases** are full database instances run for you by [DB Agent](../../../db-agent/index.md), with their own container, power controls, and live stats.

Both kinds count toward the same limit, shown at the top of the page as "6 of 15 maximum databases created."; the limit is part of the server's [feature limits](../admin/servers.md#feature-limits). If your panel only offers one kind, the page shows a single list; with both available, it splits into a **Classic Databases** and a **Managed Databases** section, each with its own search box and create button.

![](./images/databases/overview.webp)

## Classic Databases

The table lists each database's name, type (MySQL, PostgreSQL, or MongoDB), address, username, size, and whether it's locked. Click the address to copy it.

### Creating a Database

Click **Create Database**. Pick a **Database Name** and a **Database Host**; hosts are grouped by database type, and a host marked **Under Maintenance** can't be selected. If the button is disabled with "No hosts found", there's nothing to provision on.

::: info
Database hosts are set up by administrators and attached to locations, see [Database Hosts](../../../additional/database-hosts/index.md). Users only ever pick from the hosts made available to their server.
:::

### Connection Details

Right-click a database and choose **Details** to open the **Database connection details** modal: database name, host, username, password, and a ready-made **JDBC Connection String** in the form `jdbc:mysql://<username>:<password>@192.0.2.1:3306/<database>`.

![](./images/databases/details-modal.webp)

The password is only visible with the `databases.read-password` permission. From the same modal, **Rotate Password** generates a new password immediately, invalidating the old one.

### Editing, Recreating, and Deleting

The rest of the right-click menu:

| Action | What it does |
| --- | --- |
| **Edit** | Toggle **Locked**. A locked database can't be recreated or deleted, and its password can't be rotated. |
| **Recreate** | Wipes all data and creates a fresh, empty database with the same connection details. Type the database name to confirm. |
| **Delete** | Permanently deletes the database and all data. Type the database name to confirm. |

## Managed Databases

Managed databases are dedicated Redis, MongoDB, PostgreSQL, or MariaDB instances. The list shows each instance's name, type, address, memory, disk, and lock state; an instance with a pending template update also shows an **Update Available** badge. Right-click a row for power actions (**Start**, **Restart**, **Stop**, **Kill**) and **Delete**, or click it to open the instance page.

### Creating a Managed Database

Click **Create Managed Database**. Choose a **Database Name** and a **Template**; templates are grouped by database type, and each one defines the instance's resource limits (memory, swap, disk, CPU, and IO weight). If the template offers more than one **Docker Image**, you pick one too.

::: info
Templates and the resource limits they carry are configured by administrators under [Database Agent Templates](../admin/database-agent-templates.md); the per-instance database and user caps live in [Settings > Server](../admin/settings.md#server). See the [DB Agent docs](../../../db-agent/index.md) for how instances are provisioned.
:::

### The Instance Page

Each instance has its own page at `/server/<id>/databases/instances/<id>` with the instance name, its type badge, and badges for **Locked** and **Update Available** where relevant.

![](./images/databases/instance-view.webp)

Along the top:

- **Start**, **Restart**, and **Stop** power buttons. While the instance is stopping, **Stop** turns into **Kill**; killing warns you first, since forcibly killing a database can corrupt data.
- **Export** and **Import** (Redis only, and only while running): download a dump of the whole instance, or upload one, optionally with **Wipe all existing data before importing**.
- **Apply Update**, shown when the instance's template has a newer configuration. Applying it restarts the database on the updated template.
- **Edit** to rename the instance or toggle **Locked**. A locked instance can't be deleted, template updates can't be applied, and its user passwords can't be rotated.
- **Delete** to remove the instance and all its data. Type the name to confirm.

Below that are live **CPU Load** and **Memory Load** graphs (with an "Instance is offline" overlay when it's off) and stat tiles for Address, Uptime, CPU Load, Memory Load, and Disk Usage. Tiles show usage against the template's limits; a limit of zero displays as Unlimited. If a background operation like a remote import is running, a progress ring appears next to the power buttons where you can watch or cancel it.

### Databases Tab

Not shown for Redis, which has no named databases. Lists the databases inside the instance with their size, up to its own per-instance cap. **Create** asks only for a name (letters and numbers only) and requires the instance to be running. A warning icon next to a database means it has no user attached yet, so nothing can connect to it.

Right-click a database for:

| Action | What it does |
| --- | --- |
| **Export** | Downloads a dump of this database. |
| **Import** | Uploads a **Dump File**, optionally wiping existing data first. MongoDB imports also need the **Source Database** name the dump was taken from. |
| **Import from Remote** | Dumps another database server over a **Connection String** and imports the result. The connection string is only used to take the dump, it is never stored. Runs in the background as a cancellable operation. |
| **Recreate** | Wipes all data and recreates an empty database with the same name and user access. Type the name to confirm. |
| **Delete** | Permanently deletes the database and its data. |

### Users Tab

Per-instance database users, also capped ("0 of 10 maximum users created."). **Create** takes a **Username** (letters and numbers only) and, for everything except Redis, the **Database** the user is granted access to.

Right-click a user for **Details**, which opens the **Database Credentials** modal: address, username, password, and a **JDBC Connection String**, plus the same **Rotate Password** button classic databases have. **Delete** removes the user.

![](./images/databases/instance-credentials.webp)

### Logs Tab

A live log stream from the instance's container, the managed-database equivalent of the server console (read-only, no command input). While the agent is pulling a new Docker image, pull and extract progress bars appear beneath the log.
