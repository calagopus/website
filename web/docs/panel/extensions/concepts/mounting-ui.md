# Mounting UI

So far the docs have covered the backend side - routes, permissions, settings, activity. But none of that is any use unless the Panel's UI actually *shows* something to a user. This page is about the frontend entry point: how your extension gets React components onto actual pages in the Panel.

Two things do the work:

1. **The `Extension` class** you export from `src/index.ts`, which declares a couple of default mount points (the admin extension card, the admin extension configuration page).
2. **The `ExtensionRegistry`**, accessed via `ctx.extensionRegistry` inside your `initialize()` method, which lets you push components into existing Panel pages and add entirely new routes to the sidebar.

Together these cover the big four: "add a summary to the admin extension card", "let the admin configure your extension", "drop a widget into an existing page", and "add a whole new page". Which is most of what most extensions need.

## The Extension Class

Every extension's frontend entry point is a class extending `Extension`, whose instance you default-export:

```ts
import { Extension, ExtensionContext } from 'shared';
import MyConfigurationPage from './ConfigurationPage.tsx';
import MyCardSummary from './CardSummary.tsx';

class MyExtension extends Extension {
  public cardConfigurationPage: React.FC | null = MyConfigurationPage;
  public cardComponent: React.FC | null = MyCardSummary;

  public initialize(ctx: ExtensionContext): void {
    // register additional UI through ctx.extensionRegistry - see below
  }
}

export default new MyExtension();
```

Two fields on the class map directly to admin-panel surfaces:

- **`cardComponent`** - a React component rendered inside your extension's card in the admin panel's extension list. Good for a quick at-a-glance summary: "42 items installed", "last sync 2 minutes ago", a small health indicator. Keep it compact, it's sharing space with other extensions. Set to `null` if you don't need it.

- **`cardConfigurationPage`** - a React component shown when an admin clicks the Configure button on your extension's card. It's mounted at `/admin/extensions/<your-package-identifier>` automatically - you don't need to register a route for it. Set to `null` if your extension has nothing to configure.

