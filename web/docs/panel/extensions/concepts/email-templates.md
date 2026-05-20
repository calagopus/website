# Email Templates

Calagopus sends emails for things like password resets, account creation notifications, and SMTP connection tests. Each of those emails is rendered from a **template** - a chunk of HTML with [MiniJinja](https://docs.rs/minijinja) placeholders for variable substitution. By default the Panel ships its own templates baked into the binary, but operators can override them through the admin UI (different brand voice, different language, different layout entirely if they want), and **extensions can register their own templates** so that emails their extension sends are subject to the same override flow as the core ones.

That last part is what this page is about. If your extension sends emails - notification when a backup completes, alerts when a server hits a resource limit, custom welcome flow - you should ship your email content as a template rather than hardcoding the HTML in your Rust code. That way operators can customize it, and your extension fits into the same admin UI everyone already knows how to use.

## What a Template Looks Like

A template is a small Rust struct: an identifier, a list of available variable names, a default subject line, the default body content as a string (typically `include_str!`'d from an HTML file in your extension's source tree), and whether the template is enabled by default. You don't store templates yourself - the Panel manages persistence. You just declare them and the framework handles the override-and-fall-back machinery.

```rs
use shared::extensions::email_templates::EmailTemplate;

EmailTemplate {
    identifier: "dev.0x7d8.test.welcome",
    available_variables: vec!["user", "invite_link"],
    default_subject: "{{ settings.app.name }} - Welcome",
    default_content: include_str!("../mails/welcome.html"),
    default_enabled: true,
}
```

The five fields, in order:

- **`identifier`** is a `&'static str` that uniquely names this template. It's how your code looks the template up later when sending an email, and it's how the admin UI keys overrides in the database. Identifiers are global across the whole Panel - core templates and every extension share one namespace - so prefix yours with your package name (e.g. `dev.0x7d8.test.welcome`, not just `welcome`) to avoid collisions.

- **`available_variables`** is a `Vec<&'static str>` listing the variables your template can use. This is **metadata for the admin UI** - it shows operators which variables are available to put into the template - not enforcement. The actual rendering uses whatever variables the calling code passes; a typo in an override that references a non-existent variable will just render as nothing rather than error. Keep this list accurate so operators editing the template have something to work from.

- **`default_subject`** is the email subject line, as a MiniJinja template string. It supports the same `{{ variable }}` syntax as the body - `{{ settings.app.name }}` works here just as it does in the body content. Operators can override the subject through the admin UI independently of the body.

- **`default_content`** is the template body, a MiniJinja-formatted HTML string. It's `&'static str` because it's typically `include_str!`'d from a file in your extension at build time. Operators can override it through the admin UI; if no override is set, your default is used.

- **`default_enabled`** controls whether the template is enabled out of the box. If `false`, `send_template` and `send_template_foreground` silently skip sending when no operator override is in place. Use this for opt-in notifications (e.g. "server installed" alerts) where most operators probably don't want the email unless they actively turn it on.

::: info
Every template implicitly gets a `settings` variable in addition to whatever you declare - it's the Panel's app settings, accessible as `{{ settings.app.name }}`, `{{ settings.app.url }}`, etc. Two things happen automatically: `settings` is appended to your `available_variables` list during finalization (so it shows up in the admin UI even if you didn't list it), and it's injected into the rendering context by `send_template` / `send_template_foreground` at send time. You should not pass `settings` yourself in the context - whatever you pass gets overwritten by the framework-provided value anyway.
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
            default_subject: "{{ settings.app.name }} - Welcome",
            default_content: include_str!("../mails/welcome.html"),
            default_enabled: true,
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

Sending an email uses `state.mail.send_template` (fire-and-forget) or `state.mail.send_template_foreground` (awaits and propagates errors). Both methods look up the template, check whether it's enabled, resolve the subject and body (applying any operator overrides), and then send:

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
    state
        .mail
        .send_template(
            state,
            "dev.0x7d8.test.welcome",
            user.email.clone(),
            minijinja::context! {
                user => user,
                invite_link => invite_link,
            },
        )
        .await;

    Ok(())
}
```

Note the absence of `?` on the `send_template` call - it returns nothing meaningful (it spawns a tokio task and any failure is logged from inside the task). If you use `send_template_foreground` instead, you'd propagate errors with `.await?`.

The four arguments to `send_template` / `send_template_foreground`: the `State`, the template identifier, the recipient address, and the MiniJinja context for variable substitution.

A few notes on this pattern:

- **The subject comes from the template, not your code.** Both the subject and body are stored in the template and can be overridden by operators. The subject is itself a MiniJinja template string, so `{{ settings.app.name }}` and other variables work there too.
- **If the template is disabled, the send is silently skipped.** `send_template` returns immediately with no error; `send_template_foreground` returns `Ok(())`. A `tracing::debug` message is emitted so you can see it in logs. Check `default_enabled` on your template definition if you're wondering why emails aren't sending.
- **The 15-second cache still applies.** Template content and the enabled/disabled state are cached from the database for 15 seconds. A change made in the admin UI won't be visible to senders for up to that long.
- **`send_template` vs `send_template_foreground` is about who handles failures.** `send_template` returns almost immediately and spawns a tokio task for the actual send - SMTP errors, network errors, and rendering errors are logged from inside the task and the user-facing request is unaffected. `send_template_foreground` does everything in your async context and propagates errors back. Use `send_template` for fire-and-forget notifications; use `send_template_foreground` when the send result actually matters to your code (e.g. an SMTP connection test, where the whole point is to know whether it worked).

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
        template.default_subject = "Password Reset - My Brand";
        template.default_content = include_str!("../mails/branded_password_reset.html");
    })
}
```

`mutate_template` finds the template by identifier and runs your closure against it, letting you change any field - `default_content` (the most common case), `default_subject`, or `default_enabled`. If no template with that identifier exists, the closure is silently skipped.

The core templates available for mutation, as of this writing, are:

- `account_created` - sent when a new user account is created. Variables: `user`, `reset_link`.
- `password_reset` - sent when a user requests a password reset. Variables: `user`, `reset_link`.
- `connection_test` - sent by the admin SMTP test feature. No variables (other than the implicit `settings`).
- `added_to_server` - sent when a user is added as a subuser to a server. Variables: `user`, `server_link`.
- `removed_from_server` - sent when a user is removed as a subuser from a server. Variables: `user`.
- `server_installed` - sent when a server finishes installing. Variables: `user`, `server_link`. Disabled by default.
- `server_restored` - sent when a server backup is restored. Variables: `user`, `server_link`. Disabled by default.

::: warning Don't extend `available_variables` on a core template
The variables list reflects what the calling code actually passes when sending. If you add `"server_count"` to the `password_reset` template's variable list but the password-reset code path never passes a `server_count`, operators will see it in the UI as available but every reference to it in their template will render as nothing. If you need extra variables, register your own template under a new identifier instead and use it from your own code.
:::

Mutating core templates is a sharp tool - it changes behavior other parts of the Panel and other extensions depend on. Same general guidance as mutating core permissions or intercepting routes: do it sparingly, document why, and prefer adding your own template alongside the core one when you can.

## What Operators See

The whole point of using the template system rather than hardcoded HTML is that operators get a UI for editing your templates. From the admin panel's "Email Templates" page they can:

- See the list of all registered templates (core and extension-provided), each labeled by its identifier
- See the available variables for each template, so they know what they can reference
- Toggle a template on or off (independently of the default) - disabled templates are silently skipped at send time
- Edit the subject line, replacing your default with their own customized version (the subject supports the same MiniJinja syntax as the body)
- Edit the body content, replacing your default with their own customized version
- Reset the subject and/or content back to the default at any time

Overrides are per-template and stored in the Panel's database, so they persist across restarts and are shared across panel instances. Resetting deletes the database row for that field, falling back to your `default_subject` / `default_content` immediately.

## Where to Go From Here

Most extensions only need `add_template` and `send_template` - the rest of this is for less common cases. If you're shipping a feature that sends email, register a template, write your default HTML and subject in English, and use it. The override flow happens for free.

A few things this page didn't cover that you might want to look into separately:

- **Triggering sends from background tasks.** Nothing about email is route-specific - you can call `state.mail.send_template` from a `BackgroundTaskBuilder` task or a `ShutdownHandlerBuilder` handler the same way you'd call it from a route. See [Background Tasks and Shutdown Handlers](./background-tasks-and-shutdown-handlers.md).
- **Per-recipient customization beyond the context.** The MiniJinja context is per-call, so for things like "include this user's recent activity in the email," compute the activity, pass it as a variable, and render it in the template. That's standard usage; no special API.
- **Conditionally suppressing sends.** If you want users to opt out of certain emails (or operators to disable specific email types globally), the `default_enabled` field and the operator-facing enabled toggle handle the operator-global case. For per-user opt-out, check whatever flag you've set up on the user before calling `send_template` - the email-template system doesn't have a built-in per-user suppression mechanism, but the call sites are your code anyway.
