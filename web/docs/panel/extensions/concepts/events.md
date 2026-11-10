---
title: Events
description: Listen to panel events from your extension and run code when they fire.
---

# Events

The Panel's event system lets your extension run code when something happens to a model, such as a server being reinstalled or a user being created, and in some cases change or cancel the operation.

Models emit events through these traits:

| Trait                                                                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`EventEmittingModel`](https://cratedocs.calagopus.com/shared/models/trait.EventEmittingModel) | The least used emitter, for events specific to one model. For example, the `Server` model emits an event when it's reinstalled, which doesn't apply to any other model.                                                                                                                                                                                                                                                                                                                           |
| [`CreatableModel`](https://cratedocs.calagopus.com/shared/models/trait.CreatableModel)         | Emits events when a model is created, for example to create a default configuration for your extension when a new server is created.                                                                                                                                                                                                                                                                                                                                                              |
| [`UpdatableModel`](https://cratedocs.calagopus.com/shared/models/trait.UpdatableModel)         | Emits events when a model is updated, for example to update your extension's configuration when a server is renamed.                                                                                                                                                                                                                                                                                                                                                                              |
| [`DeletableModel`](https://cratedocs.calagopus.com/shared/models/trait.DeletableModel)         | Emits events when a model is deleted, for example to clean up your extension's data when a server is deleted.                                                                                                                                                                                                                                                                                                                                                                                     |
| [`DuplicableModel`](https://cratedocs.calagopus.com/shared/models/trait.DuplicableModel)       | Emits events when a model is duplicated (such as duplicating a role, location, node, egg, egg variable, egg configuration, mount, announcement, oauth provider, backup configuration, database agent template, command snippet, api key, schedule or schedule step). It works just like the create/update/delete emitters, except the model handed to your handlers is the _source_ model being duplicated. Use it to copy your extension's own data to the new copy, or to cancel a duplication. |

Listening works slightly differently for `EventEmittingModel` than for the other traits, so they are covered separately.

## Listening to `EventEmittingModel` Events

This example uses the [`Server`](https://cratedocs.calagopus.com/shared/models/server/struct.Server) model, which emits an event when it is reinstalled. Import the trait and register a handler:

```rs
use shared::{
    State,
    extensions::Extension,
    models::{
        EventEmittingModel,
        server::{Server, ServerEvent},
    },
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");

        // its important to note that you should not call this multiple times, otherwise you will be registering multiple listeners and your code will run multiple times when the event is emitted
        Server::register_event_handler(async |_state, event| {
            match &*event {
                ServerEvent::InstallStarted { server, .. } => {
                    tracing::info!("install started for server: {}", server.name);
                }
                ServerEvent::InstallCompleted { server, successful } => {
                    tracing::info!(
                        "install completed for server: {}, successful: {}",
                        server.name,
                        successful
                    );
                }
                _ => {}
            }

            Ok(())
        });
    }
}
```

Call `register_event_handler` on the model you want to listen to, then match on the emitted event. Registering is a plain synchronous call; only the handler closure itself is async. It returns an `EventHandlerHandle`, and calling `.disconnect()` on that handle removes the listener again; the lifecycle registrations in the next section return nothing and cannot be undone.

To see all models that support this, you can check the implementors [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.EventEmittingModel#implementors).

## Listening to `CreatableModel`, `UpdatableModel`, `DeletableModel` and `DuplicableModel` Events

These are a bit more complex, Rust's type system is working overtime with the implementation of these, however you don't have to worry about it too much.

Each of these traits actually exposes **two** kinds of hooks: a _before_ hook and an _after_ hook. The before hook runs before the database operation happens, and is the one you've probably been using already; it lets you modify the options, the query builder, or cancel the operation entirely by returning an error. The after hook runs after the database operation has completed, but still inside the same transaction, so you can use it to react to the result of the operation while still being able to fail the whole thing if something goes wrong (returning an error from an after hook will roll back the transaction along with everything the before hooks and the operation itself did).

To _influence_ how the operation happens, use the before hook. To _react_ after the operation has happened (for example, because you need the resulting model's UUID, or because you want your side-effects to only run if the operation actually succeeded), use the after hook.

::::tabs
=== CreatableModel

```rs
use shared::{
    State,
    extensions::Extension,
    models::{CreatableModel, ListenerPriority, server::Server},
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");

        // its important to note that you should not call this multiple times, otherwise you will be registering multiple listeners and your code will run multiple times when the event is emitted
        Server::register_create_handler(
            ListenerPriority::Normal,
            |options, _query_builder, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!("creating server with name: {}", options.name);
                    Ok(())
                })
            },
        );

        // and the after hook, which runs once the server has actually been created
        Server::register_after_create_handler(
            ListenerPriority::Normal,
            |result, options, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!(
                        "server created with name: {} (result available now)",
                        options.name
                    );
                    Ok(())
                })
            },
        );
    }
}
```

`EventEmittingModel` events only tell you something happened, but these handlers can affect the operation: for example, with the `CreatableModel` events, you can cancel the creation of the model by returning an error in the handler, or you can modify the options that are used to create the model. `ListenerPriority` determines the order in which the listeners are called, and if a listener returns an error, listeners with lower priority are not called.

Parameters of the before handler (registered with `register_create_handler`):

| Parameter       | Type                      | Description                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`       | `&mut CreateOptions`      | The options that are used to create the model, you can modify these options to change how the model is created.                                                                                                                                                                                          |
| `query_builder` | `&mut InsertQueryBuilder` | The query builder that is used to create the model, you can use this to set additional fields on the model that are not in the options, for example, you can set a `created_by_extension` field to true to indicate that the model was created by an extension.                                          |
| `state`         | `&State`                  | The state of the application, you can use this to access the database or other models.                                                                                                                                                                                                                   |
| `transaction`   | `&mut Transaction`        | The sqlx database transaction that is used to create the model after all listeners ran, you can use this to run additional queries that are part of the creation of the model, for example, you can create a default configuration for an extension in the database as part of the creation of a server. |

And the after handler function (registered with `register_after_create_handler`):

| Parameter     | Type                | Description                                                                                                                                                                                                                                                         |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `result`      | `&mut CreateResult` | The result of the creation, this is the value that will be returned from `create`. You can mutate it if you have a reason to, but more commonly you'll just read from it (for example, to grab a freshly assigned UUID for whatever follow-up work you want to do). |
| `options`     | `&CreateOptions`    | The options that were used to create the model. Immutable here, since the creation has already happened.                                                                                                                                                            |
| `state`       | `&State`            | The state of the application, you can use this to access the database or other models.                                                                                                                                                                              |
| `transaction` | `&mut Transaction`  | The same sqlx transaction the creation was performed in. Returning an error here will roll back the whole thing, including the creation itself.                                                                                                                     |

To see all models that support this, you can check the implementors of the `CreatableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.CreatableModel#implementors).

=== UpdatableModel

```rs
use shared::{
    State,
    extensions::Extension,
    models::{ListenerPriority, UpdatableModel, server::Server},
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");

        // its important to note that you should not call this multiple times, otherwise you will be registering multiple listeners and your code will run multiple times when the event is emitted
        Server::register_update_handler(
            ListenerPriority::Normal,
            |server, options, _query_builder, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!(
                        "updating server with name: {} (new name: {})",
                        server.name,
                        options.name.as_ref().unwrap_or(&server.name)
                    );
                    Ok(())
                })
            },
        );

        // and the after hook, which runs once the server has actually been updated
        Server::register_after_update_handler(
            ListenerPriority::Normal,
            |server, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!("server updated, current name is now: {}", server.name);
                    Ok(())
                })
            },
        );
    }
}
```

`EventEmittingModel` events only tell you something happened, but these handlers can affect the operation: for example, with the `UpdatableModel` events, you can cancel the update of the model by returning an error in the handler, or you can modify the options that are used to update the model. `ListenerPriority` determines the order in which the listeners are called, and if a listener returns an error, listeners with lower priority are not called.

Parameters of the before handler (registered with `register_update_handler`):

| Parameter       | Type                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server`        | `&mut Server`             | The model that is being updated, you can modify this model to change how the update works, in general, that's only useful for modifying fields that are not in the options, since the fields that are in the options will override the fields in the model, but you can use this to set additional fields on the model that are not in the options, for example, you can set an `updated_by_extension` field to true to indicate that the model was updated by an extension. |
| `options`       | `&mut UpdateOptions`      | The options that are used to update the model after all listeners ran, you can modify these options to change how the model is updated.                                                                                                                                                                                                                                                                                                                                      |
| `query_builder` | `&mut UpdateQueryBuilder` | The query builder that is used to update the model, you can use this to set additional fields on the model that are not in the options, for example, you can set an `updated_by_extension` field to true to indicate that the model was updated by an extension.                                                                                                                                                                                                             |
| `state`         | `&State`                  | The state of the application, you can use this to access the database or other models.                                                                                                                                                                                                                                                                                                                                                                                       |
| `transaction`   | `&mut Transaction`        | The sqlx database transaction that is used to update the model after all listeners ran, you can use this to run additional queries that are part of the update of the model, for example, you can update a configuration for an extension in the database as part of the update of a server.                                                                                                                                                                                 |

And the after handler function (registered with `register_after_update_handler`):

| Parameter     | Type               | Description                                                                                                                                                                                                                                                                        |
| ------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server`      | `&mut Server`      | The model in its post-update state. The fields from the options have already been applied at this point, so you're looking at what the model actually is now, not what it was before. You can still mutate it if you need to, though it's a bit of an unusual thing to want to do. |
| `state`       | `&State`           | The state of the application, you can use this to access the database or other models.                                                                                                                                                                                             |
| `transaction` | `&mut Transaction` | The same sqlx transaction the update was performed in. Returning an error here will roll back the whole thing, including the update itself.                                                                                                                                        |

The after hook has no `options` parameter: by the time it runs, the options have been consumed by the update, and the post-update model itself is the source of truth for what changed.

To see all models that support this, you can check the implementors of the `UpdatableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.UpdatableModel#implementors).

=== DeletableModel

```rs
use shared::{
    State,
    extensions::Extension,
    models::{DeletableModel, ListenerPriority, server::Server},
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");

        // its important to note that you should not call this multiple times, otherwise you will be registering multiple listeners and your code will run multiple times when the event is emitted
        Server::register_delete_handler(
            ListenerPriority::Normal,
            |server, _options, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!("deleting server with name: {}", server.name);
                    Ok(())
                })
            },
        );

        // and the after hook, which runs once the server has actually been deleted
        Server::register_after_delete_handler(
            ListenerPriority::Normal,
            |server, _options, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!("server with name {} has been deleted", server.name);
                    Ok(())
                })
            },
        );
    }
}
```

`EventEmittingModel` events only tell you something happened, but these handlers can affect the operation: for example, with the `DeletableModel` events, you can cancel the deletion of the model by returning an error in the handler, or you can modify the options that are used to delete the model. `ListenerPriority` determines the order in which the listeners are called, and if a listener returns an error, listeners with lower priority are not called.

Parameters of the before handler (registered with `register_delete_handler`):

| Parameter     | Type               | Description                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server`      | `&Server`          | The model that is being deleted, you can use this to get information about the model that is being deleted, for example, you can get the name of the server that is being deleted to clean up some data for that server.                                                                     |
| `options`     | `&DeleteOptions`   | The options that are used to delete the model, you can use this to get information about how the model is being deleted, for example, you can check if the deletion is supposed to be forceful to decide whether you want to allow the deletion or not.                                      |
| `state`       | `&State`           | The state of the application, you can use this to access the database or other models.                                                                                                                                                                                                       |
| `transaction` | `&mut Transaction` | The sqlx database transaction that is used to delete the model after all listeners ran, you can use this to run additional queries that are part of the deletion of the model, for example, you can clean up some data for an extension in the database as part of the deletion of a server. |

And the after handler function (registered with `register_after_delete_handler`), which has the same shape:

| Parameter     | Type               | Description                                                                                                                                                                                                                                                                  |
| ------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server`      | `&Server`          | The model that was just deleted. Still readable in memory of course (Rust doesn't make the value disappear just because the row did), so you can use it to clean up extension data, files on disk, or anything else keyed off this model.                                    |
| `options`     | `&DeleteOptions`   | The options that were used to delete the model, in case your cleanup logic needs to know whether the deletion was forceful or not.                                                                                                                                           |
| `state`       | `&State`           | The state of the application, you can use this to access the database or other models.                                                                                                                                                                                       |
| `transaction` | `&mut Transaction` | The same sqlx transaction the deletion was performed in. Returning an error here rolls back everything, including the deletion itself, which is useful if your cleanup is critical and you'd rather keep the row around than have it gone with no extension data cleaned up. |

To see all models that support this, you can check the implementors of the `DeletableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.DeletableModel#implementors).

=== DuplicableModel

```rs
use shared::{
    State,
    extensions::Extension,
    models::{DuplicableModel, ListenerPriority, role::Role},
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");

        // its important to note that you should not call this multiple times, otherwise you will be registering multiple listeners and your code will run multiple times when the event is emitted
        Role::register_duplicate_handler(
            ListenerPriority::Normal,
            |role, options, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!(
                        "duplicating role {} into new role with name: {}",
                        role.name,
                        options.name
                    );
                    Ok(())
                })
            },
        );

        // and the after hook, which runs once the duplicate has actually been created
        Role::register_after_duplicate_handler(
            ListenerPriority::Normal,
            |role, duplicated, _options, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!(
                        "role {} was duplicated into new role {} ({})",
                        role.name,
                        duplicated.name,
                        duplicated.uuid
                    );
                    Ok(())
                })
            },
        );
    }
}
```

`EventEmittingModel` events only tell you something happened, but these handlers can affect the operation: for example, with the `DuplicableModel` events, you can cancel the duplication of the model by returning an error in the handler. `ListenerPriority` determines the order in which the listeners are called, and if a listener returns an error, listeners with lower priority are not called.

With duplication, keep the source model in mind. The before hook only gets the **source** model, the one being duplicated, since the copy doesn't exist yet; unlike the create hooks it gets no query builder, so the new copy is constructed from the source model's fields plus the `options`, and the `options` are your only window into what's actually changing (for example, the new name). The after hook runs once the copy has been inserted, so it receives _both_ the source model **and** the new duplicate (mutably), for example to read its newly assigned UUID.

Parameters of the before handler (registered with `register_duplicate_handler`):

| Parameter     | Type                | Description                                                                                                                                                                                                         |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`       | `&Self`             | The _source_ model that is being duplicated. You can read from it to decide what your handler should do, for example, to copy along your extension's own data that is keyed off the source model onto the new copy. |
| `options`     | `&DuplicateOptions` | The options used to duplicate the model, holding the values that differ from the source (for example, the new name). They are immutable, so you cannot change how the duplicate is created here.                    |
| `state`       | `&State`            | The state of the application, you can use this to access the database or other models.                                                                                                                              |
| `transaction` | `&mut Transaction`  | The sqlx database transaction the duplication runs in. Use it to run additional queries that are part of the duplication, for example, copying your extension's data for the new model.                             |

And the after handler function (registered with `register_after_duplicate_handler`), which runs _after_ the duplicate row has been inserted, still inside the same transaction (so returning an error from it will roll back the whole duplication):

| Parameter     | Type                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`       | `&Self`                | The _source_ model that was duplicated from. Still readable so you can compare it against the new copy or key your follow-up work off it.                                                                                                                                                                                                                                                                                                                                                                                              |
| `duplicated`  | `&mut DuplicateResult` | The result of the duplication, this is the value that will be returned from `duplicate`. For most models this is just the freshly created duplicate as it now exists in the database (with its newly assigned UUID and any other generated fields), but some models return more, for example, API keys return `(String, Self)` with the new plaintext key. You can mutate it if you have a reason to, but more commonly you'll just read from it, for example, to grab the new UUID to wire up your extension's own data for the copy. |
| `options`     | `&DuplicateOptions`    | The options that were used to duplicate the model.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `state`       | `&State`               | The state of the application, you can use this to access the database or other models.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `transaction` | `&mut Transaction`     | The same sqlx transaction the duplication was performed in. Returning an error here will roll back the whole thing, including the duplicate itself.                                                                                                                                                                                                                                                                                                                                                                                    |

To see all models that support this, you can check the implementors of the `DuplicableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.DuplicableModel#implementors).

::::
