---
title: Backups
description: Create, browse, restore, and download server and database backups, and organize them into groups with automatic retention.
---

# Backups

The Backups page lists every backup of your server, with a counter like "2 of 15 maximum backups created." at the top. There are two kinds of backup. A **Server** backup is an archive of the server's files. A **Database** backup is a dump of one of the server's [managed databases](./databases.md#managed-databases). Both kinds count toward the same limit, which is part of the server's [feature limits](../admin/servers.md#feature-limits); as soon as a database backup exists the counter splits, as in "11 of 15 maximum backups created (9 server, 2 database)." Once you hit the limit, the create option is disabled with the tooltip "This server is limited to 15 backups."

![](./images/backups/list.webp)

Each row shows the backup's **Name**, **Kind** (**Server** or **Database**), **Source** (**Server Files**, or the managed database the dump was taken from, with its engine next to it), **Checksum** (e.g. `sha256:...`), **Size**, **Files** (file count, always 0 for a database backup), **Created**, and **Locked?** (a green closed lock when locked, a red open one when not). If the managed database a dump came from has since been deleted, the source reads "Example (deleted)". A backup that is still running shows a progress bar instead; a failed one shows a **Failed** badge. Deletion is asynchronous: the row dims under a **Deleting...** badge, which turns into **Deletion failed** if it goes wrong.

## Creating a Backup

Click **Create** in the top right. If backup groups are available, the button opens a menu instead, with **Create Backup** and **Create Backup Group**.

<img src="./images/backups/create-modal.webp" width="220" alt="" />

The form has four fields:

| Field | Notes |
| --- | --- |
| **Name** | Pre-filled with a generated timestamp name; change it if you like. |
| **Source** | **Server Files** (the default) or **Managed Database**. Only shown when you can see the server's managed databases; picking **Managed Database** adds a picker for which one to dump. |
| **Backup Group** | Only shown when the server has groups. Defaults to **No group**. |
| **Ignored Files** | Patterns for files to exclude, one pattern per line. Server backups only. |

The **Ignored Files** field shows a live match count next to each pattern, supports `!` exceptions, and has a **Preview ignored files** toggle that opens a file browser showing exactly what would be skipped.

## Database Backups

A database backup is a dump of a managed database, written by the database's own tooling: a SQL dump for PostgreSQL and MariaDB, a `mongodump` archive for MongoDB, and an RDB snapshot for Redis. It goes through the same backup configuration as your server backups and sits in the same list and the same groups. The managed database it came from lists it too, on its own [Backups tab](./databases.md#backups-tab), where you can take one without leaving the database's page.

A few things have to be true before the panel takes one:

- The managed database must be running. Its Backups tab disables **Create** with "The managed database must be running to take a backup." while it is off.
- The server's backup configuration cannot be a btrfs or ZFS one; those store file snapshots and have nowhere to put a dump. Every other driver works.
- No restore may be running into that managed database at the time.

A dump has no file tree, so **Browse**, **Export to Files**, and **Backup Metadata** are not offered for database backups. **Download** hands you the dump file as it was stored. **Edit**, **Restore**, and **Delete** work as they do for server backups; restoring is covered under [Restore](#restore) below.

## Backup Groups

Groups organize backups and can rotate them automatically. Each group is a collapsible card with its own search box, and any backups outside a group collect under **Ungrouped**. An empty group reads "This group has no backups yet." with a **Create backup in this group** button.

The group header shows retention at a glance:

| Badge | Meaning |
| --- | --- |
| `1/5` | Usable backups versus the group's **Keep count**. Turns yellow when over the limit. Groups without a Keep count show a plain "N Backups" badge instead. |
| **Keep 7 Days** | The group's **Keep days** retention. |
| **No auto-deletion** | No retention set; the group is just a label. |
| **All locked** | Every backup in the group is locked, so nothing can be rotated out. |

### Creating and Editing a Group

Pick **Create Backup Group** from the **Create** menu. Give it a name and optionally set:

- **Keep count**: maximum number of usable backups to keep in this group. Leave empty for no limit.
- **Keep days**: delete backups in this group older than this many days. Leave empty for no limit.

<img src="./images/backups/group-edit-modal.webp" width="221" alt="" />

With neither set, the group never deletes backups automatically. **Keep count** is applied to each kind separately, so a group with a Keep count of 5 holds up to five server backups and up to five database backups at once; **Keep days** applies to everything in the group. Use the pencil icon in a group's header to edit it later. There is also a panel-wide limit on groups per server, set under [Settings > Server](../admin/settings.md#server); the **Create Backup Group** option disappears once you reach it.

Once you have more than one group, each header grows a grip handle: drag it to reorder the groups on the page. This is display order only and doesn't affect retention.

### Deleting a Group

Click the trash icon in the group header and type the group's name to confirm. The backups inside are not deleted, they become ungrouped and follow standard rotation. A **Lock backups** switch locks all backups in the group first, so they cannot be rotated out automatically afterwards.

## System Backups

When the panel has taken automatic backups of this server through a [system backup policy](../admin/system-backup-policies.md), a sub-navigation appears with a **System Backups** tab at `/backups/system`: "Backups taken automatically by the panel. They cannot be modified or deleted." The rows are read-only in the sense that you cannot rename, lock or delete them - but they are still fully usable backups: browsing, downloading, restoring, exporting to files and viewing metadata all work exactly as they do on your own backups, with the same permissions.

![System backups tab](./images/backups/system-backups.webp)

## Backup Actions

Right-click a backup (or use the menu at the end of the row) for its actions.

<img src="./images/backups/context-menu.webp" width="200" alt="" />

### Edit

Rename the backup, move it to another group, or toggle **Locked**. A locked backup cannot be deleted and is never rotated out by group retention.

<img src="./images/backups/edit-modal.webp" width="220" alt="" />

### Browse

Opens the backup's contents directly in the [file manager](./files.md#browsing-backups) (under a read-only `/.backups/` path), so you can inspect it and pull out individual files without downloading the whole archive. Browse only appears for server backups whose storage driver and format support it; see [Browsing Backups from the Client UI](../../../wings/advanced/backup-configurations.md#browsing-backups-from-the-client-ui) for which do.

### Download

Downloads the backup as an archive. For server backups stored in a driver that can re-stream them, the entry expands into **Download as ...** options (`.tar`, `.tar.gz`, `.tar.xz`, `.tar.lz`, `.tar.bz2`, `.tar.lz4`, `.tar.zst`, `.zip`); others download in their stored format. A database backup downloads as its dump file.

### Restore

Restores the backup onto the server. Two switches control how:

- **Do you want to delete all files of this server before performing this action? This cannot be undone.** wipes the server first for a clean restore.
- **Restore the startup command, image, and variables from this backup.** is only available when the backup captured that metadata.

The server switches into a restoring state and you're taken back to the console while it runs. A progress toast showing the bytes and files restored so far stays in the corner on every page of the server until the restore finishes.

<img src="./images/backups/restore-modal.webp" width="220" alt="" />

For a database backup, **Restore** opens **Restore Database Backup** instead. Pick the **Target Managed Database**; the list only offers managed databases running the same engine as the dump, with the one the backup was taken from preselected, so a dump from a deleted database can be restored into a new one. The modal spells out what happens: "Existing tables and collections carried by the dump are replaced, and power actions are blocked until the restore finishes." The target has to be running, and only one restore can run into a given database at a time.

<img src="./images/databases/instance-restore-backup-modal.webp" width="220" alt="" />

The restore itself runs in the background. While it runs, the database's page shows a **Restoring backup** badge and a progress banner, and its power buttons are disabled. A toast tells you when it completes or fails. See [The Instance Page](./databases.md#the-instance-page).

### Export to Files

Server backups only. Writes the backup as an archive file into the server's own file area. Pick a destination directory, file name, and archive format (fixed for backups whose stored format can't be converted); the modal shows the resulting path under `/home/container/` before you hit **Export**.

<img src="./images/backups/export-modal.webp" width="310" alt="" />

### Backup Metadata

Shown only for server backups that captured metadata (startup command, image, variables); opens a JSON view of it.

<img src="./images/backups/metadata-modal.webp" width="310" alt="" />

### Delete

Asks for confirmation, then deletes the backup. Disabled while the backup is locked.

::: info
Where backups are physically stored (local disk, S3, restic, and so on) is a backup configuration admins assign at the server, node, or location level. See [Setting up Backup Configurations](../../../wings/advanced/backup-configurations.md).
:::
