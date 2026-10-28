---
title: Database Agent Hosts
description: Register and manage Calagopus DB Agent hosts, the machines that run managed database instances for your users.
---

# Database Agent Hosts

A database agent host is a machine running the [Calagopus DB Agent](../../../db-agent/index.md), which provisions managed databases: dedicated PostgreSQL, MariaDB, MongoDB, or Redis instances users create from their server's [Databases page](../server/databases/managed.md#creating-a-managed-database).

::: info
Install the agent on the machine first; the [DB Agent docs](../../../db-agent/index.md) cover installation and the [configuration reference](../../../db-agent/configuration.md). The panel side below hands you the exact config file to drop in.
:::

The list at `/admin/database-agent-hosts` shows a health indicator, ID, Name, and Created date for each host. The heart is green when the panel can reach the agent, yellow and pulsing when an agent update is available, grey when the latest version could not be determined, and broken red when the host is unreachable; hovering it gives the agent version. Next to the name, a badge shows whether the host can still take new instances: **Deployment Enabled** (green), **Nearly Full** (yellow), **No Capacity** (orange), **Under Maintenance** (red), **No Types Enabled** (red), or **Deployment Disabled** (red). Hovering it shows allocated memory and disk against the host's limits, or "no host limit" where a limit is `0`.

Rows have selection checkboxes; drag across rows or Ctrl/Cmd-click to select several (Ctrl/Cmd+A for all, Escape to clear). With hosts selected, an action bar appears with **Update Config**, which applies a YAML configuration snippet to every selected host at once.

![Database agent host selected with the bulk Update Config control](./images/database-agent-hosts/bulk-actions.webp)

::: info
The capacity states compare the memory and disk claimed by the host's instances against its configured limits, whichever of the two is worse: **Nearly Full** from 90%, **No Capacity** at 100% or over. A limit of `0` is unlimited and never counts toward either. **Deployment Disabled**, **Under Maintenance** and **No Types Enabled** each rule the host out on their own, so they are checked first, in that order. The allocation figures are cached for 30 seconds.
:::

![Database agent hosts list](./images/database-agent-hosts/list.webp)

## Creating a Database Agent Host

Click **Create** in the top right.

![Create database agent host form](./images/database-agent-hosts/create-form.webp)

| Field | Description |
| ----- | ----------- |
| **Name** | Display name for the host. |
| **URL** | Where the panel reaches the agent, e.g. `https://agent.example.com:8090`. If you omit the port, a warning explains the panel will connect on the URL's default port while the agent listens on `8090` by default; an **Add :8090** button appends it for you. |
| **Description** | Optional free text. |
| **Memory** | "The total memory available for database instances on this host." New instances are only placed while the combined limits of the host's instances fit within it. Defaults to `0`, which means no limit. |
| **Disk** | "The total disk available for database instances on this host." The same placement rule applies. Defaults to `0`, which means no limit. |
| **Deployment Enabled** | Whether new instances may be placed on this host. On by default. |
| **Maintenance Enabled** | Puts the host into maintenance mode, see below. Off by default. |

Below that is a section per database type (**PostgreSQL**, **MariaDB**, **MongoDB**, **Redis**), each with an **Enabled** switch and optional **Public Host** and **Public Port** overrides for the address users connect to (defaults `5432`, `3306`, `27017`, `6379`).

## Connecting the Agent

Open the new host's **Configuration** tab and click **Reveal Configuration** (it's hidden by default because it contains the host token).

![Configuration tab](./images/database-agent-hosts/configuration.webp)

Under **Initial Setup**:

#### 1. Settings

Set the **API Port** the agent should listen on. If it doesn't match the port in the host URL, a warning tells you the panel won't be able to connect unless a reverse proxy bridges the two.

#### 2. Apply Configuration

Copy the generated YAML into `/etc/calagopus-db-agent/config.yml` on the host, or use the one-line command shown next to it.

#### 3. Verify Connection

Click **Verify Connection** to check the panel can reach the agent; the result appears in the **Backend to DB Agent** box.

