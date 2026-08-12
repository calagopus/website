---
title: Mounts
description: Attach and detach admin-defined host directories into your server's container.
---

# Mounts

Mounts make a directory from the host machine available inside your server's container at a fixed target path, useful for things like shared plugin folders or common asset directories.

![Mounts table](./images/mounts/list.webp)

The table lists every mount available to your server: **Name**, **Description**, **Target** (the path inside the container, e.g. `/home/container/plugins-mount`), **Mounted**, and **Read Only**.

Use the green **+** at the end of a row to attach a mount, or the red **-** to detach one. Both ask for confirmation first ("Do you want to attach **name** to `target`?") and confirm with a toast once done.

::: info
Users only toggle mounts on and off. Which mounts exist, where they point, and whether they are read-only is defined by administrators under [Mounts](../admin/mounts.md), and every mounted path must also be whitelisted in the node's [`allowed_mounts`](../../../wings/configuration.md#allowed_mounts) Wings setting.
:::

Attaching and detaching are gated by the `mounts.attach` and `mounts.detach` permissions, viewing by `mounts.read`. See the [Permissions Reference](../dashboard/permissions.md).
