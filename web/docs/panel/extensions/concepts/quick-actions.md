# Quick Actions

The quick actions palette is the Panel's command bar: the modal that opens on `Mod+Space` (or from the button above the sidebar) and lets a user type "restart", hit Enter, and be done. It aggregates everything the user can do from where they currently stand - power actions, navigation, page-specific operations, a server search - into one searchable list, and your extension can put its own entries in there.

There are three surfaces, and which one you want depends on how long your action should live:

| Surface | Registered where | Lives for |
| ------- | ---------------- | --------- |
| **Global actions** | `enterQuickActions` in `initialize()` | The whole session |
| **Page actions** | The `useQuickActions` hook in a component | As long as that component is mounted |
| **Modes** | `enterQuickActions` in `initialize()` | Activated by a prefix the user types |

::: info
Quick actions arrived in Panel 1.2.0. On 1.1.x there is no palette and no `quickActions` registry, so an extension using this API won't build against an older Panel.
:::

## Registering a Global Action

Global actions go in your `initialize()` method, through `enterQuickActions`:

```ts
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Extension, ExtensionContext } from 'shared';
import { getExtTranslations } from './translations.ts';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterQuickActions((quickActions) =>
      quickActions.addAction({
        id: 'dev.0x7d8.cleanup.purgeLogs',
        category: 'power',
        label: () => getExtTranslations().t('quickAction.purgeLogs', {}),
        keywords: ['clean', 'logs', 'purge'],
        icon: <FontAwesomeIcon icon={faBroom} fixedWidth />,
        scopes: ['server'],
        permission: 'files.delete',
        perform: (actionCtx) => purgeLogs(actionCtx.server!.uuid),
      }),
    );
  }
}
```

`addAction`, `addMode` and `addCategory` all return the registry, so you can chain them.

### Definition Fields

| Field | Type | What it does |
| ----- | ---- | ------------ |
| `id` | `string` | Identity of the action. Used as the palette's list key, so it must be unique - prefix it with your package identifier. |
| `category` | `string` | The id of the category this action groups under. A core id (see below) or one you registered. |
| `label` | `string \| (() => string)` | What the user reads. Pass a function for translated labels so it re-resolves when the language changes. |
| `description?` | `string \| (() => string)` | Secondary text, rendered dimmed and right-aligned on the row. Good for a value, a shortcut hint, or a target path. |
| `keywords?` | `string[]` | Extra search terms. Matched with the same substring rule as the label, so `['mkdir']` makes "New Directory" findable by typing `mkdir`. |
| `icon?` | `ReactNode` | Any node, so `<FontAwesomeIcon icon={faBroom} fixedWidth />` for a FontAwesome glyph or an `<img>` for something custom. Pass `fixedWidth` (or your own fixed-width wrapper) to keep rows aligned with core's. Optional, but rows without an icon look out of place. |
| `scopes?` | `('dashboard' \| 'server' \| 'admin')[]` | Where the action shows up. Omitted means all three. |
| `permission?` | `string \| string[]` | Server permission node(s) required. An array passes if *any* of them match. |
| `adminPermission?` | `string \| true` | `true` requires the user be an admin at all; a string requires that admin permission node. |
| `danger?` | `boolean` | Renders the row in red and highlights it red when selected. For destructive things - the core "Kill" and "Log out" actions use it. |
| `isVisible?` | `(ctx) => boolean` | Last-word visibility check, run on every palette render. Use it for state, not permissions. |
| `perform` | `(ctx) => void` | Runs when the user picks the action. |

The scope of an action is derived from the current URL, not from where you registered it: `/server/<id>/...` is `server`, `/admin/...` is `admin`, everything else is `dashboard`.

::: warning
`permission` is checked against the *current server's* permissions, and outside server scope there are none - so an action with `permission` set is silently hidden on dashboard and admin pages. If you want a permission-gated action that also appears outside a server, pair `permission` with `scopes: ['server']` and register a separate unpermissioned action for the other scopes.
:::

### The Action Context

