---
title: Console
description: The Calagopus server console, with power controls, a live terminal, command history, resource stats, and usage graphs.
---

# Console

The Console is the landing tab of every server: power controls, the live terminal, resource stats, and usage graphs on one page.

![Server console page with live Minecraft log output, command input, resource cards, and usage graphs](./images/console/overview.webp)

## Power Controls

**Start**, **Restart**, and **Stop** sit next to the server's name. **Start** is only clickable while the server is offline, **Stop** only while it isn't. While the server is stopping, **Stop** turns into **Kill** to force-stop the process.

::: warning
**Kill** asks for confirmation first (**Forcibly Stop Process**), because forcibly stopping a server can lead to data corruption. Use it only when a normal stop hangs.
:::

Each button requires its matching permission (`control.start`, `control.restart`, `control.stop`), and all of them are disabled while the server is suspended, transferring, or installing.

## The Terminal

Output streams in live over a websocket. The dot in the top left shows the connection: green with **Connected (12ms ping)**, refreshed every 10 seconds, or red with **Disconnected** if the connection drops. Recent logs replay when you open the page, and state changes are written into the stream as "Server marked as Running...".

The icons in the top right of the terminal:

| Icon | Does |
| --- | --- |
| **Search** | Search the scrollback (also `Ctrl`+`F`). Enter jumps to the next match, Shift+Enter to the previous. |
| **SSH Details** | Connection details for SSH access, see below |
| **Command History** | Previously sent commands, see below |
| **Decrease Font Size** / **Increase Font Size** | Adjust the terminal font between 10px and 24px; the choice is saved to your account and follows you to other devices, unless you set it to this device only. With the terminal focused, `Ctrl+=`, `Ctrl+-` and `Ctrl+0` (reset to 14px) do the same, as does `Ctrl` + mouse wheel over it; see [Font Size Shortcuts](../dashboard/keyboard-shortcuts.md#font-size-shortcuts) |

Select text to copy it: `Ctrl`+`C` copies the selection, and so does the browser's own **Copy** (from the right-click menu, for example). The selection is cleared once copied. On touch screens a long press starts selecting and shows a **Copy Selection** button. If you've scrolled up, an arrow button jumps back to the bottom.

When the server's Docker image has to be pulled before it can start, pull and extract progress bars appear below the terminal.

## Sending Commands

The input below the terminal (**Type a command...**) sends commands straight to the server process. It requires the `control.console` permission and is disabled while the server is offline.

Arrow Up and Arrow Down cycle through your last commands (up to 32, kept per server in your browser); the bindings are rebindable in [Keyboard Shortcuts](../dashboard/keyboard-shortcuts.md).

Typing `!` suggests your [Command Snippets](../dashboard/command-snippets.md); picking one pastes its full command into the input.

### Command Prefix

Click the terminal icon in the command input to set a **Command Prefix** of up to 64 characters. The prefix is prepended exactly as entered to commands sent from this input, so include a trailing space if the command needs one, for example `say `. Clear it with the clear button. The prefix lasts while this console view is open; it is not a saved server setting.

![Console command prefix](./images/console/command-prefix.webp)

### Command History

**Command History** opens a drawer of every command sent to this server, pulled from the [Activity](./activity.md) log (so it needs the `activity.read` permission). Click an entry to see the full command, who sent it (a user, a schedule, or the system), and when. From there, **Send Command** runs it again and **Copy Command** copies it.

<img src="./images/console/command-history.webp" width="200" alt="Command History panel listing recent console commands with the user and time" />

### SSH Details

**SSH Details** shows everything needed to open a shell on the server over SSH: protocol, host, port, the username (your panel username followed by the server's short ID, like `<username>.<server-id>`), and a ready-made **SSH Command**. The password is your panel password, or add an [SSH Key](../dashboard/ssh-keys.md) to skip it. If your password cannot open the connection, the key is required and a warning replaces the password field.

Every field except the password copies on click, and **Launch** opens the connection in your system's SSH client. Both this and **Command History** are disabled while the server is suspended or busy installing, restoring, or transferring.

<img src="./images/console/ssh-details.webp" width="220" alt="SSH Details dialog with protocol, port, host, username, password, and SSH command fields" />

### SSH Shell Commands

The SSH shell is the server console: it shows the console output, and each line you type is sent to the server as a command (requires `control.console`). Lines starting with `.wings` are handled by Wings instead. The node can rename the prefix with [`system.sftp.shell.cli.name`](../../../wings/configuration.md#system-sftp-shell-cli-name) or turn the shell off with [`system.sftp.shell.enabled`](../../../wings/configuration.md#system-sftp-shell-enabled), and opening it needs the `websocket.connect` permission.

| Command | What it does |
| --- | --- |
| `.wings help` | Lists the commands. |
| `.wings version` | Shows the Wings version of the node. |
| `.wings status [--json]` | Shows the server state and whether a restart is pending. |
| `.wings power start\|restart\|stop\|kill [--wait]` | Sends a power action; needs the matching `control.*` permission. With `--wait`, waits up to 10 minutes until the server is running (start, restart) or offline (stop, kill). |
| `.wings stats [--json]` | Shows CPU, memory, disk and network usage against the server's limits. |
| `.wings logs [lines]` | Prints the last console lines, by default as many as the console loads on connect. Needs `control.read-console`. |
| `.wings permissions [--json]` | Lists your permissions on the server, and says when some files are hidden from you. |

`status`, `logs`, `permissions`, `power --wait` and the `--json` options need Wings 1.2.8 or newer; older versions only have `help`, `version`, `power` and `stats`. On 1.2.8 the commands also work without an interactive shell, which makes them usable from scripts. The SSH exit status is `0` on success and `1` on failure:

```bash
ssh -p 2022 user.1a2b3c4d@node.example.com '.wings power restart --wait'
```

A command that does not start with `.wings` is sent to the console the same way, without printing any output; it fails with `Server is not running.` while the server is offline, and with `Permission denied.` without `control.console`. Wings before 1.2.8 sends every such command to the console, `.wings` included, and always exits with `0`.

## Stats

To the right of the terminal, tiles show the server's live stats. Usage tiles show current use against the server's limit, like `869.89 MiB / 4 GiB`, or **Unlimited** where no limit is set; while the server is offline they read **Offline**, except **Disk Usage**, which always shows the stored amount.

| Tile | Shows |
| --- | --- |
| **Address** | The server's primary address, click to copy. Eggs that use a separate port show a **Port** tile too. |
| **Uptime** | Time since the server started |
| **CPU Load** | CPU usage against the CPU limit, like `2.35% / 400%`. A checkbox on the tile, **Normalize CPU Load (shifted to max 100%)**, rescales it to a 0-100% range instead. |
| **Memory Load** | Memory usage against the memory limit |
| **Disk Usage** | Disk usage against the disk limit |
| **Network (In)** / **Network (Out)** | Current receive and send rate in bits per second, against the server's download and upload [bandwidth limits](../admin/servers.md#resource-limits). The line below shows the total traffic and the packets per second, like `1.2 GiB total · 340 pps`. |

## Graphs

Below everything, three live graphs: **CPU Load**, **Memory Load**, and **Network**. The Network graph tracks both directions in bits per second; click **Hide Outbound** or **Hide Inbound** in its legend to focus on one. While the server is offline, the graphs show a **Server is offline** overlay instead. Until the first stats arrive after opening the page, they show **Connecting...** with a spinner, and the stat tiles show a spinner rather than **Offline**.

When the server has a CPU or memory limit, that graph draws it as a dashed red **Limit** line. Once usage reaches 40% of the limit, the graph's scale stretches to the limit so you can see how close the server is; below that the line sits off the top of the graph and only a small **Limit** label marks it. Hovering over one graph highlights the same moment on all three.

![CPU load, memory load, and network graphs below the console](./images/console/graphs.webp)

## Automatic Prompts

On some eggs, the console reacts to known startup problems:

- Minecraft eggs: if the server stops because the EULA isn't accepted, a **Minecraft EULA Agreement** modal appears. **Accept EULA** sets `eula=true` in `eula.txt` and restarts the server.
- If the server can't start because it's running an unsupported Java version, an **Unsupported Java Version** modal lets you pick a supported Docker image and apply it with **Update Docker Image**.
