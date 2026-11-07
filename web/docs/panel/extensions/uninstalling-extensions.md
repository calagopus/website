---
title: Uninstalling Extensions
description: Remove an extension from your Calagopus Panel, and what happens to its data when you do.
---

# Uninstalling Extensions

This page covers removing an extension from your Panel, and what happens to its data (it stays).

If you only want to stop an extension from running for a while, you don't have to uninstall it: [Disabling Extensions](./disabling-extensions.md) turns one off in place, with no rebuild and nothing removed.

::: warning Data is not removed when an extension is uninstalled
Uninstalling an extension removes its code, not its data. The settings the extension stored, any rows it wrote into core tables via model extensions, and any tables/columns its migrations created **all stay in the database**. The Panel deliberately leaves them alone, because:

- If you reinstall the same extension later (after troubleshooting, or to upgrade to a newer version), it picks up where it left off: users keep their configuration and server data isn't wiped.
- If you remove an extension for good, you decide whether to inspect, archive or drop the data it left behind.

There's an opt-in `--remove-migrations` flag on the dev-environment uninstall command that will roll back the extension's migrations during removal. **It's not recommended.** Rolling back migrations drops columns and tables and deletes data. If you want it gone, take a backup and clean up the database by hand instead, so you know exactly what is deleted.
:::

::: warning Requires the `:heavy` image or a development environment
Same as installing: the regular `:latest` and `:nightly` Docker images don't have the toolchain to recompile after an extension is removed. You need either the `:heavy` / `:nightly-heavy` Docker image variant, or a full local development environment.
:::

## Uninstall an Extension

Pick the matching tab for your environment:

::::tabs
=== With Docker

Two ways to uninstall, same end result.

**Option 1: Remove through the admin UI.** Open the Panel's extension management page, find the extension you want to remove, and click Uninstall. The Panel handles the recompile and reload.

![Placeholder: extension uninstall UI](./admin-extensions-ui-remove.webp)

**Option 2: Delete the file and restart.** Remove the `.c7s.zip` from the Panel's `extensions/` data directory (with the default heavy compose stack, that's `./build/extensions` relative to your compose file), then restart the container:

```bash
sudo docker compose restart web
```

The Panel notices the file is gone on startup and uninstalls accordingly.

=== With Development Environment

Run the remove command with the extension's package name (the same identifier from its `Metadata.toml`):

```bash
panel-rs extensions remove dev.yourname.extension
```

That removes the extension source from your tree but leaves the existing compiled binary running. To recompile without it:

```bash
panel-rs extensions apply --profile balanced
```

This is the same `apply` command used after installing; it rebuilds the Panel with the extensions currently in the source tree.

::: details Removing migrations as well
If you are certain you want the extension's database changes rolled back along with its code, there's a `--remove-migrations` flag:

```bash
panel-rs extensions remove dev.yourname.extension --remove-migrations
```

This runs the extension's `down.sql` migrations during removal. **Read the data-persistence warning at the top of this page first.** It is destructive, can't be undone without a backup, and is rarely what you want. Prefer cleaning up the database by hand once you've checked what's in there.
:::

::::

## After Uninstalling

The Panel's no longer running the extension's code, but the extension's data is still in the database. What you do next depends on why you uninstalled:

- **Troubleshooting**: reinstall the same `.c7s.zip` and the extension picks up with all its previous data. The Panel doesn't track "this extension was uninstalled and reinstalled" as a distinct state; it just sees the source is back and compiles it in.
- **Upgrading to a new version**: there's no need to uninstall the old one first. On Docker, upload the new `.c7s.zip` or overwrite the archive in `./build/extensions`; in the development environment run `panel-rs extensions update path/to/extension.c7s.zip`, since `extensions add` refuses a package that is already installed. The Panel handles the swap, and the extension's own migration scripts handle any schema changes between versions.
- **Permanent removal**: the extension's columns and tables stay in your database. If you want them gone, write SQL to drop them manually after taking a backup. Look at the extension's `migrations/` directory (in the original `.c7s.zip` if you still have it) to see exactly what got created.
