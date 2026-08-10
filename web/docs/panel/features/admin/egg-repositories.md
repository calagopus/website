---
title: Egg Repositories
description: Connect Git repositories full of eggs and sync them for browsing and installing into your nests.
---

# Egg Repositories

Egg repositories connect Git repositories containing egg definitions to your panel, so you can browse and install eggs without downloading files by hand. This page describes the admin surface; the full setup and usage walkthrough, including importing and updating eggs, lives in [Setting up Egg Repositories](../../next-steps/egg-repos.md).

The list shows ID, Name, Description, **Git Repository**, and Created. Repositories you selected during the panel's first-time setup appear here already.

![](./images/egg-repositories/list.webp)

## Creating a Repository

Click **Create** and fill in **Name**, **Git Repository** (the repository URL), and an optional **Description**.

For private repositories, enable the **Repository Credentials** section and pick a **Credential Type**: **None**, **Password** (a **Password or Access Token**), or **Private Key** (an SSH **Private Key** with optional **Passphrase**).

## Syncing

Open a repository and hit **Sync**. The panel clones the repository, scans it for egg definitions (`.json`, `.yml`, `.yaml`, with any nearby README picked up for the preview drawer), refreshes the repository's egg list, and drops entries that no longer exist in the repository. Syncing never installs or modifies eggs in your nests; it only updates what's available to install.

## Eggs Tab

The **Eggs** tab lists everything found by the last sync (Path, Name, Author, Description, Updated). Click a row to preview its README, or select eggs and **Install** them into a nest. See [the walkthrough](../../next-steps/egg-repos.md) for the install and update flows step by step.

::: info
Actions here map to the `egg-repositories.*` admin permissions (syncing needs `egg-repositories.sync`); see the [Permissions Reference](../dashboard/permissions.md).
:::
