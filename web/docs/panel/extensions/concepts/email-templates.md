# Email Templates

Calagopus sends emails for things like password resets, account creation notifications, and SMTP connection tests. Each of those emails is rendered from a **template** - a chunk of HTML with [MiniJinja](https://docs.rs/minijinja) placeholders for variable substitution. By default the Panel ships its own templates baked into the binary, but operators can override them through the admin UI (different brand voice, different language, different layout entirely if they want), and **extensions can register their own templates** so that emails their extension sends are subject to the same override flow as the core ones.

That last part is what this page is about. If your extension sends emails - notification when a backup completes, alerts when a server hits a resource limit, custom welcome flow - you should ship your email content as a template rather than hardcoding the HTML in your Rust code. That way operators can customize it, and your extension fits into the same admin UI everyone already knows how to use.

## What a Template Looks Like

A template is a small Rust struct: an identifier, a list of available variable names, and the default content as a string (typically `include_str!`'d from an HTML file in your extension's source tree). You don't store templates yourself - the Panel manages persistence. You just declare them and the framework handles the override-and-fall-back machinery.

```rs
use shared::extensions::email_templates::EmailTemplate;

EmailTemplate {
    identifier: "dev.0x7d8.test.welcome",
    available_variables: vec!["user", "invite_link"],
    default_content: include_str!("../mails/welcome.html"),
}
```

The three fields, in order:

- **`identifier`** is a `&'static str` that uniquely names this template. It's how your code looks the template up later when sending an email, and it's how the admin UI keys overrides in the database. Identifiers are global across the whole Panel - core templates and every extension share one namespace - so prefix yours with your package name (e.g. `dev.0x7d8.test.welcome`, not just `welcome`) to avoid collisions.

- **`available_variables`** is a `Vec<&'static str>` listing the variables your template can use. This is **metadata for the admin UI** - it shows operators which variables are available to put into the template - not enforcement. The actual rendering uses whatever variables the calling code passes; a typo in an override that references a non-existent variable will just render as nothing rather than error. Keep this list accurate so operators editing the template have something to work from.

- **`default_content`** is the template body, a MiniJinja-formatted HTML string. It's `&'static str` because it's typically `include_str!`'d from a file in your extension at build time. Operators can override it through the admin UI; if no override is set, your default is used.

::: info
Every template implicitly gets a `settings` variable in addition to whatever you declare - it's the Panel's app settings, accessible as `{{ settings.app.name }}`, `{{ settings.app.url }}`, etc. Two things happen automatically: `settings` is appended to your `available_variables` list during finalization (so it shows up in the admin UI even if you didn't list it), and it's injected into the rendering context by `send` / `send_foreground` at send time. You should not pass `settings` yourself in the context - whatever you pass gets overwritten by the framework-provided value anyway.
:::

## Registering Templates

Templates are registered through the `initialize_email_templates` method on your `Extension` trait, which gets handed an `ExtensionEmailTemplateBuilder`:

```rs
use shared::{
    State,
    extensions::{
        Extension,
        email_templates::{EmailTemplate, ExtensionEmailTemplateBuilder},
    },
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize_email_templates(
        &mut self,
        _state: State,
        builder: ExtensionEmailTemplateBuilder,
    ) -> ExtensionEmailTemplateBuilder {
        builder.add_template(EmailTemplate {
            identifier: "dev.0x7d8.test.welcome",
            available_variables: vec!["user", "invite_link"],
            default_content: include_str!("../mails/welcome.html"),
        })
    }
}
```

The builder method is `add_template(template) -> Self`, returning the builder so you can chain multiple registrations. There's no separate "list of all templates" - each call adds one.

::: warning Duplicate identifiers are silently dropped
If you call `add_template` with an identifier that's already registered (by core or by another extension that loaded before yours), the call is a silent no-op - the existing template wins, your call has no effect. There is no error, no log message, no panic. Pick a unique identifier (prefix with your package name) and you'll never hit this.
:::

The directory layout most extensions use looks like this:

```bash
backend/
  mails/
    welcome.html # MiniJinja template, included via include_str!
  src/
    lib.rs # registers the templates in initialize_email_templates
```

Storing the templates as separate `.html` files (rather than inline string literals) keeps the Rust code readable.

## Writing the Template Content

Template content is a [MiniJinja](https://docs.rs/minijinja) template - close to Jinja2 if you've used Python templating, with the same `{{ variable }}` and `{% control %}` syntax. A minimal welcome email might look like:

```html
<p>Hello {{ user.name }},</p>

<p>Your account at {{ settings.app.name }} is ready to go.</p>

<p>
  Click <a href="{{ invite_link }}">here</a> to set a password and log in.
  This link expires in {{ user.invite_expiry_hours }} hours.
</p>
```

`{{ user.name }}` and `{{ user.invite_expiry_hours }}` use field access - MiniJinja can dot-walk into structs that get serialized into the rendering context. The shape of `user` is whatever the sending code passed; if you registered `available_variables: vec!["user"]` and your sender passes `user => some_user_struct`, the template can access any of that struct's serialized fields. `{{ invite_link }}` is a simple string variable; `{{ settings.app.name }}` is the implicit settings variable, accessible without you passing anything.

::: warning Default templates should be in English
The `default_content` you ship with your extension should be written in English, regardless of where you or your users are. Operators who want a different language adjust the template content through the admin UI on a per-deployment basis - the override system is the localization story for emails. Don't try to ship multiple language variants by registering separate identifiers per language; that just creates fragmentation that operators can't sensibly customize.
:::

## Sending an Email Using Your Template

Sending an email is the same pattern the core Panel uses for its own emails - look up the template by identifier, fetch the (possibly-overridden) content, render it with `state.mail.send`:

```rs
use shared::{
    State,
    response::{ApiResponse, ApiResponseResult},
};

async fn send_welcome_email(
    state: &State,
    user: &shared::models::user::User,
    invite_link: &str,
) -> Result<(), anyhow::Error> {
    let settings = state.settings.get().await?;
    let template = state
        .mail
        .templates
        .get_template("dev.0x7d8.test.welcome")?;
    let content = template.get_content(state).await?;

    state
        .mail
        .send(
            user.email.clone(),
            format!("{} - Welcome", settings.app.name).into(),
            content,
            minijinja::context! {
                user => user,
                invite_link => invite_link,
            },
        )
        .await;

    Ok(())
}
```

Note the absence of `?` on the `send` call - `send` returns nothing meaningful at the call site (it spawns a tokio task and any failure is logged from inside the task). If you used `send_foreground` instead, you'd want `.await?` to propagate any send error.

The four arguments to `state.mail.send` / `send_foreground`: recipient address, subject line, the rendered template content, and the MiniJinja context for variable substitution.

A few notes on this pattern:

- **The subject is determined by your code, not the template.** Templates only override the body. If you want a translatable or operator-customizable subject too, that's a separate problem (use the [translations system](./translations.md) for translatable, or a regular extension setting for operator-customizable).
- **`get_content` returns a `Cow<'static, str>`** - if there's no operator override, you get a borrow into your `default_content` (zero-copy); if there is an override, you get an owned `String` from the database. Either way it works as the third argument to `send`.
- **`get_content` is cached for 15 seconds.** A template change made in the admin UI won't be visible to senders for up to that long. This is almost never a problem, but if you're hammering `get_content` in a tight loop, it's good to know.
- **`send` vs `send_foreground` is about who handles failures.** `state.mail.send` returns almost immediately - it grabs the settings cache synchronously and spawns a tokio task to do the actual sending. You won't see SMTP errors, network errors, or template rendering errors at the call site; if any of those happen, they're logged from inside the task and the user is none the wiser. `state.mail.send_foreground` has the same signature but does everything in your async context and propagates errors back through the return type. Use `send` for fire-and-forget notifications (welcome emails, password reset notices) where you don't want the user-facing request to fail just because email is broken; use `send_foreground` when the send result actually matters to your code (e.g. an SMTP connection test, where the whole point is to know whether it worked).

## Overriding Core Templates

You can also modify a template the core Panel ships, rather than registering a new one. The use case here is narrow but real: maybe you ship an extension that customizes a deployment's email branding (say, replacing the default password-reset template with one that matches your customer's brand), and you don't want to make every operator manually paste content into the admin UI.

