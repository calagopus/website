# Migrating to Docker Compose

This guide covers migrating an existing Calagopus standalone installation into Docker without losing your users, servers, or configuration. The process involves two things: copying your encryption key, and exporting your PostgreSQL database and importing it into the new Docker-managed database. No data transformation is required, the schema is identical between installations.

::: info
This guide covers the standalone panel compose setup only. If you want to migrate to an All-in-One setup instead, follow the [Docker installation guide](../../../panel/installation/docker.md) first, then return here for the database migration steps.
:::

::: info This guide assumes
- You're using the standard standalone installation
- Your database is running locally (default setup)
- You're moving to the standard Docker Compose setup

If your setup differs significantly (custom database hosts, unusual configurations), you may need to adapt some steps.
:::

## Overview

Here's what you'll be doing at a high level:

- Grab your `APP_ENCRYPTION_KEY` and database password from your existing installation
- Create the Docker Compose file and plug in those values
- Start the database container
- Dump the existing database and restore it into Docker
- Start the full stack and verify everything works

## Before You Start

Make sure you have:

- A working standalone Calagopus installation
- Docker and Docker Compose installed on the target host
- Access to `/etc/calagopus/.env` on your standalone system
- `pg_dump` available on your standalone system (it should already be there if PostgreSQL is installed)

## Collect values from your existing installation

Open your existing configuration file:

```bash
cat /etc/calagopus/.env
```

You need two values from this file:

**`APP_ENCRYPTION_KEY`** a 16-character alphanumeric string that was generated during initial setup:

```txt
APP_ENCRYPTION_KEY=Ab3xZ9qR2mKp7vLw
```

**The database password** found in `DATABASE_URL`:

```txt
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

The password is the segment between the second `:` and the `@` - in the example above, that is `yourPassword`.

::: warning
The `APP_ENCRYPTION_KEY` must be copied exactly as-is. It is used to decrypt sensitive data stored in your database. If it is wrong or missing, that data cannot be recovered.
:::

Keep both values handy. You'll need them in the next step.

## Set up your Docker directory

Create a directory to hold your Compose file and persistent data:

```bash
mkdir -p /opt/calagopus
cd /opt/calagopus
```

## Create the Docker Compose file

Create `/opt/calagopus/docker-compose.yml` with the following content. **Before saving, replace the placeholder values** marked with comments:

```yaml
services:
  web:
    image: ghcr.io/calagopus/panel:latest
    restart: unless-stopped
    environment:
      - TZ=Europe/Berlin
      - REDIS_URL=redis://cache
      - DATABASE_URL=postgresql://panel:YOUR_DB_PASSWORD@db/panel # enter your db password
      - DATABASE_MIGRATE=true
      - PORT=8000
      - APP_DEBUG=false
      - APP_LOG_DIRECTORY=/var/log/calagopus
      - APP_PRIMARY=true
      - APP_ENABLE_WINGS_PROXY=true
      - APP_ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY  # paste your key from above
      - APP_USE_DECRYPTION_CACHE=true
      - APP_USE_INTERNAL_CACHE=true
    volumes:
      - ./data:/var/lib/calagopus
      - ./logs:/var/log/calagopus
    ports:
      - 8000:8000
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - db
      - cache

  db:
    image: ghcr.io/calagopus/pgautoupgrade:18-alpine
    restart: unless-stopped
    environment:
      - TZ=Europe/Berlin
      - POSTGRES_USER=panel
      - POSTGRES_PASSWORD=YOUR_DB_PASSWORD  # use the same password as above
      - POSTGRES_DB=panel
      - PGDATA=/data
    volumes:
      - ./postgres:/data

  cache:
    image: ghcr.io/calagopus/valkey:latest
    restart: unless-stopped
    command: --protected-mode no --save 60 1
    environment:
      TZ: Europe/Berlin
    volumes:
      - ./cache:/data
```

Replace:

- `YOUR_ENCRYPTION_KEY` with the `APP_ENCRYPTION_KEY` value collected above
- `YOUR_DB_PASSWORD` (both occurrences) with your old database password, or a new one - the value must match in both the `web` and `db` service definitions.

## Start the database and cache

Start only the database and cache containers for now. The web container will fail on first boot if the database isn't populated yet.

```bash
docker compose up -d db cache
```

Wait a few seconds for the database to finish initializing, then confirm it's running:

```bash
docker compose ps
```

Both `db` and `cache` should show as `running`.

## Export your existing database

Run this on your **standalone system** (not inside Docker). Replace `yourPassword` with the password collected earlier:

```bash
PGPASSWORD="yourPassword" pg_dump \
  -h 127.0.0.1 \
  -U calagopus \
  -d panel \
  -F c \
  -f /opt/calagopus/panel.backup
```

This creates a compressed database dump at `/opt/calagopus/panel.backup`.

> If you're migrating to a different host, copy `panel.backup` to `/opt/calagopus/` on the target machine before continuing.

## Import the database into Docker

From `/opt/calagopus` on your Docker host, run the following:

```bash
docker exec -i calagopus-db-1 pg_restore \
  -U panel \
  -d panel \
  --no-owner \
  --clean \
  --if-exists \
  < panel.backup
```

You may see some harmless notices about dropping objects that don't exist yet - that's normal. The restore is successful as long as the command exits without errors.

## Start the full stack

```bash
docker compose up -d
```

The web container will run any pending database migrations automatically on first boot (`DATABASE_MIGRATE=true`).

## Verify the migration

Once the stack is up, open Calagopus in your browser and check:

- You can log in with your existing credentials
- Your servers are visible and intact
- No setup wizard (OOBE) appears (if it does, the database import likely did not work - see below)
- Wings nodes are still connected

## Troubleshooting

**Setup wizard (OOBE) appears after starting:**

The database was not imported correctly, or the wrong database was targeted. Stop the stack, double-check the import command used the right container name (`calagopus-db-1`), re-run the import, then restart with `docker compose restart web`.

**Login fails / encrypted data appears corrupted:**

Your `APP_ENCRYPTION_KEY` in `docker-compose.yml` probably doesn't match the one from your original installation. Stop the stack, correct the key and run `docker compose up -d` again.
