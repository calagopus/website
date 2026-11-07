---
description: Migrate to Calagopus from Pterodactyl or Pelican, or move an existing Calagopus install between Docker and standalone deployments.
---

# Migrations

Pick the guide for what you're doing:

| You want to | Guide |
| --- | --- |
| Move from Pterodactyl to Calagopus | [Migrating from Pterodactyl](./pterodactyl.md) |
| Move from Pelican to Calagopus | [Migrating from Pelican](./pelican.md) |
| Move an existing Pterodactyl or Pelican node to Calagopus Wings | [Migrating Wings Nodes](./wings.md) |
| Move a standalone Calagopus install to Docker | [Migrating to Docker Compose](./calagopus/docker.md) |
| Move a Calagopus install in Docker to standalone | [Migrating to Standalone](./calagopus/standalone.md) |

## Resetting the Calagopus Database

::: danger This wipes the Calagopus database
Only do this if you want to discard everything in it and start fresh, for example after clicking through the OOBE on a new install. It isn't needed after a failed import that reports a rollback.
:::

Pick the tab that matches how Calagopus is installed:

::::tabs
=== Docker
From the directory with your Calagopus compose file:

```bash
sudo docker compose down
sudo rm -r postgres
sudo docker compose up -d
```

=== APT/RPM, Binary

On Linux:

```bash
sudo systemctl stop calagopus-panel
sudo -u postgres psql <<'SQL'
DROP DATABASE panel WITH (FORCE);
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
SQL
sudo systemctl start calagopus-panel
```

On Windows, run `nssm stop "Calagopus Panel"`, then run the three SQL lines above in the SQL Shell (the Windows tab of the [binary guide](../../panel/installation/binary.md) shows how to open it), and finish with `nssm start "Calagopus Panel"`.

::::
