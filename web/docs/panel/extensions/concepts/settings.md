# Settings

Let's say you're making the best extension in the universe. Impossible? Maybe. But you're facing a BIG issue - you need an API key to make it work. So where do you put it? Hardcoding is out, environment variables mean the operator has to restart the Panel to change them, and storing a config file next to your binary is a nightmare to keep in sync across deployments. What you actually want is for the operator to open the admin panel, paste the key into a text field, click Save, and have it Just Work.

That's what settings are for. The settings API lets you declare what data your extension needs to persist, the Panel stores it in its database, and your handlers can read or update it like any other Rust struct.

The whole thing boils down to three steps: define a struct, tell the Panel how to turn it into rows and back, then point the Panel at the deserializer so it knows to use your types. This page walks through all three, and a few patterns that will save you pain along the way.

## Defining Your Settings Struct

First, create a `settings.rs` file in your extension's `src/` directory. Inside it, define a struct holding every piece of data your extension wants to persist:

```rs
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct ExtensionSettingsData {
    pub api_key: compact_str::CompactString,
    pub collect_secret_government_telemetry: bool,
}
```

The only hard requirements are `serde::Serialize` and `serde::Deserialize` (since Rust needs to know how to read and write each field) and that the struct and every field are `Send + Sync`. `ToSchema` from utoipa is also standard - if you're ever going to expose settings through a route, utoipa needs it to generate the OpenAPI schema.

## Serializing and Deserializing

Now the interesting part. The Panel stores extension settings in a key-value shape in the database - one row per (extension, key) pair, with the value as a string. That's the storage format you're mapping your struct onto. You implement two traits that describe the mapping: `SettingsSerializeExt` to turn your struct into key-value pairs, and `SettingsDeserializeExt` to rebuild your struct from those pairs.

You have two options for how the keys line up with your struct's fields: **one key per field**, or **one key for the whole struct**. Both work; pick based on what the data looks like.

### Pattern 1: One Key Per Field (`write_raw_setting`)

Use this when your fields are simple scalars (strings, numbers, booleans) and you want the option to encrypt, transform, or otherwise treat each field differently. Each `write_raw_setting` call writes one key with a string value; `take_raw_setting` reads one back:

```rs
use compact_str::ToCompactString;
use serde::{Deserialize, Serialize};
use shared::extensions::settings::{
    ExtensionSettings, SettingsDeserializeExt, SettingsDeserializer, SettingsSerializeExt,
    SettingsSerializer,
};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct ExtensionSettingsData {
    pub api_key: compact_str::CompactString,
    pub collect_secret_government_telemetry: bool,
}

#[async_trait::async_trait]
impl SettingsSerializeExt for ExtensionSettingsData {
    async fn serialize(
        &self,
        serializer: SettingsSerializer,
    ) -> Result<SettingsSerializer, anyhow::Error> {
        let database = serializer.database.clone();

        Ok(serializer
            .write_raw_setting(
                "api_key",
                base32::encode(
                    base32::Alphabet::Z,
                    database.encrypt(self.api_key.clone()).await?.as_slice(),
                ),
            )
            .write_raw_setting(
                "collect_secret_government_telemetry",
                self.collect_secret_government_telemetry.to_compact_string(),
            ))
    }
}

pub struct ExtensionSettingsDataDeserializer;

#[async_trait::async_trait]
impl SettingsDeserializeExt for ExtensionSettingsDataDeserializer {
    async fn deserialize_boxed(
        &self,
        mut deserializer: SettingsDeserializer<'_>,
    ) -> Result<ExtensionSettings, anyhow::Error> {
        Ok(Box::new(ExtensionSettingsData {
            api_key: match deserializer.take_raw_setting("api_key") {
                Some(encoded) => {
                    let decoded = base32::decode(base32::Alphabet::Z, &encoded)
                        .ok_or_else(|| anyhow::anyhow!("Failed to decode API key from base32"))?;
                    deserializer.database.decrypt(decoded).await?
                }
                None => "".into(),
            },
            collect_secret_government_telemetry: deserializer
                .take_raw_setting("collect_secret_government_telemetry")
                .and_then(|s| s.parse().ok())
                .unwrap_or(false),
        }))
    }
}
```

There's a lot here but it's all the same two ideas. On the serialize side, `write_raw_setting(key, value)` tells the Panel to save that key as that value, chained once per field. On the deserialize side, `take_raw_setting(key)` pulls it back as an `Option<String>` - you decide what to do if it's missing (in the example above, fall back to empty string or `false`).

