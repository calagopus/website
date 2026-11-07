---
title: Sessions
description: View and revoke devices currently logged into your Calagopus account.
---

# Sessions

Sessions lists every device currently logged into your account: its IP address, whether it's the device you're using right now (the **This Device?** column), its user agent, and when it was last active.

![Sessions page listing IP, This Device, User Agent, and Last Used with a Log Out Others button](./images/sessions/list.webp)

## Revoking a Session

Right-click a session (or open the menu at the end of its row) and select **Remove** to log it out; on your current session the action is disabled. Use this if you spot a session you don't recognize or want to sign out an old device.

To clear everything at once, **Log Out Others** in the top right ends every session except the one you're using. It asks for confirmation first, and reports how many were removed. This is what you want after losing a device or changing your password.

Changing your password from [Account](./account.md) does not end other sessions by itself; it offers you this same action in a prompt afterwards. It does close your SFTP and SSH sessions on every node, and closes any server console you have open; reopen them to continue. Completing a [password reset](../auth/password-reset.md) is different: it always revokes every session on the account, with nothing to confirm.

