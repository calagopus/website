---
title: Assets
description: Host public files on your panel, like the icons and banners referenced from the Application settings.
---

# Assets

Assets (**System** > **Assets**) is a small file browser for publicly served files. Anything you upload here gets a public URL, which is exactly what the **Icon** and **Banner** fields in [Settings > Application](./settings.md#application) expect: those fields autocomplete from your uploaded assets.

The browser shows a breadcrumb (starting at `assets`) and a table with **Name**, **Size**, and **Created**. Click a directory to enter it, click a file name to open it in a new tab.

![Assets browser](./images/assets/list.webp)

## Uploading and Organizing

- **Upload** picks files from your machine; you can also drag and drop files anywhere on the page ("Drop files here to upload").
- **New Directory** creates a folder inside the current one; the modal previews the full path it will be created at.

## Managing Assets

Right-click a file for:

- **Copy Link**: copies the asset's public URL.
- **Delete**: removes the asset after confirmation. Deletion cannot be undone.

You can also select multiple files (checkboxes, Ctrl+click, drag selection, or Ctrl+A for everything on the page) and delete them in one go with the action bar or the Delete key.

## Public URLs

With the default filesystem storage driver, assets are served by the panel itself at `<panel URL>/assets/<path>`, e.g. `https://panel.example.com/assets/branding/icon.png`. With the S3 storage driver, links use the bucket's configured **Public URL** instead. The storage driver is set in [Settings > Storage](./settings.md#storage).

Uploading requires the `assets.upload` admin permission, deleting `assets.delete`, viewing `assets.read`. See the [Permissions Reference](../dashboard/permissions.md).