Both `isVisible` and `perform` receive a `QuickActionContext`, which is the palette handing you everything it knows about the current page:

| Member | Type | Notes |
| ------ | ---- | ----- |
| `scope` | `'dashboard' \| 'server' \| 'admin'` | The derived scope described above |
| `navigate` | `NavigateFunction` | react-router's navigate, for going somewhere |
| `close` | `() => void` | Closes the palette |
| `user` | `FullUser \| null` | The logged-in user |
| `server` | `Server \| null` | The current server, `null` outside server scope |
| `serverState` | `ServerPowerState \| null` | `offline`, `starting`, `running`, `stopping`, `null` outside server scope |
| `socketInstance` | `Websocket \| null` | The server's websocket, for sending power requests and commands |
| `doLogout` | `() => void` | Logs the user out |
| `canServer` | `(action, matchAny?) => boolean` | Permission check against the current server. `matchAny` defaults to `true` |
| `requestServerKill` | `() => void` | Opens the Panel's force-stop confirmation modal |

The palette closes itself *before* calling `perform`, so you don't need `ctx.close()` in an action - it's there for mode items, which manage their own lifecycle.

`isVisible` runs during the palette's render, on every keystroke. Keep it to synchronous state reads - a Zustand `.getState()`, a field on `ctx.server` - and never call hooks or fire requests from it. This is where state-dependent actions belong, the way the core power actions only offer "Start" when `ctx.serverState === 'offline'`:

```ts
quickActions.addAction({
  id: 'dev.0x7d8.cleanup.purgeLogs',
  category: 'power',
  label: () => getExtTranslations().t('quickAction.purgeLogs', {}),
  scopes: ['server'],
  permission: 'files.delete',
  isVisible: (actionCtx) => actionCtx.serverState === 'offline',
  perform: (actionCtx) => purgeLogs(actionCtx.server!.uuid),
});
```

## Categories

Every item belongs to a category, which is the labelled group it renders under. The Panel ships five, plus a `servers` group that only appears on the dashboard:

| Id | Group heading | Order | Contains |
| -- | ------------- | ----- | -------- |
| `math` | Math | 10 | The `=` calculator result |
| `page` | Page | 20 | Actions the current page registered |
| `power` | Power | 30 | Start / stop / restart / kill |
| `servers` | Servers | 40 | Server search results (dashboard only) |
| `navigation` | Navigation | 50 | Sidebar routes for the current scope |
| `account` | Account | 60 | Log out |

Reuse one of those ids when your action fits the group - a power-adjacent action belongs under Power, not under a category of its own. When it doesn't fit, register your own:

```ts
import { faDragon } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

ctx.extensionRegistry.enterQuickActions((quickActions) =>
  quickActions.addCategory({
    id: 'dev.0x7d8.cleanup',
    label: () => getExtTranslations().t('quickAction.category', {}),
    icon: <FontAwesomeIcon icon={faDragon} size='sm' />,
    order: 25,
  }),
);
```

`label` takes a plain string or a getter, same as on an action. `icon` is a `ReactNode` here too, though it's rendered as a group heading rather than a row, so core passes `size='sm'` instead of `fixedWidth`.

Groups render by `order`, lowest first, with ties broken alphabetically on the resolved label. Core categories hold the numbers in the table above, and a category without an `order` falls back to 100, which puts it after core and sorted by label among the other extension categories. The `order: 25` in the example above lands the group between Page and Power, so pick a number when you care where your actions sit relative to core's.

Extension categories are merged last, so registering one with a core id such as `page` or `power` overrides that group's label, icon and order for the whole palette. That's occasionally useful and more often a mistake.

An action pointing at a category nobody registered still renders: the raw category id becomes the group heading. If you see `dev.0x7d8.cleanup` as a heading, you forgot the `addCategory` call.

## Page-Scoped Actions

An action that only makes sense on one page shouldn't be registered globally with an `isVisible` that checks the URL. Use the `useQuickActions` hook instead, from a component that's mounted on that page:

