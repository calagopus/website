---
title: Account
description: Manage your Calagopus account, password, email, two-factor authentication, account details, and avatar.
---

# Account

The Account page covers everything about your own user profile: password, email, two-factor authentication, display details, and avatar.

![Account page with Password, Email, Two-Factor Authentication, Account Details, Preferences, and Avatar panels](./images/account/overview.webp)

## Email Verification

If the administrator has turned on **Require Email Verification** and you haven't confirmed your address yet, a red **Email Verification Required** alert sits at the top of this page with a **Resend Verification Email** button, and the panel keeps redirecting you here from anywhere else.

Until you verify, the panel is almost entirely closed off. You can reach this page and the [Security Keys](./security-keys.md) page, change your email, request a new link, and log out. **SFTP and SSH are refused too**, so that route to your files is shut as well.

The link is mailed to you and stays valid for 24 hours; requesting a new one is limited to once a minute. Opening it takes you to `/auth/verify-email` and marks the address verified. Completing a [password reset](../auth/password-reset.md) also verifies your address, which is the way out if the verification mail never arrives but the reset mail does.

## Password

Enter your current password, then your new password twice, and hit **Update**. You always have to confirm your current password first, even if you're already logged in. If your account was created through an OAuth provider and has no password set, the **Current Password** field is hidden and this is how you set one for the first time.

Changing your password does not sign anyone out of the panel on its own, so a **Log Out Other Sessions** prompt follows a successful change. On nodes running Wings 1.2.6 or newer it does cut off what is already connected there: your open SFTP and SSH sessions and server consoles are closed, and you have to reconnect.

<img src="./images/account/password-log-out-others.webp" width="220" alt="Log Out Other Sessions dialog shown after a password update with a Log Out Others button" />

**Log Out Others** ends every [session](./sessions.md) except the one you're using and reports how many were removed; **Cancel** leaves them alone. Take it if you changed your password because you suspect someone else has it, or if you were signed in somewhere you no longer control. It is the same action as **Log Out Others** on the Sessions page, so you can also do it later.

## Email

Same idea: enter your new email and your current password, then **Update**.

When email verification is required, the change doesn't apply straight away. The panel mails a confirmation link to the *new* address and tells you "Confirmation link sent to {email}. Your address changes once you open it." Until you open that link, your old address stays in place. Confirming it also invalidates any outstanding password reset.

## Two-Factor Authentication

Standard TOTP-based 2FA, the same kind used by most apps. Scan the QR code (or enter the code shown below it) in your authenticator app, then enter the 6-digit code it generates along with your current password to enable it.

<img src="./images/account/2fa-setup.webp" width="220" alt="Setup Two-Factor Authentication dialog with a QR code, Authentication Code field, and Password field" />

Right after enabling, a **Recovery Codes** dialog appears: "Below are your recovery codes. Store these in a safe place. If you lose access to your authentication device, you can use these codes to regain access to your account." You get ten codes; click the code block to copy them all, or **Download** to save them as `recovery-codes.txt`, one per line. Enabling email two-factor shows the same dialog with the same button.

