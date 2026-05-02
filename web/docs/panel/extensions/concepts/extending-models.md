# Extending Models

So you've read the rest of the docs and you're feeling pretty good - you can add routes, register settings, ship a UI, the whole nine yards. But everything you've built so far has been *next to* the Panel's existing data model, never *part* of it. You can store a setting that says "the subdomain limit for server X is 5", but you can't put a column directly on the `servers` table that everyone else who queries servers will see. And you can't get that column to appear in API responses, or get the existing admin "create server" form to know about it, without a lot of glue code.

Calagopus has a system for exactly this: **model extensions**. Your extension can register itself against a core model (like `Server`, `Node`, `User`, etc.), declare extra columns it owns, hook into the existing create / update / delete flows, and even extend the API structs that get sent over the wire. To core code and other extensions, your data looks like part of the model. To you, it's clearly your domain.

This page walks through the pattern end-to-end using a worked example - one that adds a per-server subdomain limit, fully integrated with the existing feature-limits system. By the end you'll know how to:

- Add columns to a core table via migration and surface them on the model
- Hook into create and update flows to populate those columns
- Extend API response and request structs so the columns appear in the JSON
- Register frontend form components that slot into the existing admin pages
- Read your extension's data from both backend code and frontend components

## The Two Sides: Models and API Structs

Before we get into the code, it's worth understanding the divide. Calagopus has two related but distinct concepts that both get extended by this system:

**Models** are the database-backed types - `Server`, `Node`, `User`, `NestEgg`, `ServerSchedule`, and so on. They're what the rest of the codebase deals with internally, and they're *your* extension's interface to the database. When you add a column to the `servers` table and want code that queries `Server` to know about it, you're extending the model.

**API structs** are the over-the-wire types - `ApiServer`, `ApiAdminServer`, `ApiServerFeatureLimits`, etc. These are what get serialized into JSON for HTTP responses and deserialized from JSON in request bodies. They're documented in the OpenAPI spec, they're consumed by the frontend, and they're often a *projection* of a model rather than a 1:1 mirror (e.g. `ApiServer` hides internal columns like deletion timestamps, exposes derived fields, and so on). When you want your extra column to appear in the JSON, you're extending the API struct.

The two extension surfaces are independent. You can extend a model without extending its API struct (your column exists in the database but doesn't appear in JSON). You can extend an API struct without extending the model (you compute and expose a derived value). Most extensions do both.

The full list of extendable models and API structs is at [cratedocs - Extendible implementors](https://cratedocs.calagopus.com/shared/trait.Extendible#implementors). Anything that implements `Extendible` can be extended; anything that doesn't can't.

## Worked Example: Subdomain Limits

The example we'll walk through is a per-server subdomain limit. Imagine your Panel deployment runs a service that gives each server one or more subdomains pointing at it - `myserver.yourpanel.example` and so on. You want admins to be able to cap the number of subdomains each server is allowed, the way they can already cap Databases, Backups and more. That's exactly the shape of a feature limit, so we'll extend `ApiServerFeatureLimits`.

The plan: add a `subdomains` column to `servers`, plumb it through the model layer so it loads with every `Server`, hook into the create and update flows so admins can set it via the existing endpoints, extend `ApiServerFeatureLimits` so the value appears in the API response, register frontend form components for the admin create-server and edit-server pages, and finally show how to *read* the limit from both your backend routes and your frontend components.

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

Defaults on `NOT NULL` columns are basically required, since rows already exist when your extension is installed and they need *some* value for the new column. `0` is a sensible default for a limit field - if you read it as "no subdomains allowed by default" rather than "unlimited," operators get safe defaults out of the box.

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

The `SafeModelExtension` impl is a small piece of name-keying boilerplate - it lets other code look up your extension's data via a typed handle (`Server::parse_model_extension::<ServerExtension>()`) rather than a stringly-typed lookup. You almost always want this.

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
                        query_builder.set("subdomains", value.unwrap_or(0)); // the unwrap_or is due to the NOT NULL constraint on the column - if the client sent null, treat it as 0 on create
                    } else {
                        query_builder.set("subdomains", 0); // default value for new servers if not provided, since the API struct field is optional and the database column is NOT NULL
                    }
                    Ok(())
                })
            },
        )
        .await;

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
        )
        .await;

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

