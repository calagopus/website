---
title: Toasts
description: Show transient feedback from your extension with the Panel toast system.
---

# Toasts

Toasts are the Panel's transient feedback channel: the little cards that slide into a corner after you save a form or hit an error. Every "Settings saved." and "Something went wrong." in the Panel is a toast, and your extension raises them through the same API core pages use. There's no separate notification system for extensions, so your feedback lands in the corner the user is already watching.

## The `useToast` Hook

Everything goes through one hook, `useToast`, exported from the Panel's `ToastProvider`:

```tsx
import Button from '@/elements/buttons/Button.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';

export default function MyCard() {
  const { addToast } = useToast();

  return <Button onClick={() => addToast('Everything worked.', 'success')}>Do the thing</Button>;
}
```

Before you reach for it, check whether something already toasts for you. The Panel's data-fetching hooks raise error and success toasts internally, which covers many of the obvious cases. See [Toasts the data hooks already raise](#toasts-the-data-hooks-already-raise).

The hook hands you six things:

| Member                                | What it does                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `addToast(message, type?, actions?)`  | Shows a toast, returns its numeric id                                                               |
| `addProgressToast(message, options?)` | Shows a toast with a progress bar that stays until you dismiss it, returns its id                   |
| `addPendingToast(message)`            | Shows a progress toast only if the work takes longer than 300ms, returns a handle to settle it with |
| `updateToast(id, update)`             | Patches a toast that's already on screen                                                            |
| `dismissToast(id)`                    | Removes a toast early                                                                               |
| `toastPosition`                       | The corner the current user has chosen                                                              |

