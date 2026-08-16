---
title: Dashboard
description: A tour of the Calagopus user dashboard, the part of the Panel every user sees after logging in to manage their account and servers.
---

# Dashboard

The Dashboard is what every user lands on after logging in. It covers your own account (password, email, two-factor, avatar), your servers, and account-level self-service like API keys, SSH keys, and security keys. It's separate from the **Admin** area, which is only visible to users with admin permissions and covers instance-wide management like nodes, locations, and other users.

| Page | Description |
| --- | --- |
| [Servers](./servers.md) | Your server list, server groups, and bulk power actions |
| [Account](./account.md) | Password, email, two-factor authentication, and avatar |
| [Security Keys](./security-keys.md) | Passkeys and hardware security keys for login |
| [API Keys](./api-keys.md) | Personal access tokens for the API, with granular permissions |
| [SSH Keys](./ssh-keys.md) | Public keys used for SFTP and SSH access to Wings |
| [Command Snippets](./command-snippets.md) | Shortcuts for commands you use often in the server console |
| [OAuth Links](./oauth-links.md) | Linking third-party accounts for faster login |
| [Sessions](./sessions.md) | Devices currently logged into your account |
| [Keyboard Shortcuts](./keyboard-shortcuts.md) | Rebindable shortcuts for navigating the panel |
| [Activity](./activity.md) | A log of everything that's happened on your account |

## Navigating the Dashboard

The sidebar lists every page above, plus **Servers** and **Admin** (if you have admin permissions) at the top, under the **Quick actions** trigger (see below). At the bottom sits a server switcher: click into it to search and jump straight to one of your servers. The profile box below it leads to your [Account page](./account.md).

<img src="./images/index/nav-search.webp" width="200" alt="" />

## Quick Actions

**Quick actions...** at the top of the sidebar, or `Ctrl+Space` anywhere (rebindable under [Keyboard Shortcuts](./keyboard-shortcuts.md), and it works even while typing in an input), opens a command palette: type to filter actions and pages by any part of their name, use the arrow keys to navigate, **Enter** to select, **Esc** to close.

<img src="./images/index/quick-actions.webp" width="200" alt="Quick actions trigger" />

What it offers follows where you are:

- On the dashboard: your servers, to jump straight into one, plus every dashboard page.
- Inside a server: the server's pages plus **Power** actions matching its state and your permissions (**Start** while offline, **Stop** and **Restart** while running, **Kill** while stopping).
- In the admin area: **Back**, **Home**, and every admin page.

<img src="./images/index/quick-actions-modal.webp" width="310" alt="Quick actions palette" />

A **Logout** action is available everywhere, under **Account**.

The three dots next to your name open a small menu to jump to your **Account** page, switch to the **Admin** area (admins only), pick a **Theme**, or log out. **Auto** follows your browser's theme, **Dark** and **Light** force one; the panel starts on **Dark** until you pick.

<img src="./images/index/nav-menu.webp" width="200" alt="" />
