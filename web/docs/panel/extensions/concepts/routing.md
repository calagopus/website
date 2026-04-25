# Routing

Okay so you have an extension, cool. But unless you want it to sit there looking pretty, you probably want the frontend to actually talk to the backend at some point. Maybe you want to expose a list of servers, let an admin update a setting, or just return a cheeky "hello world". This is where routing comes in, and Calagopus makes it pretty painless - you register your routes through an `ExtensionRouteBuilder` in your `lib.rs`, and then the Panel mounts them onto the main app for you. No plumbing, no middleware wiring, no authentication code to write. Nice.

Under the hood, routes are just [axum](https://docs.rs/axum) routes wrapped in [utoipa_axum](https://docs.rs/utoipa-axum) so that they automatically show up in the Panel's OpenAPI docs. If you've written axum code before, you already know 90% of this.

## The Router Types

The `ExtensionRouteBuilder` exposes seven different routers, each mounted at a different base path with different authentication and extractor behavior. You pick the one(s) you need, the rest just don't get registered.

| Builder method | Mount point | Auth | Typical use |
| -------------- | ----------- | ---- | ----------- |
| `add_global_router` | `/` | None | Public endpoints, webhooks, health checks |
| `add_auth_api_router` | `/api/auth` | None | Custom auth flows (OAuth callbacks, SSO) |
| `add_admin_api_router` | `/api/admin` | User session + Permission check | Admin-only endpoints, settings, statistics |
| `add_client_api_router` | `/api/client` | User session | User-scoped endpoints that aren't tied to a server |
| `add_client_server_api_router` | `/api/client/servers/{server}` | User session + server access check | The most common one - anything a user does to one of their servers |
| `add_remote_api_router` | `/api/remote` | Node token | Endpoints called by Wings nodes |
| `add_remote_server_api_router` | `/api/remote/servers/{server}` | Node token + server scope | Endpoints called by Wings about a specific server |

The important thing to understand is that **authentication and permission middleware is already applied by the parent router** for every method except `add_global_router` and `add_auth_api_router`. You don't write auth code, you just check specific permissions inside your handler (more on that further down).

All seven methods return `Self`, so you can chain as many as you like. Calling the same method twice is additive - the second call receives the router you built in the first, so you can split registration across files if your extension grows.

## Registering Routes

Routes are registered by implementing the `initialize_router` method on your `Extension` trait. Here's a minimal example that registers one admin endpoint and one server-scoped endpoint:

```rs
use shared::{
    State,
    extensions::{Extension, ExtensionRouteBuilder},
};

mod routes;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize_router(
        &mut self,
        state: State,
        builder: ExtensionRouteBuilder,
    ) -> ExtensionRouteBuilder {
        builder
            .add_admin_api_router(|routes| {
                routes.nest(
                    "/extensions/dev.yourname.test",
                    routes::admin::router(&state),
                )
            })
            .add_client_server_api_router(|routes| {
                routes.nest("/my-feature", routes::server::router(&state))
            })
    }
}
```

A couple of things to notice. First, **always make sure your routes do not collide with other extensions or the panel itself**. The Panel doesn't do anything to prevent collisions, so if two extensions both register a route at `/api/client/servers/{server}/foo`, utoipa will panic on startup and the process exits. That's a pretty hard failure mode, so just be considerate and pick paths that are unlikely to clash. Calling your routes `/config` is really just asking for trouble, but `/extensions/dev.yourname.test/config` is perfectly reasonable.

How pretty those paths need to be is up to you and depends on who's going to call them. For an admin API that only your extension's own frontend talks to, a namespace like `/extensions/dev.yourname.test/settings` is fine - it's ugly, but it's guaranteed not to collide, and nobody's typing it by hand. For a client API that end users might call with their API key, a cleaner path like `/my-feature` makes for a much nicer public surface. Both are valid choices, pick the one that fits your use case.

Second, each builder method takes a closure that receives an `OpenApiRouter<State>` and returns one. You use standard axum router methods on it - `.nest(...)`, `.route(...)`, `.merge(...)`, whatever. There's no magic.

## The File-System Convention

Before we look at an actual route handler, a quick word on how to organize your files. This isn't enforced by the framework - you *could* put every route in `lib.rs` - but following the convention makes your extension way easier to navigate, and matches how the core Panel is laid out.

The idea is simple: **your file tree should mirror your URL tree**. For an example extension that registers routes at `/api/client/servers/{server}/my-feature/...` and `/api/admin/extensions/dev.yourname.test/...`, the backend would look like this:

```bash
backend/src/
  lib.rs # registers the routers, nests into routes::admin and routes::server
  routes/
    mod.rs # just `pub mod admin; pub mod server;`
    admin/
      mod.rs # nests settings, statistics
      settings.rs # GET and PUT on /settings
      statistics/
        mod.rs # nests total
        total.rs # GET on /statistics/total
    server/
      mod.rs # nests items
      items/
        mod.rs # nests /{item}, also has its own GET on /items
        _item_/
          mod.rs # nests /{variant}, also has its own GET on /items/{item}
          _variant_.rs # GET on /items/{item}/{variant}
```

The rules:

- Each directory has a `mod.rs` that nests its children.
- Leaf files contain the actual handlers for that URL segment.
- **A filename or folder wrapped in underscores like `_item_`** is a convention signalling "this segment is a path parameter" - it still has to be wired up as `{item}` in the parent's `.nest(...)` call, the underscores don't do anything automatically, they're just a readability cue so you know at a glance which files are parameterized.
- A `mod.rs` can also have its own handlers, not just nests. For example, `items/mod.rs` responds to `GET /items` *and* nests `/{item}` - no need for a separate `index.rs`.

::: info
If you're coming from Next.js or SvelteKit, you already know this pattern - it's the same file-based routing idea, just done manually through `mod.rs` wiring instead of auto-discovered by a bundler. Keeping the underscore convention for params means you can grep your codebase for `_server_` and find every route that touches a server ID.
:::

Here's what a typical `routes/admin/mod.rs` looks like - it's intentionally boring, just wiring:

```rs
use shared::State;
use utoipa_axum::router::OpenApiRouter;

mod settings;
mod statistics;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/settings", settings::router(state))
        .nest("/statistics", statistics::router(state))
        .with_state(state.clone())
}
```

Every `mod.rs` follows this exact shape - declare the child modules, `OpenApiRouter::new()`, nest each child under its URL segment, `.with_state(state.clone())`, done. Once you've written two of these you've written all of them.

## Writing a Route Handler

Okay now the interesting part. Here's the idiom we use for every leaf route file - one inner module per HTTP method, then a `router()` function at the bottom. Let's look at a `settings.rs` that exposes both a `GET` and a `PUT`:

```rs
use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        #[schema(inline)]
        settings: &'a crate::settings::ExtensionSettingsData,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState, permissions: GetPermissionManager) -> ApiResponseResult {
        permissions.has_admin_permission("settings.read")?;

        let settings = state.settings.get().await?;
        let extension_settings: &crate::settings::ExtensionSettingsData =
            settings.find_extension_settings()?;

        ApiResponse::new_serialized(Response {
            settings: extension_settings,
        })
        .ok()
    }
}

mod put {
    // ... see "Request Bodies and Validation" below
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
```

Let's dissect this, because there's a lot going on in a small amount of code.

**The `mod get { ... }` wrapper.** Each HTTP method gets its own inner module. This isn't arbitrary - it lets you name the handler function `route` (instead of `get_settings`, `put_settings`, etc.) and lets each method define its own `Response`, `Payload`, and imports without collisions. When you have four methods on one endpoint, the consistency really pays off.

**The `#[utoipa::path(...)]` attribute.** This is what makes your route show up in the auto-generated OpenAPI spec. The first argument is the HTTP method, `path = "/"` means "whatever the parent nested me under", and `responses(...)` tells utoipa what shape to document. `body = inline(Response)` inlines the response schema rather than referencing it by name - this is what you'll want almost always for per-route types.

**The extractors.** `GetState` gives you the Panel's `State`, `GetPermissionManager` gives you a permission checker for the current session. These are shared aliases that do the right thing depending on which router you're in - inside an admin router, `GetPermissionManager` checks admin permissions; inside a client-server router, it checks user-plus-server permissions. You never manually parse an auth token.

**The permission check.** `permissions.has_admin_permission("settings.read")?` returns a `DisplayError` (which `?` bubbles up as a `403 Forbidden`) if the current admin doesn't have that permission node. Always do this as the first line of the handler so you don't accidentally leak data before the check.

**The return type.** `ApiResponseResult` is an alias for `Result<ApiResponse, ApiResponse>` - yes, both sides are `ApiResponse`, which is a bit unusual but intentional. See [Response Types and Errors](#response-types-and-errors) below.

**The `routes!` macro.** At the bottom, `.routes(routes!(get::route))` is the utoipa-axum macro that both registers the handler with axum *and* adds its schema to the OpenAPI spec. You call it once per method. If you have both GET and PUT on the same path you chain `.routes(routes!(get::route)).routes(routes!(put::route))`.

## Path Parameters

Path parameters are extracted with `axum::extract::Path<T>`. The file-system convention puts them in `_name_.rs` (or `_name_/mod.rs`) files, but the actual parameter name is defined in the `.nest(...)` call of the parent. Here's an `_item_/_variant_.rs` file that responds to `GET /api/client/servers/{server}/my-feature/items/{item}/{variant}`:

```rs
use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use axum::extract::Path;
    use serde::Serialize;
    use shared::{
        GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        details: String,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "item" = String,
            description = "The item identifier",
            example = "example-item",
        ),
        (
            "variant" = String,
            description = "The variant identifier",
            example = "v1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        Path((_server, item, variant)): Path<(String, String, String)>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("files.read")?;

        ApiResponse::new_serialized(Response {
            details: format!("{item}/{variant}"),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
```

And the parent `_item_/mod.rs` that wires `{variant}` into the URL:

```rs
pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/{variant}", _variant_::router(state))
        .with_state(state.clone())
}
```

A few things worth pointing out:

- **`Path<(String, String, String)>` extracts params in URL order**, from outermost to innermost. On a client-server route, `{server}` always comes first because it's part of the parent mount point - even though you didn't register it yourself. If you don't need it, destructure it as `_server` like above.
- **`params(...)` in `#[utoipa::path]` documents every param**, including inherited ones like `server`. The Panel uses this to generate a clickable API reference, so fill in `description` and `example` - your future self will thank you when debugging.
- **Watch out for Rust keywords.** If your parameter has a name like `type`, `ref`, `move`, or similar, you'll need Rust's raw identifier syntax to use it as a variable: `r#type`. This is a Rust thing, not a Calagopus thing, but it trips people up.

## Request Bodies and Validation

For routes that accept a request body, define a `Payload` struct with `serde::Deserialize` and (optionally) `garde::Validate` for validation. Here's a `PUT` handler that accepts a few optional fields:

```rs
mod put {
    use axum::http::StatusCode;
    use garde::Validate;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[garde(url, length(chars, min = 1, max = 255))]
        #[schema(format = "url", min_length = 1, max_length = 255)]
        api_url: Option<compact_str::CompactString>,

        #[garde(skip)]
        enable_feature: Option<bool>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        shared::Payload(data): shared::Payload<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::new_serialized(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("extensions.configure")?;

        // ... apply the update, save, etc.
        ApiResponse::new_serialized(Response {}).ok()
    }
}
```

Key points:

- **`#[garde(...)]` attributes describe validation rules**; `#[schema(...)]` attributes describe the OpenAPI schema. Keep them in sync - if you say `min_length = 1` in the schema, also enforce it with garde, otherwise the API docs lie.
- **`shared::Payload<T>` is the recommended extractor for JSON bodies** - it handles content-type negotiation and gives you better error messages than plain `axum::Json<T>`. Both work, but prefer `shared::Payload` unless you have a specific reason not to.
- **Validation doesn't run automatically.** Call `shared::utils::validate_data(&data)` yourself and return a `400 Bad Request` with `ApiError::new_strings_value(errors)` on failure. Do this *before* the permission check if you want 400s to take precedence over 403s (which is usually what you want, since validation errors are more informative).

::: warning
Do not put `Option<Option<T>>` fields in your payload without understanding what you're doing. That pattern is used with `#[serde(with = "::serde_with::rust::double_option")]` to distinguish between "field absent" (leave unchanged) and "field explicitly set to null" (clear it). It's a nice pattern for PATCH-style updates, but if you just want "update if provided", a plain `Option<T>` is what you want.
:::

## Response Types and Errors

Every handler returns `ApiResponseResult`, which is `Result<ApiResponse, ApiResponse>`. Yes, both sides are the same type - an `ApiResponse` is just a status code, headers, and a body, and errors happen to use the same shape as successes. The distinction between `Ok(...)` and `Err(...)` only matters for the `?` operator.

The success path uses `ApiResponse::new_serialized(...).ok()`:

```rs
ApiResponse::new_serialized(Response { count: 42 }).ok()
```

`new_serialized` handles content negotiation via the `Accept` header - the same handler can respond with JSON, MessagePack, or XML depending on what the client asks for. You don't have to do anything to opt in, it just works.

For non-200 responses, chain `.with_status(StatusCode::...)` before `.ok()`:

```rs
ApiResponse::new_serialized(ApiError::new_strings_value(errors))
    .with_status(StatusCode::BAD_REQUEST)
    .ok()
```

### Bubbling errors with `?`

Anything that converts to `anyhow::Error` - which includes `sqlx::Error`, `reqwest::Error`, and most Panel errors - can be bubbled up with `?`. The conversion is smart: `DatabaseError::Validation` becomes a `400 Bad Request` with the field errors; `DatabaseError::InvalidRelation` becomes a `400`; anything else becomes a `500 Internal Server Error` (and gets logged and sent to Sentry). So for the common case of "something failed, I don't want to handle it specifically", you just `?` and move on:

```rs
let settings = state.settings.get().await?; // 500 if the DB is down, handled for you
```

### Custom-status errors with `DisplayError`

For cases where you want to return a specific error message with a specific status code - and especially when the error happens deep in a call stack that doesn't have direct access to `ApiResponse` - use `shared::response::DisplayError`. It implements `std::error::Error`, so you can return it through any function whose error type is `anyhow::Error`, and the `From` impl on `ApiResponse` will automatically pick up the status and message:

```rs
use shared::response::DisplayError;

fn find_item(id: &str) -> Result<Item, anyhow::Error> {
    lookup(id).ok_or_else(|| {
        DisplayError::new("item not found")
            .with_status(StatusCode::NOT_FOUND)
            .into()
    })
}

// in your handler:
let item = find_item(&id)?; // bubbles as 404 "item not found"
```

This is the idiomatic way to signal "this specific thing went wrong, here's the status I want" from somewhere that isn't the handler itself. A helper function three or four calls deep has no access to `ApiResponse`, and threading it back up through every layer would be miserable - but every one of those layers already returns `anyhow::Error`, which means `DisplayError` slots in cleanly. You specify the HTTP response at the point where the error *happens*, which is usually where you have the best information about what went wrong, and the handler doesn't need to care.

`DisplayError::new` defaults to `400 Bad Request` if you don't call `.with_status(...)`.

### Shortcut for simple error responses

For the common "return a 400 with a message" case directly inside a handler, there's a shortcut:

```rs
return Err(ApiResponse::error("username is already taken"));
```

`ApiResponse::error` is a convenience constructor that wraps the string in the standard error shape and sets the status to `400 Bad Request`. You can still chain `.with_status(...)` to change the code.

## Activity Logging

Mutating routes should usually log an activity entry so it's auditable. There are three loggers available as extractors:

- `GetAdminActivityLogger` from `shared::models::admin_activity` - for admin routes
- `GetServerActivityLogger` from `shared::models::server` - for client-server routes
- `GetUserActivityLogger` from `shared::models::user_activity` - for client routes that aren't server-scoped

All three work the same way - extract one in your handler, call `.log(event_name, json_payload).await`, and you're done. Event-name conventions and the structure of the JSON payload are covered in the [Activity Logging](./activity-logging.md) page.

## Hiding Routes from API Docs

Every pattern above uses `OpenApiRouter` + `routes!(...)`, which automatically generates OpenAPI documentation. Sometimes you don't want that - maybe you're exposing a public callback URL that shouldn't show up in the admin-facing API reference, or an internal endpoint that's only called by your frontend and doesn't need to be part of the public surface.

To opt a route out of OpenAPI docs, register it with **plain axum routing** instead of `routes!`:

```rs
.add_global_router(|routes| {
    routes.route(
        "/my-extension/callback",
        axum::routing::get(callback::route),
    )
})
```

The route still works exactly the same - it gets mounted, it receives requests, extractors work normally. It just doesn't get a `#[utoipa::path]` attribute and therefore doesn't appear in the generated spec. You can mix both styles on the same router: use `.routes(routes!(...))` for the ones you want documented and `.route(...)` for the ones you don't.

::: info
This works on any of the seven builder methods, not just `add_global_router`. If you want one admin endpoint to be undocumented, you can use `.route(...)` inside an `add_admin_api_router` call.
:::

## Calling Your Routes from the Frontend

Once your routes are registered, your frontend code can call them with the axios instance that's already set up for you. The URL depends on which router you registered under:

| Router | URL shape from frontend |
| ------ | ----------------------- |
| `add_admin_api_router` | `/api/admin/<whatever path you nested under>` |
| `add_client_api_router` | `/api/client/<whatever path you nested under>` |
| `add_client_server_api_router` | `/api/client/servers/${uuid}/<whatever path you nested under>` |
| `add_global_router` | `/<whatever path you nested under>` |

```ts
import { axiosInstance } from '@/api/axios';

export default async (uuid: string, item: string) => {
  const { data } = await axiosInstance.get(
    `/api/client/servers/${uuid}/my-feature/items/${item}`,
  );
  return data;
};
```

There are two axios instances available - `axiosInstance` automatically converts response keys from `snake_case` to `camelCase`, while `untransformedAxiosInstance` leaves them as-is. Use `axiosInstance` by default; reach for `untransformedAxiosInstance` only when you have keys that need to stay in their original casing (for example, if your response contains a map whose *keys* are user-provided identifiers that you don't want mangled).

For a full guide on structuring frontend API calls, see [Frontend API Calls](./frontend-api.md).
