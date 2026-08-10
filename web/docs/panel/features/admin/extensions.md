---
title: Extensions
description: See installed panel extensions, configure them, install new ones, and manage the extension build pipeline.
---

# Extensions

Extensions (**System** > **Extensions**) add features to the panel itself. This page shows what's installed and drives the build pipeline that compiles extensions into the panel.

::: info
The full installation walkthrough, including switching to the heavy image that extension building requires, lives at [Installing Extensions](../../extensions/installing-extensions.md). This page only describes the admin UI.
:::

## Installed Extensions

Each installed extension gets a card with its name, package name, **Version**, **Authors**, and description. Badges flag incomplete states: **Frontend missing**, **Backend missing**, **Pending build**, and **Pending removal**.

![Extensions page](./images/extensions/list.webp)

**Configure** on a card opens the extension's own settings page at `/admin/extensions/<packageName>`; it's disabled when the extension doesn't ship a configuration page. The trash icon removes an extension (with an option to also remove its database migrations); removal takes effect on the next rebuild.

## Installing and Building

- **Install extension** uploads an extension `.zip`; you can also drag and drop files onto the page. If the extension ships a license, you have to **Accept** it before it's added.
- Newly added extensions land under **Pending extensions** until you hit **Rebuild extensions**, which compiles everything and restarts the panel. Progress phases are shown live, and a running build can be stopped with **Cancel build**.
- **View build logs** opens the log of the current or last build. If a build fails, an alert shows the reason and the **Rebuild** button becomes **Retry build**.

::: warning
Extensions can only be built when the panel runs the heavy Docker image and its extension supervisor is reachable; the page warns you when either is missing. See [Installing Extensions](../../extensions/installing-extensions.md).
:::

Everything on this page is gated by the `extensions.manage` admin permission. See the [Permissions Reference](../dashboard/permissions.md).
