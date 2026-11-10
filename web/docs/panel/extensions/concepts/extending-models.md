---
title: Extending Models
description: Attach your extension data to the Panel models and API objects.
---

# Extending Models

So you've read the rest of the docs and you're feeling pretty good - you can add routes, register settings, ship a UI, the whole nine yards. But everything you've built so far has been _next to_ the Panel's existing data model, never _part_ of it. You can store a setting that says "the subdomain limit for server X is 5", but you can't put a column directly on the `servers` table that everyone else who queries servers will see. And you can't get that column to appear in API responses, or get the existing admin "create server" form to know about it, without a lot of glue code.

Calagopus has a system for exactly this: **model extensions**. Your extension can register itself against a core model (like `Server`, `Node`, `User`, etc.), declare extra columns it owns, hook into the existing create / update / delete flows, and even extend the API structs that get sent over the wire. To core code and other extensions, your data looks like part of the model. To you, it's clearly your domain.

This page walks through the pattern end-to-end using a worked example - one that adds a per-server subdomain limit, fully integrated with the existing feature-limits system. By the end you'll know how to:

- Add columns to a core table via migration and surface them on the model
- Hook into create and update flows to populate those columns
- Extend API response and request structs so the columns appear in the JSON
- Register frontend form components that slot into the existing admin pages
- Read your extension's data from both backend code and frontend components

## The Two Sides: Models and API Structs

Before we get into the code, it's worth understanding the divide. Calagopus has two related but distinct concepts that both get extended by this system:

**Models** are the database-backed types - `Server`, `Node`, `User`, `NestEgg`, `ServerSchedule`, and so on. They're what the rest of the codebase deals with internally, and they're _your_ extension's interface to the database. When you add a column to the `servers` table and want code that queries `Server` to know about it, you're extending the model.

**API structs** are the over-the-wire types - `ApiServer`, `AdminApiServer`, `ApiServerFeatureLimits`, etc. These are what get serialized into JSON for HTTP responses and deserialized from JSON in request bodies. They're documented in the OpenAPI spec, they're consumed by the frontend, and they're often a _projection_ of a model rather than a 1:1 mirror (e.g. `ApiServer` hides internal columns like deletion timestamps, exposes derived fields, and so on). When you want your extra column to appear in the JSON, you're extending the API struct.

