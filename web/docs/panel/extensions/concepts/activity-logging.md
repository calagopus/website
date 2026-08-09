# Activity Logging

Let's say you just shipped an admin endpoint that lets operators update a critical setting, or a server endpoint that nukes a user's files. Great. Now imagine six months later someone goes "who the hell deleted my world folder" and you have absolutely no way to answer. Awkward. This is why every mutation in the Panel ends with an activity log entry, and it's why your extension should do the same.

The good news is that logging is basically free - you extract a logger from your route handler, call `.log(...).await`, and the Panel handles the rest. IP, user agent, timestamp, and who did it are all captured automatically, so your payload only has to describe *what* happened.

## The Three Loggers

There are three logger extractors, one per activity scope. Pick the one that matches the router you're in - if you're in an admin route use the admin logger, if you're in a server route use the server logger, etc. Mixing them across router types doesn't really make sense.

| Logger | Import from | Shows up in | Use from |
| ------ | ----------- | ----------- | -------- |
| `GetAdminActivityLogger` | `shared::models::admin_activity` | Panel-wide admin audit log | `add_admin_api_router` routes |
| `GetServerActivityLogger` | `shared::models::server` | The server's activity tab | `add_client_server_api_router` routes |
| `GetUserActivityLogger` | `shared::models::user_activity` | The user's account activity page | `add_client_api_router` routes |

All three have the same `.log(event_name, payload).await` signature, so once you've used one you've used all of them. The only thing that changes is *who sees the entry*.

## Logging an Event

Here's the pattern, using the admin logger as an example:

```rs
use shared::{
    GetState,
    models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
    response::{ApiResponse, ApiResponseResult},
};

#[utoipa::path(put, path = "/", responses(
    (status = OK, body = inline(Response)),
), request_body = inline(Payload))]
pub async fn route(
    state: GetState,
    permissions: GetPermissionManager,
    activity_logger: GetAdminActivityLogger,
    shared::Payload(data): shared::Payload<Payload>,
) -> ApiResponseResult {
    permissions.has_admin_permission("extensions.configure")?;

    // ... do the actual work

    activity_logger
        .log(
            "settings:extensions:update",
            serde_json::json!({
                "extension": "dev.yourname.test",
                "changed_fields": ["api_url", "enable_feature"],
            }),
        )
        .await;

    ApiResponse::new_serialized(Response {}).ok()
}
```

The two arguments are the event name and the JSON payload. That's it. Swap `GetAdminActivityLogger` for `GetServerActivityLogger` or `GetUserActivityLogger` and the call looks exactly the same - only the extractor type changes.

## Event Names

The Panel uses a specific convention for event names, and your extension should match it for consistency with the rest of the audit log:

- **Colons separate scopes**, narrowing from broadest to most specific.
- **Dots separate the sub-action** at the end.

So `server:version.install` reads as "in the server scope, under version, the install sub-action was performed". `settings:extensions:update` reads as "in the settings scope, under extensions, update". The rule of thumb: colons are namespacing, dots are verbs.

Some examples of well-formed event names:

| Event name | What it represents |
| ---------- | ------------------ |
| `settings:extensions:update` | Extension settings were updated in the admin panel |
| `server:version.install` | A server had a new version installed |
| `server:backup.create` | A backup was created for a server |
| `user:apikey.revoke` | A user revoked one of their API keys |

If you're adding a new event type, try to fit it into an existing scope rather than inventing a new top-level one - users scanning the audit log will have a much easier time filtering `server:*` than trying to remember that your extension uses `minecraftstuff:*`. When in doubt, prefix with the resource you're acting on (`server`, `node`, `settings`, `user`) and let the sub-action carry the extension-specific meaning.

## Payloads

The second argument is any `serde_json::Value` (or anything that serializes into one). It shows up in the audit UI as structured data that admins can inspect when investigating an event.

A good payload answers the question "if I saw this log entry with no other context, would I understand what happened?" Include the IDs of anything that was touched, any before/after values that matter, and any decision points the code took. Don't include things that are already captured automatically - IP address, user agent, timestamp, and the acting user's ID are all added for you by the Panel.

```rs
// Good: tells you what changed and on which resource
activity_logger
    .log(
        "server:backup.create",
        serde_json::json!({
            "backup_id": backup.uuid,
            "name": backup.name,
            "size_bytes": backup.size,
            "locked": backup.locked,
        }),
    )
    .await;

// Bad: tells you nothing you couldn't already tell from the event name
activity_logger
    .log("server:backup.create", serde_json::json!({}))
    .await;

// Also bad: duplicates automatic fields
activity_logger
    .log(
        "server:backup.create",
        serde_json::json!({
            "user_id": user.id, // already captured
            "timestamp": chrono::Utc::now(), // already captured
            "backup_id": backup.uuid, // this one is actually useful
        }),
    )
    .await;
```

::: info
An empty payload `serde_json::json!({})` is valid and won't break anything - it's fine for events where the event name genuinely says everything (e.g. `session.logout`). But most of the time there's *something* worth capturing, and you'll thank yourself later for including it.
:::

## When to Log

As a rule of thumb, log anything that:

- **Mutates persistent state** - database writes, file changes, external API calls that create or modify something.
- **Has security implications** - permission changes, credential updates, admin actions.
- **Would be useful to an operator debugging later** - installs, migrations, one-shot maintenance actions.

You generally don't need to log pure reads (`GET` handlers), idempotent no-ops, or user-facing toggles that only affect the user themselves and have no security impact (e.g. a UI theme preference). When in doubt, lean toward logging - a slightly noisy audit log is a lot more useful than a quiet one when something goes wrong.

## Logging from Helper Functions

The activity logger is an axum extractor, which means it's only available inside route handlers. If the code that actually does the work lives in a helper module, you have two options:

1. **Pass the logger down.** The logger is cheap to clone, so you can just take it as an argument to your helper function. This is the cleanest approach and makes the dependency obvious.

2. **Return the data to log, and log in the handler.** Have your helper return enough information for the handler to build the payload, then call `.log(...)` at the top level. This keeps helpers agnostic of the logging system.

Option 2 is usually nicer - logging is a presentation concern, and keeping it out of your business logic means those helpers are easier to test and reuse from contexts that aren't HTTP handlers (like background jobs or CLI commands).
