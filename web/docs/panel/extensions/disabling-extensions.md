---
title: Disabling Extensions
description: Turn an installed extension off without uninstalling or recompiling it, on any Calagopus Panel deployment.
---

# Disabling Extensions

Disabling an extension keeps it installed but stops the Panel from running it. On the next start, the Panel skips the extension's backend entrypoints, and the frontend never runs its entrypoint - so its routes, permissions, background tasks, model extensions, settings and pages are simply not there.

Unlike installing and uninstalling, this needs **no recompile**, which means it works on every deployment: the regular `:latest` and `:nightly` images, the `:heavy` variants, the all-in-one image and a plain binary install.

::: tip Reach for this when an extension misbehaves
An extension that breaks the Panel - a failing migration, a route that takes the API down - can be disabled to get the Panel back on its feet, without losing the extension or its data. Since Panel 1.2.7, an extension that panics in its entrypoints, or whose routes or CLI commands clash with another, is skipped on its own and shown as **Failed to start**; disable or remove it to clear that. Its migrations are skipped while it is disabled and applied again when you enable it.
:::

## Disabling an Extension

Open the Panel's extension management page under **Admin → Extensions** and flip the switch on the extension's card. It requires the `extensions.manage` admin permission.

The change is stored right away, but the Panel only picks it up when it starts, so the card shows a **Pending restart** badge until then. On the `:heavy` images the alert above the extension list has a **Restart the panel** button; everywhere else, restart the Panel the way your deployment normally does (`docker compose restart web`, `systemctl restart calagopus`, ...).

Once the Panel comes back, the extension's card shows a **Disabled** badge, and its **Configure** button is greyed out - the configuration page is registered by the entrypoint that no longer runs.

## What Happens to its Data

Nothing is removed. Disabling only stops code from running:

- **Settings** the extension stored stay in the database, untouched, and come back exactly as they were when you enable it again.
- **Migrations** are not rolled back. New migrations shipped by an update are not applied while the extension is disabled, they run the next time the Panel starts with the extension enabled - before its entrypoints run.
- **Permissions** the extension added stay valid on roles, subusers and API keys. They are not offered in the permission pickers while the extension is disabled, but existing grants survive and take effect again once you enable it.

## Things to Know

- **Its columns stay, its hooks do not.** An extension that added a column to a core table through a migration and filled it from a create handler no longer fills it while disabled. If that column is `NOT NULL` without a default, creating the model it extends will fail until you enable the extension again.
- **Other extensions calling into it** get nothing back: extension calls are not dispatched to a disabled extension, and looking up its settings from another extension fails.
- **CLI commands stay registered.** They are set up before the Panel reads which extensions are disabled, so an extension's own commands remain available.
- **Its frontend code is still shipped, but inert.** The browser still downloads and evaluates a disabled extension's frontend module - it just never runs its entrypoint, and the extension's stylesheet is loaded in a disabled state, so none of its CSS applies. What does survive is what gets baked into the shared bundle: a core component the extension replaces through [`overrides.ts`](/docs/panel/extensions/concepts/file-overrides) stays replaced. Uninstall the extension if you need the original component back.

## Uninstalling Instead

If you want the extension gone rather than paused, see [Uninstalling Extensions](/docs/panel/extensions/uninstalling-extensions) - that removes its code and requires a recompile, so it needs a `:heavy` image or a development environment.
