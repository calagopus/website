# Theming

Most extensions are happy with how the Panel already looks. You slot a card onto a page, register a route, and you inherit the surrounding chrome for free (see [Mounting UI](./mounting-ui.md)). But sometimes you need to change the *look* itself: recolor the whole Panel to match your brand, restyle every `Button` at once, or replace a stock component with your own everywhere it shows up.

There are three layers for this, from broadest to most surgical:

1. **The Mantine theme** - `initializeMantineTheme()` returns a theme override that gets merged across all extensions and applied globally. This is the one you want for colors, fonts, radii, default component props - anything Mantine's theming already models.
2. **CSS variables and Tailwind tokens** - ship your own `app.css` to override the `--mantine-color-*` variables and the Tailwind tokens the Panel defines. This is for the stuff that lives below the Mantine theme object, like chart colors.
3. **Hookable components** - every element in the Panel's component library is *hookable*. You can intercept its props, wrap its rendered output, or replace its implementation entirely, and your change applies everywhere that component is used (core pages included).

Rule of thumb: pick the broadest layer that does the job. Drop down to hookable components only when the theme and CSS layers can't get you there.

## The Mantine Theme

The Panel runs on [Mantine](https://mantine.dev/), and Mantine's theme object is where colors, the primary color, fonts, spacing, radii, and per-component default props all live. Your extension chips in by overriding `initializeMantineTheme()` on your `Extension` class:

```ts
import { Extension, ExtensionContext } from 'shared';
import type { MantineThemeOverride } from '@mantine/core';

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

`initializeMantineTheme()` runs once at load, on every installed extension. The Panel deep-merges each returned override - in installation order - into one object, runs it through Mantine's `createTheme`, and hands it to the top-level `MantineProvider`. So:

- Your override is **merged, not replacing**. You only name what you want to change; everything else keeps its Panel default.
- **Multiple extensions can contribute.** Two extensions setting `primaryColor` is last-writer-wins (later install order wins). Two extensions setting *different* keys both take effect.
- It's a deep merge, so nested stuff like `components.Button.defaultProps` combines key-by-key instead of clobbering the whole `components` map.

::: info
The Panel mounts `MantineProvider` with `defaultColorScheme='dark'`. Most of its own styling is tuned for dark first, with light mode as a supported alternate. If your override touches colors, check both schemes before you ship.
:::

### What goes here

Anything Mantine already models: `colors` (including a custom 10-shade palette), `primaryColor`, `primaryShade`, `fontFamily` / `headings`, `defaultRadius`, `spacing`, `shadows`, and per-component `defaultProps` / `classNames` / `styles`. The full surface is upstream - see Mantine's [theme object](https://mantine.dev/theming/theme-object/) and [styles overview](https://mantine.dev/styles/styles-overview/) - and all of it is fair game inside the object you return.

::: info
Setting a component's `defaultProps` in the theme is usually a cleaner way to restyle a whole class of component than a props interceptor. If all you want is "every `Button` defaults to `variant='light'`", the theme is the simpler tool. Reach for an interceptor only when the change depends on the incoming props.
:::

## The CSS Variables Resolver

The theme object and a static `app.css` sit at two extremes: the theme is fully theme-aware but only reaches what Mantine models, while `app.css` reaches any variable but is static - it can't see your palette or react to it. The resolver is the bridge. `initializeMantineCssResolver()` hands you the resolved theme and lets you compute CSS variables from it, so your values stay in lockstep with the palette, `primaryColor`, and the active color scheme.

Override it on your `Extension` class. Most extensions don't need it, so the default returns `null` (contribute nothing):

```ts
import { Extension, ExtensionContext } from 'shared';
import type { CSSVariablesResolver } from '@mantine/core';

class MyExtension extends Extension {
  public initializeMantineCssResolver(ctx: ExtensionContext): CSSVariablesResolver | null {
    return (theme) => {
      const brand = theme.colors[theme.primaryColor];

      return {
        variables: {},
        dark: {
          '--chart-series-1-border': brand[4],
          '--chart-series-1-fill': brand[8],
        },
        light: {
          '--chart-series-1-border': brand[6],
          '--chart-series-1-fill': brand[2],
        },
      };
    };
  }
}

export default new MyExtension();
```

A resolver returns three buckets:

- **`variables`** - emitted regardless of color scheme.
- **`light`** - emitted under the light scheme only.
- **`dark`** - emitted under the dark scheme only.

The Panel feeds the result into the top-level `MantineProvider`'s `cssVariablesResolver`, which renders the variables into a `<style>` tag scoped by scheme. Because the values come from `theme`, a later extension that changes `primaryColor` in `initializeMantineTheme()` automatically reshades everything your resolver derived from it - no second edit on your side.

### How resolvers combine

Unlike `initializeMantineTheme()`, resolvers are **not merged**. The Panel walks installed extensions in installation order and uses the **first one that returns a non-null resolver** - every extension after it is ignored entirely, buckets and all. There's no per-variable merge: a single resolver wins outright. Returning `null` opts out cleanly and lets the Panel fall through to the next extension.

When that one resolver runs, Mantine calls it with the **already-merged** theme - every extension's `initializeMantineTheme()` override is folded in first - so you derive from the final palette, not your own slice of it.

::: warning
Because only the first non-null resolver is used, two extensions that both ship a resolver don't cooperate - the later one silently contributes nothing. If you need variables that another extension's resolver also sets, you can't rely on merging here; prefer scoping CSS variable overrides to your own surfaces, or set theme-derived values through `initializeMantineTheme()` (which *does* deep-merge) where Mantine models them.
:::

::: info
The resolver sees the merged theme but runs separately from it. If your variable is purely theme-derived and Mantine already models the target (a palette shade, a spacing value), set it in `initializeMantineTheme()` instead - the resolver is for variables Mantine *doesn't* model but that you still want computed from the theme, like the chart colors above.
:::

::: info
Reach for the resolver over `app.css` only when the value has to track the theme. A fixed `--chart-grid-color: #2a2a2a` belongs in `app.css`; a chart series color derived from `theme.colors[theme.primaryColor]` belongs here, so it follows palette changes and both schemes for free.
:::

## CSS Variables and Tailwind Tokens

Below the theme object sits a layer of raw CSS custom properties. The Panel resolves Mantine's theme into `--mantine-color-*` variables on `:root`, scoped by color scheme through the `[data-mantine-color-scheme="dark"]` / `[data-mantine-color-scheme="light"]` attributes. It also defines its own tokens - the font stack, server-status colors, chart colors - in its `app.css`.

Your extension can ship its own `src/app.css`, and the build picks it up automatically and folds it into the final stylesheet. That lets you override variables the theme object doesn't reach. The chart colors are the common case - they're plain CSS vars, not part of the Mantine theme, so this is the only way to retheme them:

```css
/* my-extension/src/app.css */

:root[data-mantine-color-scheme="dark"] {
  --chart-grid-color: #2a2a2a;
  --chart-tick-color: #e5e7eb;
  --chart-series-1-border: #c084fc;
  --chart-series-1-fill: rgba(192, 132, 252, 0.18);
  --chart-series-2-border: #f0abfc;
  --chart-series-2-fill: rgba(240, 171, 252, 0.18);
}

:root[data-mantine-color-scheme="light"] {
  --chart-grid-color: #e5e7eb;
  --chart-tick-color: #374151;
  --chart-series-1-border: #9333ea;
  --chart-series-1-fill: rgba(147, 51, 234, 0.15);
}
```

Same trick works for the app background (`--mantine-color-body`) or any other `--mantine-color-*` variable.

A couple of things to watch:

- **Scheme scoping matters.** These vars are defined separately under the dark and light selectors. Override them under the matching scheme selector (or both) - not bare `:root` - or the more specific scheme rule wins and your value gets ignored.
- **Load order between extensions isn't guaranteed.** If two extensions fight over the same variable, the winner comes down to bundling order, which you don't control. Keep overrides scoped to your own surfaces where you can, and treat global variable overrides as a deliberate "theme extension" thing.
- **Prefer the theme when a value is theme-derived.** Overriding `--mantine-color-grape-7` in CSS works, but if Mantine would normally compute it from your palette, set it in `initializeMantineTheme()` instead so both schemes and all the derived shades stay consistent.

## Hookable Components

Every element in the Panel's component library - `Button`, `Card`, `Modal`, `Spinner`, the inputs, all of it - gets wrapped before it's exported. Instead of exporting the bare component, each module does:

```ts
export default makeComponentHookable(Button);
```

`makeComponentHookable` returns a thin wrapper that's a **process-wide singleton**. Importing `@/elements/Button.tsx` from anywhere - core code or your extension - gives you the *same* wrapper instance. It exposes three methods, and because the instance is shared, registering a hook changes every render of that component across the whole Panel:

```ts
Button.addPropsInterceptor((props) => props); // transform incoming props
Button.addRenderInterceptor((element, props) => element); // wrap/replace the output
Button.replaceBaseComponent(MyButton); // swap the implementation entirely
```

### Where to register hooks

Register hooks in your extension's `initialize()`. It runs once, before React renders anything, so the interceptors are in place before the first paint and apply uniformly from the very first render:

```ts
import { Extension, ExtensionContext } from 'shared';
import Button from '@/elements/Button.tsx';

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
Don't register hooks from inside a React component - not in a render body, an effect, or an event handler. The interceptor arrays are append-only with no dedupe, so registering on every render or click stacks duplicate hooks forever and will eventually misbehave. `initialize()` is the one right place.
:::

### `addPropsInterceptor` - transform props before render

The interceptor gets the props the component was called with and returns the props it should actually render with. Use it to force, default, or rewrite props everywhere a component is used:

```ts
Button.addPropsInterceptor((props) => ({
  ...props,
  // push every non-destructive button to our brand variant,
  // but leave red (destructive) buttons alone
  variant: props.color === 'red' ? props.variant : 'gradient',
}));
```

Interceptors run in registration order, each getting the previous one's output, so multiple extensions (and multiple hooks from the same extension) compose. Always spread the incoming props and return a superset - returning a fresh object that drops fields breaks the component for every caller, core included.

### `addRenderInterceptor` - wrap or replace the output

Where a props interceptor changes *what the component renders with*, a render interceptor changes *what comes out*. It gets the already-created React element plus the (post-props-interceptor) props, and returns the element to actually render. Good for wrapping the component in extra markup, or swapping it out conditionally:

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

### `replaceBaseComponent` - swap the implementation

The blunt one. `replaceBaseComponent` swaps out the underlying component the wrapper renders, leaving the singleton wrapper (and any interceptors already registered on it) in place. Every import site now renders your version instead of the Panel's:

```tsx
import Button, { type ButtonProps } from '@/elements/Button.tsx';

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
- **You own it now.** When the Panel evolves its `Button`, your replacement won't follow along - that maintenance is yours.
- **Last replacement wins.** If two extensions both `replaceBaseComponent` the same component, only the last one in install order survives. Nothing merges.

Replace a base component only when intercepting props or wrapping the render genuinely can't get you there. For most "make it look different" goals, the theme, a props interceptor, or a render interceptor is the safer bet.
:::

### Compound and sub-components

Some elements ship sub-components, and each is independently hookable. `Spinner` carries `Spinner.Centered` and `Spinner.Suspense`, for instance, and `Modal` is exported alongside `ModalFooter`. Each is its own hookable wrapper, so hook them separately:

```ts
import Spinner from '@/elements/Spinner.tsx';

Spinner.Centered.addPropsInterceptor((props) => ({ ...props, size: 48 }));
```

Hooking the parent (`Spinner`) doesn't hook the children (`Spinner.Centered`), and vice versa - they're distinct singletons.

### Caveats for all three

- **Everything is global.** There's no per-page or per-extension scoping. A hook on `Button` changes the Panel's own buttons too. That's the whole point of the system, but it means a careless interceptor has a big blast radius.
- **Order is install order**, which you don't control. Don't write hooks that assume they run first or last.
- **Keep interceptors pure and cheap.** They run on every render of a heavily-used component. No expensive work, no side effects.

## Choosing the Right Layer

| You want to... | Use |
| -------------- | --- |
| Recolor the Panel, change fonts, radii, spacing | `initializeMantineTheme()` |
| Set a default prop on a whole class of component | Mantine theme `components.X.defaultProps` |
| Retheme charts, or override a CSS variable | Your extension's `src/app.css` |
| Force or rewrite props on one component everywhere | `addPropsInterceptor` |
| Wrap or conditionally swap a component's output | `addRenderInterceptor` |
| Replace a component's implementation wholesale | `replaceBaseComponent` (last resort) |

When more than one layer would work, prefer the one higher up the list - it's less coupled to internals and less likely to surprise anyone.
