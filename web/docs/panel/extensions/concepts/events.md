# Events

You may be writing an extension and wondering, how can I delete all of my systems files when someone renames their account? Or maybe not, but still, you want to be able to listen to an event and run some code when it happens. This is where the Panel's event system comes in.

There are different kinds of events that structs can emit, usually, its the following:

| Trait | Description |
| ----- | ----------- |
| [`EventEmittingModel`](https://cratedocs.calagopus.com/shared/models/trait.EventEmittingModel) | This may sound common but is actually the least used event emitter, its for very specific events that usually ONLY apply to the model they are on, for example, the `Server` model emits an event when its reinstalled, which is something that only applies to the `Server` model, and it wouldn't make sense for other models to be able to emit this event. |
| [`CreatableModel`](https://cratedocs.calagopus.com/shared/models/trait.CreatableModel) | This is a more common event emitter, it emits events when a model is created, this is useful for when you want to run some code when a model is created, for example, you may want to create a default configuration for an extension when a new server is created. |
| [`UpdatableModel`](https://cratedocs.calagopus.com/shared/models/trait.UpdatableModel) | This is also a common event emitter, it emits events when a model is updated, this is useful for when you want to run some code when a model is updated, for example, you may want to update some configuration for an extension when a server is renamed. |
| [`DeletableModel`](https://cratedocs.calagopus.com/shared/models/trait.DeletableModel) | This is also a common event emitter, it emits events when a model is deleted, this is useful for when you want to run some code when a model is deleted, for example, you may want to clean up some data for an extension when a server is deleted. |

Listening to these events is pretty straightforward, however it does change slightly between the `EventEmittingModel` trait and the other three, so we will go over them separately.

## Listening to `EventEmittingModel` Events

For this example, let's use the [`Server`](https://cratedocs.calagopus.com/shared/models/server/struct.Server) model, which emits an event when it is reinstalled. To listen to this event, we need to use the trait and we can basically already listen.

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
        })
        .await;
    }
}
```

Relatively straightforward, you just call the `register_event_handler` function on the model you want to listen to events from, and then you match on the event that is emitted and run your code accordingly.

To see all models that support this, you can check the implementors [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.EventEmittingModel#implementors).

## Listening to `CreatableModel`, `UpdatableModel` and `DeletableModel` Events

These are a bit more complex, Rust's type system is working overtime with the implementation of these, however you dont have to worry about it too much.

Each of these traits actually exposes **two** kinds of hooks: a *before* hook and an *after* hook. The before hook runs before the database operation happens, and is the one you've probably been using already; it lets you modify the options, the query builder, or cancel the operation entirely by returning an error. The after hook runs after the database operation has completed, but still inside the same transaction, so you can use it to react to the result of the operation while still being able to fail the whole thing if something goes wrong (returning an error from an after hook will roll back the transaction along with everything the before hooks and the operation itself did).

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
        )
        .await;

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
        )
        .await;
    }
}
```

What's important to note here is the `ListenerPriority`, which is an enum that determines the order in which the listeners are called. Huh? But why was that not needed for the `EventEmittingModel` events? Well, that's because those events are ran whenever they see fit, you do not have influence over whether they will be cancelled or similar. By name, its an Emitter, it emits events, you listen to them, but you dont have influence over them. However, with these events, you do have influence over them, for example, with the `CreatableModel` events, you can cancel the creation of the model by returning an error in the handler, or you can modify the options that are used to create the model. This is where the `ListenerPriority` comes in, it determines the order in which the listeners are called, and if a listener returns an error, the listeners with lower priority will not be called.

