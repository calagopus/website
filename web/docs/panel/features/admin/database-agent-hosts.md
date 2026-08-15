---
title: Database Agent Hosts
description: Register and manage Calagopus DB Agent hosts, the machines that run managed database instances for your users.
---

# Database Agent Hosts

A database agent host is a machine running the [Calagopus DB Agent](../../../db-agent/index.md), which provisions managed databases: dedicated PostgreSQL, MariaDB, MongoDB, or Redis instances users create from their server's [Databases page](../server/databases.md#creating-a-managed-database).

::: info
Install the agent on the machine first; the [DB Agent docs](../../../db-agent/index.md) cover installation and the [configuration reference](../../../db-agent/configuration.md). The panel side below hands you the exact config file to drop in.
:::

The list at `/admin/database-agent-hosts` shows each host's ID, Name, and Created date. Rows have selection checkboxes; drag across rows or Ctrl/Cmd-click to select several (Ctrl/Cmd+A for all, Escape to clear). With hosts selected, an action bar appears with **Update Config**, which applies a YAML configuration snippet to every selected host at once.

![Database agent hosts list](./images/database-agent-hosts/list.webp)

## Creating a Database Agent Host

Click **Create** in the top right.

![Create database agent host form](./images/database-agent-hosts/create-form.webp)

| Field | Description |
| ----- | ----------- |
| **Name** | Display name for the host. |
| **URL** | Where the panel reaches the agent, e.g. `https://agent.example.com:8080`. If you omit the port, a warning explains the panel will connect on the URL's default port while the agent listens on `8080` by default; an **Add :8080** button appends it for you. |
| **Description** | Optional free text. |
| **Memory** / **Disk** | The capacity budget for this host. New instances are only placed on the host while the combined limits of its instances fit within these values. |
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

Below the setup steps, **Live Configuration** shows the running agent's full config in a YAML editor; edit it and hit **Save Configuration** to push changes without touching the machine. This is the same config the bulk **Update Config** action patches across many hosts.

![Live configuration editor](./images/database-agent-hosts/live-config.webp)

## Host View

### Overview

Badges show the host's deployment and maintenance state. The **Host Details** card lists URL, Memory, Disk, Description, and Created; **System Information** shows the agent's Version, CPU, Memory, Instances (online / total), Kernel Version, and Architecture. If a newer agent release exists, an **Update Available** badge appears next to the version; see [Updating](../../../db-agent/updating.md). **Allocated Resources** graphs how much of the host's memory and disk budget instances currently claim, plus allocated CPU.

![Host overview](./images/database-agent-hosts/overview.webp)

### General

The edit form, plus **Test Connection**, **Reset Token** (invalidates the agent's current token; you'll need to update the config file on the host afterwards), and **Delete**.

![General tab](./images/database-agent-hosts/general.webp)

### Instances

Every managed database on this host, searchable: Name, Server (linked), Type, Address, Template (linked), and Created. Right-click an instance to **Edit** or **Delete** it. Editing lets you pin a specific **Docker Image** (leave empty to follow the template, including future template updates), set **Environment Overrides**, and override the template's Memory, Swap, Disk, CPU, and IO Weight per instance.

![Instances tab](./images/database-agent-hosts/instances.webp)

### Statistics

Live host metrics streamed from the agent: CPU, memory, disk, and network cards plus **CPU Load**, **Memory Usage**, **Disk I/O**, and **Network Traffic** graphs. The memory card also notes the agent's own footprint.

![Statistics tab](./images/database-agent-hosts/statistics.webp)

## How Instances Are Placed

Like database hosts, agent hosts must be attached to a node or location from that node's or location's **Database Agent Hosts** tab. When a user creates a managed database, the panel picks among hosts that are attached to the server's node or its location, have **Deployment Enabled** on, are not in maintenance, have the requested database type enabled, and still have enough free memory and disk; the least utilized eligible host is preferred.

## Maintenance Mode

While **Maintenance Enabled** is on, users cannot send power actions to instances on the host, update them, or delete them. Template updates skip instances on hosts in maintenance too.

::: info
The buttons on these pages follow the `database-agent-hosts.*` admin permission keys (`create`, `read`, `update`, `delete`, `test`, `read-token`, `reset-token`). See the [Permissions Reference](../dashboard/permissions.md).
:::