What's worth pointing out *here* is how the lifecycle handlers interact with model extensions. Both closures receive an `options` argument carrying the incoming payload - the same payload the core create/update logic uses. When that payload includes an extended struct (here, `feature_limits`), you call `parse_extended::<YourExtensionStruct>()` to pull out *your* extension's slice of it as a typed Rust struct.

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
)
.await;
```

The create handler runs as part of the INSERT flow. Your closure gets a `query_builder` you can mutate to add columns to the INSERT statement, and the core insert will execute the resulting SQL with all extensions' columns merged in.

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
)
.await;
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

## The Frontend Side

The backend is now fully wired - you can `POST /api/admin/servers` or `PATCH /api/admin/servers/{uuid}` with `{ "feature_limits": { "subdomains": 5 } }` in the body and the server will get its limit set. But the existing admin form for creating and editing servers doesn't know about your new field. You need to register form components that slot into the right places.

Form-aware slot points expose an `appendComponent` (or `prependComponent`) method that takes three arguments instead of one: a Zod schema describing the fields you're adding, the default values for those fields, and the React component itself. Register them in your frontend `index.ts`:

```ts
import { Extension, ExtensionContext } from 'shared';
import { CreateSubdomainsComponent, UpdateSubdomainsComponent } from './SubdomainsFormComponent.tsx';
import { serverWithSubdomainsFeatureLimitsSchema } from './lib/schema.ts';

class SubdomainsExtension extends Extension {
  public cardConfigurationPage: React.FC | null = null;
  public cardComponent: React.FC | null = null;

  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.pages.admin.servers.create.featureLimitsFormContainer.appendComponent(
      serverWithSubdomainsFeatureLimitsSchema,
      { featureLimits: { subdomains: 0 } },
      CreateSubdomainsComponent,
    );
    ctx.extensionRegistry.pages.admin.servers.view.update.featureLimitsFormContainer.appendComponent(
      serverWithSubdomainsFeatureLimitsSchema,
      { featureLimits: { subdomains: 0 } },
      UpdateSubdomainsComponent,
    );
  }
}

export default new SubdomainsExtension();
```

The schema looks identical to any other Zod schema you've seen in [Settings - Building the Admin Form](./settings.md#building-the-admin-form), nested to match the shape of the form's existing data:

```ts
import { z } from 'zod';

export const serverWithSubdomainsFeatureLimitsSchema = z.object({
  featureLimits: z.object({
    subdomains: z.number().int().min(0),
  }),
});
```

The Panel merges your schema into the parent form's schema and your defaults into the parent's defaults, so when the form gets submitted, your fields ride along with the core ones. The validation rules from your schema apply alongside the core validation; type-safety on `form.getInputProps('featureLimits.subdomains')` carries through.

Your form component doesn't take any props from the slot point directly - instead it's typed with `FormComponentProps<MainSchema, ExtensionSchema>` from `shared/src/registries/slices/form`, and receives a `form` prop that's the *parent form's* `useForm` instance:

```tsx
import { FormComponentProps } from 'shared/src/registries/slices/form';
import NumberInput from '@/elements/input/NumberInput.tsx';
import { adminServerCreateSchema } from '@/lib/schemas/admin/servers.ts';
import { serverWithSubdomainsFeatureLimitsSchema } from './lib/schema.ts';

export function CreateSubdomainsComponent({
  form,
}: FormComponentProps<typeof adminServerCreateSchema, typeof serverWithSubdomainsFeatureLimitsSchema>) {
  return (
    <NumberInput
      withAsterisk
      label='Subdomains'
      placeholder='0'
      min={0}
      key={form.key('featureLimits.subdomains')}
      {...form.getInputProps('featureLimits.subdomains')}
    />
  );
}
```

The two type parameters tell TypeScript "this component is being slotted into a form whose main schema is `adminServerCreateSchema` and which has my extension schema merged in." The result is that `form.getInputProps('featureLimits.subdomains')` is fully type-safe - if you typo the path, you get a compile error.

The Update component is structurally identical, just with `adminServerUpdateSchema` as the first type parameter instead of `adminServerCreateSchema`. The Panel ships separate schemas for create and update flows because they often have slightly different requirements (some fields optional on update, all required on create, etc.).

## Reading Your Extension's Data

The whole point of this exercise is so your extension can *use* the data it stores. The access pattern is slightly different on the backend and the frontend, but in both cases the underlying idea is the same: the field is just *there*, alongside the core fields, since the extended struct gets merged into the model's serialized form.

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
- **The data is read-only via `parse_model_extension`.** To *change* the value, go through the normal update flow - submit a PATCH to the admin update endpoint with the new `feature_limits.subdomains`, and your update handler from earlier in this page will write it.

#### Writing via Direct Calls to `Server::update`

If your extension wants to update a server from inside its own code - say, a CLI command that adjusts limits in bulk, a background task that recalculates them, or a route handler that wraps `update` with extra logic - you can call `Server::update` directly with a constructed `ApiServerFeatureLimits` instead of going through an HTTP endpoint. This works the same way it does for any other update path, with one wrinkle: when you build the API object yourself, you need to remember to include your extension's fields. Otherwise the update goes through with only the core fields set, and your `subdomains` column never gets touched.

The `Extendible` trait gives you a method for exactly this:

```rs
fn insert_extension<E: Serialize>(&mut self, ext_value: E) -> Result<(), anyhow::Error>;
```

Construct the core API object normally, then call `insert_extension` with your extended struct *before* passing the whole thing to `update`:

```rs
use shared::{Extendible, models::server::{ApiServerFeatureLimits, Server}};
 