The two extension surfaces are independent. You can extend a model without extending its API struct (your column exists in the database but doesn't appear in JSON). You can extend an API struct without extending the model (you compute and expose a derived value). Most extensions do both.

The full list of extendable API structs is at [cratedocs - Extendible implementors](https://cratedocs.calagopus.com/shared/trait.Extendible#implementors); anything that implements `Extendible` can be extended, anything that doesn't can't. Models are a separate list: every model that implements [`BaseModel`](https://cratedocs.calagopus.com/shared/models/trait.BaseModel) accepts `register_model_extension`.

## Worked Example: Subdomain Limits

The example we'll walk through is a per-server subdomain limit. Imagine your Panel deployment runs a service that gives each server one or more subdomains pointing at it - `myserver.yourpanel.example` and so on. You want admins to be able to cap the number of subdomains each server is allowed, the way they can already cap Databases, Backups and more. That's exactly the shape of a feature limit, so we'll extend `ApiServerFeatureLimits`.

The plan: add a `subdomains` column to `servers`, plumb it through the model layer so it loads with every `Server`, hook into the create and update flows so admins can set it via the existing endpoints, extend `ApiServerFeatureLimits` so the value appears in the API response, register frontend form components for the admin create-server and edit-server pages, and finally show how to _read_ the limit from both your backend routes and your frontend components.

::: info
Note that we're naming the field just `subdomains`, not `max_subdomains`. The `ApiServerFeatureLimits` struct is the cap-defining surface by definition - every field in it represents a maximum. Prefixing with `max_` is redundant; just like the core fields `databases`, `backups`, ... aren't prefixed, your extension fields shouldn't be either. The "max" is implicit.
:::

### The Migration

First, the database. You need a migration that adds your column to the existing table, with both an up and a down script:

```sql
-- up.sql
ALTER TABLE "servers" ADD COLUMN "subdomains" integer NOT NULL DEFAULT 0;
```

```sql
-- down.sql
ALTER TABLE "servers" DROP COLUMN "subdomains";
```

Defaults on `NOT NULL` columns are basically required, since rows already exist when your extension is installed and they need _some_ value for the new column. `0` is a sensible default for a limit field - if you read it as "no subdomains allowed by default" rather than "unlimited," operators get safe defaults out of the box.

::: warning
**Always provide both `up.sql` and `down.sql`.** The down migration should drop your columns in reverse order. If an operator uninstalls your extension or rolls back a release, leaving orphan columns on a core table is a recipe for a broken Panel.
:::

### Defining the Model Extension

Now create a `model.rs` in your extension's backend `src/`. This is where the SELECT-side magic happens - you tell the Panel "these are my columns" and "here's how to deserialize a row that includes them":

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

Three things to unpack here.

**`ServerExtensionData`** is your extension's view of its own columns - a plain struct, no derives required beyond `Serialize`/`Deserialize`. Anyone reading a `Server` and looking up your extension's data will get this struct back.

**`extended_columns`** declares which columns from the underlying table your extension cares about. The map keys are the fully-qualified column names (with table prefix, like `"servers.subdomains"`); the values are the aliased names the Panel uses in its actual SELECT statement, prefixed by whatever the caller passed in. The prefix mechanic exists because the same model can appear multiple times in a query (e.g. a server joined to a related server) and each instance needs uniquely-aliased columns.

**`map_extended`** is the row-to-struct mapper. Given a `PgRow` and the same prefix, pull your fields out and return them boxed up. Errors here become `DatabaseError`s and bubble up to whoever was loading the model.

The `SafeModelExtension` impl is a small piece of name-keying boilerplate - it lets other code look up your extension's data via a typed handle (`server.parse_model_extension::<ServerExtension>()`) rather than a stringly-typed lookup. You almost always want this.

### The Extended API Struct

You also need an "extended" API struct that mirrors the field shape of whichever API struct you're extending. This is the type that flows over the wire - what clients send when setting your fields and what they receive when reading them back:

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

This is a real API struct - `ToSchema` for OpenAPI documentation, `Validate` from garde so request bodies get validated like any other payload (see [Routing - Request Bodies and Validation](./routing.md#request-bodies-and-validation) for the validation system), `Serialize`/`Deserialize` for the wire format.

The settable field is wrapped in `Option<T>`. **This is on purpose, and it's important.** Existing API clients - the Panel's own frontend, third-party integrations, scripts written before your extension was installed - have no idea your field exists. When they hit the update endpoint, they're sending payloads that don't include `subdomains` at all. With `Option<T>`, "field absent" deserializes to `None`, your update handler reads `None` and skips the column, and the existing value stays untouched. Backwards compatibility, for free.

The alternative would be a non-optional field with a default value (`#[serde(default)]`), but that's a footgun: every update from a client that doesn't know about your field would set the column to whatever the default is. If your field is `subdomains: i32` defaulting to `0`, every untouched update silently zeros out the limit on every server. By the time anyone notices, the data is gone. `Option<T>` makes "the client didn't send this" a distinct case from "the client wants this set to 0," and your handler treats them differently.

### Registering Everything

All four registrations - the model extension, the create handler, the update handler, and the API struct extension - happen in your `Extension::initialize`:

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

Four calls, four different surfaces. Let's go through each.

## Lifecycle Handlers

The `register_create_handler` and `register_update_handler` calls are part of the `CreatableModel` / `UpdatableModel` lifecycle handler systems, which are documented fully on the [Events](./events.md) page along with `register_delete_handler`. This page won't rehash that documentation - go read the events page if you haven't already, the parameter list for the closure is over there.

What's worth pointing out _here_ is how the lifecycle handlers interact with model extensions. Both closures receive an `options` argument carrying the incoming payload - the same payload the core create/update logic uses. When that payload includes an extended struct (here, `feature_limits`), you call `parse_extended::<YourExtensionStruct>()` to pull out _your_ extension's slice of it as a typed Rust struct.

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

Notice that on create, `options.feature_limits` is the struct directly (not an `Option`), since every server creation must include a feature_limits payload. On update, it's `Option<...>` - clients can omit the whole feature_limits block when updating other fields. Adjust your handler shape accordingly, or factor the shared logic into a helper function the way most extensions do once they have more than a couple of fields.

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

The update handler is structurally similar but the closure also receives `server` (the current state of the model being updated) as the first argument. You can read from `server` if your update logic needs the existing values - for instance, validating that a new limit isn't being lowered below the number of subdomains already in use, or detecting transitions you want to react to.

`parse_extended` returns a `Result` because the extended slice might not be present (e.g. an older client didn't include the field) or might fail to deserialize (e.g. malformed input). Handle both - log, fall back, or set a default - whatever's right for your domain. Then mutate the `query_builder` to add your column to the UPDATE statement.

### Deletes

For deletes, register `register_delete_handler` if you need to do cleanup beyond what the foreign-key constraints handle. Most extensions don't - `ON DELETE CASCADE` and similar SQL-level mechanics handle the simple cases. See [Events](./events.md) for the full signature.

::: info
**Read the events page if you haven't.** The cancellation semantics and priority-ordering rules of the lifecycle handlers (returning `Err(...)` cancels the operation and skips lower-priority handlers) apply to model extensions just like everything else. If you're returning errors to enforce business rules, make sure you understand how that interacts with other extensions registering on the same model.
:::

## Extending API Structs

The fourth call - `ApiServerFeatureLimits::extend_validated(...)` - is what makes your extension's data appear in the JSON the Panel sends and accepts. This is the `Extendible` trait at work, and it's separate from the model extension because not every model column needs to be exposed (some are internal-only) and not every API field has a backing column (some are computed).

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

The **first closure** is the "fetch": given the parent struct (here, a `Server`), produce your extension's data. Usually this is a one-liner that calls `parse_model_extension` to read the data your `ModelExtension` already loaded. If your extension's data isn't backed by a model extension (e.g. it's computed on the fly), this is where you'd compute it.

The **second closure** is the "project": given the original `ApiServerFeatureLimits` and your extension's data, produce the extended struct. This is where you decide which fields to expose and how to shape them. Note that the original `_limits` is passed in but not used in this example - if you wanted your extended fields to depend on the core ones, this is where you'd combine them.

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

The backend is now fully wired - you can `POST /api/admin/servers` or `PATCH /api/admin/servers/{uuid}` with `{ "feature_limits": { "subdomains": 5 } }` in the body and the server will get its limit set. But the existing admin form for creating and editing servers doesn't know about your new field.

The server create and update forms are rendered by the Panel's form engine, and extensions hook into them through the form registry - the same mechanism documented in full on the [Forms](./forms.md) page. You register a slot for the form IDs `admin.servers.create` and `admin.servers.update`, using a `transform` to insert your field into the rendered field list:

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

Field `name`s are Mantine form paths, so the dotted `featureLimits.subdomains` binds into the nested `featureLimits` object in the form's values - the same shape the core fields use. `insertFieldsAfter` anchors your field right after the built-in schedules limit; if the anchor isn't present in a particular render of the form, the transform leaves the fields untouched, which keeps it safe on forms that render their fields in multiple sections.

The `zodShape` and `initialValues` here are doing more than just validation and defaults. Both are **deep-merged** into the core form's schema and initial values, which is why the nested `featureLimits` object extends the built-in feature-limit validation instead of replacing it. And the core create/update API files pass the registered zod shapes to `serializeForApi` (via `formExtensionSchemas(formId)`), so declaring your field in `zodShape` is what gets its value serialized into the request body - as `feature_limits.subdomains`, right where your backend's `parse_extended` expects it. A field that only exists in `transform` renders and validates, but never leaves the browser.

## Reading Your Extension's Data

The whole point of this exercise is so your extension can _use_ the data it stores. The access pattern is pleasingly symmetric on the two sides: wherever a model is loaded, you parse your typed slice back out of it - `parse_model_extension` on the backend, your own Zod schema on the frontend.

### From Backend Routes

Since `ServerExtension` is registered, every place in the codebase that loads a `Server` automatically loads your columns alongside it - no special query needed. To pull your typed view back out of a loaded `Server`, call `parse_model_extension` with the extension's marker type:

```rs
let extension = server.parse_model_extension::<model::ServerExtension>()?;
let limit = extension.subdomains;
```

That's the entire access pattern. `parse_model_extension` returns your `ServerExtensionData` struct (the inner `Value` type from the `SafeModelExtension` impl), and from there it's just struct-field access. The `?` propagates a `DatabaseError` if your extension wasn't loaded for some reason - in practice this only happens if someone constructed a `Server` manually without going through the normal query path, which is rare.

In a real route handler, it looks like this:

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

A couple of things worth pointing out:

- **The same access pattern works in any context that has a loaded `Server`** - route handlers, lifecycle handlers, background tasks, CLI commands, anywhere. If you've got the model, you've got the extension data.
- **The data is read-only via `parse_model_extension`.** To _change_ the value, go through the normal update flow - submit a PATCH to the admin update endpoint with the new `feature_limits.subdomains`, and your update handler from earlier in this page will write it.

#### Writing via Direct Calls to `Server::update`

If your extension wants to update a server from inside its own code - say, a CLI command that adjusts limits in bulk, a background task that recalculates them, or a route handler that wraps `update` with extra logic - you can call `Server::update` directly with an `ApiServerFeatureLimits` instead of going through an HTTP endpoint. This works the same way it does for any other update path, with one wrinkle: when you build the API object yourself, you need to remember to include your extension's fields. Otherwise the update goes through with only the core fields set, and your `subdomains` column never gets touched.

The `Extendible` trait gives you a method for exactly this:

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

What `insert_extension` is doing under the hood is serializing your extended struct into the same internal blob that `parse_extended` reads from - the bridge between your typed extension struct and the type-erased "extension data" inside the API object. The object returned by `server.feature_limits(...)` already went through every registered `extend_validated` resolver, so your own fields are present with their stored values; `insert_extension` replaces that slice with the values you want written.

The same applies to any other API struct you've extended via `extend_validated` - obtain or build the core object, call `insert_extension` with your extended view, then use the API object as normal. Once `insert_extension` has been called, everything downstream behaves identically to a request that came in over the wire.

### From Frontend Components

On the frontend, your extended fields are in the JSON the Panel returns when it loads a server - because of the `extend_validated` call. So you don't need a separate fetch and you don't need a custom API endpoint.

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

Note that you parse `server.featureLimits`, not `server` - extension fields sit on the node your backend extension actually extended. Keys arrive camelCased like every other response field: the backend's `subdomains` column arrives as `subdomains`, and a hypothetical `custom_flag` would arrive as `customFlag`. Mark fields `.optional()` if older panel versions, or a panel running without your extension, might not send them.

Two things to keep in mind:

- **Parse, don't trust.** The values ride on the object unvalidated - the core schema declared nothing about them. Running your own schema over the node is what turns them into typed data, and it fails loudly when your extension and the panel disagree.
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

The model extension you've built is now a first-class citizen of the `Server` model. You can:

- **Read your data anywhere a `Server` is loaded** by calling `server.parse_model_extension::<ServerExtension>()`. Other extensions can do the same, even if you didn't tell them about your data.
- **Add custom routes** that operate on your fields, using all the patterns from [Routing](./routing.md). Inside those routes, treat your data exactly like core columns - they were loaded by the same query, after all.
- **Register additional create / update / delete handlers** if you need more complex behavior (e.g. enforcing business rules, denormalizing data into other tables, emitting custom events when your fields change).
- **Extend other API structs** if your data should appear in places beyond `ApiServerFeatureLimits`. The `Extendible` trait works on most API struct types - the [implementor list](https://cratedocs.calagopus.com/shared/trait.Extendible#implementors) is the authoritative reference.

Model extensions are one of the more involved patterns Calagopus exposes, but they're also the most powerful - once you've gone through the dance once, you've got code that reads exactly like core code that ships with the Panel, and the rest of the ecosystem can interact with your data without knowing or caring that it came from an extension.