The example does a couple of extra things worth calling out:

- **Encryption** - the `api_key` is encrypted before being written and decrypted on read, using `serializer.database.encrypt(...)` / `.decrypt(...)`. The Panel provides this helper specifically for settings that are secrets. Wrap it in `base32::encode` / `decode` because `write_raw_setting` takes a `String`, not bytes.
- **Graceful defaults** - every field falls back to a default value if the setting doesn't exist in the database. Missing keys happen on first startup before anyone's set anything, on fresh installs, and any time you add a new field to an existing extension without writing a migration. Never assume a key will be there.

### Pattern 2: One Key for the Whole Struct (`write_serde_setting`)

Use this when your data is more complex than scalar fields - a `Vec<T>`, a nested struct, a `HashMap`, anything that doesn't round-trip cleanly as a single string. Instead of mapping each field to its own key, you treat the whole struct (or a sub-field of it) as one serde-serializable blob under a single key:

```rs
use serde::{Deserialize, Serialize};
use shared::extensions::settings::{
    ExtensionSettings, SettingsDeserializeExt, SettingsDeserializer, SettingsSerializeExt,
    SettingsSerializer,
};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct ItemGroup {
    pub name: compact_str::CompactString,
    pub items: Vec<uuid::Uuid>,
    pub enabled: bool,
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct ExtensionSettingsData {
    pub item_groups: Vec<ItemGroup>,
}

#[async_trait::async_trait]
impl SettingsSerializeExt for ExtensionSettingsData {
    async fn serialize(
        &self,
        serializer: SettingsSerializer,
    ) -> Result<SettingsSerializer, anyhow::Error> {
        Ok(serializer.write_serde_setting("item_groups", &self.item_groups)?)
    }
}

pub struct ExtensionSettingsDataDeserializer;

#[async_trait::async_trait]
impl SettingsDeserializeExt for ExtensionSettingsDataDeserializer {
    async fn deserialize_boxed(
        &self,
        deserializer: SettingsDeserializer<'_>,
    ) -> Result<ExtensionSettings, anyhow::Error> {
        Ok(Box::new(ExtensionSettingsData {
            item_groups: deserializer
                .read_serde_setting("item_groups")
                .unwrap_or_else(|_| Vec::new()),
        }))
    }
}
```

Much shorter. `write_serde_setting(key, &value)?` does the serde dance internally (the value ends up as JSON in the database) and `read_serde_setting(key)` reads it back into any `Deserialize` type. If the key is missing or the stored value fails to deserialize, you get an `Err`, which the example above handles by falling back to an empty `Vec`.

### Mixing Both

You can mix patterns in one `serialize`/`deserialize` implementation - use `write_raw_setting` for scalar fields that benefit from per-field treatment (encryption, validation at read time) and `write_serde_setting` for fields that are inherently complex. The key space is shared, so just don't use the same key twice.

### Choosing Between Them

- **`write_raw_setting`** when you need per-field control - encryption, custom encoding, stricter fallback logic, or you specifically want each setting inspectable as its own row in the database.
- **`write_serde_setting`** when the field is a collection or struct that doesn't flatten nicely to a single string. Saves a lot of boilerplate.

For a settings struct with a mix of scalar secrets and complex configuration, using both is perfectly normal.

## Wiring It Up

You've got a struct and ser/deser logic. Now tell the Panel to use them. Over in your `lib.rs`, implement the `settings_deserializer` method on your `Extension` trait:

```rs
use shared::{State, extensions::Extension};
use std::sync::Arc;

mod settings;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn settings_deserializer(
        &self,
        _state: State,
    ) -> shared::extensions::settings::ExtensionSettingsDeserializer {
        Arc::new(settings::ExtensionSettingsDataDeserializer)
    }
}
```

That's it for wiring. Return an `Arc` of your deserializer and the Panel will route every "settings for this extension" read through it.

## Reading Settings

Once wired up, you access your settings through `state.settings`. The read path looks like this:

```rs
async fn load_api_key(state: &State) -> Result<String, anyhow::Error> {
    let settings = state.settings.get().await?;
    let ext_settings: &settings::ExtensionSettingsData =
        settings.find_extension_settings()?;

    Ok(ext_settings.api_key.to_string())
}
```

Two calls. `state.settings.get().await?` gives you a snapshot of the current settings store. `.find_extension_settings::<T>()?` finds your extension's slice of that snapshot and downcasts it to your struct type. From there it's just a reference - read fields as normal.

