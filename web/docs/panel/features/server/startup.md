---
title: Startup
description: Change your server's startup command, Docker image, and egg variables from the Calagopus panel.
---

# Startup

The Startup page controls how your server boots: the command that launches it, the Docker image it runs in, and the egg variables that feed into both.

![Startup page with command, Docker image, and variables](./images/startup/overview.webp)

## Startup Command

The **Startup Command** box holds the exact command used to start the server. Edit it and it saves automatically a moment after you stop typing, confirmed by a "Startup command updated." toast.

If the egg ships predefined commands, a **Predefined Startup Commands** dropdown sits above the box. Picking an entry replaces the command with that preset; a **Custom** entry represents anything you typed yourself. Whether custom commands are allowed at all is an [egg configuration](../admin/egg-configurations.md#startup-configuration) setting; when they aren't, the box is read-only and you can only pick from the list.

## Docker Image

A searchable dropdown of the images the egg offers: "The Docker image used to run this server. This can be changed to use a different image." Selecting one saves immediately.

If an administrator assigned an image outside the egg's list, the selector locks and shows "The Docker image used to run this server. This has been set by an administrator and cannot be changed.", unless the panel-wide [**Allow Overwriting Custom Docker Image**](../admin/settings.md#server) setting keeps it editable.

## Variables

Each variable is a card with its name, a description, and an input. The input type follows the variable's validation rules:

| Variable                                      | Input                                         |
| --------------------------------------------- | --------------------------------------------- |
| Boolean (or a `0`/`1`, `true`/`false` choice) | Toggle switch                                 |
| Fixed list of allowed values                  | Dropdown of those values                      |
| Integer or numeric                            | Number input                                  |
| Secret                                        | Password-style input that hides the value     |
| Anything else                                 | Text input with a **Reset to default** button |

Required variables are marked with an asterisk (toggle-style boolean variables never are), and the input's placeholder shows the default value. Variables the egg does not let users change carry a **Read-Only** badge. Since Panel 1.2.10, **Save** refuses to send an empty required variable and marks it with "This variable is required.", and an error the panel returns for one variable is shown on that field as well as in a toast.

![Variables grid with different input types](./images/startup/variables.webp)

Unlike the command and image, variables only save when you hit **Save** (or Ctrl+S). Navigating away with unsaved values triggers an **Unsaved Changes** prompt; **Leave Page** discards them.

Saving never restarts the server. New values are pushed to the node right away and take effect the next time the server starts.

Since Panel 1.2.11 a variable can also disappear and come back while you edit: the egg can [exclude](../admin/nests.md#excluding-variables) a variable depending on another one's value, for example hiding a Paper build number unless the server type is Paper. An excluded variable is hidden, isn't checked, and keeps its saved value.

### Generating a Password

Since Panel 1.2.11 secret variables have a dice button next to the visibility toggle ("Generate password") that opens a password generator:

| Option                                                | What it does                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Preview field                                         | Shows the generated password, with buttons to copy it and to regenerate it.                                   |
| **Length**                                            | 8 to 128 characters, 24 by default.                                                                           |
| **Lowercase**, **Uppercase**, **Digits**, **Symbols** | The character sets to draw from, all on by default. The password contains at least one character of each set. |
| **Exclude ambiguous characters (I, l, 1, O, 0, o)**   | Leaves out characters that are easy to misread.                                                               |

<img src="./images/startup/password-generator.webp" width="190" alt="Password generator popover with a generated password, Length 24, all four character sets on, and the Use Password button" />

**Use Password** puts the password into the field and reveals it, so you can check it before you hit **Save**. The generator remembers your options, and they [sync with your account](../dashboard/index.md#settings-sync) like other preferences.

The generator follows the variable's rules. `min`, `max`, `size` and `between` set the length range, and `alpha`, `alpha_num`, `alpha_dash`, `lowercase`, `uppercase`, `digits` and `digits_between` switch off the character sets the rules don't allow. A secret variable whose rules the generator can't satisfy for sure, such as one with a `regex` or `in` rule, gets no dice button.

The same generator appears on the admin [user form](../admin/users.md#creating-a-user) and on the Restic password of a [backup configuration](../admin/backup-configurations.md), and on secret variables in the admin server forms.

::: info
The predefined commands, image list, and variables come from the [egg](../admin/nests.md#editing-an-egg); whether custom commands are allowed comes from [egg configurations](../admin/egg-configurations.md). Both are managed by administrators.
:::

Viewing this page needs the `startup.read` permission; editing variables, the command, and the image need `startup.update`, `startup.command`, and `startup.docker-image` respectively. See the [Permissions Reference](../dashboard/permissions.md).
