---
title: Theming
description: Restyle the Panel from an extension, beyond slotting components into existing pages.
---

# Theming

Most extensions keep the Panel's look: a card slotted onto a page inherits the styling around it (see [Mounting UI](./mounting-ui.md)). Sometimes you need to change the _look_ itself: recolor the whole Panel to match your brand, restyle every `Button` at once, or replace a stock component with your own everywhere it shows up.

There are three layers for this, from broadest to most surgical:

1. **The Mantine theme.** `initializeMantineTheme()` returns a theme override that is merged across all extensions and applied globally. Use it for colors, fonts, radii and default component props, anything Mantine's theming already covers.
2. **CSS variables and Tailwind tokens.** Ship your own `app.css` to override the `--mantine-color-*` variables and the Tailwind tokens the Panel defines. This covers what sits below the Mantine theme object, such as chart colors.
3. **Hookable components.** Every element in the Panel's component library is _hookable_. You can intercept its props, wrap its rendered output, or replace its implementation entirely, and your change applies everywhere that component is used (core pages included).

Pick the broadest layer that does the job. Drop down to hookable components only when the theme and CSS layers can't get you there.

All three layers apply for as long as your extension is installed. If you want a look that users can pick or leave, like a high-contrast mode or a brand palette next to the stock one, register a [theme variant](#theme-variants) instead. A variant carries the same three layers, but they only apply while the user has it selected.

## The Mantine Theme

The Panel runs on [Mantine](https://mantine.dev/), and Mantine's theme object is where colors, the primary color, fonts, spacing, radii, and per-component default props all live. Your extension contributes by overriding `initializeMantineTheme()` on your `Extension` class:

```ts
import type { MantineThemeOverride } from '@mantine/core';
import { Extension, ExtensionContext } from 'shared';

class MyExtension extends Extension {
  public initializeMantineTheme(ctx: ExtensionContext): MantineThemeOverride {
    return {
      primaryColor: 'grape',
      defaultRadius: 'md',
      fontFamily: 'Inter, sans-serif',
      components: {
        Button: {
          defaultProps: {
            variant: 'light',
          },
        },
      },
    };
  }
}

export default new MyExtension();
```

### How overrides combine

`initializeMantineTheme()` runs once at load, on every installed extension. The Panel deep-merges each returned override, in installation order, into one object, runs it through Mantine's `createTheme`, and hands it to the top-level `MantineProvider`. So:

- Your override is **merged, not replacing**. You only name what you want to change; everything else keeps Mantine's default. The Panel's own theme object is small, since most of its look lives in `app.css`: it sets a few component defaults (the loader, input wrappers and tooltips), and extension overrides are merged on top of it.
- **Multiple extensions can contribute.** Two extensions setting `primaryColor` is last-writer-wins (later install order wins). Two extensions setting _different_ keys both take effect.
- It's a deep merge, so nested keys like `components.Button.defaultProps` combines key-by-key instead of clobbering the whole `components` map.

::: info
The Panel mounts `MantineProvider` with `defaultColorScheme='dark'`. Most of its own styling is tuned for dark first, with light mode as a supported alternate. If your override touches colors, check both schemes before you ship.
:::

### What goes here

Anything Mantine already models: `colors` (including a custom 10-shade palette), `primaryColor`, `primaryShade`, `fontFamily` / `headings`, `defaultRadius`, `spacing`, `shadows`, and per-component `defaultProps` / `classNames` / `styles`. Mantine's [theme object](https://mantine.dev/theming/theme-object/) and [styles overview](https://mantine.dev/styles/styles-overview/) document all of it, and all of it can go in the object you return.

::: info
Setting a component's `defaultProps` in the theme is usually a cleaner way to restyle a whole class of component than a props interceptor. If all you want is "every `Button` defaults to `variant='light'`", the theme is the simpler tool. Reach for an interceptor only when the change depends on the incoming props.
:::

## The CSS Variables Resolver

The theme object and a static `app.css` sit at two extremes: the theme is fully theme-aware but only reaches what Mantine models, while `app.css` reaches any variable but is static and can't see your palette. The resolver sits between them. `initializeMantineCssResolver()` hands you the resolved theme and lets you compute CSS variables from it, so your values stay in lockstep with the palette, `primaryColor`, and the active color scheme.

Override it on your `Extension` class. Most extensions don't need it, so the default returns `null` (contribute nothing):

```ts
import type { CSSVariablesResolver } from '@mantine/core';
import { Extension, ExtensionContext } from 'shared';

class MyExtension extends Extension {
  public initializeMantineCssResolver(ctx: ExtensionContext): CSSVariablesResolver | null {
    return (theme) => {
      const brand = theme.colors[theme.primaryColor];

      return {
        variables: {},
        dark: {
          '--chart-series-1': brand[4],
          '--chart-series-2': brand[8],
        },
        light: {
          '--chart-series-1': brand[6],
          '--chart-series-2': brand[2],
        },
      };
    };
  }
}

export default new MyExtension();
```

A resolver returns three buckets:

- **`variables`**: emitted regardless of color scheme.
- **`light`**: emitted under the light scheme only.
- **`dark`**: emitted under the dark scheme only.

The Panel feeds the result into the top-level `MantineProvider`'s `cssVariablesResolver`, which renders the variables into a `<style>` tag scoped by scheme. Because the values come from `theme`, a later extension that changes `primaryColor` in `initializeMantineTheme()` automatically reshades everything your resolver derived from it.

### How resolvers combine

Unlike `initializeMantineTheme()`, resolvers are **not merged**. The Panel walks installed extensions in installation order and uses the **first one that returns a non-null resolver**; every extension after it is ignored, buckets and all. There's no per-variable merge: a single resolver wins outright. Returning `null` opts out cleanly and lets the Panel fall through to the next extension.

When that one resolver runs, Mantine calls it with the **already-merged** theme, with every extension's `initializeMantineTheme()` override folded in first, so you derive from the final palette, not your own slice of it.

::: warning
Because only the first non-null resolver is used, two extensions that both ship a resolver don't cooperate: the later one silently contributes nothing. If you need variables that another extension's resolver also sets, you can't rely on merging here; prefer scoping CSS variable overrides to your own surfaces, or set theme-derived values through `initializeMantineTheme()` (which _does_ deep-merge) where Mantine models them.
:::

::: info
The resolver sees the merged theme but runs separately from it. If your variable is purely theme-derived and Mantine already models the target (a palette shade, a spacing value), set it in `initializeMantineTheme()` instead. The resolver is for variables Mantine _doesn't_ model but that you still want computed from the theme, like the chart colors above.
:::

::: info
Reach for the resolver over `app.css` only when the value has to track the theme. A fixed `--chart-grid-color: #2a2a2a` belongs in `app.css`; a chart series color derived from `theme.colors[theme.primaryColor]` belongs here, so it follows palette changes and both schemes.
:::

## CSS Variables and Tailwind Tokens

Below the theme object sits a layer of raw CSS custom properties. The Panel resolves Mantine's theme into `--mantine-color-*` variables on `:root`, scoped by color scheme through the `[data-mantine-color-scheme="dark"]` / `[data-mantine-color-scheme="light"]` attributes. It also defines its own tokens in its `app.css`: the font stack, server status colors and chart colors.

Your extension can ship its own `src/app.css`, and the build picks it up automatically and folds it into the final stylesheet. That lets you override variables the theme object doesn't reach. Chart colors are the common case. They are plain CSS variables, not part of the Mantine theme, so this is the only way to change them:

```css
/* my-extension/src/app.css */

:root[data-mantine-color-scheme='dark'] {
  --chart-grid-color: #2a2a2a;
  --chart-tick-color: #e5e7eb;
  --chart-series-1: #c084fc;
  --chart-series-2: #f0abfc;
}

:root[data-mantine-color-scheme='light'] {
  --chart-grid-color: #e5e7eb;
  --chart-tick-color: #374151;
  --chart-series-1: #9333ea;
  --chart-series-2: #c026d3;
}
```

The Panel defines four series slots, `--chart-series-1` through `--chart-series-4`; a chart with more series than that cycles back through them. Each slot is a single color used for the series' line and, at reduced opacity, its gradient fill; there's no separate fill variable.

The same works for the app background (`--mantine-color-body`) or any other `--mantine-color-*` variable.

- **Scheme scoping matters.** These variables are defined separately under the dark and light selectors. Override them under the matching scheme selector (or both), not bare `:root`, or the more specific scheme rule wins and your value is ignored.
- **Load order between extensions isn't guaranteed.** If two extensions fight over the same variable, the winner comes down to bundling order, which you don't control. Keep overrides scoped to your own surfaces where you can, and only override global variables in an extension that is meant to be a theme.
- **Prefer the theme when a value is theme-derived.** Overriding `--mantine-color-grape-7` in CSS works, but if Mantine would normally compute it from your palette, set it in `initializeMantineTheme()` instead so both schemes and all the derived shades stay consistent.

## Hookable Components

Most elements in the Panel's component library, such as `Button`, `Card`, `Modal`, `Spinner` and the inputs, are wrapped before they're exported. Instead of exporting the bare component, the module does:

```ts
export default makeComponentHookable(Button);
```

`makeComponentHookable` returns a thin wrapper that's a **process-wide singleton**. Importing `@/elements/buttons/Button.tsx` from anywhere, core code or your extension, gives you the _same_ wrapper instance. That call at the bottom of a module is also how you tell whether an element is hookable at all: a few layout pieces such as `ContentContainer` and `ExtensionSlot` are exported bare. The wrapper exposes three methods, and because the instance is shared, registering a hook changes every render of that component across the whole Panel:

```ts
Button.addPropsInterceptor((props) => props); // transform incoming props
Button.addRenderInterceptor((element, props) => element); // wrap/replace the output
Button.replaceBaseComponent(MyButton); // swap the implementation entirely
```

Each method returns a function that undoes exactly that registration. Already-mounted instances of the component re-render when a hook is added or removed, so a change shows up without a reload:

```ts
const undo = Button.addPropsInterceptor((props) => ({ ...props, radius: 'xl' }));

undo(); // every Button renders without the interceptor again
```

Undoing a `replaceBaseComponent` falls back to the replacement registered before it, or to the original component when none is left, so two extensions can each undo their own replacement in any order. Panels before 1.2.11 return nothing from these methods, so a hook registered there stays for the whole session.

### Where to register hooks

Register hooks in your extension's `initialize()`. It runs once, before React renders anything, so the interceptors are in place before the first paint and apply uniformly from the very first render:

```ts
import { Extension, ExtensionContext } from 'shared';
import Button from '@/elements/buttons/Button.tsx';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    Button.addPropsInterceptor((props) => ({
      ...props,
      radius: 'xl',
    }));
  }
}

export default new MyExtension();
```

::: warning
Don't register hooks from inside a React component: not in a render body, an effect, or an event handler. Registrations are not deduplicated, so registering on every render or click keeps stacking duplicate hooks, and each registration re-renders every instance of the component. Register permanent hooks in `initialize()`. For hooks that should come and go with a look the user picks, use a [theme variant's `enter`](#entering-and-exiting), which removes them for you.
:::

### `addPropsInterceptor`: transform props before render

The interceptor gets the props the component was called with and returns the props it should actually render with. Use it to force, default, or rewrite props everywhere a component is used:

```ts
Button.addPropsInterceptor((props) => ({
  ...props,
  // push every non-destructive button to our brand variant,
  // but leave red (destructive) buttons alone
  variant: props.color === 'red' ? props.variant : 'gradient',
}));
```

Interceptors run in registration order, each getting the previous one's output, so multiple extensions (and multiple hooks from the same extension) compose. Always spread the incoming props and return a superset. Returning a fresh object that drops fields breaks the component for every caller, core included.

### `addRenderInterceptor`: wrap or replace the output

Where a props interceptor changes _what the component renders with_, a render interceptor changes _what comes out_. It gets the already-created React element plus the (post-props-interceptor) props, and returns the element to render. Use it to wrap the component in extra markup, or to swap it out conditionally:

```tsx
import { cloneElement } from 'react';

Button.addRenderInterceptor((element, props) => (
  <div className='relative inline-block'>
    {element}
    {props.loading && <span className='my-extension-sparkle' />}
  </div>
));
```

You can also `cloneElement(element, ...)` to tweak the element rather than wrap it, or return something else entirely. Like props interceptors, these stack in registration order.

### `replaceBaseComponent`: swap the implementation

`replaceBaseComponent` swaps out the underlying component the wrapper renders, leaving the singleton wrapper (and any interceptors already registered on it) in place. Every import site now renders your version instead of the Panel's:

```tsx
import Button, { type ButtonProps } from '@/elements/buttons/Button.tsx';

function MyButton(props: ButtonProps) {
  // your own implementation - has to honor the same props contract
  return <button className='my-button' onClick={props.onClick} {...} />;
}

// inside initialize():
Button.replaceBaseComponent(MyButton);
```

::: warning
This is a sharp tool, same family as route interceptors (see [Mounting UI → Interceptors](./mounting-ui.md#interceptors)). You're taking over a component that core pages depend on, so:

- **Honor the exact props contract.** Your replacement has to accept and correctly handle every prop the original did (`ButtonProps` here), or you break callers you've never seen.
- **You own it now.** When the Panel changes its `Button`, your replacement won't follow; keeping it current is your job.
- **Last replacement wins.** If two extensions both `replaceBaseComponent` the same component, only the last one in install order survives. Nothing merges.

Replace a base component only when intercepting props or wrapping the render genuinely can't get you there. For most "make it look different" goals, the theme, a props interceptor, or a render interceptor is the safer bet.
:::

### Compound and sub-components

Some elements ship sub-components, and each is independently hookable. `Spinner` carries `Spinner.Centered` and `Spinner.Suspense`, for instance, and `Modal` is exported alongside `ModalFooter` (both are named exports of `@/elements/modals/Modal.tsx`, not the default). Each is its own hookable wrapper, so hook them separately:

```ts
import Spinner from '@/elements/feedback/Spinner.tsx';

Spinner.Centered.addPropsInterceptor((props) => ({ ...props, size: 48 }));
```

Hooking the parent (`Spinner`) doesn't hook the children (`Spinner.Centered`), and vice versa; they're separate singletons.

### Caveats for all three

- **Everything is global.** There's no per-page or per-extension scoping. A hook on `Button` changes the Panel's own buttons too. That is the point of the system, but it also means a careless interceptor affects every page.
- **Order is install order**, which you don't control. Don't write hooks that assume they run first or last.
- **Keep interceptors pure and cheap.** They run on every render of a heavily-used component. No expensive work, no side effects.
- **Don't call React hooks inside an interceptor.** An interceptor runs inside the wrapper's render, so any hook it calls becomes one of the wrapper's hooks. When an interceptor is added or removed while instances are mounted, their hook count changes and React throws. If a render interceptor needs state or context, wrap the element in a small component of your own and use the hooks there.

## Theme Variants

Since Panel 1.2.11 the theme menu in the sidebar's account card lists **theme variants** above the color scheme choices. The Panel ships two: **Standard** (light and dark) and **Pure Black**, a dark-only variant with true black backgrounds for OLED screens. Extensions can add their own through the theme registry:

```ts
import { Extension, ExtensionContext } from 'shared';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterThemes((themes) =>
      themes.addVariant({
        id: 'my-extension-solarized',
        label: 'Solarized',
        schemes: ['light', 'dark'],
      }),
    );
  }
}

export default new MyExtension();
```

| Field                  | What it does                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                   | Written to `<html data-theme-variant="...">` while the variant is selected. Prefix it with your extension name. An id equal to a stock variant (`standard`, `pure-black`) replaces that variant. |
| `label`                | The menu label. Pass a string or a function returning one, so a translation can be read at render time.                                                                                          |
| `icon`                 | The menu item's icon, any [`IconLike`](./icons.md). Defaults to a palette icon.                                                                                                                  |
| `schemes`              | The color schemes the variant supports, `'light'`, `'dark'` or both. A variant with an empty list is ignored.                                                                                    |
| `category`             | The id of the [category](#categories) to list the variant under. Leave it out to list the variant at the top level.                                                                              |
| `mantineTheme`         | A Mantine theme override applied while the variant is active. See [Mantine changes](#mantine-changes).                                                                                           |
| `cssVariablesResolver` | A CSS variables resolver applied while the variant is active.                                                                                                                                    |
| `enter`                | Runs when the variant becomes active. See [Entering and exiting](#entering-and-exiting).                                                                                                         |

The selection is stored per browser, next to the light/dark choice, and is not synced to the user's account. The Panel applies it before the first paint, so a reload doesn't flash the stock colors first.

### Categories

Extensions that ship several variants can group them into submenus with `addCategory`. Variants join a category by setting `category` to its id, and a category can sit inside another one the same way, so submenus nest as deep as you need:

```ts
ctx.extensionRegistry.enterThemes((themes) =>
  themes
    .addCategory({ id: 'my-extension-catppuccin', label: 'Catppuccin', icon: faCat })
    .addCategory({ id: 'my-extension-catppuccin-dark', label: 'Dark Flavors', category: 'my-extension-catppuccin' })
    .addVariant({ id: 'my-extension-latte', label: 'Latte', schemes: ['light'], category: 'my-extension-catppuccin' })
    .addVariant({
      id: 'my-extension-mocha',
      label: 'Mocha',
      schemes: ['dark'],
      category: 'my-extension-catppuccin-dark',
    }),
);
```

A category takes `id`, `label`, `icon` and `category` (its parent), which work like the variant fields above. Categories are keyed by id, so several extensions can add variants to the same one, and a later `addCategory` with the same id replaces the earlier one. A `category` that names an unknown id lists the entry at the top level, and a category with no visible variants is hidden. Within a menu, variants come first and categories after them, each in registration order.

### Supported schemes

The menu only shows the **Dark** and **Light** entries the selected variant supports, so with Pure Black selected only **Dark** is offered. Picking a variant that doesn't support the current scheme switches to the first entry in its `schemes`.

**Auto** stays in the menu for every variant. With a single-scheme variant selected, the Panel stays on that variant's scheme and remembers that the user wants Auto: Auto keeps its checkmark, and switching to a variant that supports both schemes goes back to following the operating system. The same applies when a user on Auto picks a single-scheme variant. This preference is stored per browser too.

If the current scheme still ends up outside `schemes`, the Panel treats the variant as inactive: its Mantine changes and `enter` hooks are removed and Standard applies. The user's selection is kept, and the variant applies again once the scheme comes back.

### Styling a variant

Ship the styles in your extension's `src/app.css`, scoped by both the scheme and the variant:

```css
:root[data-mantine-color-scheme='dark'][data-theme-variant='my-extension-solarized'] {
  --mantine-color-body: #002b36;
  --mantine-color-dark-7: #002b36;
  --mantine-color-dark-6: #073642;
  --mantine-color-dark-4: #2a4a52;
}

:root[data-mantine-color-scheme='light'][data-theme-variant='my-extension-solarized'] {
  --mantine-color-body: #fdf6e3;
}
```

The `data-theme-variant` attribute always holds the selected variant, even while its scheme is unsupported. The scheme half of the selector is what keeps a dark-only variant's colors off the light scheme, so don't drop it. Two attributes also make the selector more specific than the Panel's own scheme rules, so your values win without `!important`.

Pure Black is built the same way: it lowers the `--mantine-color-dark-*` shades and `--mantine-color-body` under `:root[data-mantine-color-scheme='dark'][data-theme-variant='pure-black']`. If your extension restyles the dark palette globally, check how it looks with Pure Black selected, or [disable variants](#full-themes) if your extension is a complete theme.

### Mantine changes

`mantineTheme` and `cssVariablesResolver` work like `initializeMantineTheme()` and `initializeMantineCssResolver()`, but only while the variant is active:

```ts
themes.addVariant({
  id: 'my-extension-rounded',
  label: 'Rounded',
  schemes: ['light', 'dark'],
  mantineTheme: {
    primaryColor: 'grape',
    defaultRadius: 'xl',
  },
  cssVariablesResolver: (theme) => ({
    variables: {},
    light: {},
    dark: { '--chart-series-1': theme.colors.grape[4] },
  }),
});
```

- `mantineTheme` is merged over the full theme (the Panel's plus every extension's) with Mantine's `mergeThemeOverrides`. Objects merge key by key, but functions, arrays and strings replace the existing value. A `components.Button.styles` function in your variant replaces any `styles` function another extension set for `Button` instead of combining with it, so prefer `defaultProps` and `classNames` keys that nobody else uses.
- `cssVariablesResolver` runs after the extension resolver from `initializeMantineCssResolver()`, and its variables are merged over that resolver's output bucket by bucket. Unlike extension resolvers, the variant resolver never shadows or gets shadowed.

### Entering and exiting

`enter` runs every time the variant becomes active: when the user picks it, on page load when it is already selected, and when the scheme comes back to one it supports. It receives a scope. Every hook registered through the scope is removed again, in reverse order, when the variant stops being active:

```ts
import Button from '@/elements/buttons/Button.tsx';
import Card from '@/elements/data-display/Card.tsx';
import MyCard from './MyCard.tsx';

themes.addVariant({
  id: 'my-extension-retro',
  label: 'Retro',
  schemes: ['dark'],
  enter(scope) {
    scope
      .addPropsInterceptor(Button, (props) => ({
        ...props,
        variant: 'outline',
      }))
      .replaceBaseComponent(Card, MyCard)
      .onExit(() => document.body.classList.remove('my-extension-scanlines'));

    document.body.classList.add('my-extension-scanlines');
  },
});
```

| Scope method                                   | What it does                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `addPropsInterceptor(component, fn)`           | Registers a props interceptor on a [hookable component](#hookable-components).     |
| `addRenderInterceptor(component, fn)`          | Registers a render interceptor.                                                    |
| `replaceBaseComponent(component, replacement)` | Replaces the component's implementation.                                           |
| `replaceIcon(original, replacement)`           | Replaces a Font Awesome icon, see [Icons](./icons.md#replacing-the-panel-s-icons). |
| `onExit(fn)`                                   | Runs `fn` on exit, for anything you set up outside the scope.                      |

All five return the scope, so calls chain. If `enter` throws partway, everything it registered before the error is removed again and the variant falls back to its CSS and Mantine changes.

::: warning
Replacing a base component, or a render interceptor that returns a different element type, remounts that part of the page when the variant is entered or exited. Open modals and unsaved form input inside it are lost. Props interceptors and render interceptors that keep the element type don't remount anything.
:::

### Full themes

Variants assume the Panel's stock look underneath. An extension that restyles the whole Panel, with its own palette, fonts and component styles, usually doesn't hold up with Pure Black or another extension's variant stacked on top. Such an extension can turn variants off:

```ts
class MyTheme extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterThemes((themes) => themes.disableVariants());
  }
}
```

With variants disabled, the menu offers no variants, only Standard applies, and a variant the user had selected before your extension was installed is cleared on the next load. Variants registered by other extensions are hidden too.

Pass `schemes` when your theme only supports one color scheme:

```ts
themes.disableVariants({ schemes: ['light'] });
```

The Panel is then forced into that scheme and the **Theme** entry disappears from the account card menu. A stored dark preference, **Auto** and changes from other tabs no longer switch it. With both schemes allowed, the menu keeps **Auto**, **Dark** and **Light**.

If more than one extension calls `disableVariants`, the allowed schemes are intersected. When nothing is left (one extension allows only light, another only dark), the Panel logs a warning and keeps the schemes from the earlier call.

::: info
The first page load after installing a theme that disables variants may paint one frame with the variant the user had selected before. The stored selection is corrected during that load, so later loads start out right.
:::

## Choosing the Right Layer

| You want to...                                     | Use                                       |
| -------------------------------------------------- | ----------------------------------------- |
| Recolor the Panel, change fonts, radii, spacing    | `initializeMantineTheme()`                |
| Set a default prop on a whole class of component   | Mantine theme `components.X.defaultProps` |
| Retheme charts, or override a CSS variable         | Your extension's `src/app.css`            |
| Force or rewrite props on one component everywhere | `addPropsInterceptor`                     |
| Wrap or conditionally swap a component's output    | `addRenderInterceptor`                    |
| Replace a component's implementation wholesale     | `replaceBaseComponent` (last resort)      |
| Offer an optional look users can switch to         | [Theme variant](#theme-variants)          |
| Ship a complete theme for the whole Panel          | The layers above + `disableVariants()`    |
| Replace a file that has no hookable export or slot | [File overrides](./file-overrides.md)     |

When more than one layer would work, prefer the one higher up the list. It's less coupled to internals.
