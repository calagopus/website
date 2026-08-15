---
title: Toasts
description: Show transient feedback from your extension with the Panel toast system.
---

# Toasts

Toasts are the Panel's transient feedback channel: the little cards that slide into a corner after you save a form or hit an error. Every "Settings saved." and "Something went wrong." in the Panel is a toast, and your extension raises them through the same API core pages use. There's no separate notification system for extensions, so your feedback lands in the corner the user is already watching.

## The `useToast` Hook

Everything goes through one hook, `useToast`, exported from the Panel's `ToastProvider`:

```tsx
import { useToast } from '@/providers/ToastProvider.tsx';
import Button from '@/elements/Button.tsx';

export default function MyCard() {
  const { addToast } = useToast();

  return <Button onClick={() => addToast('Everything worked.', 'success')}>Do the thing</Button>;
}
```

Before you reach for it, check whether something already toasts for you - the Panel's data-fetching hooks raise error and success toasts internally, so a lot of the obvious cases are already covered. See [Toasts the data hooks already raise](#toasts-the-data-hooks-already-raise).

The hook hands you four things:

| Member | What it does |
| ------ | ------------ |
| `addToast(message, type?, actions?)` | Shows a toast, returns its numeric id |
| `dismissToast(id)` | Removes a toast early |
| `toastPosition` | The corner the current user has chosen |
| `setToastPosition(position)` | Moves the toast stack (see [Position](#position) - almost never yours to call) |

The provider sits above the whole app, so the hook works from anywhere you render: a route you registered, a component you slotted into a core page, a modal, a form submit handler. It throws if called outside the provider, which in practice only happens if you call it outside React entirely - see [Toasting Outside React](#toasting-outside-react).

## Types

The second argument picks the toast's color and, implicitly, its tone. There are four, and `success` is the default when you omit the argument:

| Type | Color | Use it for |
| ---- | ----- | ---------- |
| `success` | Green | The thing the user asked for happened |
| `error` | Red | It didn't, and they need to know why |
| `warning` | Yellow | It happened, but with a caveat worth reading |
| `info` | Teal | Neutral status with no success/failure framing |

```ts
addToast('Backup created.', 'success');
addToast('Node is unreachable.', 'error');
addToast('Saved, but the node will need a restart.', 'warning');
addToast('Import started in the background.', 'info');
```

::: info
Default-to-`success` means `addToast('Saved.')` is a valid one-liner, but spell the type out anyway on anything that isn't obviously a success. It reads better at the call site and it's one less thing to get wrong when someone later copies your line for an error path.
:::

## Messages

The message is a `ReactNode`, not a `string`, so anything React can render works, not just plain text. In practice most toasts are a single translated line.

For translated messages, run the string through `.md()` when it contains Markdown. The Panel augments `String.prototype` with it, and it renders through a sanitized Markdown component (links get scheme-checked, raw HTML stays off unless you pass `{ html: true }`):

```tsx
import { useToast } from '@/providers/ToastProvider.tsx';
import { useExtTranslations } from './translations.ts';

export default function DeleteButton({ fileName }: Props) {
  const { addToast } = useToast();
  const { t } = useExtTranslations();

  const onDelete = () => {
    // 'toast.deleted' is e.g. "Deleted **{file}**."
    addToast(t('toast.deleted', { file: fileName }).md(), 'success');
  };

  // ... render
}
```

Keep messages short. The toast card is a fixed 288px wide and long text just wraps into a wall - if you need to explain something properly, put it on the page and use the toast to point at it. See [Translations](./translations.md) for wiring up your extension's own strings, and note that the base Panel already ships plenty of generic ones you can reuse.

## Actions

A toast can carry action buttons - small icon buttons rendered inside the card, to the left of the close button. They're for the "and now what" follow-up: jump to the thing you just created, or undo it.

An action is `{ name, icon, disabled?, onClick }`:

```tsx
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { useToast } from '@/providers/ToastProvider.tsx';

export default function ImportCard({ serverUuid }: Props) {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const onImported = (path: string) => {
    addToast('Import finished.', 'success', [
      {
        name: 'Show files',
        icon: faFolderOpen,
        onClick: () => navigate(`/server/${serverUuid}/files?directory=${path}`),
      },
    ]);
  };

  // ... render
}
```

`name` isn't rendered as a label - it becomes the button's tooltip, so the `icon` has to carry the meaning on its own. Pick an obvious one and keep `name` to a couple of words.

When actions are the only extra you need, there's a shorthand overload that skips the type and defaults to `success`:

```ts
addToast('Import finished.', [{ name: 'Show files', icon: faFolderOpen, onClick: onShow }]);
```

A few behaviors worth knowing:

- **`onClick` may return a promise.** If it does, the button shows a loading spinner until the promise settles. Handy for actions that hit the API.
- **Actions fire exactly once.** The button guards against a second click and disables itself after the first, so an async action can't be double-submitted by an impatient user.
- **Clicking an action doesn't dismiss the toast.** If your action should close it, capture the id from `addToast` and call `dismissToast` yourself.
- **`disabled: true`** renders the button greyed out from the start, for an action you want visible but not yet available.

::: warning
Actions live and die with the toast, which disappears on its own after a few seconds. That makes them fine for *shortcuts* - a faster way to do something the user could also do by navigating - and a poor fit for anything that's the only way to complete a flow. If missing the button means the user is stuck, it doesn't belong in a toast.
:::

## Undoable Toasts

"Did it, here's an undo button" is common enough that the Panel ships a purpose-built hook for it rather than making you hand-roll the action every time. `useUndoableToast` wraps `addToast` with an Undo action *and* registers the same undo in a scoped history, so the user can trigger it either by clicking the button or by pressing the undo shortcut. The file manager uses it for renames, moves, and permission changes.

The hook takes a scope and returns an `addUndoableToast(message, undo)` function:

```tsx
import { useUndoableToast } from '@/plugins/useUndoableToast.ts';

export default function RenameModal({ server, file }: Props) {
  const addUndoableToast = useUndoableToast(`server:${server.uuid}:my-extension`);

  const onRenamed = (from: string, to: string) => {
    addUndoableToast(`Renamed ${to}.`, () => renameThing(server.uuid, to, from));
  };

  // ... render
}
```

That one call gets you a success toast carrying an Undo button (a left-arrow icon, tooltipped with the Panel's translated `common.button.undo`), plus an entry in the undo history. You don't wire the action yourself and you don't dismiss the toast in your callback - clicking Undo takes the toast down before running your function.

### Writing the undo callback

The callback is just "do the inverse operation". It can return a promise, which the action button turns into a loading spinner, and it's responsible for its own feedback - the Panel doesn't toast anything on your behalf when an undo runs. The shape the file manager uses:

```tsx
addUndoableToast('Renamed 3 files.', () =>
  renameFiles({ uuid: server.uuid, root: directory, files: reversedRenames })
    .then(({ renamed }) => {
      if (renamed < 1) {
        addToast('The rename could not be undone.', 'error');
        return;
      }

      addToast('Rename undone.', 'success');
      invalidate();
    })
    .catch((err) => addToast(httpErrorToHuman(err), 'error')),
);
```

Two things that matter here. First, **an undo can fail** - the file may have moved on, the API may reject it - so check the result and say so rather than silently doing nothing. Second, **invalidate your queries in the undo path too**. The undo mutates state exactly like the original action did, and nothing re-fetches for you.

### Actions that can't be undone

Pass `null` instead of a function when the operation isn't reversible, and you get a plain success toast with no Undo button, so the call site doesn't have to branch:

```tsx
// recursive chmod can't be walked back; a single-file one can
const undo = wasRecursive ? null : () => restorePermissions(file, oldMode);

addUndoableToast('Permissions updated.', undo);
```

Compute the `undo` once and let the hook decide whether to render the button. That's how `FilePermissionsModal` handles it, and it keeps "is this undoable" as one expression instead of two toast call sites.

### Scopes and the undo history

The scope string is how the keyboard shortcut finds the right entry. Undo entries from every part of the Panel land in one shared store, tagged with the scope you passed, and `runLastUndoEntry(scope)` pulls the most recent live entry for that scope only:

```ts
import { runLastUndoEntry } from '@/stores/undoHistory.ts';

// bound to the general Ctrl/Cmd+Z shortcut
runLastUndoEntry(`server:${server.uuid}:files`);
```

Scope your extension's entries to something unique and stable - include the server or resource id if the undo is per-resource, the way the file manager's `server:{uuid}:files` does. If you register your own keyboard shortcut, point its callback at `runLastUndoEntry` with the same scope string you pass to `useUndoableToast`.

The store has a few properties worth knowing about:

- **Entries expire with the toast.** An entry's lifetime is `toastTimeout` from when it was pushed, so the undo shortcut stops working at the same moment the toast disappears. Expired entries are pruned as new ones arrive.
- **Entries are one-shot.** Running an undo removes it, whether it was triggered by the button or the shortcut, so there's no way to fire the same undo twice.
- **The history holds 10 entries, globally.** It's shared across all scopes, and the oldest fall off. In practice the timeout expires entries long before the cap bites, but don't build anything that assumes a deep undo stack.
- **There's no redo.** Undoing doesn't push an inverse entry. If you want "undo the undo", raise another undoable toast from inside your undo callback.

::: info
`useUndoableToast` is a convenience layer over the same `addToast` actions described above - nothing stops you from building your own Undo action by hand. Use the hook anyway when the semantics fit. Wiring it yourself means reimplementing the shortcut integration and the dismiss-on-undo behavior, and keeping your label and icon in sync with the ones users see everywhere else.
:::

## Dismissing and Lifetime

Every toast auto-dismisses after `toastTimeout`, which is 7500ms. It's a module constant, not a per-toast option, so you can't make a toast stickier or shorter, and hovering doesn't pause the timer. If you need something to stay on screen until acknowledged, use a modal or an inline alert on the page instead.

To take a toast down early, hold onto the id `addToast` gives you:

```ts
const { addToast, dismissToast } = useToast();

const id = addToast('Uploading...', 'info');

await uploadEverything();

dismissToast(id);
addToast('Upload complete.', 'success');
```

If you need the timeout value yourself - to line up an animation, say - import it rather than hardcoding `7500`:

```ts
import { toastTimeout } from '@/providers/contexts/toastContext.ts';
```

Toasts stack in the order they're raised, and nothing dedupes them. Firing one per item in a loop produces one card per item, all fighting for the same corner. Collapse those into a single summary toast ("Deleted 12 files.") before you raise it.

## Position

Which corner toasts appear in is a **user preference**, not an extension setting. It's stored on the user record as `toastPosition`, edited from the account page, and pushed into the provider by `AuthProvider` whenever the user loads or changes. The six options are `top_left`, `top_center`, `top_right`, `bottom_left`, `bottom_center`, and `bottom_right`.

::: warning
`setToastPosition` is exposed on the context, but it's there for the Panel's own auth wiring. Calling it from an extension moves *every* toast in the Panel - core ones included - away from the corner the user deliberately chose, and your change silently reverts the next time the user record syncs. Read `toastPosition` if you need to position something of your own relative to the stack; don't write it.
:::

## Toasting Outside React

Unlike translations, which expose a module-scope `getTranslations()` for use outside components, toasts are hook-only - there's no `getToast()`. Code that runs outside the React tree, like a background upload loop or a websocket handler, has to be handed `addToast` from something that *is* inside the tree.

The Panel's own upload manager solves this with a small externals object: the module keeps a mutable slot, and a component fills it in an effect.

```ts
// my-extension/src/lib/worker.ts
import type { ReactNode } from 'react';
import type { ToastType } from '@/providers/contexts/toastContext.ts';

let addToast: ((message: ReactNode, type?: ToastType) => void) | null = null;

export function setWorkerExternals(ext: { addToast: typeof addToast }): void {
  addToast = ext.addToast;
}

export function onJobFailed(error: string): void {
  addToast?.(error, 'error');
}
```

```tsx
// somewhere that renders inside the app
import { useEffect } from 'react';
import { useToast } from '@/providers/ToastProvider.tsx';
import { setWorkerExternals } from './lib/worker.ts';

export default function MyWorkerBridge() {
  const { addToast } = useToast();

  useEffect(() => {
    setWorkerExternals({ addToast });
  }, [addToast]);

  return null;
}
```

Note the optional call (`addToast?.(...)`). The module can run before any component has mounted, so treat "no toast available yet" as normal rather than an error - the same reason `copyToClipboard`'s helpers take `addToast` as an optional argument.

## Toasting API Errors

The standard error path is `httpErrorToHuman` straight into an error toast:

```tsx
import { httpErrorToHuman } from '@/api/axios.ts';
import { useToast } from '@/providers/ToastProvider.tsx';

const onSave = (values: MyData) => {
  setSaving(true);

  updateThing(values)
    .then(() => addToast('Saved.', 'success'))
    .catch((err) => addToast(httpErrorToHuman(err), 'error'))
    .finally(() => setSaving(false));
};
```

This `.then` / `.catch` / `.finally` shape is what the Panel uses everywhere. See [Frontend API Calls → Handling Errors](./frontend-api.md#handling-errors) for the full treatment.

::: info
Not every failure deserves a toast. Field-level validation belongs on the field (see [Forms](./forms.md)), and an empty list belongs in the list. Save the toast for things the user can't see the result of by looking at the page they're already on.
:::

### Toasts the data hooks already raise

Write that pattern by hand only when you're calling the API directly. The Panel's [data-fetching hooks](./frontend-api.md#data-fetching-hooks) call `useToast` internally and toast on your behalf - if you're using one of them, adding your own toast on top produces two cards for one event.

| Hook | What it toasts for you |
| ---- | ---------------------- |
| `useResource` | Fetch errors, as `httpErrorToHuman(error)` |
| `usePollingResource` | Fetch errors, same as above |
| `useSearchableResource` | Fetch errors |
| `useSearchablePaginatedTable` | Fetch errors |
| `useResourceForm` | Create / update / delete success, **and** errors on all three |
| `useModalForm` | Submit errors |

The opt-outs differ, and two of the hooks don't have one:

- **`useResource` and `usePollingResource`** take `silent: true`, which suppresses the error toast while still returning `error`. Reach for it when you want to render the failure inline instead.
- **`useModalForm`** takes an `onError` callback that *replaces* the built-in toast entirely. Pass it and you own the error path; omit it and you get `httpErrorToHuman` in an error toast.
- **`useSearchableResource` and `useSearchablePaginatedTable`** always toast fetch errors, with no way to opt out.
- **`useResourceForm`** always toasts too, and its success messages are built from the `resourceName` you pass (`"Item created."`, `"Item updated."`, `"Item deleted."`). If you want different wording, that argument is the lever, not a second toast.

::: warning
The fetch-error toasts fire from an effect on `error`, so a query that keeps failing - a poll against a down node, say - toasts each time the error updates. `usePollingResource`'s `retryOnError` bounds that by stopping the poll after N consecutive failures; on a long-lived poll where the failure is already visible on the page, `silent: true` is usually the kinder choice.
:::

## Styling Toasts

Toasts render through the Panel's `Notification` element, which is a [hookable component](./theming.md#hookable-components). If you're building a theme extension and want every toast restyled, intercept `Notification` rather than trying to reach into the toast provider:

```ts
import Notification from '@/elements/Notification.tsx';

// inside initialize():
Notification.addPropsInterceptor((props) => ({ ...props, radius: 'xl' }));
```

The per-type colors (`green`, `red`, `yellow`, `teal`) come from the Mantine palette, so redefining those colors in `initializeMantineTheme()` reshades toasts along with everything else. See [Theming](./theming.md) for both layers.

::: warning
`Notification` is used for more than toasts, and the hook is global. Restyling it changes the Panel's own toasts too - which is the point for a theme extension, but a surprise if you were only trying to tweak your own.
:::
