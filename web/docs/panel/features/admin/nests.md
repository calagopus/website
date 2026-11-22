---
title: Nests
description: Organize eggs into nests and manage everything about an egg, from install script and startup behavior to variables, mounts, and exports.
---

# Nests

Nests are categories for eggs, and eggs are the templates that define how a server type is installed, started, stopped, and configured. Everything egg-related lives here: a nest holds its eggs, and each egg holds its install script, startup and stop configuration, variables, and Docker images.

The list shows each nest's ID, name, author, description, how many **Eggs** it holds, how many **Servers** use them, and created timestamp. Use the search box to filter, click a nest's ID to open it, or hit **Create** in the top right for a new one.

![Admin nest list with the Games nest, a search box, and a Create button](./images/nests/list.webp)

## Creating and Editing a Nest

A nest is just three fields: **Name**, **Author**, and an optional **Description**. **Save** creates it, **Save & Stay** creates it without leaving the form.

Nests can also be created without leaving the page you're on: the nest pickers in the egg install dialogs and the egg repository form have a **Can't find one? Create a new nest** link (needs `nests.create`) that opens the same form in a modal and selects the new nest.

Opening an existing nest shows two tabs: **General**, the same form plus a **Delete** button, and **Eggs**. Deleting a nest asks whether you also want to delete all eggs inside it, via the **Do you want to delete all eggs in this nest?** switch in the confirmation. Since Panel 1.2.10 **Delete** is disabled, with a tooltip, while servers still use eggs in the nest.

![Games nest General tab with the Update Nest form, Save and Delete buttons](./images/nests/general.webp)

## Eggs

The **Eggs** tab lists the nest's eggs with ID, Name, Author, Description, **Servers** (how many servers use the egg) and Created, plus a selection checkbox per row.

![Games nest Eggs tab listing eggs with Import and Create buttons](./images/nests/eggs.webp)

Eggs support bulk operations: drag across rows to select, Ctrl/Cmd-click or use the checkboxes (the one in the header selects the whole page), Ctrl/Cmd+A to select everything, Escape to clear. With eggs selected, an action bar appears with **Update from Repository**, **Move** (to another nest), and **Delete**.

![Egg selected with Update from Repository, Move and Delete controls](./images/nests/eggs-selection.webp)

### Creating an Egg

