---
title: API Keys
description: Create and manage personal API keys for the Calagopus API, with granular permissions per key.
---

# API Keys

API keys are personal access tokens for the [API](https://demo.calagopus.com/api). Each key gets its own set of permissions, so you can hand out a key scoped to exactly what it needs rather than your full account access.

The list shows each key's name, the beginning of its key value, how many user/server/admin permissions it has, and its last used, expiry, and created timestamps. A counter reads "N of M maximum api keys created.", and **API Documentation** in the top right opens your panel's `/api` reference.

![](./images/api-keys/list.webp)

## Creating a Key

Click **Create** in the top right. Give it a name, optionally an expiry date, and optionally a list of IPs it's allowed to be used from (leave empty to allow any IP).

![](./images/api-keys/create-form.webp)

Expiry uses a calendar picker with an optional time:


Below that are the permission categories: **User**, **Server**, and **Admin** (the last only shown if your own account has admin permissions). Check individual permissions, or toggle an entire category at once.

Everything you've selected shows up on the right under **Selected Permissions**, where **Select All** and **Deselect All** toggle everything and a clipboard menu offers **Copy Permissions** and **Paste Permissions**. See the [Permissions Reference](./permissions.md) for what every permission does.

Once you're happy with the selection, scroll down and hit **Save**, or **Close** to back out without creating anything. The full key value is shown exactly once, in an **API Key Created** modal: "Make sure to copy it now, as it will not be shown again."

## Editing, Recreating, and Removing

Right-click a key (or open the menu at the end of its row) for **Edit**, **Recreate**, or **Remove**.


**Edit** opens the same form as creating one, letting you change the name, expiry, allowed IPs, and permissions.

![](./images/api-keys/edit-form.webp)

**Recreate** issues a new key value with the same name and permissions, immediately invalidating the old value; the new one appears once in an **API Key Recreated** modal. Use this if a key may have leaked. **Remove** deletes the key outright.

## Third-Party Key Requests

External applications can send you to `/account/api-keys/create` or `/account/api-keys/update` to request a key with specific permissions, or changes to an existing one. The page shows exactly what is requested, with **Added**, **Granted**, and **Removed** badges on the permission diff, warns when admin permissions are involved, and returns you to the app's callback URL once you approve.

::: info
A key can never edit itself or grant permissions it doesn't already have, even with `api-keys.update`. The maximum number of API keys per account is set by the instance administrator under [Settings > User](../admin/settings.md#user).
:::
