---
title: DB Agent Templates
description: Set up Calagopus DB Agent templates, with ready-to-import presets for PostgreSQL, MariaDB/MySQL, MongoDB, Redis, and ClickHouse.
---

# Setting up Templates

A template describes how DB Agent provisions a database of a given type. It is the database equivalent of an egg: it pins the container image(s), the environment, the resource limits, and the low-level container details (socket path, volumes, UID/GID) that DB Agent uses every time it spins up a new database from that template.

This guide first shows how to import one of the ready-made templates, then explains what each field means if you want to adapt or build your own.

### Example files

These are working templates for the five supported database types that you can import as-is, or use as a starting point. They target the official upstream images.

Right-click a link below and save the file locally.\
PostgreSQL: <a href="/db-agent-templates/postgres.yml" download>Download <code>postgres.yml</code> ➚</a>\
MariaDB / MySQL: <a href="/db-agent-templates/mariadb.yml" download>Download <code>mariadb.yml</code> ➚</a>\
MongoDB: <a href="/db-agent-templates/mongodb.yml" download>Download <code>mongodb.yml</code> ➚</a>\
Redis: <a href="/db-agent-templates/redis.yml" download>Download <code>redis.yml</code> ➚</a>\
ClickHouse: <a href="/db-agent-templates/clickhouse.yml" download>Download <code>clickhouse.yml</code> ➚</a>

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

One of: `postgres`, `mariadb`, `mongodb`, `redis`, `clickhouse`

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

For engines that can only listen on TCP, start the command with the [relay](#relay) that DB Agent mounts into every container.

### Volumes <Badge type="tip" text="Required" />

A map of host name to container path. Each entry becomes a per-instance directory on the DB Agent host, mounted into the container at the given path. Use this for the database's data directory.

::: warning
The directory that holds the socket path is bind-mounted by DB Agent on its own. Do not point a volume at that same directory (or at `/tmp`, which DB Agent already mounts as tmpfs), the overlapping mounts will conflict.
:::

Example: `data: /var/lib/postgresql`

### Socket Path <Badge type="tip" text="Required" />

The full path to the unix socket inside the container. It must match where the configured image actually creates its socket. DB Agent bind-mounts the socket's parent directory and connects over that socket, it does not reach the database over TCP.

Example: `/var/run/postgresql/.s.PGSQL.5432`

### Control Socket Path <Badge type="info" text="Optional" />

A second unix socket, used only by DB Agent itself: creating users and databases, applying permissions, size checks, queries from the Panel, the explorer, and exports and imports. When it is set, [Socket Path](#socket-path) only carries the proxied client connections. Leave it empty to use the socket path for both.

It must be in the same directory as the socket path, since only that directory is mounted. The Panel saves such a template, but DB Agent refuses to create or update an instance from it with `control_socket_path must be in the same directory as socket_path`.

Example: `/run/clickhouse/http.sock`

### Memory / Swap / Disk <Badge type="tip" text="Required" />

Container resource limits, in MiB. `0` means no limit for memory and disk, `-1` means no limit for swap. DB Agent periodically checks disk usage and stops a running instance when it reaches its nonzero disk limit. It refuses to start the instance again while it remains full. Checks follow [`disk_check_interval`](./configuration.md#disk-check-interval), so temporary overage is possible; this is not a hard filesystem quota.

Example: `512` / `-1` / `5120`

### CPU Limit <Badge type="tip" text="Required" />

The CPU limit as a percentage, where one thread equals `100`. `0` sets no limit.

Example: `50`

### IO Weight <Badge type="info" text="Optional" />

The relative block-IO weight of the container compared to others, from `0` to `1000`. Leave it empty to not set a weight. May not work on all systems.

## Relay

Some engines can't listen on a unix socket at all. Containers have no network, so since version 1.2.5 DB Agent mounts a small relay at `/usr/local/libexec/calagopus-relay` (read-only) into every container. The relay listens on unix sockets and forwards each one to a TCP port inside the container. Nothing about it is engine-specific, so it works for any TCP-only server without changes to DB Agent.

Put the relay first in the command, followed by one `--forward <socket path>=<address>` per socket and then `--` with the server's own command:

```yaml
cmd:
  - /usr/local/libexec/calagopus-relay
  - --forward
  - /run/myengine/server.sock=127.0.0.1:5000
  - --
  - /entrypoint.sh
```

The relay then runs as the container's main process and wraps the server's lifecycle:

- It starts the command after `--` as its child, passes stop and other signals on to it, and exits with the child's exit code, so restarts and crash detection behave as they would without it.
- It only creates a socket once its TCP target accepts connections. Clients see the instance as offline while the server is still starting, instead of being dropped.
- It removes its sockets when it exits.

The relay is a static binary, so it runs in any image regardless of its libc or base distribution. DB Agent ships it built in and unpacks it to `.bin/relay` under [`data_dir`](./configuration.md#data-dir) on the host, which is the file the containers mount.

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

### ClickHouse

ClickHouse needs DB Agent 1.2.5 or newer. It can only listen on TCP, so the preset runs it behind the [relay](#relay). The relay forwards two sockets:

- the native protocol (port `9000`) to `/run/clickhouse/native.sock`, the socket path, which carries client connections;
- the HTTP interface (port `8123`) to `/run/clickhouse/http.sock`, the [control socket path](#control-socket-path), which DB Agent uses to manage the instance.

The command after `--` is the image's own `/entrypoint.sh`, which starts the server. The official image runs as UID/GID `101`.

The first time DB Agent manages the instance, it uses the image's passwordless `default` user, which is only reachable from inside the container, to create its own `calagopus_root` account, and uses that account from then on.

ClickHouse starts several hundred threads, and they count towards [`docker.container_pid_limit`](./configuration.md#docker-container-pid-limit). With a limit much below 1000 the server aborts on startup with `Couldn't get 512 threads from global thread pool`. The default limit is high enough, but an agent upgraded from a version before 1.2.5 still has the old `512` in its `config.yml`. Docker installs from before 1.2.5 also need `- 9000:9000` added under `ports:` in `compose.yml`, or ClickHouse can't be reached from outside the host.

Remote import and the database explorer are not available for ClickHouse. Exports and database backups are ClickHouse's own `BACKUP` archives (`.zip`), and imports restore such an archive, optionally from a different source database name. Queries from the Panel run through ClickHouse's own SQL.
