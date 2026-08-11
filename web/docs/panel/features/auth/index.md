---
title: Authentication
description: Logging in, registering, and resetting your password on a Calagopus panel, and where admins control each part of the flow.
---

# Authentication

Everything you can do without a session lives under `/auth/`. All of these pages share the same centered card layout: the panel icon and name on top, a heading and subtitle, the form itself, an **OR** separator, and alternate actions below it.

| Page | Description |
| --- | --- |
| [Login](./login.md) | The two-step login flow, passkeys, OAuth providers, and the two-factor checkpoint |
| [Register](./register.md) | Creating an account, when registration is enabled |
| [Password Reset](./password-reset.md) | Requesting a reset email and choosing a new password |

## What Admins Control

What actually shows up on these pages depends on panel settings:

| Behavior | Where |
| --- | --- |
| Registration on or off | **Enable Registration** in [Settings > Application](../admin/settings.md#application) |
| Who must use 2FA | **Two-Factor Authentication Requirement** in [Settings > Application](../admin/settings.md#application) |
| Captcha on the auth forms | [Settings > Captcha](../admin/settings.md#captcha) |
| Passkeys and usernameless login | [Settings > Webauthn](../admin/settings.md#webauthn) |
| OAuth login buttons | [OAuth Providers](../admin/oauth-providers.md) |
| Reset and other outgoing email | [Settings > Mail](../admin/settings.md#mail) |
| Rate limits on the auth endpoints | [Settings > Ratelimits](../admin/settings.md#ratelimits) |