```tsx
import { faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuickActions } from '@/plugins/useQuickActions.ts';
import { CORE_QUICK_ACTION_CATEGORIES } from '@/lib/coreQuickActions.tsx';

export default function MyServerPage() {
  const [selected, setSelected] = useState<string[]>([]);

  useQuickActions([
    {
      id: 'dev.0x7d8.cleanup.purgeSelected',
      category: CORE_QUICK_ACTION_CATEGORIES.page,
      label: () => getExtTranslations().t('quickAction.purgeSelected', {}),
      icon: <FontAwesomeIcon icon={faFileCirclePlus} fixedWidth />,
      isVisible: () => selected.length > 0,
      perform: () => purge(selected),
    },
  ]);

  return /* ... */;
}
```

The hook takes the same `QuickActionDefinition[]` as `addAction`, plus an optional second argument to switch registration on and off:

```ts
useQuickActions(definitions, !loading);
```

Actions registered this way disappear when the component unmounts, and they go through exactly the same scope, permission and visibility filtering as global ones. The `page` category exists for them, and it's what the Panel's own file manager uses for its file and selection actions.

The array is re-read on every palette render rather than captured at mount, so closures over component state stay current: `selected` in the example above is always the live value, and you never have to re-register. The tradeoff is that `label`, `isVisible` and `perform` are called from the palette's render rather than yours, so they cannot contain hooks.

::: info
Something has to render the component for the hook to fire. A page you registered with `addServerRoute` works, and so does a component you slotted into a core page - see [Mounting UI](./mounting-ui.md). If you want actions present on a page you don't own, register them globally with an `isVisible` check instead.
:::

## Modes

Modes turn the palette into something other than a list filter when the query starts with a given prefix. Core ships two: `=` evaluates a math expression and offers to copy the result, and `/` switches to path-based navigation search, showing each route's URL alongside its name.

```ts
ctx.extensionRegistry.enterQuickActions((quickActions) =>
  quickActions.addMode({
    id: 'dev.0x7d8.players',
    prefix: '@',
    hint: () => getExtTranslations().t('quickAction.playerHint', {}),
    prepare: (modeCtx) => void ensurePlayersLoaded(modeCtx.term).then(modeCtx.refresh),
    items: (modeCtx) =>
      searchPlayers(modeCtx.term).map((player) => ({
        key: `player:${player.uuid}`,
        category: 'dev.0x7d8.cleanup',
        label: player.name,
        description: player.uuid,
        icon: <FontAwesomeIcon icon={faUser} fixedWidth />,
        onSelect: () => {
          modeCtx.close();
          kickPlayer(player.uuid);
        },
      })),
  }),
);
```

| Field | Type | What it does |
| ----- | ---- | ------------ |
| `id` | `string` | Identity of the mode |
| `prefix` | `string` | The string that activates it. Usually one punctuation character |
| `hint` | `string \| (() => string)` | Shown next to the prefix in the palette's footer bar, so users can discover the mode |
| `prepare?` | `(ctx) => void` | Called whenever the query changes while your mode is active. Where async loading goes |
| `items?` | `(ctx) => QuickActionItem[]` | The items your mode contributes, built from `ctx.term` |
| `map?` | `(item, ctx) => QuickActionItem \| null` | Filters and rewrites the *normal* items while your mode is active. `null` drops one |

The mode context is small: `term` (the query with your prefix stripped and trimmed), `close`, `addToast` for raising a [toast](./toasts.md), and `refresh` to re-render the palette after async work lands.

A few behaviours shape how you write one:

- The palette picks the first mode whose prefix the query starts with, and core modes are checked before extension ones, so `=` and `/` are unavailable to you.
- While a mode is active the label and keyword matching is bypassed, and whatever `items` returns is shown as-is. Filtering on `ctx.term` is your job, which is what makes modes useful for computed results that no substring match would find.
- Actions and navigation entries survive only if your `map` returns them, so a mode with just `items` gives the user a single-purpose list. Implement `map` when you want to *narrow* the existing list instead of replacing it, the way core's `/` mode keeps only the navigation category and hangs each route's path off `description`.
- `prepare` runs on every keystroke, so make it idempotent and cheap to re-enter. Core's math mode checks whether its library is already loaded before kicking off the dynamic import; do the same for anything expensive, and call `refresh` when the data arrives.