The type parameter on `find_extension_settings` is usually inferred from the annotation on the left-hand side (`let ext_settings: &ExtensionSettingsData = ...`), but you can also call it as `.find_extension_settings::<ExtensionSettingsData>()?` if the surrounding code doesn't disambiguate.

::: info
**How the settings store actually works.** Under the hood, `state.settings` is backed by two `RwLock`s holding the same data, with an "active" pointer that switches between them on every mutation. Reads always follow the active pointer; writes mutate the inactive one, then flip the pointer.

The upshot: **reads usually don't block on ongoing writes**. A long `get_mut` holding the write lock isn't stalling every request in your Panel - readers keep going against the active buffer the whole time. Writes themselves are serialized (one writer at a time), since writers need exclusive access to the inactive buffer.

Don't rely on "reads never block" as an absolute, though. There's a brief window between pointer swap and lock acquisition on the newly-inactive buffer where a reader can be held up. It's usually microseconds, but if you're writing latency-sensitive code you should assume the worst case is "a read might block briefly."
:::

## Writing Settings

The write path mirrors reads but goes through `get_mut` and ends with an explicit `save`:

```rs
async fn update_settings(state: &State) -> Result<(), anyhow::Error> {
    let mut settings = state.settings.get_mut().await?;
    let ext_settings: &mut settings::ExtensionSettingsData =
        settings.find_mut_extension_settings()?;

    ext_settings.api_key = "my_secret_api_key".into();
    ext_settings.collect_secret_government_telemetry = true;

    settings.save().await?;

    Ok(())
}
```

The important part is **`settings.save().await?` at the end** - without it, your changes stay in memory and get discarded when the guard drops. `save` is what serializes everything and persists it to the database. Forgetting it is the single most common settings bug, so develop the reflex.

Writes are serialized - only one writer can hold `get_mut` at a time, so don't hold the mutable guard longer than you need to. Grab it, mutate, save, drop. Readers won't be blocked by your write in the common case (see the callout above), but other writers will wait, and holding the guard across unrelated async work is still asking for trouble.

::: warning
The `save()` call serializes **every** extension's settings, not just yours. That's how the Panel keeps everything consistent, but it does mean calling `save` is heavier than a single-extension write. Batch related changes into one `get_mut` + `save` block rather than saving after every field change.
:::

## Reading Settings From a Route

The most common place you'll actually do this is inside a route handler. The routing page covered this briefly; here it is in full context:

```rs
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = inline(Response)),
))]
pub async fn route(state: GetState, permissions: GetPermissionManager) -> ApiResponseResult {
    permissions.has_admin_permission("settings.read")?;

    let settings = state.settings.get().await?;
    let ext_settings: &crate::settings::ExtensionSettingsData =
        settings.find_extension_settings()?;

    ApiResponse::new_serialized(Response {
        api_key_present: !ext_settings.api_key.is_empty(),
    })
    .ok()
}
```

