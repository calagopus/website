---
title: Security Keys
description: Add passkeys and hardware security keys (WebAuthn) to your Calagopus account for passwordless login.
---

# Security Keys

Security keys use [WebAuthn](https://webauthn.io/) to let you log in with a passkey, your device's biometrics, or a physical hardware key instead of typing your password. Your instance needs a valid SSL certificate for this to work; see [Generating SSL Certificates](../../../additional/ssl-certificates.md) if it doesn't have one yet.

Existing keys are listed with their name, credential ID, last used, and created timestamps. Right-click one to rename it or delete it.

![](./images/security-keys/list.webp)

## Creating a Security Key

Click **Create** in the top right and give the key a name.

![](./images/security-keys/create-form.webp)

After confirming, the browser takes over and asks where to save the credential: a password manager extension like Bitwarden, a platform prompt (Windows Hello, iCloud Keychain, Android), or a physical key. Closing that prompt cancels the creation.

![](./images/security-keys/save-prompt.webp)

## Editing and Removing

Right-click a key to rename it or delete it. Editing only changes the display name, not the credential itself.

![](./images/security-keys/context-menu.webp)
![](./images/security-keys/edit-form.webp)