Items you build yourself use `QuickActionItem` rather than a definition, which is a slightly different shape: `key` (unique across the whole list), `category`, `label` and `description` as already-resolved strings rather than getters, plus optional `path`, `keywords`, `icon`, `danger`, and a required `onSelect`. The palette filters none of these for you, checking neither scope nor permissions, so verify whatever matters before you offer an item.

::: warning
Mode items get no `navigate`, `user` or `server` - the mode context has none of the page state an action's `QuickActionContext` carries. Modes are built for computed and fetched results, not for routing. If your item needs to navigate or read the current server, make it a regular action (or a page action) instead.
:::

## Opening the Palette Yourself

The palette's open state is a Zustand store, so you can drive it from your own UI - a button in a card, a step in an onboarding flow:

```tsx
import { useQuickActionsStore } from '@/stores/quickActions.ts';

export default function MyCard() {
  const setOpen = useQuickActionsStore((state) => state.setOpen);

  return <Button onClick={() => setOpen(true)}>Search</Button>;
}
```

Outside React, `getQuickActionsStore()` from the same module gives you a synchronous snapshot with the same `setOpen` and `toggle`. The built-in `Mod+Space` shortcut and the sidebar trigger go through that same store. If you want your own key binding for something, the adjacent `enterShortcuts` registry lets you register a shortcut with a default binding that users can rebind from their account settings.

## A Worked Example

Putting the pieces together - an extension that registers its own category, one server-scoped action gated on a permission and on the server being offline, and one destructive dashboard action:

```ts
import { faBroom, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Extension, ExtensionContext } from 'shared';
import { getExtTranslations } from './translations.ts';

const CATEGORY = 'dev.0x7d8.cleanup';

class CleanupExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterQuickActions((quickActions) =>
      quickActions
        .addCategory({
          id: CATEGORY,
          label: () => getExtTranslations().t('quickAction.category', {}),
          icon: <FontAwesomeIcon icon={faBroom} size='sm' />,
        })
        .addAction({
          id: 'dev.0x7d8.cleanup.purgeLogs',
          category: CATEGORY,
          label: () => getExtTranslations().t('quickAction.purgeLogs', {}),
          keywords: ['clean', 'logs'],
          icon: <FontAwesomeIcon icon={faBroom} fixedWidth />,
          scopes: ['server'],
          permission: 'files.delete',
          isVisible: (actionCtx) => actionCtx.serverState === 'offline',
          perform: (actionCtx) => purgeLogs(actionCtx.server!.uuid),
        })
        .addAction({
          id: 'dev.0x7d8.cleanup.purgeAll',
          category: CATEGORY,
          label: () => getExtTranslations().t('quickAction.purgeAll', {}),
          icon: <FontAwesomeIcon icon={faTrash} fixedWidth />,
          danger: true,
          scopes: ['dashboard'],
          adminPermission: true,
          perform: () => purgeEverything(),
        }),
    );
  }
}

export default new CleanupExtension();
```

## Guidelines

- Prefix your ids with your package identifier. They're the palette's list keys, and a collision with core or another extension leaves one of the two actions unreachable.
- Pass a getter for `label` rather than a string, since the palette re-resolves labels on render: a getter follows a language switch and a literal doesn't. See [Translations](./translations.md).
- Add keywords for anything users would search by another name. The match is a plain case-insensitive substring over label and keywords, without fuzzy matching or stemming, so "mkdir" only finds "New Directory" if you put it there.
- Reserve `danger` for destructive actions, so that a red row keeps meaning "this one you can't undo".
- Confirm destructive things. `perform` fires straight off an Enter keypress, so if the action is irreversible, open a modal from `perform` instead of doing the work. `requestServerKill` on the context is core doing exactly that.
- Don't register the same thing twice. An action that's also a sidebar route is already in the palette under Navigation.
