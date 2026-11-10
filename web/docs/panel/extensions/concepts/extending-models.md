---
title: Extending Models
description: Attach your extension data to the Panel models and API objects.
---

# Extending Models

Routes, settings and UI all live _next to_ the Panel's data model. A setting can say "the subdomain limit for server X is 5", but it can't add a column to the `servers` table that everything loading a server sees, and it doesn't show up in API responses or the admin "create server" form.

**Model extensions** do that. Your extension registers against a core model (`Server`, `Node`, `User` and so on), declares the extra columns it owns, hooks into the create, update and delete flows, and can extend the API structs sent over the wire. To core code and other extensions, your data looks like part of the model.

This page builds one example from start to finish: a per-server subdomain limit that plugs into the existing feature limits. It covers how to:

- Add columns to a core table via migration and surface them on the model
- Hook into create and update flows to populate those columns
- Extend API response and request structs so the columns appear in the JSON
- Register frontend form components that slot into the existing admin pages
- Read your extension's data from both backend code and frontend components

## The Two Sides: Models and API Structs

This system extends two related but separate things:

**Models** are the database-backed types: `Server`, `Node`, `User`, `NestEgg`, `ServerSchedule`, and so on. The rest of the codebase works with them internally, and they are your extension's interface to the database. When you add a column to the `servers` table and want code that queries `Server` to know about it, you're extending the model.

**API structs** are the over-the-wire types: `ApiServer`, `AdminApiServer`, `ApiServerFeatureLimits` and so on. These are what get serialized into JSON for HTTP responses and deserialized from JSON in request bodies. They're documented in the OpenAPI spec, they're consumed by the frontend, and they're often a _projection_ of a model rather than a 1:1 mirror (e.g. `ApiServer` hides internal columns like deletion timestamps, exposes derived fields, and so on). When you want your extra column to appear in the JSON, you're extending the API struct.

