# Events

The Panel's event system lets your extension listen to system and user actions and run code when they happen - for example, cleaning up your extension's data when a server is deleted.

Models can emit several kinds of events:

| Trait | Description |
| ----- | ----------- |
| [`EventEmittingModel`](https://cratedocs.calagopus.com/shared/models/trait.EventEmittingModel) | The least used emitter, for very specific events that usually only apply to the model they are on - for example, the `Server` model emits an event when it is reinstalled, which wouldn't make sense on any other model. |
| [`CreatableModel`](https://cratedocs.calagopus.com/shared/models/trait.CreatableModel) | Emits events when a model is created - for example, to create a default configuration for your extension when a new server is created. |
| [`UpdatableModel`](https://cratedocs.calagopus.com/shared/models/trait.UpdatableModel) | Emits events when a model is updated - for example, to update your extension's configuration when a server is renamed. |
| [`DeletableModel`](https://cratedocs.calagopus.com/shared/models/trait.DeletableModel) | Emits events when a model is deleted - for example, to clean up your extension's data when a server is deleted. |
| [`DuplicableModel`](https://cratedocs.calagopus.com/shared/models/trait.DuplicableModel) | Emits events when a model is duplicated (a role, location, node, egg, egg configuration, mount, announcement, oauth provider, schedule or schedule step). Works like the create/update/delete emitters, except the model handed to your handlers is the *source* model being duplicated - useful for copying your own extension's data along to the new copy, or cancelling a duplication. |

Listening is straightforward, but differs slightly between the `EventEmittingModel` trait and the others, so they are covered separately.

## Listening to `EventEmittingModel` Events

This example uses the [`Server`](https://cratedocs.calagopus.com/shared/models/server/struct.Server) model, which emits an event when it is reinstalled. Bring the trait into scope and register a handler:

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

Call `register_event_handler` on the model you want to listen to, then match on the emitted event. Note that registering is a plain synchronous call - only the handler closure itself is async.

To see all models that support this, check the implementors [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.EventEmittingModel#implementors).

## Listening to `CreatableModel`, `UpdatableModel`, `DeletableModel` and `DuplicableModel` Events

These are a bit more complex under the hood, but you don't have to worry about the implementation.

Each of these traits exposes **two** kinds of hooks: a *before* hook and an *after* hook. The before hook runs before the database operation happens; it lets you modify the options, the query builder, or cancel the operation entirely by returning an error. The after hook runs after the database operation has completed, but still inside the same transaction, so you can react to the result while still being able to fail the whole thing (returning an error from an after hook rolls back the transaction along with everything the before hooks and the operation itself did).

When to use which? A good rule of thumb: if you want to *influence* how the operation happens, use the before hook. If you want to *react* to the operation having happened (for example, because you need the resulting model's UUID, or because you want your side-effects to only run if the operation actually succeeded), use the after hook.

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

Note the `ListenerPriority` enum, which determines the order in which the listeners are called. `EventEmittingModel` events didn't need it because you have no influence over them - they are emitted, you listen. Here you do: with the `CreatableModel` events you can cancel the creation of the model by returning an error in the handler, or modify the options that are used to create the model. If a listener returns an error, the listeners with lower priority will not be called.

Here's an overview of the parameters of the before handler function (registered with `register_create_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `options` | `&mut CreateOptions` | The options used to create the model. Modify them to change how the model is created. |
| `query_builder` | `&mut InsertQueryBuilder` | The query builder used to create the model. Use it to set additional fields that are not in the options - for example, a `created_by_extension` field set to true to indicate the model was created by an extension. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The sqlx transaction the model is created in after all listeners ran. Use it to run additional queries as part of the creation - for example, creating a default configuration for your extension when a server is created. |

And the after handler function (registered with `register_after_create_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `result` | `&mut CreateResult` | The result of the creation, this is the value that will be returned from `create`. You can mutate it if you have a reason to, but more commonly you'll just read from it (for example, to grab a freshly assigned UUID for whatever follow-up work you want to do). |
| `options` | `&CreateOptions` | The options that were used to create the model. Immutable here, since the creation has already happened - modifying them at this point wouldn't change anything. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The same sqlx transaction the creation was performed in. Returning an error here will roll back the whole thing, including the creation itself. |

To see all models that support this, check the implementors of the `CreatableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.CreatableModel#implementors).

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

Note the `ListenerPriority` enum, which determines the order in which the listeners are called. `EventEmittingModel` events didn't need it because you have no influence over them - they are emitted, you listen. Here you do: with the `UpdatableModel` events you can cancel the update of the model by returning an error in the handler, or modify the options that are used to update the model. If a listener returns an error, the listeners with lower priority will not be called.

Here's an overview of the parameters of the before handler function (registered with `register_update_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&mut Server` | The model being updated. Modifying it is only useful for fields that are not in the options, since option fields override model fields - for example, set an `updated_by_extension` field to true to indicate the model was updated by an extension. |
| `options` | `&mut UpdateOptions` | The options used to update the model after all listeners ran. Modify them to change how the model is updated. |
| `query_builder` | `&mut UpdateQueryBuilder` | The query builder used to update the model. Use it to set additional fields that are not in the options - for example, an `updated_by_extension` field set to true to indicate the model was updated by an extension. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The sqlx transaction the model is updated in after all listeners ran. Use it to run additional queries as part of the update - for example, updating your extension's configuration when a server is updated. |

And the after handler function (registered with `register_after_update_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&mut Server` | The model in its post-update state. The fields from the options have already been applied at this point, so you're looking at what the model actually is now, not what it was before. You can still mutate it if you need to, though it's a bit of an unusual thing to want to do. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The same sqlx transaction the update was performed in. Returning an error here will roll back the whole thing, including the update itself. |

Note that there's no `options` parameter in the after hook - by the time it runs, the options have already been consumed by the update, and the post-update model itself is the source of truth for what changed.

To see all models that support this, check the implementors of the `UpdatableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.UpdatableModel#implementors).

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

Note the `ListenerPriority` enum, which determines the order in which the listeners are called. `EventEmittingModel` events didn't need it because you have no influence over them - they are emitted, you listen. Here you do: with the `DeletableModel` events you can cancel the deletion of the model by returning an error in the handler, or modify the options that are used to delete the model. If a listener returns an error, the listeners with lower priority will not be called.

Here's an overview of the parameters of the before handler function (registered with `register_delete_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&Server` | The model being deleted. Use it to get information about what is being deleted - for example, the server's name, to clean up data for that server. |
| `options` | `&DeleteOptions` | The options used to delete the model - for example, check whether the deletion is meant to be forceful to decide whether to allow it. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The sqlx transaction the model is deleted in after all listeners ran. Use it to run additional queries as part of the deletion - for example, cleaning up your extension's data when a server is deleted. |

And the after handler function (registered with `register_after_delete_handler`), which has the same shape:

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&Server` | The model that was just deleted. Still readable in memory of course (Rust doesn't make the value disappear just because the row did), so you can use it to clean up extension data, files on disk, or anything else keyed off this model. |
| `options` | `&DeleteOptions` | The options that were used to delete the model, in case your cleanup logic needs to know whether the deletion was forceful or not. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The same sqlx transaction the deletion was performed in. Returning an error here will roll back the whole thing, including the deletion itself - useful if your cleanup is critical and you'd rather keep the row around than have it gone with no extension data cleaned up. |

To see all models that support this, check the implementors of the `DeletableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.DeletableModel#implementors).

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

Note the `ListenerPriority` enum, which determines the order in which the listeners are called. `EventEmittingModel` events didn't need it because you have no influence over them - they are emitted, you listen. Here you do: with the `DuplicableModel` events you can cancel the duplication of the model by returning an error in the handler. If a listener returns an error, the listeners with lower priority will not be called.

The big thing to keep in mind with duplication is the source model. The before hook is only handed the **source** model - the one being duplicated from - since the copy doesn't exist yet; unlike the create hooks it gets no query builder, so the new copy is constructed from the source model's fields plus the `options`, and the `options` are your only window into what's actually changing (for example, the new name). The after hook, on the other hand, runs once the copy has been inserted, so it receives *both* the source model **and** the freshly created duplicate (mutably), letting you react to the actual result - for example, to grab its newly assigned UUID.

Here's an overview of the parameters of the before handler function (registered with `register_duplicate_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `model` | `&Self` | The *source* model that is being duplicated. You can read from it to decide what your handler should do, for example, to copy along your extension's own data that is keyed off the source model onto the new copy. |
| `options` | `&DuplicateOptions` | The options used to duplicate the model - the values that differ from the source (for example, the new name). Immutable, so you cannot change how the duplicate is created here. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The sqlx transaction the duplication runs in. Use it to run additional queries as part of the duplication - for example, copying your extension's data for the new model. |

And the after handler function (registered with `register_after_duplicate_handler`), which runs *after* the duplicate row has been inserted, still inside the same transaction (so returning an error from it will roll back the whole duplication):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `model` | `&Self` | The *source* model that was duplicated from. Still readable so you can compare it against the new copy or key your follow-up work off it. |
| `duplicated` | `&mut Self` | The freshly created duplicate, as it now exists in the database (with its newly assigned UUID and any other generated fields). You can mutate it if you have a reason to, but more commonly you'll just read from it, for example, to grab the new UUID to wire up your extension's own data for the copy. |
| `options` | `&DuplicateOptions` | The options that were used to duplicate the model. |
| `state` | `&State` | The application state, used to access the database or other models. |
| `transaction` | `&mut Transaction` | The same sqlx transaction the duplication was performed in. Returning an error here will roll back the whole thing, including the duplicate itself. |

To see all models that support this, check the implementors of the `DuplicableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.DuplicableModel#implementors).

::::