::: info
**Configuration pages are already wrapped for you.** The route shell that mounts your `cardConfigurationPage` at `/admin/extensions/<id>` provides the admin layout, navigation, and title bar - your component just returns its content (a `<div>`, a `<Stack>`, whatever). This is the *only* exception. Every other route you add needs to wrap its own content (see [Container Wrappers](#container-wrappers) below).
:::

The `initialize()` method runs once when the Panel loads your extension, and receives a `ctx: ExtensionContext` that exposes the registry. Any UI beyond the two class fields gets added here.

## Slotting Into Existing Pages

The Panel's built-in pages expose named **slot points** where extensions can inject components. As an example, the Egg Changer extension uses this to drop a card onto the server settings page:

```ts
public initialize(ctx: ExtensionContext): void {
  ctx.extensionRegistry.pages.server.settings.enterSettingContainers((containers) =>
    containers.appendComponent(EggChangerContainer),
  );
}
```

Walking this left to right: `ctx.extensionRegistry.pages` is the tree of built-in pages with slot points. `.server.settings` navigates to the server settings page. `.enterSettingContainers(...)` enters the "setting containers" slot on that page, handing you a container object whose methods control what gets added and where.

Each slot has two methods for adding components:

- **`appendComponent(Component)`** - adds to the end of the slot
- **`prependComponent(Component)`** - adds to the beginning of the slot

The component you pass takes no props - it's a self-contained feature card that reads whatever state it needs from Panel stores (see [Reading Panel State](#reading-panel-state) below).

### Ordering Between Entries

Append and prepend get you to the ends. If you need to land *between* existing entries, the slot points use Tailwind's `order-` utility classes on each entry to control visual position. Stock entries count up by 10 starting at `order-10`, so `order-10`, `order-20`, `order-30`, and so on - leaving plenty of gaps for extensions to slot in at `order-15` or `order-25` without having to renumber anything.

Since the exact numbers depend on what's already there in the version of the Panel you're targeting, **inspect the page in DevTools** to find the existing orders: right-click an entry next to where you want to land, inspect, and look for the `order-<n>` class on the wrapper. Then set your own component's outer element to an order that falls in the right gap:

```tsx
export default function MyServerSettingsCard() {
  return (
    <TitleCard title='...' className='order-25'>
      {/* ... */}
    </TitleCard>
  );
}
```

This is a slightly manual process but it's flexible and it avoids the common "ordering API where nobody agrees on priorities" mess. Most extensions won't need to care - appending to the end is usually fine.

### Full Slot-Point Surface

The page tree under `ctx.extensionRegistry.pages` is large and evolves as the Panel grows new slot points. Rather than enumerate it here (and go stale immediately), see the typedocs: [ExtensionRegistry](https://typedocs.calagopus.com/classes/extensions_shared_src_registries.ExtensionRegistry). Look for `pages.*` and follow the types to find the container method you need.

## Adding New Routes

When slotting into an existing page isn't enough - you have a whole new feature that deserves its own sidebar entry and URL - use the route registry. The Minecraft version changer extension does this to add a "Versions" tab to every server:

```ts
import { faCube } from '@fortawesome/free-solid-svg-icons';

public initialize(ctx: ExtensionContext): void {
  ctx.extensionRegistry.enterRoutes((routes) =>
    routes.addServerRoute({
      name: () => getExtTranslations().t('pages.server.versions.title', {}),
      icon: faCube,
      path: '/minecraft/versions',
      element: MinecraftVersionsPage,
    }),
  );
}
```

`enterRoutes(...)` gives you a `RouteRegistry` with one `add*Route` method per route type. The route types correspond 1:1 with the Panel's major navigation scopes:

| Method | Definition type | Where it appears | Has name/icon? | Has permission? |
| ------ | --------------- | ---------------- | -------------- | --------------- |
| `addGlobalRoute` | `GlobalRouteDefinition` | Top-level, no layout | No | No |
| `addAuthenticationRoute` | `GlobalRouteDefinition` | Inside the auth flow | No | No |
| `addAccountRoute` | `RouteDefinition` | User's account area | Yes | No |
| `addAdminRoute` | `AdminRouteDefinition` | Admin panel sidebar | Yes | Yes |
| `addServerRoute` | `ServerRouteDefinition` | Per-server sidebar (like "Console", "Files", etc.) | Yes | Yes |

### Route Definition Fields

The definition types form a small hierarchy, each level adding fields. These are the fields you'll actually fill in:

**Always (`GlobalRouteDefinition` and everything that extends it):**

- **`path: string`** - the URL relative to the route type's base. A path of `/minecraft/versions` passed to `addServerRoute` becomes something like `/server/<uuid>/minecraft/versions` in the actual URL. Leading slash required.
- **`element: FC`** - the React component to render when the route matches. Remember it needs to wrap itself in the appropriate container (see [Container Wrappers](#container-wrappers) below).
- **`exact?: boolean`** - standard react-router exact-matching flag. Leave unset unless you know you need it.
- **`filter?: () => boolean`** - called at render time; if it returns `false` the route is skipped as though it wasn't registered. Useful for feature flags ("only show this route if the extension's setting is enabled"), conditional UI ("only show if the server has a specific egg type"), or environment checks. The function runs on every render, so keep it cheap - a boolean check on a store value, not a network call.

**Additionally for named routes (`RouteDefinition` - account, admin, server):**

- **`name: string | (() => string) | undefined`** - the label shown in the sidebar. A plain string works for untranslated labels. For translated labels, pass a function that returns the translated string - this way the label re-evaluates when the user switches language. `undefined` is valid if for some reason you want a route with no sidebar entry (though in that case you probably want `addGlobalRoute` instead).
- **`icon?: IconDefinition`** - a FontAwesome icon definition (e.g. `faCube` from `@fortawesome/free-solid-svg-icons`). Optional, but sidebar entries look noticeably worse without one - include one unless you're specifically going for a text-only look.

**Additionally for permissioned routes (`AdminRouteDefinition`, `ServerRouteDefinition`):**

- **`permission?: string | string[] | null`** - the permission node(s) required to see this route. A single string requires that permission; an array requires all of them. Routes whose permission check fails are hidden from the sidebar and inaccessible via direct URL. This is the frontend counterpart to `has_server_permission` on the backend - see [Permissions](./permissions.md) for how permission nodes map to what the user can do. `null` or omitted means no permission required (which is the right default for most user-facing features; reach for `permission` when you have something gated).

### A More Complete Example

Putting a few of these together - a server route with a translated name, an icon, gated on a permission, and conditionally hidden unless the extension is enabled for the current server:

```ts
ctx.extensionRegistry.enterRoutes((routes) =>
  routes.addServerRoute({
    name: () => getExtTranslations().t('pages.server.myfeature.title', {}),
    icon: faCube,
    path: '/my-feature',
    element: MyFeaturePage,
    permission: 'settings.my-feature',
    filter: () => {
      const egg = useServerStore.getState().server.egg;
      return egg.features.includes('minecraft');
    },
  }),
);
```

Note the `.getState()` call inside `filter` - since `filter` runs outside React (it's called by the router, not a component), you can't use the hook form `useServerStore(...)`. Zustand's `.getState()` gives you a synchronous snapshot which is what you want here.

### Container Wrappers

Unlike configuration pages, **route components don't get page chrome for free**. Your `element` is rendered inside the layout for its route type, but inside that layout you still need to wrap your content in the right **content container**, which handles the title, header, and other per-page chrome. Importing from `@/elements/containers/`:

| Route type | Wrapper | Notes |
| ---------- | ------- | ----- |
| `addGlobalRoute`, `addAuthenticationRoute` | `ContentContainer` | Minimal - sets the browser tab title, renders children directly |
| `addAccountRoute` | `AccountContentContainer` | Full account page chrome |
| `addAdminRoute` (top-level) | `AdminContentContainer` | Full admin page chrome |
| `addAdminRoute` (under a tabbed page with SubNavigation) | `AdminSubContentContainer` | For admin pages that live as a tab underneath a parent page |
| `addServerRoute` | `ServerContentContainer` | Full server page chrome |

The non-minimal containers all take the same core props - `title` (required - the page header), plus optionals like `subtitle`, `search` / `setSearch` (wires up a search input in the header), `contentRight` (a ReactNode rendered on the right of the header, for buttons), and `fullscreen`. A typical server page looks like this:

```tsx
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';

export default function MyServerPage() {
  const { t: tExt } = useExtTranslations();

  return (
    <ServerContentContainer title={tExt('pages.server.myfeature.title', {})}>
      {/* your page content */}
    </ServerContentContainer>
  );
}
```

Note that these containers have a `registry` prop. **You don't need it.** It's used by the stock Panel to register its own slot points inside pages, not by extensions - ignore it.

### Ordering Routes

By default, admins can reorder routes (for admin and server sidebars) from the admin panel UI. **This is the source of truth.** If an admin has set a custom order, that wins. You generally don't need to think about where your route lands - it'll appear somewhere sensible by default, and admins will move it if they want.

If you really do want to influence the default ordering (before an admin customizes it), use an interceptor - see the next section. But most of the time: just `addServerRoute(...)` and let the admin panel handle placement.

## Interceptors

Alongside each `add*Route` method there's a matching `add*RouteInterceptor`. Interceptors receive the full array of routes of their type (including routes registered by core and by other extensions) and can mutate it. They run after all extensions have registered, so the array you see is the final list before the Panel renders it:

```ts
public initialize(ctx: ExtensionContext): void {
  ctx.extensionRegistry.enterRoutes((routes) =>
    routes.addServerRouteInterceptor((items) => {
      // reorder, or replace a stock page's element with your own
    }),
  );
}
```

Two legitimate uses:

- **Changing default route order.** Move entries around to land in a specific spot. This is the *default* order only - if an admin has set a custom order in the admin panel, their ordering wins and your interceptor's work is discarded. So interceptors are for "sensible default before anyone customizes it", not for guaranteed placement.

- **Replacing a stock page entirely.** Find the route you want to replace by its path, swap its `element` for your own component. This lets an extension take over a built-in page - useful when you want to offer a different UX for an existing Panel feature.

::: warning
Interceptors are a sharp tool. They run against every route of that type, including routes from core and routes from other extensions that registered before you. A buggy interceptor can break functionality the user didn't even know came from your extension, and replacing a stock page's element means you now own the responsibility of keeping that page working as the Panel evolves.

Use interceptors sparingly, keep their mutations narrowly scoped (filter to the one route you care about by path, don't iterate over everything), and prefer the simple `add*Route` methods for anything you can express that way.
:::

The same interceptor pattern exists for every route type - `addGlobalRouteInterceptor`, `addAccountRouteInterceptor`, `addAdminRouteInterceptor`, `addAuthenticationRouteInterceptor`.

## Reading Panel State

Components you slot into existing pages (and pages you register as new routes) usually need to know *which* server or user the current page is about. The Panel exposes this through Zustand stores, which your components import directly:

```tsx
import { useServerStore } from '@/stores/server.ts';
import { useGlobalStore } from '@/stores/global.ts';
```

- **`useServerStore`** - the currently-viewed server (on server pages). Exposes `server`, `updateServer`, and related state.
- **`useGlobalStore`** - app-wide state like available languages, feature flags, user info.

Subscribe with a selector to avoid re-rendering when unrelated fields change:

```tsx
const uuid = useServerStore((state) => state.server.uuid);
const egg = useServerStore((state) => state.server.egg);
```

Or destructure if you need multiple fields and don't mind the extra re-renders:

```tsx
const { server, updateServer } = useServerStore();
```

This is standard Zustand - if you haven't used it before, the [Zustand docs](https://zustand.docs.pmnd.rs/) are short and cover everything.

## The Rest of the Registry

This page covered the two patterns you'll actually use in most extensions - slotting components into existing pages, and adding new routes. The `ExtensionRegistry` surface is considerably larger than this, and designed to let extensions do almost anything with the UI. Rather than enumerate it (and go stale every time it grows), the authoritative reference is the typedocs:

**[ExtensionRegistry typedocs](https://typedocs.calagopus.com/classes/extensions_shared_src_registries.ExtensionRegistry)**

Start there when you need something beyond what's shown on this page. Most slot points and registries follow the same `enter*()` / `add*()` shape as the two patterns above, so once you've used one, the rest are mostly discoverable.