The provider sits above the whole app, so the hook works from anywhere you render: a route you registered, a component you slotted into a core page, a modal, a form submit handler. It throws if called outside the provider, which in practice only happens outside React entirely; see [Toasting Outside React](#toasting-outside-react).

## Types

The second argument picks the toast's color and, implicitly, its tone. There are four, and `success` is the default when you omit the argument:

| Type      | Color  | Use it for                                     |
| --------- | ------ | ---------------------------------------------- |
| `success` | Green  | The thing the user asked for happened          |
| `error`   | Red    | It didn't, and they need to know why           |
| `warning` | Yellow | It happened, but with a caveat worth reading   |
| `info`    | Teal   | Neutral status with no success/failure framing |

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

Keep messages short. The toast card is a fixed 288px wide and long text wraps into a block; if something needs explaining, put it on the page and use the toast to point at it. See [Translations](./translations.md) for your extension's own strings. The base Panel already has many generic ones you can reuse.

## Actions

A toast can carry action buttons: small icon buttons inside the card, to the left of the close button. Use them for a follow-up, such as jumping to the thing you just created or undoing it.

An action is `{ name, icon, disabled?, onClick }`, where `icon` is a FontAwesome `IconDefinition` rather than a rendered element:

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

`name` isn't rendered as a label; it becomes the button's tooltip, so the `icon` has to carry the meaning on its own. Pick an obvious one and keep `name` to a couple of words.

When actions are the only extra you need, there's a shorthand overload that skips the type and defaults to `success`:

```ts
addToast('Import finished.', [{ name: 'Show files', icon: faFolderOpen, onClick: onShow }]);
```

- **`onClick` may return a promise.** If it does, the button shows a loading spinner until the promise settles, which suits actions that call the API.
- **Actions fire exactly once.** The button guards against a second click and disables itself after the first, so an async action can't be double-submitted by an impatient user.
- **Clicking an action doesn't dismiss the toast.** If your action should close it, capture the id from `addToast` and call `dismissToast` yourself.
- **`disabled: true`** renders the button greyed out from the start, for an action you want visible but not yet available.

::: warning
Actions live and die with the toast, which disappears on its own after a few seconds. That makes them fine for _shortcuts_, a faster way to do something the user could also reach by navigating, and a poor fit for anything that's the only way to complete a flow. If missing the button means the user is stuck, it doesn't belong in a toast.
:::

## Undoable Toasts

An undo button after an action is common enough that the Panel has a hook for it. `useUndoableToast` wraps `addToast` with an Undo action _and_ registers the same undo in a scoped history, so the user can trigger it either by clicking the button or by pressing the undo shortcut. The file manager uses it for renames, moves, and permission changes.

The hook takes a scope and returns an `addUndoableToast(message, undo)` function:

```tsx
import { useUndoableToast } from '@/plugins/toast/useUndoableToast.ts';

export default function RenameModal({ server, file }: Props) {
  const addUndoableToast = useUndoableToast(`server:${server.uuid}:my-extension`);

  const onRenamed = (from: string, to: string) => {
    addUndoableToast(`Renamed ${to}.`, () => renameThing(server.uuid, to, from));
  };

  // ... render
}
```

That one call gets you a success toast carrying an Undo button (a left-arrow icon, tooltipped with the Panel's translated `common.button.undo`), plus an entry in the undo history. You don't add the action or dismiss the toast yourself. While the undo runs, the toast swaps its Undo button for an indeterminate progress bar, and it comes down once your function settles.

<img src="./images/toasts/undo-action.webp" alt="A green success toast reading File has been renamed, with an undo arrow action button to the left of the close button" width="288">

That is the file manager's rename toast, and it is what every `useUndoableToast` call looks like: the message, one action, the close button.

### Writing the undo callback

The callback performs the inverse operation. It can return a promise, which keeps the toast's progress bar up until it settles, and it handles its own feedback: the Panel doesn't toast anything when an undo runs. The shape the file manager uses:

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

**An undo can fail**: the file may have changed again, or the API may reject it. Check the result and report it instead of silently doing nothing. Also, **invalidate your queries in the undo path too**. The undo mutates state exactly like the original action did, and nothing re-fetches for you.

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

Scope your extension's entries to something unique and stable: include the server or resource id if the undo is per-resource, the way the file manager's `server:{uuid}:files` does. If you register your own keyboard shortcut, point its callback at `runLastUndoEntry` with the same scope string you pass to `useUndoableToast`.

How the undo store behaves:

- **Entries expire with the toast.** An entry's lifetime is `toastTimeout` from when it was pushed, so the undo shortcut stops working at the same moment the toast disappears. Undo entries are always tied to that constant, even though [progress toasts](#progress-toasts) outlive it. Expired entries are pruned as new ones arrive.
- **Entries are one-shot.** Running an undo removes it, whether it was triggered by the button or the shortcut, so there's no way to fire the same undo twice.
- **One undo per scope at a time.** Since 1.2.8, while an undo is still running, the shortcut and the Undo buttons for that scope do nothing, so pressing the shortcut again on a slow connection doesn't start on the next older entry.
- **The history holds 10 entries, globally.** It's shared across all scopes, and the oldest fall off. In practice the timeout expires entries long before the cap bites, but don't build anything that assumes a deep undo stack.
- **There's no redo.** Undoing doesn't push an inverse entry. If you want "undo the undo", raise another undoable toast from inside your undo callback.

::: info
`useUndoableToast` is a convenience layer over the same `addToast` actions described above, and you can build your own Undo action by hand. Use the hook anyway when the semantics fit. Wiring it yourself means reimplementing the shortcut integration and the progress-then-dismiss behavior, and keeping your label and icon in sync with the ones users see everywhere else.
:::

## Progress Toasts

An upload or an import runs long enough that the user wants to watch it, and two toasts saying "started" and "finished" leave a silent gap in between. `addProgressToast` fills that gap with a toast carrying a progress bar, no close button, and no timeout:

```ts
const { addProgressToast, updateToast, dismissToast } = useToast();

const id = addProgressToast('Uploading world.zip', { progress: 0 });

await upload(file, (percent) => updateToast(id, { progress: percent }));

dismissToast(id);
addToast('Upload complete.', 'success');
```

The options object is optional, and so is every key in it:

| Option            | Default  | What it does                                                                |
| ----------------- | -------- | --------------------------------------------------------------------------- |
| `type`            | `'info'` | The same four types as `addToast`. It colors the bar as well as the card    |
| `progress`        | `null`   | A percentage, or `null` for an indeterminate bar                            |
| `actions`         | none     | The same `ToastAction[]` the [Actions](#actions) section describes          |
| `withCloseButton` | `false`  | Set it to `true` when the user should be able to close the toast themselves |
| `onClose`         | none     | Runs instead of the default dismiss when the user clicks the close button   |

`onClose` is what makes the close button worth having on a progress toast. Without it the button just removes the card and leaves the work running, which is rarely what someone clicking an X on a progress bar means. Point it at the cancel path instead, and let the toast come down as a consequence of the work stopping:

```ts
const id = addProgressToast('Uploading 3 files...', {
  progress: 0,
  withCloseButton: true,
  onClose: () => cancelUpload(scope),
});
```

The Panel's upload toasts work exactly this way: the X cancels every upload heading for that destination, and the toast disappears once nothing in that scope is still in flight. `onClose` _replaces_ the dismiss instead of running alongside it, so if your handler doesn't end up removing the toast one way or another, the card stays on screen.

### Indeterminate and determinate

`progress: null` gives you the sweeping indeterminate bar, which is the honest option when you know work is happening but not how much is left. A number gives you a determinate bar with the percentage written across it. The same toast can move between the two, so starting indeterminate and switching once you know the total is a normal thing to do:

```ts
const id = addProgressToast('Preparing the archive...');

const files = await listFiles();
updateToast(id, { progress: 0, message: `Archiving ${files.length} files...` });
```

Passing `progress: null` back later returns the bar to indeterminate.

### Updating a toast

`updateToast(id, update)` patches a toast that's already on screen. Message, type, progress and actions are all optional, and leaving a key out means "leave that one alone":

```ts
updateToast(id, { progress: 64, type: 'warning', message: 'Rate limited, still going...' });
```

You can call it as often as you like. It's a no-op on an id that's already gone, so there's no need to guard against a toast the user closed, and it bails out when nothing actually changed, so a callback firing ten times a second costs nothing while the numbers hold still.

The bail-out has one catch. It compares values, and a freshly built `ReactNode` is never equal to the one before it. Rebuild your message on every tick and you defeat the bail-out entirely. Keep the rendered text around as a string, compare against it, and pass `message` only when it actually differs:

```ts
const next = t('myext:import.progress', { done, total });

updateToast(id, { message: next === lastMessage ? undefined : next, progress });
lastMessage = next;
```

`updateToast` works on ordinary toasts too. Passing `progress` to a toast raised with `addToast` even switches it to the progress layout, but the toast keeps the 7500ms timeout and the close button it was created with, and nothing can take that close button away later. Use `addProgressToast` from the start for anything that should stay up.

### They don't leave on their own

This is the part to get right. A progress toast has no timeout, and by default no close button, so the only thing that takes it off the screen is your `dismissToast(id)`. Forget that call and the toast sits in the user's corner until they reload the page, with no way for them to get rid of it.

Put the dismissal somewhere that runs on every path, including the failure one:

```ts
const id = addProgressToast('Importing...');

importEverything()
  .then(() => addToast('Import finished.', 'success'))
  .catch((err) => addToast(httpErrorToHuman(err), 'error'))
  .finally(() => dismissToast(id));
```

When the work is driven by state rather than a promise, dismiss in an effect's cleanup, which covers unmount as well:

```tsx
useEffect(() => {
  if (!isImporting) return;

  const id = addProgressToast('Importing...');
  return () => dismissToast(id);
}, [isImporting]);
```

::: warning
Don't convert a finished progress toast into a completion toast with `updateToast`. It keeps the missing timeout and the missing close button, so your green "Done." card stays on screen forever. Dismiss the progress toast and raise a normal one, or use [`addPendingToast`](#pending-toasts), whose `settle` does the conversion properly.
:::

### Pending toasts

`addPendingToast` was added in Panel 1.2.8. Some requests are usually quick but can stall on a slow connection: fetching a signed download URL, checking for conflicts before an upload. A progress toast on each of them flickers past on a fast network, while no toast at all leaves the user clicking again on a slow one. `addPendingToast` waits 300ms and only raises an indeterminate progress toast if the work is still running by then:

```ts
const { addPendingToast } = useToast();

const pending = addPendingToast('Preparing download...');

getDownloadUrl()
  .then(({ url }) => {
    pending.settle('Download started.', 'success');
    downloadUrl(url);
  })
  .catch((err) => pending.settle(httpErrorToHuman(err), 'error'));
```

`settle(message?, type?)` ends it, and the type defaults to `success`:

| Call                    | Progress toast showing                                                                        | Still inside the 300ms                                            |
| ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `settle(message, type)` | The card turns into a normal toast in place, with a close button and the usual 7500ms timeout | A normal toast is raised, so the user never sees the progress bar |
| `settle()`              | The card is dismissed                                                                         | Nothing is shown                                                  |

Call `settle` exactly once, on every path, the same as `dismissToast` for a progress toast. The Panel's file and backup downloads use the first form, and the upload conflict check uses the bare `settle()` because the upload toasts take over from there.

For [toast handlers](#intercepting-toasts), a pending toast that shows up is a `'progress'` show, and settling it with a message is an update carrying the new `message` and `type`. One that settles inside the 300ms is a plain `'toast'` show.

### One owner, mounted once

A progress toast outlives the thing that raised it, which makes _where_ you raise it a real decision. Raise one from a component that remounts on navigation and the user watches it disappear and slide back in every time they click a tab. Raise one from a component that renders twice and they get two toasts.

Pick something that outlives the operation and mounts once, keep the id in a ref rather than state, and let an effect handle raise and dismiss. The Panel does this in two places worth copying from: `ServerStatusToast` mounts once per server and holds a single toast across every navigation inside that server, and `useUploadProgressToasts` keeps one toast per upload destination and drops it when that destination has nothing left in flight.

Two Panel-specific pitfalls. Anything that reads a **context-scoped store**, usually `useServerStore`, has to read it in the component that owns the toast, not inside the message. Toast messages render inside the `ToastProvider`, which sits above those providers, so a message component that subscribes to the server store throws. And if you mount your owner in a place that virtual windows also render, gate it, or every open window raises its own copy into the same stack.

## Dismissing and Lifetime

Toasts raised with `addToast` auto-dismiss after `toastTimeout`, which is 7500ms. It's a module constant, not a per-toast option, so you can't make one of them stickier or shorter from the call site, and hovering doesn't pause the timer. A [dismiss handler](#intercepting-toasts) can cancel the timeout, but that keeps the toast around for good rather than longer.

There are two lifetimes available and nothing in between: 7500ms, or until you take the toast down yourself. The second one is what [`addProgressToast`](#progress-toasts) gives you. If what you want is a normal toast that lingers a bit longer than the rest, that isn't on offer, so use a modal or an inline alert on the page instead.

To take a toast down early, hold onto the id `addToast` gives you:

```ts
const { addToast, dismissToast } = useToast();

const id = addToast('Uploading...', 'info');

await uploadEverything();

dismissToast(id);
addToast('Upload complete.', 'success');
```

If you need the timeout value yourself, to line up an animation for example, import it rather than hardcoding `7500`:

```ts
import { toastTimeout } from '@/providers/contexts/toastContext.ts';
```

Toasts stack in the order they're raised, and nothing dedupes them. Firing one per item in a loop produces one card per item, all fighting for the same corner. Collapse those into a single summary toast ("Deleted 12 files.") before you raise it.

## Position

Which corner toasts appear in is a **user preference**, not an extension setting. It's the synced user setting `app::toast_position`, edited from the account page's Preferences card. The six options are `top_left`, `top_center`, `top_right`, `bottom_left`, `bottom_center`, and `bottom_right`.

::: warning
The context exposes `toastPosition` for reading only; use it to position something of your own relative to the stack. Don't write the underlying setting from an extension: it moves _every_ toast in the Panel, core ones included, away from the corner the user deliberately chose.
:::

## Toasting Outside React

Unlike translations, which expose a module-scope `getTranslations()` for use outside components, toasts are hook-only; there's no `getToast()`. Code that runs outside the React tree, like a background upload loop or a websocket handler, has to be handed `addToast` from something that _is_ inside the tree.

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

A long-running job wants `updateToast` and `dismissToast` in that same bag, for the reasons the [progress toast](#progress-toasts) section covers: the module keeps the id it got back and patches it from wherever the work happens.

The call is optional (`addToast?.(...)`) because the module can run before any component has mounted, so "no toast available yet" is normal, not an error. That is also why `copyToClipboard`'s helpers take `addToast` as an optional argument.

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

Write that pattern by hand only when you're calling the API directly. The Panel's [data-fetching hooks](./frontend-api.md#data-fetching-hooks) call `useToast` internally and toast for you; adding your own toast on top of one of them produces two cards for one event.

| Hook                            | What it toasts for you                                        |
| ------------------------------- | ------------------------------------------------------------- |
| `useResource`                   | Fetch errors, as `httpErrorToHuman(error)`                    |
| `usePollingResource`            | Fetch errors, same as above                                   |
| `useSearchableResource`         | Fetch errors                                                  |
| `useInfiniteSearchableResource` | Fetch errors                                                  |
| `useSearchablePaginatedTable`   | Fetch errors                                                  |
| `useResourceForm`               | Create / update / delete success, **and** errors on all three |
| `useModalForm`                  | Submit errors                                                 |

The opt-outs differ, and four of the hooks don't have one:

- **`useResource` and `usePollingResource`** take `silent: true`, which suppresses the error toast while still returning `error`. Reach for it when you want to render the failure inline instead.
- **`useModalForm`** takes an `onError` callback that _replaces_ the built-in toast entirely. Pass it and you own the error path; omit it and you get `httpErrorToHuman` in an error toast.
- **`useSearchableResource`, `useInfiniteSearchableResource` and `useSearchablePaginatedTable`** always toast fetch errors, with no way to opt out.
- **`useResourceForm`** always toasts too, and its success messages are the Panel's translated "{resource} created." / "updated." / "deleted." strings with the `resourceName` you pass filled in. If you want different wording, that argument is the lever, not a second toast.

::: warning
The fetch-error toasts fire from an effect on `error`, so a query that keeps failing, such as a poll against a node that is down, toasts each time the error updates. `usePollingResource`'s `retryOnError` bounds that by stopping the poll after N consecutive failures; on a long-lived poll where the failure is already visible on the page, `silent: true` is usually the kinder choice.
:::

## Intercepting Toasts

Everything above is about raising your own toasts. If you want to change or stop toasts the Panel (or another extension) raises, register handlers in `initialize()` through `enterEvents`:

```ts
import { Extension, ExtensionContext } from 'shared';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterEvents((events) =>
      events.enterToast((toast) =>
        toast
          .addShowHandler((event) => {
            if (event.kind === 'toast' && typeof event.data.message === 'string') {
              event.data.message = `✔ ${event.data.message}`;
            }
          })
          .addDismissHandler((event) => {
            if (event.reason === 'timeout' && event.toast.type === 'error') {
              event.cancel();
            }
          }),
      ),
    );
  }
}
```

There are three events, one per toast operation:

| Handler             | Event               | `data`                                                                                               | Extra info                                                                    |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `addShowHandler`    | `ToastShowEvent`    | The toast about to be shown (`message`, `type`, `actions`, `progress`, `withCloseButton`, `onClose`) | `id`, `kind` (`'toast'` or `'progress'`)                                      |
| `addUpdateHandler`  | `ToastUpdateEvent`  | The patch passed to `updateToast`                                                                    | `id`, `toast` (current state, frozen)                                         |
| `addDismissHandler` | `ToastDismissEvent` | Nothing                                                                                              | `id`, `toast` (frozen), `reason` (`'timeout'`, `'close'` or `'programmatic'`) |

All three are [frontend events](./frontend-events.md), so the general rules there apply: edit `data` in place to change what the Panel does, call `cancel()` to stop it, and use `priority` and `receiveCancelled` to control ordering. For toasts specifically:

- A cancelled show never appears. `addToast` still returns an id, and updating or dismissing it is a no-op.
- A cancelled update leaves the toast as it was.
- A cancelled dismiss keeps the toast on screen. That includes the auto-dismiss after `toastTimeout`, which is a `'timeout'` dismiss like any other, so the toast now stays until something dismisses it again. Make sure something does.

::: warning
Raising a toast from inside a toast handler fires the handlers again. The Panel stops after a few levels of recursion and logs an error, but by then you've already shown more toasts than you meant to.
:::

## Styling Toasts

Toasts render through the Panel's `Notification` element, which is a [hookable component](./theming.md#hookable-components). If you're building a theme extension and want every toast restyled, intercept `Notification` rather than trying to reach into the toast provider:

```ts
import Notification from '@/elements/feedback/Notification.tsx';

// inside initialize():
Notification.addPropsInterceptor((props) => ({ ...props, radius: 'xl' }));
```

The bar inside a progress toast is the Panel's `Progress` element, which is hookable in the same way, so intercepting that restyles progress toasts along with every other bar in the Panel.

The per-type colors (`green`, `red`, `yellow`, `teal`) come from the Mantine palette, so redefining those colors in `initializeMantineTheme()` reshades toasts along with everything else. See [Theming](./theming.md) for both layers.

::: warning
`Notification` is used for more than toasts, and the hook is global. Restyling it changes the Panel's own toasts too. That is intended for a theme extension, but unexpected if you only meant to change your own.
:::
