# Switching to the Heavy Image

If you're running the regular `:latest` (or `:nightly`) Docker image and want to start using extensions, you'll need to switch to the heavy variant - `:heavy` (or `:nightly-heavy`). This page walks through the swap.

The migration itself is small: edit two things in your `compose.yml`, restart the stack, done. No database migration, no data export, no settings to re-enter. Your existing data carries over because the heavy image runs against the same Postgres, the same Redis, the same volumes.

::: warning Confirm system requirements first
The heavy image needs notably more CPU and disk than the regular image, because it ships with the Rust toolchain and Node.js needed to recompile the Panel when you install or uninstall extensions. RAM also spikes during a build. Before switching, double-check your host meets the minimum requirements for the heavy image: see [Panel - Minimum Requirements](../overview.md#minimum-requirements).

If you're on a tight VPS or a low-spec home server, you may want to scale up before the swap rather than discover mid-build that you've run out of RAM.
:::

## Handle Your Encryption Key Carefully

This is the one part of the migration that's actually dangerous to mess up.

Both the stock and heavy compose files contain `APP_ENCRYPTION_KEY=CHANGEME` as a placeholder. **You almost certainly already replaced that with a real key when you first set up the Panel.** That key is what encrypts secrets in your database (API tokens, SMTP passwords, anything sensitive). If you lose the key or change it, every previously-encrypted value becomes unrecoverable - your Panel will very likely become non-functional until you clean up the database and re-enter any secrets.

Two rules:

- **Preserve the exact same `APP_ENCRYPTION_KEY` value** when you edit your compose. Don't regenerate it. Don't treat `CHANGEME` in the heavy compose example below as something to randomize - that's the placeholder; your real value goes in its place.
- **Treat your compose file as a secret.** Don't commit it to a public repo, don't paste it into a support channel, don't share screenshots without redacting it. Anyone with the encryption key can decrypt the secrets stored in your database.

::: details I lost my encryption key. Now what?
Stop the Panel, restore the database from a backup taken before the key was lost (if you have one), and start over from there. Without a backup or the original key, the encrypted columns in the database are permanently unrecoverable - the practical recovery is to simply start with a fresh database, which means losing all your existing data and settings. If you find yourself in this situation, it's a good idea to review your backup strategy and secret management practices to prevent it from happening again.
:::

## The Swap

Stop the stack:

```bash
docker compose down
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
If you're on an `:aio` variant (panel + Wings bundled in one container), switch to the **`-aio`** heavy variant - `:heavy-aio` or `:nightly-heavy-aio`. Switching from `:aio` directly to plain `:heavy` will break your bundled Wings node, since plain `:heavy` doesn't include Wings. The migration is otherwise structurally identical between AIO and non-AIO.
:::

```diff
 services:
   web:
-    image: ghcr.io/calagopus/panel:latest
+    image: ghcr.io/calagopus/panel:heavy
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

The `./build/` host directories don't need to exist beforehand - Docker creates them on startup as needed.

Bring the stack back up:

```bash
docker compose up -d
```

That's it. The heavy image starts, picks up the same database and existing volumes, and from this point on you can install extensions through the admin UI. See [Installing Extensions](./installing-extensions.md).

## Reverting

If you decide the heavy image isn't for you (resource pressure, you're not actually using extensions), reverting is the same dance in reverse:

1. Edit `compose.yml`, change the heavy tag back to its non-heavy equivalent (e.g. `:heavy` → `:latest`, `:heavy-aio` → `:aio`).
2. `docker compose down` then `docker compose up -d`.

The stock image simply ignores anything under `./build/*` and starts cleanly. You don't need to uninstall extensions first, and you don't need to remove the four extra volume mounts you added (though you can clean them up if you want a tidy compose file). Your data carries over the same way it did in the original swap.

The extension code in `./build/extensions` stays on disk while you're on the stock image, so if you switch back to heavy later, your previously-installed extensions are still there and recompile on startup. Otherwise simply remove them from the compose and delete them from disk.
