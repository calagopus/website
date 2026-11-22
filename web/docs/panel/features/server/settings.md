---
title: Server Settings
description: Rename your server, configure auto-kill, auto-start, timezone, and the trash, view debug information, and reinstall it.
---

# Settings

The Settings page is a set of cards: debug information, rename, auto-kill, auto-start, timezone, trash, and reinstall. Each editable card has its own **Save** button (debug information is read-only, and reinstall uses **Reinstall Server** instead); nothing here restarts your server on save.

![Settings page with all cards](./images/settings/overview.webp)

## Debug Information

Three read-only fields you'll be asked for when reporting problems: **Node (UUID)**, **Location (UUID)**, and **Server UUID**. Click any of them to copy the value.

## Rename Server

**Server Name** (required) and an optional **Description**, then **Save**. This only changes how the server is labeled, nothing about how it runs.

## Auto-Kill

Sometimes a server refuses to shut down cleanly. With **Enabled** on, a server that is still stopping after **Seconds until auto-kill** is killed instead of hanging forever. Accepts 1 to 3600 seconds; off by default with 30 seconds prefilled.

## Auto-Start

**Behavior** controls whether the node starts the server again on its own:

| Behavior           | Meaning                                                           |
| ------------------ | ----------------------------------------------------------------- |
| **Always**         | Always bring the server back up.                                  |
| **Unless Stopped** | Bring it back up unless it was deliberately stopped. The default. |
| **Never**          | Never start it automatically.                                     |

## Timezone

Sets the timezone inside the server's container, which is what timestamps in your server's own logs and anything time-based the server does will use. The **Timezone** dropdown is searchable, shows a live clock preview for the selected zone, and can be cleared to fall back to the node's own timezone. Since Panel 1.2.11 the cleared field shows that timezone, the node's [`system.timezone`](../../../wings/configuration.md#system-timezone), as its placeholder; it reads **System** only when the panel can't get the node's configuration within a few seconds or the node sets none.

## Trash

Controls how long files deleted in the [file manager](./files.md#trash) stay in the trash. By default the server uses the panel-wide values, shown under the switch as "Panel default: 7 days, cleared at 90% disk usage". Turn on **Use custom trash settings for this server** to set its own:

| Field                   | Meaning                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Retention**           | How long deleted files stay in the trash, in days (up to 365, decimals allowed). 0 turns the trash off.                                                                |
| **Clear at Disk Usage** | Once disk usage reaches this percentage of the server's limit, the oldest entries are removed. 0 means the trash is only cleared when a write would go over the limit. |

Switching custom settings off again returns the server to the panel defaults. Files already in the trash stay there when you turn it off, until they are restored or deleted, or Wings needs the space.

The card only appears when an admin has left [Allow Changing Trash Settings](../admin/settings.md#trash) on. Admins can always change a server's trash settings from its admin [Management](../admin/servers.md#trash) tab, and custom values set there stay in effect even when users may not change them.

## Reinstall Server

Runs the egg's install script again, as if the server were being set up fresh.

::: danger
"Reinstalling your server will stop it, and then re-run the installation script that initially set it up. **Some files may be deleted or modified during this process, please back up your data before continuing.**"
:::

Clicking **Reinstall Server** opens a confirmation. Its first switch reads "Do you want to delete all files of this server before performing this action? This cannot be undone." Leave it off to keep your files (the install script may still touch some of them), or turn it on to wipe the server first, which also empties its [trash](./files.md#trash). The second, **Start the server after the reinstall has finished**, boots the server once the install script completes successfully; it is off by default and only shown to users with the `control.start` permission. Confirm with **Reinstall**; the server switches into an installing state and you're returned to the console.

<img src="./images/settings/reinstall-modal.webp" width="220" alt="Reinstall Server dialog with the latest backup date, Create a backup first, delete-all-files and start-after-reinstall toggles" />

Since Panel 1.2.10 the dialog helps you keep a copy first. With `backups.read` it shows when the latest successful server backup was taken, or "This server has no backups yet.". With `backups.create` there is a **Create a backup first** switch: the reinstall then waits for a new, ungrouped server backup to finish ("Waiting for the backup to finish…") and only starts once it succeeded. If the backup fails, the server is left alone with "The backup failed, so the server was not reinstalled.". The switch is disabled when the server is at its [backup limit](./backups.md#reaching-the-backup-limit) with nothing that can make room. Turning on the delete-all-files switch adds a red warning that every file is deleted before the installation script runs.

Each card maps to its own subuser permission (`settings.rename`, `settings.auto-kill`, `settings.auto-start`, `settings.timezone`, `settings.trash`, `settings.install`), and `settings.cancel-install` separately gates the **Cancel** button on the installing banner. See the [Permissions Reference](../dashboard/permissions.md).