Below the setup steps, **Live Configuration** shows the running agent's full config in a YAML editor; edit it and hit **Save Configuration** to push changes without touching the machine. This is the same config the bulk **Update Config** action patches across many hosts. The editor lists options that cannot be changed from the web UI, such as paths, the API listener/token, and remote-import policy. Changes to these options are ignored; edit them in the agent's local `config.yml`. See [Remote Management](../../../db-agent/configuration.md#remote-management) for the full list.

![Live configuration editor](./images/database-agent-hosts/live-config.webp)

## Host View

### Overview

Badges show the host's deployment and maintenance state. The **Host Details** card lists URL, Memory, Disk, Description, and Created; **System Information** shows the agent's Version, CPU, Memory, Instances (online / total), Kernel Version, and Architecture.

If a newer agent release exists, an **Update Available** badge appears next to the version, or **Latest Version Unknown** when the check failed; see [Updating](../../../db-agent/updating.md). **Allocated Resources** graphs how much of the host's memory and disk budget instances currently claim, plus allocated CPU. **Allocation Breakdown** below splits that per instance, with the same bars and **Measure Against** choices as on a [node's overview](./nodes.md#overview).

![Host overview](./images/database-agent-hosts/overview.webp)

### Upgrading the Agent

A host running DB Agent 1.2.4 or newer as a binary (not in a container) gets an **Upgrade** button next to the version (requires `database-agent-hosts.upgrade`). The **Upgrade Database Agent** dialog works like [upgrading Wings](./nodes.md#upgrading-wings): it names the release repository and provider, takes a **Version** such as `1.2.4` or `latest`, and the host is unreachable for a few seconds while the agent replaces its binary and restarts. Restarting the agent drops every client connection to its databases, as with any [update](../../../db-agent/updating.md). The upgrade is recorded in admin activity as `database-agent-host:upgrade`.

An agent whose `config.yml` sets [`ignore_upgrades`](../../../db-agent/configuration.md#ignore-upgrades) ignores the request, and the panel says so. A private fork or a GitHub API rate limit needs a **Database Agent Release Token** under [Settings > Updates](./settings.md#updates).

### General

The edit form, plus **Test Connection**, **Reset Token** (invalidates the agent's current token; you'll need to update the config file on the host afterwards), and **Delete**. Changing the **URL** needs `database-agent-hosts.read-token` as well as `update` since Panel 1.2.7, because the panel sends the host token to that address.

![General tab](./images/database-agent-hosts/general.webp)

### Instances

Every managed database on this host, searchable: Name, Server (linked), Type, Address, Template (linked), and Created. Right-click an instance to **Edit** or **Delete** it. Editing lets you pin a specific **Docker Image** (leave empty to follow the template, including future template updates), set **Environment Overrides**, and override the template's Memory, Swap, Disk, CPU, and IO Weight per instance.

![Instances tab](./images/database-agent-hosts/instances.webp)

### Backups

Every [database backup](../server/backups.md) taken from an instance on this host, searchable: Name, **Source** (the instance the dump came from), Server, Node, Checksum, Size, Retention, and Created. A dump taken by a [system backup policy](./system-backup-policies.md) carries a **SYSTEM** badge linking to the policy. **Retention** is filled in for backups that belong to a [backup group](../server/backups.md#backup-groups) or were taken by a [system backup policy](./system-backup-policies.md): a badge for the rule keeping the backup longest and the time the panel expects to delete it. There is no file count, because a dump is a single file.

Right-click a row to **Download**, **Reassign** or **Delete** it. Restore, export to files and the detach and reattach actions are file-backup concepts and are not offered for dumps.

**Reassign** moves a dump to a different database instance. The dialog has two fields: pick a **Server**, then one of that server's **Database Instances**. Only instances of the same database type are listed, and the instance the dump already belongs to is left out.

The target server can be a different one, in which case the dump moves onto that server's backup list and quota; a dump that's not on shared storage can only move to a server on the same node. Moving a dump to another server also takes it out of any [backup group](../server/backups.md#backup-groups) it was in, because groups belong to a single server.

When the host has failed dumps, a **Delete Failed Backups** button appears above the table, with the usual **Force** switch. Since Panel 1.2.8, dumps whose deletion failed after the panel's eight automatic attempts get a **Retry Failed Deletions** button next to it (requires `database-agent-hosts.backups` and `nodes.backups`).

The Node column is the node whose storage holds the dump, not the host that produced it. Deletion goes through that node, so a dump cannot be removed while its storage node is unreachable unless you force it.

::: info
A dump whose instance has since been deleted loses its link to this host and no longer appears here. It remains on the server's and the node's backup tabs.
:::

![Backups tab](./images/database-agent-hosts/backups.webp)

### Statistics

Live host metrics streamed from the agent: CPU, memory, disk, and network cards plus **CPU Load**, **Memory Usage**, **Disk I/O**, and **Network Traffic** graphs. The memory card also notes the agent's own footprint.

![Statistics tab](./images/database-agent-hosts/statistics.webp)

## How Instances Are Placed

Like database hosts, agent hosts must be attached to a node or location from that node's or location's **Database Agent Hosts** tab. When a user creates a managed database, the panel picks among hosts that are attached to the server's node or its location, have **Deployment Enabled** on, are not in maintenance, have the requested database type enabled, and still have enough free memory and disk; the least utilized eligible host is preferred. A limit of `0` always passes the capacity check and counts as zero utilization in that ranking, so a host with neither limit set comes first.

## Maintenance Mode

While **Maintenance Enabled** is on, the host takes no new instances, and users cannot send power actions to the instances already on it, update them, or delete them. Template updates skip instances on hosts in maintenance too.

::: info
The buttons on these pages follow the `database-agent-hosts.*` admin permission keys (`create`, `read`, `update`, `delete`, `test`, `read-token`, `reset-token`, `upgrade`, `backups`). See the [Permissions Reference](../dashboard/permissions.md).
:::
