---
title: Keyboard Shortcuts
description: View and rebind keyboard shortcuts for navigating and interacting with the Calagopus panel.
---

# Keyboard Shortcuts

Keyboard shortcuts let you navigate and interact with the panel without reaching for the mouse, grouped by where they apply: the file manager, the server console, and table navigation.

![](./images/keyboard-shortcuts/overview.webp)

The panel detects whether you're on Windows/Linux or macOS and shows the matching modifier keys automatically.

## Default Bindings

| File Manager | Binding |
| --- | --- |
| Select all files | `Ctrl+A` |
| Cut selected files | `Ctrl+X` |
| Copy selected files | `Ctrl+C` |
| Paste files | `Ctrl+V` |
| Duplicate selected file | `D` |
| Search files | `Ctrl+K` |
| Move up a directory | `Alt+↑` |
| Move up the selection | `↑` |
| Move down the selection | `↓` |
| Rename file | `F2` |
| Deselect all files | `Esc` |
| Delete selected files | `Del` |

| Server Console | Binding |
| --- | --- |
| Search in console output | `Ctrl+F` |
| Previous command in history | `↑` |
| Next command in history | `↓` |

| Table Navigation | Binding |
| --- | --- |
| Previous page | `←` |
| Next page | `→` |
| First page | `Shift+←` |
| Last page | `Shift+→` |

(`Ctrl` shows as `Cmd` on macOS.)

## Rebinding, Disabling, and Resetting

Each shortcut has three buttons next to it. The pencil rebinds: click it and press the new key combination, which is captured as soon as you press it. The circle-slash disables the shortcut entirely, and the reset button restores it to its shipped default.

![](./images/keyboard-shortcuts/rebind-hover.webp)

## Copy, Paste, and Reset All

The toolbar at the top has four actions:

<img src="./images/keyboard-shortcuts/toolbar.webp" width="289" alt="" />

- **Copy All** copies every current binding as text, in a format you can edit directly and paste back in to apply changes. It's also the easiest way to carry your keybinds over to another Calagopus panel: copy from one, paste into the other.
- **Paste** applies a previously copied (and optionally edited) set of bindings.
- **Reset All** restores every shortcut to its default at once.

```txt
# Calagopus keyboard shortcuts
#
# Edit the value after "=" then paste this back to apply your changes.
#   - a key combination such as  Ctrl+Shift+K  or  Mod+S  (Mod = Ctrl/Cmd)
#   - "disabled" turns the shortcut off
#   - "default" restores the shipped binding
# Lines starting with "#" and unknown ids are ignored.

[files] # File Manager
files.selectAll         = Mod+A
files.cut               = Mod+X
files.copy              = Mod+C
files.paste             = Mod+V
files.duplicate         = D
files.search            = Mod+K
files.moveUpDirectory   = Alt+ArrowUp
files.moveUpSelection   = ArrowUp
files.moveDownSelection = ArrowDown
files.rename            = F2
files.deselectAll       = Escape
files.delete            = Delete

[console] # Server Console
console.search          = Mod+F
console.previousCommand = ArrowUp
console.nextCommand     = ArrowDown

[table] # Table Navigation
table.previousPage      = ArrowLeft
table.nextPage          = ArrowRight
table.firstPage         = Shift+ArrowLeft
table.lastPage          = Shift+ArrowRight
```
