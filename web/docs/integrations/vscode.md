# VS Code

The **Calagopus** extension lets you browse and edit your server's files and attach to its live console directly from your editor, without leaving your development environment. Files are mounted as a workspace folder over a virtual `calagopus://` filesystem, so the full power of your editor - multi-cursor editing, search, extensions, and the integrated terminal - works against your server just like a local project.

## Supported editors

The extension is published to both major registries, so it works in Visual Studio Code and the wider ecosystem of compatible editors:

- [**Visual Studio Code Marketplace**](https://marketplace.visualstudio.com/items?itemName=calagopus.calagopus) - for Visual Studio Code.
- [**Open VSX Registry**](https://open-vsx.org/extension/calagopus/calagopus) - for editors that cannot use the Microsoft marketplace, including [VSCodium](https://vscodium.com), [code-server](https://github.com/coder/code-server), [Gitpod](https://www.gitpod.io), Cursor, Windsurf, and most other VS Code forks.

::: info
Pick the registry that matches your editor. The extension is identical on both - only the distribution channel differs. Any editor that can install from Open VSX is supported.
:::

The extension is open source - you can browse the code, file issues, or build it yourself from the [`calagopus/vscode-extension`](https://github.com/calagopus/vscode-extension) repository.

## Requirements

- A Calagopus account with access to one or more servers.
- VS Code (or a compatible editor) version `1.120.0` or newer.

## Installation

::::tabs
=== Visual Studio Code

1. Open the **Extensions** view (`Ctrl`/`Cmd` + `Shift` + `X`).
2. Search for **Calagopus**.
3. Click **Install** on the extension published by `calagopus`.

Alternatively, install it from the [Marketplace page](https://marketplace.visualstudio.com/items?itemName=calagopus.calagopus) in your browser.

=== VSCodium / Open VSX

1. Open the **Extensions** view (`Ctrl`/`Cmd` + `Shift` + `X`).
2. Search for **Calagopus**.
3. Click **Install** on the extension published by `calagopus`.

VSCodium, code-server, and most other forks are wired to the [Open VSX Registry](https://open-vsx.org/extension/calagopus/calagopus) out of the box. If your editor does not surface the extension in search, you can download the `.vsix` from Open VSX and install it manually via **Extensions → ... → Install from VSIX**.

::::

![](./images/vscode/extensions-view.webp)

## Connecting from the panel

The quickest way to get started is straight from your server's file manager. Open the **Files** tab for any server, then click the **Connect** dropdown in the toolbar and choose **Connect via VS Code**.

![](./images/vscode/connect-dropdown.webp)

Your editor opens, mounts the server's files as a workspace folder, and attaches to the console automatically. The same **Connect** dropdown is available in the header while editing a file, which will open that exact file in your editor once the server is mounted.

::: info
The first time you connect to a panel, the extension signs you in through your browser - it provisions a scoped API key for you and stores it securely in your editor's secret storage, then reuses it on future connections. No copy-pasting keys required. See [Authentication](#authentication) for the full flow.
:::

## Connecting from within the editor

You can also drive everything from the editor using the Command Palette (`Ctrl`/`Cmd` + `Shift` + `P`). The extension contributes the following commands, all under the **Calagopus** category:

| Command | Description |
| --- | --- |
| `Calagopus: Sign In` | Authenticate with your Calagopus panel. |
| `Calagopus: Sign Out` | Clear stored credentials for one or all panels. |
| `Calagopus: Open Server Files` | Pick a server and mount its files as a workspace folder. |
| `Calagopus: Open Server Console` | Pick a server and attach to its console. |
| `Calagopus: Server Power Action` | Start, stop, restart, or kill the active server. |
| `Calagopus: Enable File Collaboration` | Turn on real-time collaborative editing (see [Real-time collaboration](#real-time-collaboration)). |
| `Calagopus: Disable File Collaboration` | Turn off real-time collaborative editing. |

![](./images/vscode/command-palette.webp)

## Features

### Remote file editing

Once a server is mounted, its files appear as an ordinary workspace folder. You can edit, create, rename, move, and delete files and directories using native editor tooling - every change is written back to the server over the `calagopus://` filesystem.

### Searching files

When the editor's proposed search APIs are enabled, you can search across your server's files by **name** and **content** using the editor's built-in search. This relies on proposed APIs that are not available in every build; if search results do not appear, your editor likely has the proposed APIs disabled.

### Live console

Attach to your server's console as an integrated terminal. Output streams in real time and you can send commands straight from the terminal input, exactly as you would from the panel's console tab.

![](./images/vscode/integrated-terminal.webp)

### Real-time collaboration

When more than one person opens the same server file, the extension keeps everyone's edits in sync live - you see each other's changes as they are typed, along with colored cursors and selections labeled with each participant's name. Editing is backed by a shared document (CRDT) synchronized through the panel, so concurrent edits merge cleanly without clobbering one another.

![Remote collaborator's cursor and selection in the editor](./images/vscode/collab-cursors.gif)

While others are editing a file with you, a presence indicator appears in the status bar showing how many people (including you) are in the file; hovering it lists the other participants by name. Files with unsaved collaborative changes are marked with a dot in the Explorer.

![Collaboration presence indicator in the status bar](./images/vscode/collab-presence.png)

Saves are coordinated through the panel: when you save a collaborative file, the extension asks the panel to persist the shared document so every participant ends up with the same on-disk result.

Collaboration is on by default. You can toggle it per editor with the **Calagopus: Enable File Collaboration** and **Calagopus: Disable File Collaboration** commands, or via the `calagopus.collaboration.enabled` setting:

```json
{
  "calagopus.collaboration.enabled": false
}
```

### File history

Every Calagopus server file keeps a history of revisions. When a server is mounted, a **File History** view appears in the Explorer sidebar and tracks whichever server file is active in the editor, listing its revisions newest-first. Each entry shows who made the change, how long ago, its size, and whether it is a full snapshot.

![File History view in the Explorer sidebar](./images/vscode/file-history.png)

From a revision's inline actions (or by clicking it) you can:

- **View Diff Against Current File** - open a diff between the selected revision and the file as it is now.
- **Compare to Previous Revision** - diff the selected revision against the one immediately before it.
- **Restore Revision into Editor** - load the revision's contents back into the open editor (you still save to write it back to the server).

![Diff between a past revision and the current file](./images/vscode/revision-diff.png)

### Power actions & status bar

The current server's power state is shown in the status bar. Use the **Calagopus: Server Power Action** command (or the status bar item) to **start**, **stop**, **restart**, or **kill** the server without switching back to the panel.

![](./images/vscode/status-bar.webp)

## Deep links

The extension registers a `calagopus` URI handler. This is the mechanism the panel's **Connect via VS Code** button uses, and you can build your own links to open a server (and optionally a specific file and the console) from anywhere:

```
vscode://calagopus.calagopus/open?origin=<panel-url>&server=<server-uuid>
```

| Parameter | Required | Description |
| --- | --- | --- |
| `origin` | Yes | Panel base URL, e.g. `https://panel.example.com`. |
| `server` | Yes | The server's UUID. |
| `console` | No | When truthy (`1`/`true`), also attach to the server console. |
| `file` | No | Path (relative to the server root) to open in the editor after mounting. |
| `apiKey` | No | An API key for an ephemeral, non-persisted session (credentials are not saved). |

::: warning
A `vscode://` link is the canonical scheme for Visual Studio Code. Some forks register a different scheme (for example, `vscodium://` or `codium://`) - if a link does not open in your editor, click the settings icon in the top left of the file manager and change the VS Code URI scheme to match your editor's registered scheme.

![](./images/vscode/uri-scheme-setting.webp)
:::

## Authentication

Sign-in is per panel and backed by your editor's secret storage, so your credentials never touch the workspace and persist securely between sessions. Connecting to a new panel for the first time signs you in; from then on the session is reused automatically.

### Browser sign-in

Whenever you sign in without supplying a key - both from the panel's **Connect** button and via the **Calagopus: Sign In** command - the extension provisions an API key for you rather than asking you to paste one:

1. It starts a short-lived local (loopback) HTTP server and opens the panel's API-key creation page in your browser, pre-filled with the key name, the permissions the extension needs, and a callback URL.
2. You review and approve the key in the panel.
3. The panel redirects back to the callback URL with the new key, which the extension stores in your editor's secret storage and uses from then on.

A progress notification is shown while this round-trip happens. If the callback never arrives (for example, in a locked-down browser), you can paste an API key into the same prompt manually as a fallback.

::: info
This flow works across editors - including VS Code forks that don't register a custom URI scheme - and is forwarded automatically in Remote and Codespaces environments, so the browser round-trip still reaches your editor.
:::

### Signing out

To revoke access, run **Calagopus: Sign Out**. If you are signed in to more than one panel, you can sign out of a single panel or all of them at once. Signing out only clears the stored key from your editor; to fully revoke the key, delete it from your panel's **Account → API Keys** page.

::: info
Deep links that include an `apiKey` parameter open an **ephemeral** session - that key is used for the connection only and is never written to secret storage.
:::

## Troubleshooting

### The deep link does not open my editor

Your editor may register a URI scheme other than `vscode://`. Click the settings icon in the top left of the file manager and change the VS Code URI scheme to match your editor's registered scheme (for example, `vscodium://` or `codium://`).

![](./images/vscode/uri-scheme-setting.webp)

### File search returns no results

Search relies on proposed editor APIs that are not enabled in every build. File **editing** still works without them - only name/content search across server files is affected.

### I don't see other people's cursors

Real-time collaboration must be enabled on both ends (it is on by default). Check that `calagopus.collaboration.enabled` is set to `true`, or run **Calagopus: Enable File Collaboration**. Presence and cursors only appear once more than one person has the same file open.

### The File History view is empty

The **File History** view only appears when a server is mounted, and it tracks the file that is currently active in the editor - open a server file to populate it. A file that has never been changed through the panel will not have any revisions yet.

### "Malformed open link" error

A deep link is missing the required `origin` or `server` parameter. Both must be present, and `origin` must be the full panel base URL (including `https://`).