Heres an overview of the parameters of the before handler function (registered with `register_create_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `options` | `&mut CreateOptions` | The options that are used to create the model, you can modify these options to change how the model is created. |
| `query_builder` | `&mut InsertQueryBuilder` | The query builder that is used to create the model, you can use this to set additional fields on the model that are not in the options, for example, you can set a `created_by_extension` field to true to indicate that the model was created by an extension. |
| `state` | `&State` | The state of the application, you can use this to access the database or other models. |
| `transaction` | `&mut Transaction` | The sqlx database transaction that is used to create the model after all listeners ran, you can use this to run additional queries that are part of the creation of the model, for example, you can create a default configuration for an extension in the database as part of the creation of a server. |

And the after handler function (registered with `register_after_create_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `result` | `&mut CreateResult` | The result of the creation, this is the value that will be returned from `create`. You can mutate it if you have a reason to, but more commonly you'll just read from it (for example, to grab a freshly assigned UUID for whatever follow-up work you want to do). |
| `options` | `&CreateOptions` | The options that were used to create the model. Immutable here, since the creation has already happened - modifying them at this point wouldn't change anything. |
| `state` | `&State` | The state of the application, you can use this to access the database or other models. |
| `transaction` | `&mut Transaction` | The same sqlx transaction the creation was performed in. Returning an error here will roll back the whole thing, including the creation itself. |

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
        )
        .await;

        // and the after hook, which runs once the server has actually been updated
        Server::register_after_update_handler(
            ListenerPriority::Normal,
            |server, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!("server updated, current name is now: {}", server.name);
                    Ok(())
                })
            },
        )
        .await;
    }
}
```

What's important to note here is the `ListenerPriority`, which is an enum that determines the order in which the listeners are called. Huh? But why was that not needed for the `EventEmittingModel` events? Well, that's because those events are ran whenever they see fit, you do not have influence over whether they will be cancelled or similar. By name, its an Emitter, it emits events, you listen to them, but you dont have influence over them. However, with these events, you do have influence over them, for example, with the `UpdatableModel` events, you can cancel the update of the model by returning an error in the handler, or you can modify the options that are used to update the model. This is where the `ListenerPriority` comes in, it determines the order in which the listeners are called, and if a listener returns an error, the listeners with lower priority will not be called.

Heres an overview of the parameters of the before handler function (registered with `register_update_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&mut Server` | The model that is being updated, you can modify this model to change how the update works, in general, thats only useful for modifying fields that are not in the options, since the fields that are in the options will override the fields in the model, but you can use this to set additional fields on the model that are not in the options, for example, you can set an `updated_by_extension` field to true to indicate that the model was updated by an extension. |
| `options` | `&mut UpdateOptions` | The options that are used to update the model after all listeners ran, you can modify these options to change how the model is updated. |
| `query_builder` | `&mut UpdateQueryBuilder` | The query builder that is used to update the model, you can use this to set additional fields on the model that are not in the options, for example, you can set an `updated_by_extension` field to true to indicate that the model was updated by an extension. |
| `state` | `&State` | The state of the application, you can use this to access the database or other models. |
| `transaction` | `&mut Transaction` | The sqlx database transaction that is used to update the model after all listeners ran, you can use this to run additional queries that are part of the update of the model, for example, you can update a configuration for an extension in the database as part of the update of a server. |

And the after handler function (registered with `register_after_update_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&mut Server` | The model in its post-update state. The fields from the options have already been applied at this point, so you're looking at what the model actually is now, not what it was before. You can still mutate it if you need to, though it's a bit of an unusual thing to want to do. |
| `state` | `&State` | The state of the application, you can use this to access the database or other models. |
| `transaction` | `&mut Transaction` | The same sqlx transaction the update was performed in. Returning an error here will roll back the whole thing, including the update itself. |

Note that there's no `options` parameter in the after hook - by the time it runs, the options have already been consumed by the update, and the post-update model itself is the source of truth for what changed.

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
        )
        .await;

        // and the after hook, which runs once the server has actually been deleted
        Server::register_after_delete_handler(
            ListenerPriority::Normal,
            |server, _options, _state, _transaction| {
                Box::pin(async move {
                    tracing::info!("server with name {} has been deleted", server.name);
                    Ok(())
                })
            },
        )
        .await;
    }
}
```

What's important to note here is the `ListenerPriority`, which is an enum that determines the order in which the listeners are called. Huh? But why was that not needed for the `EventEmittingModel` events? Well, that's because those events are ran whenever they see fit, you do not have influence over whether they will be cancelled or similar. By name, its an Emitter, it emits events, you listen to them, but you dont have influence over them. However, with these events, you do have influence over them, for example, with the `DeletableModel` events, you can cancel the deletion of the model by returning an error in the handler, or you can modify the options that are used to delete the model. This is where the `ListenerPriority` comes in, it determines the order in which the listeners are called, and if a listener returns an error, the listeners with lower priority will not be called.

Heres an overview of the parameters of the before handler function (registered with `register_delete_handler`):

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&Server` | The model that is being deleted, you can use this to get information about the model that is being deleted, for example, you can get the name of the server that is being deleted to clean up some data for that server. |
| `options` | `&DeleteOptions` | The options that are used to delete the model, you can use this to get information about how the model is being deleted, for example, you can check if the deletion is supposed to be forceful to decide whether you want to allow the deletion or not. |
| `state` | `&State` | The state of the application, you can use this to access the database or other models. |
| `transaction` | `&mut Transaction` | The sqlx database transaction that is used to delete the model after all listeners ran, you can use this to run additional queries that are part of the deletion of the model, for example, you can clean up some data for an extension in the database as part of the deletion of a server. |

And the after handler function (registered with `register_after_delete_handler`), which has the same shape:

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `server` | `&Server` | The model that was just deleted. Still readable in memory of course (Rust doesn't make the value disappear just because the row did), so you can use it to clean up extension data, files on disk, or anything else keyed off this model. |
| `options` | `&DeleteOptions` | The options that were used to delete the model, in case your cleanup logic needs to know whether the deletion was forceful or not. |
| `state` | `&State` | The state of the application, you can use this to access the database or other models. |
| `transaction` | `&mut Transaction` | The same sqlx transaction the deletion was performed in. Returning an error here will roll back the whole thing, including the deletion itself - useful if your cleanup is critical and you'd rather keep the row around than have it gone with no extension data cleaned up. |

To see all models that support this, you can check the implementors of the `DeletableModel` trait [in the cratedocs](https://cratedocs.calagopus.com/shared/models/trait.DeletableModel#implementors).

::::
