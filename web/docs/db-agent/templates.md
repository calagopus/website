---
title: DB Agent Templates
description: Set up Calagopus DB Agent templates, with ready-to-import presets for PostgreSQL, MariaDB/MySQL, MongoDB, and Redis.
---

# Setting up Templates

A template describes how DB Agent provisions a database of a given type. It is the database equivalent of an egg: it pins the container image(s), the environment, the resource limits, and the low-level container details (socket path, volumes, UID/GID) that DB Agent uses every time it spins up a new database from that template.

This guide first shows how to import one of the ready-made templates, then explains what each field means if you want to adapt or build your own.

### Example files

These are working templates for the four supported database types that you can import as-is, or use as a starting point. They target the official upstream images.

Right-click a link below and save the file locally.\
PostgreSQL: <a href="/db-agent-templates/postgres.yml" download>Download <code>postgres.yml</code> ➚</a>\
MariaDB / MySQL: <a href="/db-agent-templates/mariadb.yml" download>Download <code>mariadb.yml</code> ➚</a>\
MongoDB: <a href="/db-agent-templates/mongodb.yml" download>Download <code>mongodb.yml</code> ➚</a>\
Redis: <a href="/db-agent-templates/redis.yml" download>Download <code>redis.yml</code> ➚</a>

If your setup differs from the defaults, follow the [field reference](#field-reference) below to adapt the template to your image.

### Import the template

Once the template file has been downloaded, head to your Calagopus Panel's admin page, and click on `Database Agent Templates` on the side.

Then, click on the Import button and import the file. You can also drag and drop one or more `.yml`, `.yaml`, or `.json` files anywhere onto the page. Each file creates one new template.

::: tip
To back up or copy a template between panels, open it and use the `Export` button to download it again as YAML or JSON.
:::

### Adapt it to your image

The socket path, command, and UID/GID in a template must match the exact image it deploys. The presets already line these up for the official images, but if you switch to a different image, work through the [field reference](#field-reference) and double-check the [per-type notes](#per-type-notes).

Once the template is saved and `Deployment Enabled` is on, users can deploy databases from it.

## Field reference

Every field below maps directly to a key in the template file. For all the fields, the presets already provide sensible defaults, you mainly need to review the images and resource limits.

### Name <Badge type="tip" text="Required" />

The display name of the template, shown when a user picks a database type to deploy.

Example: `PostgreSQL`

### Description <Badge type="info" text="Optional" />

An optional free-text description, useful for organizing templates in the admin list.

### Type <Badge type="tip" text="Required" />

The database engine this template provisions. This selects which DB Agent proxy the resulting database is routed through.

One of: `postgres`, `mariadb`, `mongodb`, `redis`

### Docker Images <Badge type="tip" text="Required" />

A map of label to image. Users pick one of these images when deploying, and the first entry is the default. At least one image is required, and no image may appear twice.

Example: `Postgres 18: postgres:18-alpine`

### Environment Variables <Badge type="info" text="Optional" />

Environment variables passed into the database container. `TZ` is injected automatically from the database's timezone, so you don't need to set it here.

Example: `POSTGRES_HOST_AUTH_METHOD: trust`

### Image UID / Image GID <Badge type="tip" text="Required" />

The UID and GID the image runs its database process as. DB Agent `chown`s the socket directory and every volume directory to this UID/GID so the container can write to them, so these must match the image's actual database user.

Example: `70` / `70` (Alpine Postgres)

### Command <Badge type="info" text="Optional" />

An optional command override, given as a list of arguments. Leave it empty to use the image's default entrypoint. Some engines need this to place their socket at a predictable path, see [per-type notes](#per-type-notes).

Example: `[redis-server, --unixsocket, /run/redis/redis.sock]`

### Volumes <Badge type="tip" text="Required" />

A map of host name to container path. Each entry becomes a per-instance directory on the DB Agent host, mounted into the container at the given path. Use this for the database's data directory.

::: warning
The directory that holds the socket path is bind-mounted by DB Agent on its own. Do not point a volume at that same directory (or at `/tmp`, which DB Agent already mounts as tmpfs), the overlapping mounts will conflict.
:::

Example: `data: /var/lib/postgresql`

### Socket Path <Badge type="tip" text="Required" />

The full path to the unix socket inside the container. It must match where the configured image actually creates its socket. DB Agent bind-mounts the socket's parent directory and connects over that socket, it does not reach the database over TCP.

Example: `/var/run/postgresql/.s.PGSQL.5432`

### Memory / Swap / Disk <Badge type="tip" text="Required" />

Container resource limits, in MiB. `0` means no limit for memory and disk, `-1` means no limit for swap. DB Agent periodically checks disk usage and stops a running instance when it reaches its nonzero disk limit. It refuses to start the instance again while it remains full. Checks follow [`disk_check_interval`](./configuration.md#disk-check-interval), so temporary overage is possible; this is not a hard filesystem quota.

Example: `512` / `-1` / `5120`

### CPU Limit <Badge type="tip" text="Required" />

The CPU limit as a percentage, where one thread equals `100`. `0` sets no limit.

Example: `50`

### IO Weight <Badge type="info" text="Optional" />

The relative block-IO weight of the container compared to others, from `0` to `1000`. Leave it empty to not set a weight. May not work on all systems.

## Per-type notes

The presets place sockets under `/run/...` so they never collide with the data volume or the tmpfs `/tmp`.

### PostgreSQL

Postgres creates its socket in `/var/run/postgresql` by default, so no command override is needed. The Alpine `postgres` image runs as UID/GID `70` (the Debian image uses `999`). `POSTGRES_HOST_AUTH_METHOD: trust` lets DB Agent manage authentication itself.

### MariaDB / MySQL

Both create their socket at `/run/mysqld/mysqld.sock` by default and run as UID/GID `999`. `MARIADB_ALLOW_EMPTY_ROOT_PASSWORD: '1'` lets the container start without a preset root password, since DB Agent provisions credentials itself.

### MongoDB

MongoDB writes its socket to `/tmp` by default, which conflicts with DB Agent's tmpfs mount. The preset's command overrides this with `--unixSocketPrefix /run/mongodb` and enables `--auth`, so the socket lands at `/run/mongodb/mongodb-27017.sock`.

Custom MongoDB templates must also enforce authorization. DB Agent refuses proxied sessions if MongoDB starts without it, with `mongod does not enforce authorization, add --auth and restart`. DB Agent bootstraps its own root account; it does not add `--auth` to a custom command automatically.

### Redis

Redis does not open a unix socket unless told to, so the preset's command starts `redis-server` with `--unixsocket /run/redis/redis.sock`.