Use `mutate_template` for this:

```rs
async fn initialize_email_templates(
    &mut self,
    _state: State,
    builder: ExtensionEmailTemplateBuilder,
) -> ExtensionEmailTemplateBuilder {
    builder.mutate_template("password_reset", |template| {
        template.default_content = include_str!("../mails/branded_password_reset.html");
    })
}
```

`mutate_template` finds the template by identifier and runs your closure against it, letting you change the `default_content` (the most common case) or other fields. If no template with that identifier exists, the closure is silently skipped.

The core templates available for mutation, as of this writing, are:

- `account_created` - sent when a new user account is created. Variables: `user`, `reset_link`.
- `password_reset` - sent when a user requests a password reset. Variables: `user`, `reset_link`.
- `connection_test` - sent by the admin SMTP test feature. No variables (other than the implicit `settings`).

::: warning Don't extend `available_variables` on a core template
The variables list reflects what the calling code actually passes when sending. If you add `"server_count"` to the `password_reset` template's variable list but the password-reset code path never passes a `server_count`, operators will see it in the UI as available but every reference to it in their template will render as nothing. If you need extra variables, register your own template under a new identifier instead and use it from your own code.
:::

Mutating core templates is a sharp tool - it changes behavior other parts of the Panel and other extensions depend on. Same general guidance as mutating core permissions or intercepting routes: do it sparingly, document why, and prefer adding your own template alongside the core one when you can.

## What Operators See

The whole point of using the template system rather than hardcoded HTML is that operators get a UI for editing your templates. From the admin panel's "Email Templates" page they can:

- See the list of all registered templates (core and extension-provided), each labeled by its identifier
- See the available variables for each template, so they know what they can reference
- Edit the content, replacing your default with their own customized version
- Reset back to the default at any time

The override is per-template and stored in the Panel's database, so it persists across restarts and is shared across panel instances. Resetting deletes the database row, falling back to your `default_content` immediately.

## Where to Go From Here

Most extensions only need `add_template` and the standard send pattern - the rest of this is for less common cases. If you're shipping a feature that sends email, register a template, write your default HTML in English, and use it. The override flow happens for free.

A few things this page didn't cover that you might want to look into separately:

- **Triggering sends from background tasks.** Nothing about email is route-specific - you can call `state.mail.send` from a `BackgroundTaskBuilder` task or a `ShutdownHandlerBuilder` handler the same way you'd call it from a route. See [Background Tasks and Shutdown Handlers](./background-tasks-and-shutdown-handlers.md).
- **Per-recipient customization beyond the context.** The MiniJinja context is per-call, so for things like "include this user's recent activity in the email," compute the activity, pass it as a variable, and render it in the template. That's standard usage; no special API.
- **Conditionally suppressing sends.** If you want users to opt out of certain emails (or operators to disable specific email types globally), check whatever flag you've set up on the user/settings before calling `send` at all - the email-template system doesn't have a built-in suppression mechanism, but the call sites are your code anyway.
