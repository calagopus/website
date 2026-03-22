# Settings

Let's say you are making the best extension in the universe? Impossible? Maybe, but you are facing a BIG issue, you need an API Key to work. So, what do you do? Where do you put it? How do you make sure the user can change it? This is where settings come in, with the settings API, you can easily create settings for your extension that the user can change, and you can access those settings in your extension code.

Okay great, how do we get started? Well, initialize an extension first, what did you expect?

## Defining Settings

Okay joking aside, fist off, create a `settings.rs` file in your extension src directory, this file will contain the code for your settings struct and ser/deser logic.

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

Now, lets dissect this code a bit, the `ExtensionSettingsData` struct is the struct that will hold our settings data, in this case, we have an `api_key` field and a `collect_secret_government_telemetry` field, you can have as many fields as you want, and they can be of any type that implements `Serialize` and `Deserialize`.

The `SettingsSerializeExt` implementation is where we define how to serialize our settings data, in this example, we are encrypting the `api_key` field before writing it to the database, and we are writing the `collect_secret_government_telemetry` field as a string of "true" or "false".

The `SettingsDeserializeExt` implementation is where we define how to deserialize our settings data, in this example, we are reading the `api_key` field from the database, decrypting it, and if it doesn't exist, we are defaulting it to an empty string. We are also reading the `collect_secret_government_telemetry` field and parsing it as a boolean, defaulting to `false` if it doesn't exist or if parsing fails.

Now that we have our settings struct and ser/deser logic defined, we need to tell the Panel about it, we do this in our `lib.rs` file by implementing the `settings_deserializer` function of the `Extension` trait:

```rs
use shared::{State, extensions::Extension};
use std::sync::Arc;

mod settings;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");
    }

    async fn settings_deserializer(
        &self,
        _state: State,
    ) -> shared::extensions::settings::ExtensionSettingsDeserializer {
        Arc::new(settings::ExtensionSettingsDataDeserializer)
    }
}
```

In this example, we are returning an instance of our `ExtensionSettingsDataDeserializer` struct that we defined in our `settings.rs` file. This tells the Panel to use our custom deserializer when deserializing settings for our extension.

## Accessing Settings in Your Extension Code

Now that we have defined our settings and told the Panel about it, we can access our settings in our extension code. To do this, we can use the `State` object that is passed to us in the `initialize` function of the `Extension` trait, or in any other function that has access to the `State` object.

```rs
use shared::{State, extensions::Extension};
use std::sync::Arc;

mod settings;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");

        let read_settings = async || -> Result<(), anyhow::Error> {
            let settings = state.settings.get().await?;
            let ext_settings: &settings::ExtensionSettingsData =
                settings.find_extension_settings()?;

            tracing::info!(
                "dev_0x7d8_test extension settings: api_key={}, collect_secret_government_telemetry={}",
                ext_settings.api_key,
                ext_settings.collect_secret_government_telemetry
            );

            Ok(())
        };

        if let Err(err) = read_settings().await {
            tracing::error!("failed to read settings for dev_0x7d8_test extension: {err}");
        }
    }

    async fn settings_deserializer(
        &self,
        _state: State,
    ) -> shared::extensions::settings::ExtensionSettingsDeserializer {
        Arc::new(settings::ExtensionSettingsDataDeserializer)
    }
}
```

Yes, it is that easy, you can just call `state.settings.get().await?` to get the settings store, and then call `settings.find_extension_settings()?` to get your extension settings, which will be of the type that you defined in your deserializer (in this case, `ExtensionSettingsData`).

If you want to mutate (i.e. update) your settings, you can use the `state.settings.get_mut().await?` function, which will give you a mutable reference to the settings store that you can use to update your settings.

```rs
use shared::{State, extensions::Extension};
use std::sync::Arc;

mod settings;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");

        let write_settings = async || -> Result<(), anyhow::Error> {
            let mut settings = state.settings.get_mut().await?;
            let ext_settings =
                settings.find_mut_extension_settings::<settings::ExtensionSettingsData>()?;

            ext_settings.api_key = "my_secret_api_key".into();
            ext_settings.collect_secret_government_telemetry = true;

            settings.save().await?;

            Ok(())
        };

        if let Err(err) = write_settings().await {
            tracing::error!("failed to write settings for dev_0x7d8_test extension: {err}");
        }

        let read_settings = async || -> Result<(), anyhow::Error> {
            let settings = state.settings.get().await?;
            let ext_settings: &settings::ExtensionSettingsData =
                settings.find_extension_settings()?;

            // will now print api_key as "my_secret_api_key" and collect_secret_government_telemetry as "true"
            tracing::info!(
                "dev_0x7d8_test extension settings: api_key={}, collect_secret_government_telemetry={}",
                ext_settings.api_key,
                ext_settings.collect_secret_government_telemetry
            );

            Ok(())
        };

        if let Err(err) = read_settings().await {
            tracing::error!("failed to read settings for dev_0x7d8_test extension: {err}");
        }
    }

    async fn settings_deserializer(
        &self,
        _state: State,
    ) -> shared::extensions::settings::ExtensionSettingsDeserializer {
        Arc::new(settings::ExtensionSettingsDataDeserializer)
    }
}
```

And thats it, you can now read and write settings for your extension! You can also access the settings from other parts of your extension code, not just the `initialize` function, as long as you have access to the `State` object.