**Create** opens the egg form described under [General](#general) below. New eggs start with a stub install script (a `debian:latest` container running `/bin/bash`) that you fill in afterwards.

![Empty egg create form with startup, stop, config files, startup commands, and Docker image sections](./images/nests/egg-create-form.webp)

### Importing Eggs

**Import** is a dropdown with three sources: **from File**, **from URL**, and **from Repository**.

**from File** accepts an egg file in JSON or YAML format (`.json`, `.yml`, `.yaml`), including eggs exported from Pterodactyl. A file picked here is parsed in your browser, which expands YAML aliases (`*name`) and merge keys (`<<:`). Importing from a URL or syncing an [egg repository](./egg-repositories.md) parses the YAML on the panel instead, and since Panel 1.2.7 an egg that uses aliases or merge keys fails to import from a URL and is silently left out of a repository sync. You can also drag files from your file manager anywhere onto the page and drop them to import several at once.

**from URL** fetches the eggs instead. Paste up to 25 `http`/`https` URLs and the panel downloads them (5 at a time), auto-detecting JSON or YAML. Each egg may be at most 1 MiB. If some URLs fail, the import still succeeds for the rest and lists the failures with a reason next to each URL. Eggs imported this way are not linked to a repository, so they won't be updated automatically. **Update** on an existing egg also offers **from URL** for refreshing one by hand.

**from Repository** opens a search over the eggs of every synced [egg repository](./egg-repositories.md). Use the arrow keys and Enter (or click) to pick an egg, open its **README** if you want to check it first, then click **Install** to add it to this nest. It needs `egg-repositories.read` on top of `eggs.create`, and stays greyed out without it. Each result shows its repository and, as badges, the nests it's already installed in: yellow when the panel knows the repository has a newer version than that copy, green otherwise. If the nest already has an egg with the same name, nothing is imported; the panel uses the existing egg and tells you so ("This egg was already installed in Games, the existing egg was used."). Eggs installed this way stay linked to their repository egg, so **Update from Repository** works on them later.

To browse every repository's eggs as cards and see which installed eggs have updates waiting, use the [Egg Library](./egg-library.md).

## Editing an Egg

Opening an egg shows five tabs: **General**, **Installation Script**, **Variables**, **Mounts**, and **Servers**.

Unsaved edits on **General** and **Installation Script** are kept while you switch between the egg's tabs. Leaving the egg with them still unsaved asks you to confirm first.

### General

The top of the form covers identity and repository linkage:

| Field                                       | What it does                                                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Author** / **Name** / **Description**     | Basic metadata.                                                                                                      |
| **Egg Repository** / **Egg Repository Egg** | Links this egg to an egg from a synced [egg repository](./egg-repositories.md), enabling **Update from Repository**. |

![Paper egg General tab with startup, stop, config file, startup command, and Docker image settings filled in](./images/nests/egg-general.webp)

Below that, three configuration cards:

- **Startup Configuration**: **Startup Done**, one or more console messages indicating startup completion (the panel marks the server as running when one appears), and **Strip ANSI from startup messages**, which removes ANSI control characters before matching.
- **Stop Configuration**: **Stop Type** is **Send Command** (with a **Stop Command** field), **Send Signal** (with a **Stop Signal** picker: `SIGABRT`, `SIGINT`, `SIGTERM`, `SIGQUIT`, `SIGKILL`), or **Docker Stop**.
- **Config Files Configuration**: files the panel rewrites on boot. Each entry has a **File Path**, a **Parser** (File, YAML, Properties, INI, JSON, XML, TOML), a **Create New File** switch, and a list of replacements (**Match**, optional **If Value**, **Replace With** as either **Text** or **JSON**, plus **Insert New** and **Update Existing** switches controlling whether unmatched values get inserted and matched ones replaced). Since Wings 1.2.7, a YAML file that uses aliases (`*name`), including merge keys (`<<: *name`), is not rewritten: Wings logs `failed to update process configuration files` and skips that file and the entries after it, then starts the server anyway.

![Config Files Configuration section with a new config file entry and an Add Replacement button](./images/nests/config-files.webp)

![Empty replacement row with Match, If Value, and Replace With fields and Insert New and Update Existing toggles](./images/nests/config-files-replacement.webp)

The rest of the form:

| Field                    | What it does                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Startup Commands**     | Named startup command presets as key/value pairs. Users pick between them on the server's [Startup page](../server/startup.md). An egg needs at least one, and none may be empty or whitespace-only or repeat another. |
| **Force Outgoing IP**    | Forces the server's outgoing traffic through its allocation IP.                                                                                                                                                        |
| **Separate IP and Port** | Shows the primary IP and port separately on the Console page instead of joining them with `:`.                                                                                                                         |
| **Features**             | Feature tags for this egg.                                                                                                                                                                                             |
| **File Deny List**       | File patterns users cannot touch in the file manager.                                                                                                                                                                  |
| **Docker Images**        | Named Docker images as key/value pairs (label to image). Users switch between them on the Startup page. No image may be empty or whitespace-only, and the same image can't be listed twice.                            |

The tag-style inputs (Startup Done, Features, File Deny List) share a clipboard menu with **Copy All** and **Paste (Replace)** for carrying lists between eggs.

The startup command and Docker image rules apply wherever an egg is written: saving this form, creating an egg, importing one from a file or URL, and installing one from a repository. An egg that breaks them is rejected with "at least one startup command is required", "startup commands cannot be empty", "docker images cannot be empty", or a "duplicate startup command" / "duplicate docker image" error naming the value. When you install several repository eggs at once, an egg that fails these checks is skipped and left out of the installed count. Updating an existing egg from its repository, with **Update from Repository** here or **Update** in the [Egg Library](./egg-library.md#installed), does not re-check them, so a repository egg that breaks the rules can still overwrite one of yours.

At the bottom, next to **Save**:

- **Update**: dropdown with **from File** (upload a `.json`/`.yml`/`.yaml` egg to overwrite this one) and **from Repository** (re-pull from the linked egg repository egg; disabled if none is linked). Installing or updating from a repository records which version of the repository egg you have, which is how the [Egg Library](./egg-library.md#installed) knows an update is waiting. Overwriting the egg from a file or URL keeps the repository link but forgets that version, so the egg shows no pending update until you next run **from Repository**. Since Panel 1.2.10 an update also carries over each variable's **Secret** flag, and runs as one transaction: a variable that can't be written fails the whole update and leaves the egg as it was, where older versions logged a warning and skipped that variable.
- **Export**: dropdown with **Export as JSON**, **Export as YAML**, and **Export as Pterodactyl** (JSON in Pterodactyl's egg format, for taking eggs back the other way).
- **Move** (to another nest), **Duplicate** (copy under a new name, optionally into a different nest), and **Delete**. Since Panel 1.2.10 **Delete** is disabled, with a tooltip, while servers still use the egg.

Pterodactyl and Pelican eggs don't map one-to-one onto Calagopus eggs, so some values are translated on import and export:

- **Import**: a stop value of `^C` becomes the `SIGINT` signal, and `^SIGTERM`, `^SIGQUIT`, `^SIGABRT` and `^SIGKILL` become those signals. Any other `^` value, including `^^C`, becomes `SIGKILL`. Conditional config file replacements (an object of value-to-replacement pairs) turn into replacements with **If Value** set, and the file's `create_file` setting carries over to **Create New File**.
- **Export as Pterodactyl**: **Docker Stop** and the `SIGQUIT` signal are written as `^SIGTERM`, since Pterodactyl doesn't know them. The author must be an email address, so one is pulled out of the author field if it contains one, and `unknown@example.com` is used otherwise. Variables without rules are exported with `nullable`.

### Installation Script

The script that runs when a server using this egg is installed or reinstalled. **Installation Container** is the Docker image the script runs in, **Container Entrypoint** the shell that executes it, and below both sits a code editor for the script itself.

![Paper egg Installation Script tab with installer container, entrypoint, and script editor](./images/nests/egg-script.webp)

#### Reporting Progress

Wings gives the install container an `INSTALL_PROGRESS_FILE` environment variable pointing at a file inside the container. Write a line to that file and the server's installing banner turns into a progress bar with a label, instead of an indefinite "installing" message. Wings re-reads the file every 500 ms and uses the **last non-empty line**, so appending as you go is fine.

Each line is a progress value, optionally followed by a space and a label:

```sh
echo "42" > "$INSTALL_PROGRESS_FILE"                    # 42%
echo "42 Downloading" > "$INSTALL_PROGRESS_FILE"        # 42%, labeled
echo "512/2048 Downloading" > "$INSTALL_PROGRESS_FILE"  # explicit total
```

With no `/`, the total is assumed to be 100, so the number is a percentage. Two things to watch out for. A trailing `%` makes the line **invalid**, and it is dropped without an error. When the total is anything other than 100, the panel renders the pair as a byte count, so `512/2048` shows as bytes: right for a download, misleading for anything else. Only the last 4096 bytes of the file are read, and labels are capped at 255 characters.

There is a matching `INSTALL_STATUS_FILE` for the final status of the install.

### Variables

Each variable is a card in a grid; drag a card by the grip handle in its top-right corner to reorder them, which sets the order users see on the Startup page. **Add** creates a blank card.

![Paper egg Variables tab showing four egg variable cards with environment names, defaults, and rules](./images/nests/egg-variables.webp)

| Field                                 | What it does                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name** / **Description**            | Shown to users. Both are translatable per language, and the description supports Markdown.                                                                                                                                                                                                                                         |
| **Environment Variable**              | The `ENV_VAR` passed to the container. Typed input is uppercased automatically, with spaces and hyphens converted to underscores. Wings sets `TZ`, `STARTUP`, `SERVER_MEMORY`, `SERVER_IP` and `SERVER_PORT` itself; from Wings 1.2.5 a variable with one of those names replaces Wings' value, while older versions overwrite it. |
| **Default Value**                     | Value used when the user hasn't set one.                                                                                                                                                                                                                                                                                           |
| **User Viewable** / **User Editable** | Whether users see and can change the variable on the Startup page.                                                                                                                                                                                                                                                                 |
| **Secret**                            | Hides the value like a password.                                                                                                                                                                                                                                                                                                   |
| **Rules**                             | Validation rules applied to user input, using [Laravel validation rule](https://laravel.com/framework/docs/12.x/validation#available-validation-rules) syntax. See [Rules](#rules).                                                                                                                                                |

Each card has its own **Save**, **Duplicate**, and **Remove** buttons.

#### Rules

Since Panel 1.2.11 the **Rules** field has two modes, switched with **Editor** and **Text** next to its label.

**Editor** shows each rule as a pill. Type into "Add a rule..." to search the supported rules; each suggestion shows what arguments it takes. A rule without arguments, such as `required` or `boolean`, is added straight away. A rule with arguments, such as `max` or `in`, opens a small form with fields like **Value**, **Minimum** / **Maximum**, **Variable** or **Values** (comma-separated) and a preview of the finished rule, which **Add** puts into the list. Click a pill to change or **Remove** it, or press Backspace in the empty search field to drop the last one. You can also type a complete rule such as `max:20` and pick **Add max:20**.

![Rules field in Editor mode with nullable, string, and max:20 pills, and the max argument form open with Value 20](./images/nests/rules-editor.webp)

**Text** is a plain text area for pasting a rule set. "Separate rules with | or new lines.", so `required|string|max:20` works as it does in a Pterodactyl egg.

![Rules field in Text mode with required, string, and max:20 written on one line](./images/nests/rules-text.webp)

Both modes check rules as you type. A rule the panel can't parse turns red with the reason. A rule that refers to a variable this egg doesn't have, such as `required_if:SERVER_TYPE,paper` without a `SERVER_TYPE` variable, turns orange with "References unknown variable SERVER_TYPE.", since that rule never matches.

The values themselves are now checked live as well: on [Create Server](./servers.md#variables) and on a server's [Variables](./servers.md#variables-1) tab, a value that breaks a rule shows the error on its field as soon as you change it, and the Variables tab's **Save** stays disabled until every changed variable passes.

#### Excluding Variables

Since Panel 1.2.11 a variable can be switched off depending on the value of another one, using Laravel's exclude rules:

| Rule                              | The variable is excluded when                       |
| --------------------------------- | --------------------------------------------------- |
| `exclude`                         | Always.                                             |
| `exclude_if:OTHER,value1,value2`  | `OTHER` has one of the listed values.               |
| `exclude_unless:OTHER,value1,...` | `OTHER` has none of the listed values.              |
| `exclude_with:OTHER`              | The egg has an `OTHER` variable, even an empty one. |
| `exclude_without:OTHER`           | `OTHER` is empty or missing.                        |

If `OTHER` has the `boolean` rule, `true`/`1` and `false`/`0` count as the same value. When the variable a rule points at is excluded itself, the variable with the rule is excluded too, so rules can chain: a `PAPER_BUILD` variable with `exclude_unless:SERVER_TYPE,paper` disappears along with anything that has `exclude_if:PAPER_BUILD,...`.

An excluded variable:

- is hidden on the user's [Startup](../server/startup.md#variables) page, on Create Server and on the server's Variables tab. The forms re-check while you type, so changing `SERVER_TYPE` shows or hides the variables that depend on it right away.
- has none of its other rules checked, so a `required` excluded variable can stay empty.
- keeps its stored value. Values sent for it are ignored when a server is created or its variables are saved, so it can't be changed while it is excluded.
- is still passed to the container with that stored value (or the default). Exclusion only controls the forms, so write the install script and startup command to ignore the variable when it doesn't apply.

Users don't see variables that aren't **User Viewable**, so their names stay hidden too. When a viewable variable has an exclude rule that points at a hidden variable, the user's Startup page only gets the outcome: the variable is left out when the rule excludes it, and otherwise is shown with that rule removed from its rules.

### Mounts

Mounts attached here become available to every server using this egg, on top of any per-server mounts. The searchable table lists ID, Name, Source, Target, and Added; **Add** opens a modal to pick one of the panel's configured [mounts](./mounts.md), and each row's context menu offers **Remove**. See the server-side [Mounts page](../server/mounts.md) for how users interact with them.

![Paper egg Mounts tab listing the Minecraft Plugins mount with an Add button](./images/nests/egg-mounts.webp)

### Devices

Assign [devices](./devices.md) that servers using this egg may attach (requires `eggs.devices`). **Add** selects a device; **Remove** detaches its egg assignment. The server's node must also be assigned to the device, and the device must be attached to the server before it is used.

### Servers

A read-only, searchable list of all servers currently using this egg, with the same columns as the [Servers](./servers.md) list. Check it before deleting or heavily editing an egg.

![Paper egg Servers tab listing two servers with status, node, owner, and allocation](./images/nests/egg-servers.webp)

::: info
Nest and egg actions are gated by the `nests.*` and `eggs.*` admin permissions (the Mounts tab additionally needs `eggs.mounts`). See the [Permissions Reference](../dashboard/permissions.md).
:::
