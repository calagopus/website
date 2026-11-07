---
title: Switching to the Heavy Image
description: Swap from the regular Docker image to the heavy variant that supports extensions.
---

# Switching to the Heavy Image

If you're running the regular `:latest` (or `:nightly`) Docker image and want to start using extensions, you need the heavy variant, `:heavy` (or `:nightly-heavy`).

The switch is small: change two things in your `compose.yml` and restart the stack. There's no database migration, data export or settings to re-enter, because the heavy image uses the same Postgres, Redis and volumes.

::: warning Confirm system requirements first
The heavy image needs considerably more CPU and disk than the regular image, because it ships with the Rust toolchain and Node.js needed to recompile the Panel when you install or uninstall extensions. RAM also spikes during a build. Before switching, double-check your host meets the minimum requirements for the heavy image: see [Panel - Minimum Requirements](../overview.md#minimum-requirements).

If you're on a tight VPS or a low-spec home server, you may want to scale up before the swap rather than discover mid-build that you've run out of RAM.
:::

## Handle Your Encryption Key Carefully

This is the one part of the migration that's actually dangerous to mess up.

Both the stock and heavy compose files contain `APP_ENCRYPTION_KEY=CHANGEME` as a placeholder. **You almost certainly already replaced that with a real key when you first set up the Panel.** That key is what encrypts secrets in your database (API tokens, SMTP passwords, anything sensitive). If you lose or change the key, every value encrypted with it becomes unrecoverable, and the Panel will most likely stop working until you clean up the database and re-enter the secrets.

Two rules:

- **Preserve the exact same `APP_ENCRYPTION_KEY` value** when you edit your compose. Don't regenerate it. `CHANGEME` in the heavy compose example below is only a placeholder; put your existing value in its place.
- **Treat your compose file as a secret.** Don't commit it to a public repo, don't paste it into a support channel, don't share screenshots without redacting it. Anyone with the encryption key can decrypt the secrets stored in your database.

::: details I lost my encryption key. Now what?
Stop the Panel, restore the database from a backup taken before the key was lost (if you have one), and start over from there. Without a backup or the original key, the encrypted columns are permanently unrecoverable, and the only way forward is a fresh database, losing all existing data and settings. Review your backup strategy and secret management practices to prevent it from happening again.
:::

## The Swap

Stop the stack:

```bash
sudo docker compose down
```

Open `compose.yml` and make two changes to the `web` service.

**Change 1: Update the image tag.** Match your current tag to the heavy equivalent:

| You're on | Switch to |
| --- | --- |
| `:latest` | `:heavy` |
| `:nightly` | `:nightly-heavy` |
| `:aio` | `:heavy-aio` |
| `:nightly-aio` | `:nightly-heavy-aio` |

::: warning AIO operators: stay on the AIO track
If you're on an `:aio` variant (panel + Wings bundled in one container), switch to the **`-aio`** heavy variant: `:heavy-aio` or `:nightly-heavy-aio`. Switching from `:aio` directly to plain `:heavy` will break your bundled Wings node, since plain `:heavy` doesn't include Wings. Otherwise the switch is the same for AIO and non-AIO.
:::

```diff
 services:
   web:
-    image: calagopus/panel:latest
+    image: calagopus/panel:heavy
```

**Change 2: Add four new volume mounts** for the build artifacts the heavy image produces. These get added to the existing `volumes:` block under `web`:

```diff
     volumes:
       - ./data:/var/lib/calagopus
       - ./logs:/var/log/calagopus
+      - ./build/binaries:/app/binaries
+      - ./build/translations:/app/translations
+      - ./build/extensions:/app/extensions
+      - ./build/extension-migrations:/app/repo/database/extension-migrations
```

The `./build/` host directories don't need to exist beforehand; Docker creates them on startup.

Bring the stack back up:

```bash
sudo docker compose up -d
```

The heavy image starts, picks up the same database and existing volumes, and from this point on you can install extensions through the admin UI. See [Installing Extensions](./installing-extensions.md).

## Reverting

If you decide the heavy image isn't for you (resource pressure, you're not actually using extensions), reverting works the same way in reverse:

1. Edit `compose.yml`, change the heavy tag back to its non-heavy equivalent (e.g. `:heavy` → `:latest`, `:heavy-aio` → `:aio`).
2. `sudo docker compose down` then `sudo docker compose up -d`.

The stock image ignores anything under `./build/*` and starts cleanly. You don't need to uninstall extensions first, and you don't need to remove the four extra volume mounts you added (though you can clean them up if you want a tidy compose file). Your data carries over the same way it did in the original swap.

The extension code in `./build/extensions` stays on disk while you're on the stock image, so if you switch back to heavy later, your previously-installed extensions are still there and recompile on startup. Otherwise remove them from the compose and delete them from disk.
