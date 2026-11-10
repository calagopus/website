---
title: Migrating from Pelican
description: How to migrate from Pelican to Calagopus. The built-in importer copies users, servers, nodes, and eggs from your Pelican database to a fresh Calagopus instance.
---

# Migrating from Pelican

Calagopus includes an importer that reads a Pelican database and writes equivalent records into a fresh Calagopus database. The import plan includes users, servers, nodes, and eggs. Review any repaired or skipped records before writing it; users whose accounts import successfully can sign in with their existing credentials.

API keys and active login sessions do not migrate. Users need to sign in again. Generate new API keys and update your integrations: the Calagopus API differs from Pelican's, so existing API scripts also need changes.

This guide covers the panel database migration only. Your nodes already run Pelican Wings, so they don't need a fresh install: follow [Migrating Wings Nodes](./wings.md) on each one once the panel is done.

## Pick Your Path

Pelican comes in two flavors and the import process is slightly different for each. Figure out which one you're running and follow the matching guide:

| You're running | Guide |
| --- | --- |
| A normal install on a Linux box, Pelican running directly on the host | [Standalone](./pelican/standalone.md) |
| Pelican inside Docker containers, with a `docker-compose.yml` somewhere | [Dockerized](./pelican/docker.md) |

If you're not sure which setup you're using, run `sudo docker compose ps` in your Pelican directory. If it shows a running panel/web container, you're using Docker. Otherwise, you're using Standalone. A `docker-compose.yml` file alone doesn't indicate a Docker setup.

## Import Options

The importer reads the source, validates an import plan, and reports problems before writing records. Start with `--dry-run --on-invalid=abort` to inspect that plan. Add the options below to the import command in your installation guide; keep its `--environment` path and Docker prefix where applicable.

| Option | Behavior |
| --- | --- |
| `--dry-run` | Validates and reports without writing imported records or applying the imported Panel settings. |
| `--on-invalid=ask` | Default. Prompts for decisions in a terminal; aborts on unresolved problems when no terminal is attached. |
| `--on-invalid=abort` | Reports validation problems and stops without importing if any are found. |
| `--on-invalid=fix` | Applies suggested repairs where available and skips rows that cannot be repaired. Review the report and planned counts before writing. |
| `--on-invalid=skip` | Skips rows with validation problems. Dependent records may also need to be skipped. |
| `--report /path/report.json` | Writes problems, fixes, and skipped rows to a JSON file on the machine or container running the command. |
| `--unlimited-as 100` | Converts unlimited source database, allocation, and backup limits to this value. Defaults to `100`. |
| `--force` | Allows an occupied target and checks imported rows against its existing records. It does not clear the target or overwrite conflicting records automatically. |
| `--yes` / `-y` | Skips the final confirmation before writing. It does not choose a policy for invalid rows. |

For example, after reviewing an initial report, `--dry-run --on-invalid=fix` previews the proposed repairs and skipped rows. Remove `--dry-run` only when that result is acceptable. For unattended imports, choose an explicit invalid-row policy instead of relying on interactive prompts.

A failed data write rolls back the import. Panel settings are saved after the data commits: if only that step fails, the importer tells you to set the URL, name, and mail settings in the admin area. Keep the imported records and repair those settings rather than running the import again.

## Troubleshooting

The importer shares its code with the Pterodactyl one, so connection and data errors are covered under [Troubleshooting the Import](./pterodactyl.md#troubleshooting-the-import) on that page. Two things are specific to Pelican.

::: details Login fails with "Invalid username or password" for an account that had an empty password on Pelican
Signing in with an empty password doesn't work on Calagopus. Set a new password from the CLI with `sudo docker compose exec web calagopus-panel users reset-password` on Docker, or `sudo calagopus-panel users reset-password` from `/etc/calagopus` otherwise, then sign in with it.
:::

::: details Wings logs a JSON parse error naming a missing field such as `oom_disabled`, and the panel can't connect
The `remote:` URL in the Wings config still points at the Pelican panel. Set it to the Calagopus panel's address and restart Wings.
:::

::: details Config file replacements such as `{{server.environment.SERVER_NAME}}` are written literally, and the Wings log says `unknown server variable: server.environment.SERVER_NAME`
Calagopus Wings exposes the environment as `server.env`. Wings from 1.1.4 on accepts `server.environment` as an alias. On older versions, edit the egg's config file replacements to use `{{server.env.SERVER_NAME}}`.
:::