The two extension surfaces are independent. You can extend a model without extending its API struct (your column exists in the database but doesn't appear in JSON). You can extend an API struct without extending the model (you compute and expose a derived value). Most extensions do both.

The full list of extendable API structs is at [cratedocs - Extendible implementors](https://cratedocs.calagopus.com/shared/trait.Extendible#implementors); anything that implements `Extendible` can be extended, anything that doesn't can't. Models are a separate list: every model that implements [`BaseModel`](https://cratedocs.calagopus.com/shared/models/trait.BaseModel) accepts `register_model_extension`.

## Worked Example: Subdomain Limits

The example is a per-server subdomain limit. Say your deployment runs a service that gives each server one or more subdomains, such as `myserver.yourpanel.example`, and admins should be able to cap how many each server gets, the way they already cap databases and backups. That is a feature limit, so the example extends `ApiServerFeatureLimits`.

The steps: add a `subdomains` column to `servers`, load it with every `Server`, hook into the create and update flows so admins can set it through the existing endpoints, extend `ApiServerFeatureLimits` so the value appears in the API, add the field to the admin create-server and edit-server forms, and read the limit from backend routes and frontend components.

::: info
The field is called `subdomains`, not `max_subdomains`. Every field in `ApiServerFeatureLimits` is a maximum, so a `max_` prefix is redundant. The core fields `databases`, `backups` and so on aren't prefixed either.
:::

### The Migration

First, a migration that adds the column to the existing table, with both an up and a down script:

```sql
-- up.sql
ALTER TABLE "servers" ADD COLUMN "subdomains" integer NOT NULL DEFAULT 0;
```

```sql
-- down.sql
ALTER TABLE "servers" DROP COLUMN "subdomains";
```

A `NOT NULL` column needs a default, because rows already exist when your extension is installed. `0` is a sensible default for a limit: read as "no subdomains allowed" rather than "unlimited", it is the safe choice.

::: warning
**Always provide both `up.sql` and `down.sql`.** The down migration should drop your columns in reverse order. If an operator uninstalls your extension or rolls back a release, orphaned columns on a core table can break the Panel.
:::

### Defining the Model Extension

Next, create a `model.rs` in your extension's backend `src/`. It tells the Panel which columns are yours and how to read them from a row:

```rs
use serde::{Deserialize, Serialize};
use shared::models::{ModelExtension, SafeModelExtension, server::Server};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;

#[derive(Serialize, Deserialize)]
pub struct ServerExtensionData {
    pub subdomains: i32,
}

pub struct ServerExtension;

impl SafeModelExtension for ServerExtension {
    type Value = ServerExtensionData;

    fn name() -> &'static str {
        ServerExtension.extension_name()
    }
}

impl ModelExtension for ServerExtension {
    fn extension_name(&self) -> &'static str {
        "dev.yourname.subdomains"
    }

    fn extended_columns(&self, prefix: &str) -> BTreeMap<&'static str, compact_str::CompactString> {
        BTreeMap::from([(
            "servers.subdomains",
            compact_str::format_compact!("{prefix}subdomains"),
        )])
    }

    fn map_extended(
        &self,
        prefix: &str,
        row: &PgRow,
    ) -> Result<shared::models::ModelExtensionMapType, shared::database::DatabaseError> {
        Ok(Box::new(ServerExtensionData {
            subdomains: row
                .try_get(compact_str::format_compact!("{prefix}subdomains").as_str())?,
        }))
    }
}
```

**`ServerExtensionData`** is your extension's view of its own columns: a plain struct that only needs `Serialize` and `Deserialize`. Anyone reading a `Server` and looking up your extension's data gets this struct back.

**`extended_columns`** declares which columns from the underlying table your extension cares about. The map keys are the fully-qualified column names (with table prefix, like `"servers.subdomains"`); the values are the aliased names the Panel uses in its actual SELECT statement, prefixed by whatever the caller passed in. The prefix exists because the same model can appear more than once in a query (for example a server joined to a related server) and each instance needs uniquely-aliased columns.

**`map_extended`** is the row-to-struct mapper. Given a `PgRow` and the same prefix, it reads your fields and returns them boxed. Errors here become `DatabaseError`s and bubble up to whoever was loading the model.

The `SafeModelExtension` impl is a little boilerplate that lets other code look up your extension's data through a typed handle (`server.parse_model_extension::<ServerExtension>()`) instead of a string key. You almost always want it.

### The Extended API Struct

You also need an extended API struct that mirrors the shape of the API struct you're extending. This is the type sent over the wire, both when clients set your fields and when they read them back:

```rs
use garde::Validate;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(ToSchema, Validate, Serialize, Deserialize)]
pub struct ExtendedApiServerFeatureLimits {
    #[garde(range(min = 0))]
    #[schema(minimum = 0)]
    pub subdomains: Option<i32>,
}
```

It is a normal API struct: `ToSchema` for the OpenAPI documentation, `Validate` from garde so request bodies are validated like any other payload (see [Request Bodies and Validation](./routing.md#request-bodies-and-validation)), and `Serialize`/`Deserialize` for the wire format.

The settable field is wrapped in `Option<T>` **on purpose**. Existing API clients, such as the Panel's own frontend, third-party integrations and scripts written before your extension was installed, don't know your field exists, so their update requests don't include `subdomains`. With `Option<T>`, a missing field deserializes to `None`, your update handler skips the column, and the stored value stays as it was.

Don't use a non-optional field with `#[serde(default)]` instead. Every update from a client that doesn't know your field would then write the default: with `subdomains: i32` defaulting to `0`, any unrelated update silently resets the limit to zero. `Option<T>` makes "the client didn't send this" a distinct case from "the client wants this set to 0," and your handler treats them differently.

### Registering Everything

All four registrations happen in your `Extension::initialize`: the model extension, the create handler, the update handler and the API struct extension.

::: details Full example: `Extension::initialize`
```rs
use shared::{
    Extendible, State,
    extensions::Extension,
    models::{
        BaseModel, CreatableModel, ListenerPriority, UpdatableModel,
        server::{ApiServerFeatureLimits, Server},
    },
};

mod model;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        // 1. Register the SELECT-side hook
        Server::register_model_extension(model::ServerExtension);

        // 2. Hook into CREATE so admins can set the field when creating a server
        Server::register_create_handler(
            ListenerPriority::Normal,
            |options, query_builder, _state, _transaction| {
                Box::pin(async move {
                    if let Ok(extended) = options
                        .feature_limits
                        .parse_extended::<model::ExtendedApiServerFeatureLimits>()
                        && let Some(value) = extended.subdomains
                    {
                        query_builder.set("subdomains", value);
                    }
                    Ok(())
                })
            },
        );

        // 3. Hook into UPDATE so admins can edit the field on existing servers
        Server::register_update_handler(
            ListenerPriority::Normal,
            |_server, options, query_builder, _state, _transaction| {
                Box::pin(async move {
                    if let Some(feature_limits) = &options.feature_limits
                        && let Ok(extended) =
                            feature_limits.parse_extended::<model::ExtendedApiServerFeatureLimits>()
                        && let Some(value) = extended.subdomains
                    {
                        query_builder.set("subdomains", value);
                    }
                    Ok(())
                })
            },
        );

        // 4. Extend the API struct so the field appears in JSON
        ApiServerFeatureLimits::extend_validated(
            |server, _state| {
                Box::pin(
                    async move { Ok(server.parse_model_extension::<model::ServerExtension>()?) },
                )
            },
            |_limits, extension, _state| model::ExtendedApiServerFeatureLimits {
                subdomains: Some(extension.subdomains),
            },
        );
    }
}
```
:::

## Lifecycle Handlers

The `register_create_handler` and `register_update_handler` calls are part of the `CreatableModel` / `UpdatableModel` lifecycle handler systems, which are documented fully on the [Events](./events.md) page along with `register_delete_handler`. The closure parameters are listed there.

What matters here is how they work with model extensions. Both closures receive an `options` argument carrying the incoming payload, the same one the core create and update logic uses. When that payload includes an extended struct (here, `feature_limits`), you call `parse_extended::<YourExtensionStruct>()` to pull out _your_ extension's slice of it as a typed Rust struct.

### Create

```rs
Server::register_create_handler(
    ListenerPriority::Normal,
    |options, query_builder, _state, _transaction| {
        Box::pin(async move {
            if let Ok(extended) = options
                .feature_limits
                .parse_extended::<model::ExtendedApiServerFeatureLimits>()
                && let Some(value) = extended.subdomains
            {
                query_builder.set("subdomains", value);
            }
            Ok(())
        })
    },
);
```

The create handler runs as part of the INSERT flow. Your closure gets a `query_builder` you can mutate to add columns to the INSERT statement, and the core insert will execute the resulting SQL with all extensions' columns merged in. When the client sent nothing, the column's own `DEFAULT 0` from the migration fills it in, which is why the handler does not need an `else` branch.

On create, `options.feature_limits` is the struct itself (not an `Option`), since every server creation must include it. On update, it's `Option<...>`, because clients can leave out the whole block when updating other fields. Adjust your handler shape accordingly, or factor the shared logic into a helper function the way most extensions do once they have more than a couple of fields.

### Update

```rs
Server::register_update_handler(
    ListenerPriority::Normal,
    |_server, options, query_builder, _state, _transaction| {
        Box::pin(async move {
            if let Some(feature_limits) = &options.feature_limits
                && let Ok(extended) =
                    feature_limits.parse_extended::<model::ExtendedApiServerFeatureLimits>()
                && let Some(value) = extended.subdomains
            {
                query_builder.set("subdomains", value);
            }
            Ok(())
        })
    },
);
```

The update handler is structurally similar but the closure also receives `server` (the current state of the model being updated) as the first argument. Read from `server` if your update logic needs the existing values, for example to validate that a new limit isn't being lowered below the number of subdomains already in use, or detecting transitions you want to react to.

`parse_extended` returns a `Result` because the extended slice might be missing (an older client didn't send the field) or fail to deserialize (malformed input). Handle both in whatever way fits: log, fall back, or set a default. Then mutate the `query_builder` to add your column to the UPDATE statement.

### Deletes

For deletes, register `register_delete_handler` if you need to do cleanup beyond what the foreign-key constraints handle. Most extensions don't, because `ON DELETE CASCADE` and similar SQL features handle the simple cases. See [Events](./events.md) for the full signature.

::: info
The cancellation semantics and priority-ordering rules of the lifecycle handlers (returning `Err(...)` cancels the operation and skips lower-priority handlers) apply to model extensions just like everything else. If you return errors to enforce business rules, check how that interacts with other extensions registered on the same model.
:::

## Extending API Structs

The fourth call, `ApiServerFeatureLimits::extend_validated(...)`, makes your extension's data appear in the JSON the Panel sends and accepts. This is the `Extendible` trait at work, and it's separate from the model extension because not every model column needs to be exposed (some are internal-only) and not every API field has a backing column (some are computed).

The `extend_validated` call takes two closures:

```rs
ApiServerFeatureLimits::extend_validated(
    |server, _state| {
        Box::pin(
            async move { Ok(server.parse_model_extension::<model::ServerExtension>()?) },
        )
    },
    |_limits, extension, _state| model::ExtendedApiServerFeatureLimits {
        subdomains: Some(extension.subdomains),
    },
);
```

The **first closure** is the "fetch": given the parent struct (here, a `Server`), produce your extension's data. Usually this is one call to `parse_model_extension` to read the data your `ModelExtension` already loaded. If your data isn't backed by a model extension (because it's computed, say), compute it here.

The **second closure** is the "project": given the original `ApiServerFeatureLimits` and your extension's data, produce the extended struct. This is where you decide which fields to expose and how to shape them. The original `_limits` is passed in but unused in this example; if your fields depend on the core ones, combine them here.

Once registered, the extended struct gets merged into the JSON that flows in and out of any endpoint that uses `ApiServerFeatureLimits`. Inbound, your fields are validated by garde; outbound, they appear alongside the core fields. The OpenAPI spec is updated automatically.

### Mutating Existing Fields

`extend` and `extend_validated` can only add fields. To change a field the struct already has, register a `mutate` hook instead. The first closure is the same fetch as before. The second gets the built struct as `&mut` and returns a `Result`, and an `Err` fails the whole request. Nothing is added to the OpenAPI spec, since the shape of the struct doesn't change.

`RemoteApiServer` (the server configuration Wings fetches from the Panel) is the main use case. For example, to give every server's container an extra environment variable:

```rs
RemoteApiServer::mutate(
    |server, _state| {
        Box::pin(
            async move { Ok(server.parse_model_extension::<model::ServerExtension>()?) },
        )
    },
    |remote_server, extension, _state| {
        remote_server.settings.environment.insert(
            "SUBDOMAIN".into(),
            serde_json::Value::String(extension.subdomain.to_string()),
        );

        Ok(())
    },
);
```

`mutate` and `extend` hooks share one list and run in the order they were registered. Don't return a key from `extend` that matches an existing field, such as `settings` on `RemoteApiServer`. The output would then contain that key twice and Wings would reject it. Use `mutate` for those changes.

## The Frontend Side

The backend is now complete: you can `POST /api/admin/servers` or `PATCH /api/admin/servers/{uuid}` with `{ "feature_limits": { "subdomains": 5 } }` in the body and the server gets its limit. The existing admin form for creating and editing servers doesn't know about your new field.

The server create and update forms are rendered by the Panel's form engine, and extensions hook into them through the form registry described on the [Forms](./forms.md) page. You register a slot for the form IDs `admin.servers.create` and `admin.servers.update`, using a `transform` to insert your field into the rendered field list:

```ts
import { Extension, ExtensionContext } from 'shared';
import { z } from 'zod';
import { type FieldDef, insertFieldsAfter } from '@/elements/form-engine/index.ts';

class SubdomainsExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterForms((forms) => {
      for (const formId of ['admin.servers.create', 'admin.servers.update'] as const) {
        forms.extend(formId, {
          zodShape: {
            featureLimits: z.object({
              subdomains: z.number().int().min(0),
            }),
          },
          initialValues: {
            featureLimits: {
              subdomains: 0,
            },
          },
          transform: (fields) =>
            insertFieldsAfter(fields, 'featureLimits.schedules', {
              type: 'number',
              name: 'featureLimits.subdomains',
              label: 'Subdomains',
              required: true,
            } satisfies FieldDef),
        });
      }
    });
  }
}

export default new SubdomainsExtension();
```

Field `name`s are Mantine form paths, so the dotted `featureLimits.subdomains` binds into the nested `featureLimits` object in the form's values, the same shape the core fields use. `insertFieldsAfter` anchors your field right after the built-in schedules limit; if the anchor isn't present in a particular render of the form, the transform leaves the fields untouched, which keeps it safe on forms that render their fields in multiple sections.

The `zodShape` and `initialValues` do more than validation and defaults. Both are **deep-merged** into the core form's schema and initial values, which is why the nested `featureLimits` object extends the built-in feature-limit validation instead of replacing it. And the core create/update API files pass the registered zod shapes to `serializeForApi` (via `formExtensionSchemas(formId)`), so declaring your field in `zodShape` is what puts its value into the request body, as `feature_limits.subdomains`, right where your backend's `parse_extended` expects it. A field that only exists in `transform` renders and validates, but never leaves the browser.

## Reading Your Extension's Data

Reading the data works the same way on both sides: wherever a model is loaded, you parse your typed slice out of it, with `parse_model_extension` on the backend and your own Zod schema on the frontend.

### From Backend Routes

Since `ServerExtension` is registered, every place in the codebase that loads a `Server` loads your columns with it, with no extra query. To pull your typed view back out of a loaded `Server`, call `parse_model_extension` with the extension's marker type:

```rs
let extension = server.parse_model_extension::<model::ServerExtension>()?;
let limit = extension.subdomains;
```

`parse_model_extension` returns your `ServerExtensionData` struct (the inner `Value` type from the `SafeModelExtension` impl), and from there it's plain field access. The `?` propagates a `DatabaseError` if your extension wasn't loaded, which in practice only happens when someone builds a `Server` by hand instead of loading it.

In a real route handler, it looks like this:

::: details Full example: route handler
```rs
use axum::http::StatusCode;
use shared::{
    GetState,
    models::{server::GetServer, user::GetPermissionManager},
    response::{ApiResponse, ApiResponseResult},
};

#[utoipa::path(post, path = "/", responses(
    (status = OK, body = inline(Response)),
), request_body = inline(Payload))]
pub async fn route(
    state: GetState,
    permissions: GetPermissionManager,
    server: GetServer,
    shared::Payload(data): shared::Payload<Payload>,
) -> ApiResponseResult {
    permissions.has_server_permission("subdomains.create")?;

    let extension = server.parse_model_extension::<crate::model::ServerExtension>()?;
    let limit = extension.subdomains;

    let current_count = count_existing_subdomains(&state, server.uuid).await?;

    if current_count >= limit {
        return ApiResponse::error(format!(
            "maximum number of subdomains reached"
        ))
        .with_status(StatusCode::EXPECTATION_FAILED)
        .ok();
    }

    // ... actually create the subdomain

    ApiResponse::new_serialized(Response { /* ... */ }).ok()
}
```
:::

- **This works anywhere you have a loaded `Server`**: route handlers, lifecycle handlers, background tasks and CLI commands.
- **`parse_model_extension` is read-only.** To _change_ the value, go through the normal update flow: submit a PATCH to the admin update endpoint with the new `feature_limits.subdomains`, and your update handler from earlier in this page will write it.

#### Writing via Direct Calls to `Server::update`

To update a server from your extension's own code, such as a CLI command that adjusts limits in bulk, a background task that recalculates them, or a route handler that wraps `update` with extra logic, call `Server::update` directly with an `ApiServerFeatureLimits` instead of going through an HTTP endpoint. It works like any other update, except that when you build the API object yourself, you have to include your extension's fields. Otherwise the update goes through with only the core fields set, and your `subdomains` column never gets touched.

The `Extendible` trait has a method for this:

```rs
fn insert_extension<E: Serialize>(&mut self, ext_value: E) -> Result<(), anyhow::Error>;
```

You cannot write an extendible struct as a plain literal: the `#[extendible]` derive adds a hidden overlay field that holds every extension's slice, so `ApiServerFeatureLimits { backups: 5, .. }` does not compile. Start from the server's current limits instead, which the model hands you fully initialised, change the core fields you care about, then call `insert_extension` with your extended struct _before_ passing the whole thing to `update`:

```rs
use shared::{Extendible, models::{UpdatableModel, server::UpdateServerOptions}};

let mut feature_limits = server.feature_limits(&state).await?;
feature_limits.backups = 5;

feature_limits.insert_extension(model::ExtendedApiServerFeatureLimits {
    subdomains: Some(10),
})?;

server
    .update(
        &state,
        UpdateServerOptions {
            feature_limits: Some(feature_limits),
            ..Default::default()
        },
    )
    .await?;
```

`insert_extension` serializes your extended struct into the same internal blob that `parse_extended` reads from, the bridge between your typed extension struct and the type-erased "extension data" inside the API object. The object returned by `server.feature_limits(...)` already went through every registered `extend_validated` resolver, so your own fields are present with their stored values; `insert_extension` replaces that slice with the values you want written.

The same applies to any other API struct you've extended with `extend_validated`: get or build the core object, call `insert_extension` with your extended view, then use the API object as normal. Once `insert_extension` has been called, everything downstream behaves identically to a request that came in over the wire.

### From Frontend Components

On the frontend, the `extend_validated` call means your fields are already in the JSON the Panel returns for a server. You don't need a separate fetch or a custom endpoint.

The Panel's API layer validates every response against its core Zod schemas (see [Frontend API Calls](./frontend-api.md)), and those core schemas are declared with `z.looseObject`. Any key the schema doesn't declare is camelCased and kept on the parsed object as-is, so your extension's fields sit alongside the core ones. There is no wrapper property to unpack and no helper to call.

They aren't typed, though: TypeScript only knows about the core schema's fields. Declare a Zod schema for your extension's slice (camelCase keys, same conventions as any response schema) and parse the node your fields live on. A plain `z.object` ignores the core keys it doesn't declare, so you can hand it the whole node:

```tsx
import { z } from 'zod';
import { useServerStore } from '@/stores/server.ts';

const subdomainsExtensionSchema = z.object({
  subdomains: z.number(),
});

export default function SubdomainsCard() {
  const server = useServerStore((s) => s.server);
  const { subdomains: limit } = subdomainsExtensionSchema.parse(server.featureLimits);

  return (
    <div>
      <p>
        You can create up to {limit} subdomain{limit === 1 ? '' : 's'} on this server.
      </p>
    </div>
  );
}
```

Parse `server.featureLimits`, not `server`: extension fields sit on the node your backend extension extended. Keys arrive camelCased like every other response field: the backend's `subdomains` column arrives as `subdomains`, and a hypothetical `custom_flag` would arrive as `customFlag`. Mark fields `.optional()` if older panel versions, or a panel running without your extension, might not send them.

- **Parse, don't trust.** The values are on the object unvalidated, because the core schema declares nothing about them. Running your own schema over the node is what turns them into typed data, and it fails loudly when your extension and the panel disagree.
- **This is read-only**, same as `parse_model_extension` on the backend. To change the value, submit it through the update flow like any other field.

## Rewriting Variable Rules

`ServerVariable::register_rules_handler` is a different kind of model hook: it lets you rewrite a variable's validation rules just before they are handed to the client. It is also the only way to make an egg variable's input _dynamic_.

```rs
use shared::models::server_variable::ServerVariable;

ServerVariable::register_rules_handler(ListenerPriority::Normal, |server, env_variable, rules| {
    Box::pin(async move {
        if env_variable == "MINECRAFT_VERSION" {
            rules.clear();
            rules.push("required".into());
            rules.push(format!("in:{}", fetch_versions(server).await?.join(",")).into());
        }

        Ok(())
    })
});
```

The rules do more than validate. They also decide **which input widget the panel renders**: `boolean` (or an `in:` of `1,0` / `true,false`) becomes a switch, any other `in:a,b,c` becomes a dropdown built from that list, `numeric` or `integer` becomes a number input, and so on. Rewriting `in:` at request time is therefore how you build something like a version selector whose options come from an upstream API rather than being baked into the egg.

Two caveats. The handler only runs on the client startup endpoints, meaning reading and updating a server's variables. It does not run on admin variable routes, server creation, or the remote endpoint Wings uses, so it shapes what the user sees rather than what ends up stored. You also cannot invent new rule _types_: the rule set is fixed, so your handler composes existing rules rather than adding a validator of its own. Like the other lifecycle registrations, this one returns nothing, so a registered rules handler cannot be unregistered.

## Where to Go From Here

With the model extension in place, you can:

- **Read your data anywhere a `Server` is loaded** by calling `server.parse_model_extension::<ServerExtension>()`. Other extensions can do the same, even if you didn't tell them about your data.
- **Add custom routes** that operate on your fields, using all the patterns from [Routing](./routing.md). Inside those routes, your data was loaded by the same query as the core columns.
- **Register additional create / update / delete handlers** for more complex behavior (enforcing business rules, denormalizing data into other tables, emitting custom events when your fields change).
- **Extend other API structs** if your data should appear in places beyond `ApiServerFeatureLimits`. The `Extendible` trait works on most API structs; the [implementor list](https://cratedocs.calagopus.com/shared/trait.Extendible#implementors) is the authoritative reference.
