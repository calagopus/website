---
title: Activity Logging
description: Write audit log entries from your extension so operators can see who did what, using the same activity system the Panel uses.
---

# Activity Logging

Every mutation in the Panel writes an activity log entry, so that months later someone can find out who deleted a world folder or changed a setting. Your extension's endpoints should do the same.

Logging takes one call: extract a logger in your route handler and call `.log(...).await`. IP, timestamp, and who did it (including the impersonating admin or the API key, when either applies) are all captured automatically, so your payload only has to describe *what* happened.

## The Three Loggers

There are three logger extractors, one per activity scope. Use the one that matches your router: the admin logger in admin routes, the server logger in server routes, and so on.

| Logger | Import from | Shows up in | Use from |
| ------ | ----------- | ----------- | -------- |
| `GetAdminActivityLogger` | `shared::models::admin_activity` | Panel-wide admin audit log | `add_admin_api_router` routes |
| `GetServerActivityLogger` | `shared::models::server` | The server's activity tab | `add_client_server_api_router` routes |
| `GetUserActivityLogger` | `shared::models::user_activity` | The user's account activity page | `add_client_api_router` routes |

All three have the same `.log(event_name, payload).await` signature, so once you've used one you've used all of them. The only thing that changes is *who sees the entry*. `log` returns nothing: a database failure is logged as a warning and swallowed, so there is no `?` to add and no way for a broken audit write to fail the request. The server logger also drops the entry when the actor is an admin who is neither the owner nor a subuser of that server, unless the operator turned on the "log admin activity" setting under the activity settings.

## Logging an Event

Using the admin logger as an example:

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
    permissions.has_admin_permission("extensions.manage")?;

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

The two arguments are the event name and the JSON payload. Swap `GetAdminActivityLogger` for `GetServerActivityLogger` or `GetUserActivityLogger` and the call stays the same; only the extractor type changes.

## Event Names

Event names follow a convention; match it so your entries fit the rest of the audit log:

- **Colons separate scopes**, narrowing from broadest to most specific.
- **Dots separate the sub-action** at the end.

So `server:version.install` reads as "in the server scope, under version, the install sub-action was performed". `settings:extensions:update` reads as "in the settings scope, under extensions, update". Colons separate namespaces, dots separate actions.

Some examples of well-formed event names:

| Event name | What it represents |
| ---------- | ------------------ |
| `settings:extensions:update` | Extension settings were updated in the admin panel |
| `server:version.install` | A server had a new version installed |
| `server:backup.create` | A backup was created for a server |
| `user:api-key.update` | A user changed one of their API keys |

If you're adding a new event type, fit it into an existing scope instead of inventing a new top-level one. Filtering by `server:*` is easier for users than remembering that your extension uses `minecraftstuff:*`. When in doubt, prefix with the resource you're acting on (`server`, `node`, `settings`, `user`) and let the sub-action carry the extension-specific meaning.

## Payloads

The second argument is any `serde_json::Value` (or anything that serializes into one). It shows up in the audit UI as structured data that admins can inspect when investigating an event.

A good payload answers the question "if I saw this log entry with no other context, would I understand what happened?" Include the IDs of anything that was touched, any before/after values that matter, and any decision points the code took. Don't include what is captured automatically: the Panel adds the IP address, timestamp and acting user's ID. The user agent is not recorded anywhere, so if it matters for your event, put it in the payload yourself.

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
An empty payload `serde_json::json!({})` is valid for events where the name says everything (such as `session.logout`). Most events have *something* worth capturing, though.
:::

## When to Log

Log anything that:

- **Mutates persistent state**: database writes, file changes, external API calls that create or modify something.
- **Has security implications**: permission changes, credential updates, admin actions.
- **Would help an operator debugging later**: installs, migrations, one-off maintenance actions.

You generally don't need to log pure reads (`GET` handlers), idempotent no-ops, or user-facing toggles that only affect the user themselves and have no security impact (e.g. a UI theme preference). When in doubt, log it; a slightly noisy audit log is more useful than an empty one when something goes wrong.

## Logging from Helper Functions

The activity logger is an axum extractor, which means it's only available inside route handlers, and it is a consuming one: a handler can extract each logger type once, a second extraction of the same type fails the request. If the code that actually does the work lives in a helper module, you have two options:

1. **Pass the logger down.** The logger is a plain struct with public fields that is cheap to clone, so you can take it as an argument to your helper function, which makes the dependency obvious. A background job that has no request can build one by hand from the same fields.

2. **Return the data to log, and log in the handler.** Have your helper return enough information for the handler to build the payload, then call `.log(...)` at the top level. This keeps helpers agnostic of the logging system.

Option 2 is usually better: keeping logging out of your business logic makes those helpers easier to test and reuse from contexts that aren't HTTP handlers (like background jobs or CLI commands).
