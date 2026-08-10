---
title: SSH Keys
description: Add public SSH keys to your Calagopus account to use for SFTP and SSH access to Wings.
---

# SSH Keys

SSH keys added here are used for SFTP and SSH logins to Wings, the node daemon. The list shows each key's name, fingerprint, and when it was created; it's empty until you add your first one.

![](./images/ssh-keys/list.webp)

## Adding a Key

**Create** lets you paste or upload a public key file (`.pub`) and give it a name.

![](./images/ssh-keys/create-form.webp)

**Import** does the same thing but is meant for grabbing a key straight from a `.pub` file without typing anything else in.

![](./images/ssh-keys/import-form.webp)

Either way, once the key is added it can be used for SFTP or SSH logins to Wings right away.

## Editing and Removing

Right-click a key to edit or delete it.

![](./images/ssh-keys/context-menu.webp)

Editing only lets you change the key's name, not the key material itself. Add a new key instead if the underlying key pair changed.

![](./images/ssh-keys/edit-form.webp)
