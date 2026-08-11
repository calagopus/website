---
title: Password Reset
description: Requesting a password reset email and choosing a new password on a Calagopus panel.
---

# Password Reset

Forgot your password? The reset is two pages: request an email, then set the new password through the link it contains.

## Requesting a Reset

The **Forgot Password** link on the [login page](./login.md) leads to `/auth/forgot-password` ("Enter your email to receive instructions on how to reset your password"). Enter your **Email** and hit **Request Password Reset**.

A **Success** toast always reports "An email has been sent to you with instructions on how to reset your password.", whether or not the address belongs to an account, so it can't be used to check which emails are registered. When a captcha is configured, it has to be solved first.

::: warning
The email only goes out if the panel has a [mail provider](../admin/settings.md#mail) configured. Admins can edit the message itself under [Mail Templates](../admin/settings.md#mail-templates).
:::

## Choosing a New Password

The emailed link opens `/auth/reset-password` with your reset token attached ("Please enter your new password"). Enter the new **Password** twice, the second time in **Confirm Password**, and hit **Reset Password**. On success you're sent back to the login page with a "Password has been reset." confirmation. Opening the page without a token just redirects to login.

Reset tokens expire after 20 minutes and work exactly once; if yours is rejected as invalid or expired, request a new email.

::: info
For admins: both endpoints are [rate limited](../admin/settings.md#ratelimits), and reset requests are additionally limited per email address, not just per IP.
:::
