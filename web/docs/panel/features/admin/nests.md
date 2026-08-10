---
title: Nests
description: Organize eggs into nests and manage everything about an egg, from install script and startup behavior to variables, mounts, and exports.
---

# Nests

Nests are categories for eggs, and eggs are the templates that define how a server type is installed, started, stopped, and configured. Everything egg-related lives here: a nest holds its eggs, and each egg holds its install script, startup and stop configuration, variables, and Docker images.

The list shows each nest's ID, name, author, description, and created timestamp. Use the search box to filter, click a nest's ID to open it, or hit **Create** in the top right for a new one.

![](./images/nests/list.webp)

## Creating and Editing a Nest

A nest is just three fields: **Name**, **Author**, and an optional **Description**. **Save** creates it, **Save & Stay** creates it without leaving the form.

Opening an existing nest shows two tabs: **General**, the same form plus a **Delete** button, and **Eggs**. Deleting a nest asks whether you also want to delete all eggs inside it, via the **Do you want to delete all eggs in this nest?** switch in the confirmation.

## Eggs

The **Eggs** tab lists the nest's eggs with the same columns as the nest list (ID, Name, Author, Description, Created) plus a selection checkbox per row.

![](./images/nests/eggs-list.webp)

Eggs support bulk operations: drag across rows to select, Ctrl/Cmd-click or use the checkboxes, Ctrl/Cmd+A to select everything, Escape to clear. With eggs selected, an action bar appears with **Update from Repository**, **Move** (to another nest), and **Delete**.

### Creating an Egg

**Create** opens the egg form described under [General](#general) below. New eggs start with a stub install script (a `debian:latest` container running `/bin/bash`) that you fill in afterwards.

### Importing Eggs

**Import** accepts an egg file in JSON or YAML format (`.json`, `.yml`, `.yaml`), including eggs exported from Pterodactyl. You can also drag files from your file manager anywhere onto the page and drop them to import several at once.

To pull eggs from a Git repository instead of files, use [Egg Repositories](./egg-repositories.md).

## Editing an Egg

Opening an egg shows five tabs: **General**, **Installation Script**, **Variables**, **Mounts**, and **Servers**.

### General

The top of the form covers identity and repository linkage:

| Field | What it does |
|---|---|
| **Author** / **Name** / **Description** | Basic metadata. |
| **Egg Repository** / **Egg Repository Egg** | Links this egg to an egg from a synced [egg repository](./egg-repositories.md), enabling **Update from Repository**. |

![](./images/nests/egg-general.webp)

Below that, three configuration cards:

- **Startup Configuration**: **Startup Done**, one or more console messages indicating startup completion (the panel marks the server as running when one appears), and **Strip ANSI from startup messages**, which removes ANSI control characters before matching.
- **Stop Configuration**: **Stop Type** is **Send Command** (with a **Stop Command** field), **Send Signal** (with a **Stop Signal** picker: `SIGABRT`, `SIGINT`, `SIGTERM`, `SIGQUIT`, `SIGKILL`), or **Docker Stop**.
- **Config Files Configuration**: files the panel rewrites on boot. Each entry has a **File Path**, a **Parser** (File, YAML, Properties, INI, JSON, XML, TOML), a **Create New File** switch, and a list of replacements (**Match**, optional **If Value**, **Replace With**, plus **Insert New** and **Update Existing** switches controlling whether unmatched values get inserted and matched ones replaced).

The rest of the form:

| Field | What it does |
|---|---|
| **Startup Commands** | Named startup command presets as key/value pairs. Users pick between them on the server's [Startup page](../server/startup.md). |
| **Force Outgoing IP** | Forces the server's outgoing traffic through its allocation IP. |
| **Separate IP and Port** | Shows the primary IP and port separately on the Console page instead of joining them with `:`. |
| **Features** | Feature tags for this egg. |
| **File Deny List** | File patterns users cannot touch in the file manager. |
| **Docker Images** | Named Docker images as key/value pairs (label to image). Users switch between them on the Startup page. |

At the bottom, next to **Save**:

- **Update**: dropdown with **from File** (upload a `.json`/`.yml`/`.yaml` egg to overwrite this one) and **from Repository** (re-pull from the linked egg repository egg; disabled if none is linked).
- **Export**: dropdown with **Export as JSON**, **Export as YAML**, and **Export as Pterodactyl** (JSON in Pterodactyl's egg format, for taking eggs back the other way).
- **Move** (to another nest), **Duplicate** (copy under a new name, optionally into a different nest), and **Delete**.

### Installation Script

The script that runs when a server using this egg is installed or reinstalled. **Installation Container** is the Docker image the script runs in, **Container Entrypoint** the shell that executes it, and below both sits a code editor for the script itself.

### Variables

Each variable is a card in a grid; drag cards to reorder them, which sets the order users see on the Startup page. **Add** creates a blank card.

![](./images/nests/egg-variables.webp)

| Field | What it does |
|---|---|
| **Name** / **Description** | Shown to users. Both are translatable per language, and the description supports Markdown. |
| **Environment Variable** | The `ENV_VAR` passed to the container. Typed input is uppercased automatically. |
| **Default Value** | Value used when the user hasn't set one. |
| **User Viewable** / **User Editable** | Whether users see and can change the variable on the Startup page. |
| **Secret** | Hides the value like a password. |
| **Rules** | Validation rules applied to user input, using [Laravel validation rule](https://laravel.com/docs/12.x/validation#available-validation-rules) syntax. |

Each card has its own **Save**, **Duplicate**, and **Remove** buttons.

### Mounts

Mounts attached here become available to every server using this egg, on top of any per-server mounts. The table lists ID, Name, Source, Target, and Added; **Add** opens a modal to pick one of the panel's configured mounts. See the server-side [Mounts page](../server/mounts.md) for how users interact with them.

### Servers

A read-only list of all servers currently using this egg, handy before deleting or heavily editing one.

::: info
Nest and egg actions are gated by the `nests.*` and `eggs.*` admin permissions (the Mounts tab additionally needs `eggs.mounts`). See the [Permissions Reference](../dashboard/permissions.md).
:::
