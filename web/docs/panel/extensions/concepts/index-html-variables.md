---
title: Index HTML Variables
description: Render values from your backend extension into the Panel's index.html, readable before any request is made, and allow third-party sources in its content security policy.
---

# Index HTML Variables

Some values are needed before your frontend has made a single request, like a brand color for the boot screen or a feature flag that changes the first render. Fetching them from a route costs a loading state and a round trip on every page load. Your backend extension can put them into the `index.html` the Panel serves instead, and your frontend reads them synchronously.

::: warning
`index.html` is served to everyone, including visitors who are not logged in. Never put secrets, tokens or anything user-specific into an index variable.
:::

## Registering Variables

Variables are registered through the `initialize_index_html` method on your `Extension` trait, which gets handed an `IndexHtmlBuilder`:

```rs
use shared::{
    State,
    extensions::{Extension, index_html::IndexHtmlBuilder},
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize_index_html(
        &mut self,
        state: State,
        builder: IndexHtmlBuilder,
    ) -> IndexHtmlBuilder {
        builder
            .add_variable("accent_color", |settings| {
                let settings = settings.get_extension_settings::<MySettings>("dev.0x7d8.test")?;

                Ok(serde_json::json!(settings.accent_color))
            })
            .add_variable("docs_url", |_| Ok(serde_json::json!("https://example.com/docs")));

        builder
    }
}
```

Each variable is a name and a function that receives the Panel's `AppSettings` and returns any `serde_json::Value`. Variables are namespaced by your package name, so two extensions can both register `accent_color` without clashing.

The function runs every time `index.html` is rendered: at startup, after every settings save, and whenever an instance reloads its settings cache (at most a minute after a save on another instance). A variable can therefore follow your extension's settings without a restart.

Because it runs while the settings writer slot is held, keep the function cheap and avoid network calls or database queries. Read settings from the `settings` argument. Calling `state.settings.get()` inside the function can deadlock.

If the function returns an `Err` or panics, the Panel logs the error and renders the page without that variable. Registering the same name twice replaces the earlier function and logs a warning.

## Reading Variables in the Frontend

On your frontend `Extension` class, `getIndexVariable` reads one of your own variables:

```ts
class Dev0x7d8TestExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    const accentColor = this.getIndexVariable<string>('accent_color');
  }
}
```

It returns `undefined` when the variable is missing, for example because its function failed. The values ship with the page, so you can call it from `initialize` or anywhere before the first render.

To read a variable another extension registered, use the context with that extension's package name:

```ts
const value = ctx.getIndexVariable<string>('dev.0x7d8.other', 'some_variable');
```

The values are rendered into a `<script type="application/json" id="extension-variables">` block in the page head. The block holds JSON data and never runs, because the Panel's content security policy blocks inline scripts.

## Using Variables in the Boot Screen

If your extension provides [`src/boot.html`](../file-structure.md#src-boot-html), the boot screen can use your variables too, before any JavaScript has loaded:

```html
<div class="my-boot-screen" style="color: {{ variables.accent_color }}">Loading...</div>
```

`boot.html` is rendered as a [MiniJinja](https://docs.rs/minijinja) template. The only thing it can see is `variables`, which holds your own extension's variables, and values are HTML-escaped. If the template fails to render, for example because of a syntax error, the Panel logs the error and shows the default spinner.

::: info
In development (`pnpm dev`) the dev server serves the boot screen, and it only substitutes plain <code v-pre>{{ variables.name }}</code> placeholders using values from the running backend. Tags like <code v-pre>{% if %}</code> show up as written until you build.

The dev server also copies the variables block from the running backend's `index.html` (port `BACKEND_PORT`, 8000 by default) into every page it serves, so `getIndexVariable` works in development too. If the backend isn't reachable, the dev server logs a warning and the variables are missing.
:::

## Allowing Third-Party Sources

The Panel serves `index.html` with a strict `Content-Security-Policy`. Scripts, styles, fonts and media only load from the Panel itself, plus whatever the configured captcha provider needs. If your extension embeds a third-party widget like a live chat or an analytics script, add its origin to the policy from the same `initialize_index_html` method:

```rs
use shared::extensions::index_html::{CspDirective, IndexHtmlBuilder};

async fn initialize_index_html(
    &mut self,
    _state: State,
    builder: IndexHtmlBuilder,
) -> IndexHtmlBuilder {
    builder
        .add_csp_source(CspDirective::ScriptSrc, "https://client.crisp.chat")
        .add_csp_source(CspDirective::StyleSrc, "https://client.crisp.chat")
        .add_csp_sources(CspDirective::ScriptSrc, |settings| {
            let settings = settings.get_extension_settings::<MySettings>("dev.0x7d8.test")?;

            Ok(settings.analytics_url.iter().cloned().collect())
        });

    builder
}
```

`add_csp_source` adds one fixed source. `add_csp_sources` takes a function that returns a list, which helps when the source comes from your extension's settings, like the URL of a self-hosted analytics instance. That function runs on the same schedule as variable functions and follows the same rules: keep it cheap, read from the `settings` argument, and if it returns an `Err` or panics, its sources are left out of that render.

Your sources are merged with the Panel's own and the captcha provider's, and duplicates are removed. Removing a source from your extension or disabling the extension removes it from the policy on the next start.

| Directive                  | Panel default            |
| -------------------------- | ------------------------ |
| `CspDirective::ScriptSrc`  | `'self' blob:`           |
| `CspDirective::StyleSrc`   | `'self' 'unsafe-inline'` |
| `CspDirective::FontSrc`    | `'self' blob: data:`     |
| `CspDirective::MediaSrc`   | `'self' blob: data:`     |
| `CspDirective::FormAction` | `'self'`                 |
| `CspDirective::ConnectSrc` | `* blob:`                |
| `CspDirective::FrameSrc`   | `*`                      |
| `CspDirective::ImgSrc`     | `* blob: data:`          |

`connect-src`, `frame-src` and `img-src` allow everything today, so adding to them changes nothing yet. Declare what you load there anyway. If the Panel tightens those defaults later, extensions that declared their sources keep working.

Each source must be a single CSP source expression: a host like `https://*.example.com`, a scheme like `wss:`, or a quoted keyword. The Panel logs and drops sources that would break it:

- Anything with whitespace, `;` or `,` in it, since that would inject another directive.
- `'unsafe-inline'` in `script-src`. Browsers ignore it as soon as a nonce is present, and the Cap captcha provider adds one, so it would only work with some captcha providers. Use a `'sha256-...'` hash of the inline script instead.
- Hashes and nonces in `style-src`. Either one makes browsers ignore `'unsafe-inline'`, which the Panel's own styles rely on.
- `'none'`, `'strict-dynamic'` and fixed nonces.
- Sources past a total policy length of 3 KiB. Larger response headers overflow the default proxy buffer in Nginx and turn into a 502.

`'unsafe-eval'`, `*` and bare schemes like `https:` in `script-src` are accepted, but the Panel logs a warning once, because each of them lets almost any script run.

::: info
The development server doesn't send a content security policy, so a missing source only shows up against a built Panel. Check the browser console there for `Content-Security-Policy` violations before you release.
:::