For update routes (typically `PUT` on the same path), follow the patterns from [Routing](./routing.md#request-bodies-and-validation) - accept a payload, validate it, permission-check, then do the `get_mut` / mutate / `save` dance inside the handler.

## Building the Admin Form

The Panel doesn't automatically build a settings UI from your struct - it has no idea whether `collect_secret_government_telemetry` should be a checkbox or a dropdown or a free-text field, and it can't infer validation rules from types. That's your job: ship a settings page as your `cardConfigurationPage` (see [Mounting UI](./mounting-ui.md)) that calls your own GET/PUT routes to read and update the data.

The pattern every Calagopus form follows is: **`@mantine/form` for state management + Zod for validation + custom inputs from `@/elements/input/`.** It's a stable stack that composes well, and once you've written one form the rest are mostly copy-and-tweak.

### The Schema

Start with a Zod schema for your settings data. This is the source of truth for both the form's shape and its validation rules. Drop it in `src/lib/schemas.ts`:

```ts
import { z } from 'zod';

export const extensionSettingsSchema = z.object({
  apiKey: z.string().min(1).max(255),
  collectSecretGovernmentTelemetry: z.boolean(),
});
```

Note the **camelCase field names** - this is the frontend, so Zod fields match what `axiosInstance` will produce after auto-transforming snake_case responses from your backend. See [Frontend API Calls](./frontend-api.md) for the transformation rules; the short version is that your settings endpoint will return camelCase and should accept snake_case on write.

### The Form Component

Here's the canonical shape of a configuration page. It loads settings on mount, renders form fields bound to the schema, and saves on submit:

```tsx
import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import TitleCard from '@/elements/TitleCard.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import getSettings from './api/settings/getSettings.ts';
import updateSettings from './api/settings/updateSettings.ts';
import { extensionSettingsSchema } from './lib/schemas.ts';

export default function ConfigurationPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof extensionSettingsSchema>>({
    initialValues: {
      apiKey: '',
      collectSecretGovernmentTelemetry: false,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(extensionSettingsSchema),
  });

  useEffect(() => {
    getSettings()
      .then((settings) => form.setValues(settings))
      .catch((err) => addToast(httpErrorToHuman(err), 'error'));
  }, []);

  const doSave = () => {
    setLoading(true);

    updateSettings(form.values)
      .then(() => addToast('Settings saved.', 'success'))
      .catch((err) => addToast(httpErrorToHuman(err), 'error'))
      .finally(() => setLoading(false));
  };

  return (
    <TitleCard title='Extension Settings'>
      <form onSubmit={form.onSubmit(doSave)}>
        <Stack>
          <TextInput
            label='API Key'
            placeholder='sk_...'
            {...form.getInputProps('apiKey')}
          />

          <Switch
            label='Collect secret government telemetry'
            description='Please do not enable this unless you know what you are doing.'
            {...form.getInputProps('collectSecretGovernmentTelemetry', { type: 'checkbox' })}
          />

          <Button type='submit' loading={loading} disabled={!form.isValid()} className='w-fit!'>
            Save
          </Button>
        </Stack>
      </form>
    </TitleCard>
  );
}
```

Let's unpack the moving parts.

**`useForm<z.infer<typeof schema>>({ ... })`** creates the form object. The type parameter gives you IntelliSense on every field name and value type, which becomes massively useful once your settings have more than a handful of fields. The config object needs three things: `initialValues` (placeholder data before your GET response arrives - use "empty" values matching the schema shape), `validateInputOnBlur: true` (run validation when a field loses focus, rather than only on submit), and `validate: zod4Resolver(schema)` (wire the Zod schema in as the actual validator).

**`form.getInputProps(path, options?)`** spreads the right set of props onto a field - `value`, `onChange`, `error`, and so on. For checkbox-like inputs (`Switch`, checkboxes) pass `{ type: 'checkbox' }` so the resolver binds `checked` instead of `value`. For nested paths, use dot notation: `form.getInputProps('eggGroups.0.name')` works fine, and is type-safe thanks to the Zod-derived form type.

**`form.onSubmit(callback)`** wraps a submit handler so it only fires if the form is valid. Validation errors get attached to fields automatically and render as red text under each input.

**`form.isValid()`** is safe to call during render - it's a synchronous boolean reflecting whether current values pass the schema. Good for disabling the submit button when there are outstanding errors, as shown above.

**The save pattern** is the standard three-callback shape from [Frontend API Calls](./frontend-api.md#handling-errors): `.then` success toast → `.catch` error toast → `.finally` loading reset. `httpErrorToHuman` unpacks whatever the backend returned into a user-friendly string.

### Custom Inputs

The inputs under `@/elements/input/` (`TextInput`, `Switch`, `MultiSelect`, `PasswordInput`, `TextArea`, etc.) are styled wrappers around their Mantine equivalents. Use these rather than raw `@mantine/core` inputs where possible.

For inputs that don't have a prebuilt wrapper, or when you need something specialized (a drag-and-drop ordered list, a code editor, a file picker), build your own component that accepts `value` / `onChange` / `error` props and use `getInputProps` the same way. Mantine's form API doesn't care what component you're rendering, only that it honors the prop contract.

### Handling Nested / Complex State

If your settings are a `Vec<T>` on the backend (stored via `write_serde_setting`), the form state will be an array in the Zod schema. Mantine's form handles arrays natively with `form.insertListItem`, `form.removeListItem`, `form.reorderListItem`, and dotted path access (`eggGroups.0.name`).

### Wiring It Up

Export your configuration page as the default, then point your `Extension` class at it:

```ts
import { Extension, ExtensionContext } from 'shared';
import ConfigurationPage from './ConfigurationPage.tsx';

class MyExtension extends Extension {
  public cardConfigurationPage: React.FC | null = ConfigurationPage;
  public cardComponent: React.FC | null = null;

  public initialize(_ctx: ExtensionContext): void {}
}

export default new MyExtension();
```

The Panel mounts the page at `/admin/extensions/<your-package-identifier>` automatically. The admin layout, navigation, and breadcrumbs are all provided by the shell - your component just returns its content. See [Mounting UI](./mounting-ui.md#the-extension-class) for the full story on how this wiring works.
