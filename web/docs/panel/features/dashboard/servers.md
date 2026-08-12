---
title: Servers
description: Browse your servers, organize them into groups, and manage power state from the Calagopus dashboard.
---

# Servers

The Servers page is the landing page for most users and lists every server you have access to. It has two views: **All Servers**, a flat list, and **Grouped Servers**, where you organize servers into your own groups.

![](./images/servers/all-servers.webp)

Each server card shows its power state, name, address, and live CPU, memory, and disk usage. If you have access to servers owned by other users (for example as a subuser), a **Show other user's servers** toggle appears in the top right; it's off by default.

![](./images/servers/other-users-toggle.webp)

## Grouped Servers

Groups are personal and only affect how servers are organized for you, they don't change who has access to a server.

![](./images/servers/grouped-servers.webp)

### Creating a Group

Switch to the **Grouped Servers** tab and click **Create**. Give the group a name.

![](./images/servers/create-group.webp)

### The Group Header

Each group's header holds a search box that filters the servers inside it, followed by four controls:

| Control | Does |
| --- | --- |
| **Group Actions** (the three dots) | **Start**, **Restart**, or **Stop** every server in the group at once |
| **Add Server to Group** (plus) | Search for and pick a server to add |
| **Edit** (pencil) | Rename the group via the **Edit Server Group** modal |
| **Delete** (trash) | Remove the group after a **Confirm Server Group Deletion** prompt |

![](./images/servers/group-actions.webp)

Deleting a group never deletes the servers inside it, it just ungroups them.

### Inside a Group

Groups are collapsible; click the chevron to expand or collapse one, and drag servers to reorder them within the group.

![](./images/servers/group-collapsed.webp)
![](./images/servers/group-expanded.webp)

Click a server inside a group to select it. A small action bar appears with power controls (start, stop, restart) and an option to remove it from the group without deleting the server itself.

![](./images/servers/bulk-power-actions.webp)