let mut feature_limits = ApiServerFeatureLimits {
    backups: 5,
    databases: 5,
    allocations: 5,
    schedules: 5,
};
 
feature_limits.insert_extension(model::ExtendedApiServerFeatureLimits {
    subdomains: Some(10),
})?;
 
server
    .update(shared::models::server::UpdateServerOptions {
        feature_limits: Some(feature_limits),
        ..Default::default()
    })
    .await?;
```

What `insert_extension` is doing under the hood is serializing your extended struct into the same internal blob that `parse_extended` reads from - the bridge between your typed extension struct and the type-erased "extension data" inside the API object. Without it, the API object has no record of your extension's fields, and your update handler's `parse_extended::<ExtendedApiServerFeatureLimits>()` call will return an error or a struct with `None` everywhere, depending on the exact shape.

The same applies to any other API struct you've extended via `extend_validated` - construct the core object, call `insert_extension` with your extended view, then use the API object as normal. This is the only place the manual-construction path differs from the deserialized-from-JSON path; once `insert_extension` has been called, everything downstream behaves identically to a request that came in over the wire.

### From Frontend Components

On the frontend, your extended fields are already in the JSON the Panel returns when it loads a server - because of the `extend_validated` call. So you don't need a separate fetch, you don't need a custom API endpoint, you just read from the server store like normal. The only wrinkle is that the TypeScript type for the server doesn't know about your extension's fields, so you have to cast.

Here's what that looks like in a server-page component:

```tsx
import { useServerStore } from '@/stores/server.ts';

type ServerWithSubdomains = {
  featureLimits: {
    subdomains: number;
  };
};

export default function SubdomainsCard() {
  const server = useServerStore((s) => s.server);
  const { subdomains: limit } = (server as unknown as ServerWithSubdomains).featureLimits;

  return (
    <div>
      <p>You can create up to {limit} subdomain{limit === 1 ? '' : 's'} on this server.</p>
    </div>
  );
}
```

The cast is doing the actual work, and that's worth a moment of attention. At runtime the field is genuinely there in the `server` object - the JSON came back from the API with it included, and React/Zustand stored it untouched. TypeScript just doesn't know that, because the base `Server` type is defined by the core Panel without any awareness of your extension. Casting is how you tell the compiler "trust me, this field exists." It's not a runtime operation; nothing magical is happening.

The reason for `as unknown as ServerWithSubdomains` rather than a direct `as ServerWithSubdomains` is that TypeScript refuses overly-aggressive direct casts between unrelated types, requiring you to detour through `unknown` first. It looks ugly, and it kind of is - but it's a one-liner per component, and it gives you back the type-safety of a structured object access (`featureLimits.subdomains` autocomplete, type checking on operations, etc.) instead of a stringly-typed lookup.

For extensions that read multiple fields from the server, define a single shape type at the top of the file (or in `types.d.ts` next to your other types) and reuse the cast across all the places you need it.

## Where to Go From Here

The model extension you've built is now a first-class citizen of the `Server` model. You can:

- **Read your data anywhere a `Server` is loaded** by calling `server.parse_model_extension::<ServerExtension>()`. Other extensions can do the same, even if you didn't tell them about your data.
- **Add custom routes** that operate on your fields, using all the patterns from [Routing](./routing.md). Inside those routes, treat your data exactly like core columns - they were loaded by the same query, after all.
- **Register additional create / update / delete handlers** if you need more complex behavior (e.g. enforcing business rules, denormalizing data into other tables, emitting custom events when your fields change).
- **Extend other API structs** if your data should appear in places beyond `ApiServerFeatureLimits`. The `Extendible` trait works on most API struct types - the [implementor list](https://cratedocs.calagopus.com/shared/trait.Extendible#implementors) is the authoritative reference.

Model extensions are one of the more involved patterns Calagopus exposes, but they're also the most powerful - once you've gone through the dance once, you've got code that reads exactly like core code that ships with the Panel, and the rest of the ecosystem can interact with your data without knowing or caring that it came from an extension.