Each code works exactly once at the [login checkpoint](../auth/login.md#two-factor-checkpoint), so store them somewhere safe before closing the dialog. The panel keeps the same set as long as you have any code left, so enabling a second email-based factor later shows you the same codes again rather than new ones.

<img src="./images/account/2fa-recovery-codes.webp" width="220" alt="Recovery Codes dialog listing the generated one-time recovery codes" />

Once you have a second factor set up, the card lists each enrolled method as a green badge (**Authenticator App**, **Security Key** or **Email**), plus a line showing when your authenticator app was last used. With nothing set up it reads "No second factor is set up on your account yet." instead.

Up to three buttons sit at the bottom of the card: **Setup Two-Factor** or **Disable Two-Factor** for the authenticator app, **Enable Email** or **Disable Email** when the administrator has turned on email two-factor, and **Security Keys**, which takes you to the [Security Keys](./security-keys.md) page. Disabling asks for a valid authentication code and your password again.

Every authenticator code is accepted only once. The code you confirm the setup with cannot be reused to log in, and the code you just logged in with cannot be used to disable 2FA. Wait for your app to show the next code if you get "this code has already been used".

If your role or the panel requires 2FA, the card also tells you whether your account currently meets that requirement. Disabling your last factor while it is required also disconnects your open SFTP/SSH sessions and server consoles, because Wings refuses accounts that don't meet the requirement. A frozen account shows an alert explaining that account details cannot be changed.

<img src="./images/account/2fa-disable.webp" width="220" alt="Disable Two-Factor Authentication dialog asking for an authentication code and password" />

## Password Login

This card only appears if your account has a password, and only while password login is switched on panel-wide. It reads either "You can sign in with your password." or "Password login is turned off. Only your security keys can sign you in.", with a button to flip it. Both directions ask for your password to confirm.

You cannot turn password login off until you have at least one [security key](./security-keys.md); the button stays disabled with the tooltip "Add a security key before turning off password login." until then, and the panel refuses it server-side as well.

Turning it off is broader than it sounds: your password stops working **everywhere**, including SFTP password authentication. SSH keys keep working, and so do your security keys. Attempting a password login afterwards fails with "password login is disabled for this account". On nodes running Wings 1.2.6 or newer, turning it off also closes your open SFTP and SSH sessions and server consoles. While it's off you also can't delete your last remaining security key, which would otherwise lock you out entirely.

An administrator can make the same call for the whole panel, through **Enable Password Login** in [Settings](../admin/settings.md#application). The card disappears while that is off, because there is nothing left for it to switch, and the last-security-key rule applies to you either way.

## Account Details

Your first name, last name, username, and panel language. First and last name are optional; username is required, and the language selector only appears when the administrator allows changing it.

## Preferences

A separate card holding **Toast Position** (where notifications pop up on screen) and a toggle for whether the panel should open to the **Grouped Servers** view instead of **All Servers**, off by default. See [Servers](./servers.md) for the difference.

**Hide server addresses** masks IP addresses with `*` across the panel, for streaming or screen sharing. It covers server and allocation addresses, SFTP and SSH details, database hosts, session and activity IPs, and IPs printed in the server console; loopback and wildcard addresses such as `127.0.0.1` and `0.0.0.0` stay visible, and ports are kept. Toggling it redraws the console with the masking applied. The switch is labelled "best effort": in the console only IP addresses are masked, so hostnames printed there stay visible, and an address can still show up in files or anywhere else the panel does not treat as an address. The same toggle sits in the profile menu at the bottom of the sidebar as **Hide Addresses**.

## Avatar

Click the empty **Avatar** field to upload an image. If it doesn't crop the way you want, drag the position handles on the preview grid to adjust it before saving.

<img src="./images/account/avatar-empty.webp" width="349" alt="Avatar panel with an empty crop preview and disabled Update and Remove buttons" />

Once you have an avatar set, upload a new file and hit **Update** to replace it, or **Remove** to delete it.

Uploads must be PNG, JPEG, WebP or GIF, and between 64 and 4096 pixels on both sides; the file type is checked by content, not by its extension. Whatever you upload is re-encoded to a 512x512 WebP, so there is no benefit to sending anything larger.

<img src="./images/account/avatar-set.webp" width="338" alt="Avatar panel with a selected image file in the crop preview and an active Update button" />

An administrator can also configure an OAuth provider to bring your picture over from [the account you log in with](./oauth-links.md). Unless they turned overwriting on for that provider, the import only fills an empty avatar, so one you uploaded yourself stays put. That does mean **Remove** won't stick while such a provider is configured: the next login through it sees an empty avatar and imports the picture again.

If the Avatar card is missing, an administrator has turned off [Allow Changing Avatar](../admin/settings.md#user). Your current avatar stays as it is, but you can't upload or remove one yourself, and the API refuses with "changing avatar is not allowed". Pictures imported through an OAuth provider still arrive as described above.
