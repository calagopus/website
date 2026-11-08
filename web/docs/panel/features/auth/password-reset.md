---
title: Password Reset
description: Requesting a password reset email and choosing a new password on a Calagopus panel.
---

# Password Reset

Forgot your password? The reset is two pages: request an email, then set the new password through the link it contains.

## Requesting a Reset

The **Forgot Password** link on the [login page](./login.md) leads to `/auth/forgot-password` ("Enter your email to receive instructions on how to reset your password"). Enter your **Email** and hit **Request Password Reset**.

A green **Success** alert above the card always reports "An email has been sent to you with instructions on how to reset your password.", whether or not the address belongs to an account, so it can't be used to check which emails are registered. Repeat requests for the same account within 20 minutes are silently dropped behind the same message.

When a captcha is configured, it has to be solved first; after a successful request the button stays disabled until you reload, and **Login** below the separator leads back.

::: warning
The email only goes out if the panel has a [mail provider](../admin/settings.md#mail) configured. Admins can edit the message itself under [Mail Templates](../admin/settings.md#mail-templates).
:::

Self-service resets are off entirely when an admin has turned off **Enable Password Login** in [Settings](../admin/settings.md#application); the **Forgot Password** links disappear and `/auth/forgot-password` stops being a page. Setting a new password through a link an admin generated still works, so an admin can hand out a password ahead of turning the setting back on.

## Choosing a New Password

The emailed link opens `/auth/reset-password` with your reset token attached ("Please enter your new password"). Enter the new **Password** twice, the second time in **Confirm Password**, and hit **Reset Password**. On success you're sent back to the login page with a "Password has been reset." confirmation. Opening the page without a token just redirects to login.

Reset tokens expire after 20 minutes and work exactly once; if yours is rejected as invalid or expired, request a new email.

The email a new account gets when it is created for you (for example when someone adds your address as a [subuser](../server/subusers.md) and no account exists yet) also links here to set your first password. Since Panel 1.2.8 that link lasts an hour. It doesn't count as a recent request, so if it expired or never arrived you can request a normal reset straight away, and doing so replaces the original link.

Completing a reset also marks your email address as verified, since receiving the link proves you own the mailbox. That makes this the way out if your account is stuck behind [email verification](../dashboard/account.md#email-verification) and the verification mail never arrives.

A successful reset ends every [session](../dashboard/sessions.md) on the account, so anyone still logged in on another device is signed out and you have to log in again yourself. Nothing is left signed in if someone else got hold of the account.

::: info
For admins: both endpoints are [rate limited](../admin/settings.md#ratelimits), and reset requests are additionally limited per email address, not just per IP.
:::
