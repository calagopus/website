---
title: Icons
description: Pass icons to the Panel as Font Awesome definitions, React elements or components, and replace the Panel's own icons from an extension or a theme variant.
---

# Icons

Since Panel 1.2.11 every icon slot in the extension API takes the same type, `IconLike`. A route icon, a context menu item, a permission group icon and your extension's `cardIcon` all accept a Font Awesome icon, a React element or a component. Before 1.2.11 some of these slots wanted an `IconDefinition` and others a rendered `ReactNode`, so you had to check each one.

## The `IconLike` Type

```ts
import type { IconLike } from '@/elements/data-display/Icon.tsx';

type IconLike = IconDefinition | ReactElement | ComponentType<{ className?: string }>;
```

| Form             | Example                                       | Use it for                                                                                   |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `IconDefinition` | `faCube`                                      | Any Font Awesome icon. This is the usual choice and matches the rest of the Panel.           |
| `ReactElement`   | `<img src='/my-extension/logo.svg' alt='' />` | Something already rendered, such as an image, or a `<FontAwesomeIcon />` with its own props. |
| `ComponentType`  | `MyLogoIcon`                                  | Your own SVG icon. The Panel renders it in a 1em box like a Font Awesome icon and stretches it to fill that box. |

You don't need to wrap Font Awesome icons any more. These two lines render the same icon:

```tsx
<TitleCard title='Players' icon={faUsers}>
<TitleCard title='Players' icon={<FontAwesomeIcon icon={faUsers} />}>
```

The second form still works, so code written for older Panels keeps compiling.

## Rendering an Icon Yourself

If your own component takes an icon prop, type it as `IconLike` and render it with `Icon`:

```tsx
import Icon, { type IconLike } from '@/elements/data-display/Icon.tsx';

function StatusRow({ icon, label }: { icon: IconLike; label: string }) {
  return (
    <div className='flex items-center gap-2'>
      <Icon icon={icon} className='text-(--mantine-color-dimmed)' />
      {label}
    </div>
  );
}
```

`Icon` takes the same props as `FontAwesomeIcon` (`size`, `className`, `style`, `color` and so on), but `icon` is an `IconLike`. Each form renders a little differently:

- An `IconDefinition` renders as a regular `FontAwesomeIcon`.
- A `<FontAwesomeIcon />` or `<Icon />` element gets your props merged into its own, with both sets of class names kept.
- Any other element or component renders inside a `<span>` that takes the same 1em box as a Font Awesome icon, so it lines up with text and picks up `size`, `className`, `color`, `style` and a tooltip's ref. A component is stretched to fill that box. An element keeps the size it already has, so a 16px spinner stays 16px.

## Where `IconLike` Is Accepted

On the extension registry:

| Where                                                         | Field                                              |
| ------------------------------------------------------------- | -------------------------------------------------- |
| [Routes](./mounting-ui.md#route-definition-fields)            | `icon`                                             |
| Sub-navigation tabs                                           | `icon`                                             |
| [Context menu items](./file-manager.md)                       | `icon`                                             |
| [File icon handlers](./file-manager.md#icons-and-openability) | the return value                                   |
| [Quick actions](./quick-actions.md)                           | `icon` on actions, mode items and categories       |
| Keyboard shortcut categories                                  | `icon`                                             |
| [Permission groups](./permissions.md#giving-a-group-an-icon)  | the `icon` argument                                |
| [Form sections](./forms.md)                                   | `icon`                                             |
| [Theme variants](./theming.md#theme-variants)                 | `icon`                                             |
| [Toast actions](./toasts.md)                                  | `icon`                                             |
| The `Extension` class                                         | [`cardIcon`](./mounting-ui.md#the-extension-class) |

And on these Panel components, which you can use in your own pages:

| Component            | Import                                   | Props                 |
| -------------------- | ---------------------------------------- | --------------------- |
| `Alert`              | `@/elements/feedback/Alert.tsx`          | `icon`                |
| `TitleCard`          | `@/elements/data-display/TitleCard.tsx`  | `icon`                |
| `EmptyState`         | `@/elements/feedback/EmptyState.tsx`     | `icon`                |
| `StatCard`           | `@/elements/data-display/StatCard.tsx`   | `icon`, `popoverIcon` |
| `CollapsibleSection` | `@/elements/CollapsibleSection.tsx`      | `icon`                |
| `ChartBlock`         | `@/elements/charts/ChartBlock.tsx`       | `icon`                |
| `BlockedOverlay`     | `@/elements/feedback/BlockedOverlay.tsx` | `icon`                |
| `KbdKey`             | `@/elements/typography/KbdKey.tsx`       | `icon`                |
| `CapacityCard`       | `@/elements/admin/CapacityCard.tsx`      | `icon`                |
| `AllocationBar`      | `@/elements/admin/AllocationBar.tsx`     | `icon`                |

`ChartBlock`'s `overlayIcon` is still a plain `ReactNode`, because it usually holds a loading spinner. Mantine's own components and props, such as `leftSection` on buttons and inputs, also still take a `ReactNode`, so wrap the icon there yourself.

## Replacing the Panel's Icons

An extension can swap any Font Awesome icon the Panel renders for one of its own:

```ts
import { faServer } from '@fortawesome/free-solid-svg-icons';
import { Extension, ExtensionContext } from 'shared';
import MyServerIcon from './MyServerIcon.tsx';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterIcons((icons) => icons.replaceIcon(faServer, MyServerIcon));
  }
}

export default new MyExtension();
```

The first argument is the icon to replace, and the second is any `IconLike`, including another Font Awesome icon. The replacement applies everywhere that icon is drawn: the sidebar, menus, buttons, file rows, toasts, and other extensions' UI too, because every `FontAwesomeIcon` in the Panel goes through the same component.

Replacements match on the icon's style and name:

- Font Awesome exports some icons under more than one name, such as `faCog` and `faGear`. Replacing either name replaces both.
- Each style is a separate icon. Replacing the solid `faServer` leaves the regular one alone.
- A replacement covers every place the icon appears, and you can't limit it to one. The Panel uses `faServer` for both **Nodes** and **Database Agent Hosts** in the admin sidebar, so replacing it changes both entries.

When two extensions replace the same icon, the one loaded later wins. Replacements from a disabled extension are not applied.

::: info
Icons an admin has picked in the Panel, such as a custom sidebar icon in the route order editor or an OAuth provider icon, are never replaced.
:::

Only Font Awesome icons can be replaced this way. Mantine draws some icons itself, such as the chevrons in selects and the close button on modals, and the Panel's logo is an image. To change those, hook the component that draws them through the [hookable components](./theming.md#hookable-components) system.

### Only While a Theme Variant Is Active

A [theme variant](./theming.md#theme-variants) can replace icons from its `enter` hook. They are restored when the variant stops being active:

```ts
themes.addVariant({
  id: 'my-extension-retro',
  label: 'Retro',
  schemes: ['dark'],
  enter(scope) {
    scope.replaceIcon(faServer, RetroServerIcon).replaceIcon(faUsers, RetroUsersIcon);
  },
});
```

A replacement from a theme variant takes priority over one from `replaceIcon` on the registry.
