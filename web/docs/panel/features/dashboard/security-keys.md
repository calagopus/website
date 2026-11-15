---
title: Security Keys
description: Add passkeys and hardware security keys (WebAuthn) to your Calagopus account for passwordless login.
---

# Security Keys

Security keys use [WebAuthn](https://webauthn.io/) to let you log in with a passkey, your device's biometrics, or a physical hardware key instead of typing your password; see the [login flow](../auth/login.md#step-2-passkey-or-password) for how they're used. Your instance needs a valid SSL certificate for this to work; see [Generating SSL Certificates](../../../additional/ssl-certificates.md) if it doesn't have one yet.

Existing keys are listed with their name, credential ID, last used, and created timestamps, under a counter reading "N of M maximum security keys created.". **Create** is disabled with an explanatory tooltip when WebAuthn is off, the limit is reached, or the page isn't served over HTTPS, and a warning alert appears when the administrator has disabled security keys entirely.

![Security Keys page listing an Example key with credential ID, last used, and a Create button](./images/security-keys/list.webp)

## Creating a Security Key

Click **Create** in the top right and give the key a name. The **Allow signing in without a username** switch (on by default) saves the passkey onto the device so you can pick it from a list at login instead of typing your username; hardware security keys have limited storage and may refuse this, so turn it off and retry if setup fails. You also have to confirm your account password, unless your account signs in through an OAuth provider only and has no password set.

![Create Security Key dialog with Name, username-less sign-in toggle, and Password fields](./images/security-keys/create-form.webp)

After confirming, the browser takes over and asks where to save the credential: a password manager extension like Bitwarden, a platform prompt (Windows Hello, iCloud Keychain, Android), or a physical key. Closing that prompt cancels the creation.

![Create Security Key dialog beside the browser Save passkey prompt](./images/security-keys/save-prompt.webp)

## Editing and Removing

Right-click a key (or open the menu at the end of its row) to rename or remove it. **Edit** only changes the display name shown in the table, not the credential itself.

![Edit Security Key dialog with the Name field and Update button](./images/security-keys/edit-form.webp)

**Delete** removes the key from your account and asks for your account password to confirm, the same as creating one does. The credential stays on your device or password manager, so clean it up there as well if you do not intend to use it again. If password login is turned off for your account, you cannot remove your last remaining key; turn password login back on first.

Since Panel 1.2.10 **Delete** on your last key is greyed out with a tooltip in that case, and also while password login is disabled for the whole panel, where removing it would lock you out. When the key is your only factor that counts towards a required [two-factor](../admin/settings.md#application) setup, the confirmation warns that you'll be limited to the Account page until you set up another accepted method.

![Confirm Security Key Deletion dialog asking for the account password](./images/security-keys/delete-form.webp)

::: info
Whether security keys and usernameless login are available at all, and how many keys an account may have, is controlled by the instance administrator under [Settings > Webauthn](../admin/settings.md#webauthn) and [Settings > User](../admin/settings.md#user).
:::
