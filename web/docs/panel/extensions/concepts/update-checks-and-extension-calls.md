---
title: Update Checks and Extension Calls
description: Implement check_for_updates and process_call, the two standalone hooks on the Extension trait.
---

# Update Checks and Extension Calls

Two `Extension` trait methods don't follow the builder pattern of the other hooks: `check_for_updates` and `process_call`. Both are small and optional, so this page covers them together.

## Update Checks

`check_for_updates` is how your extension tells the Panel "a newer version of me exists." The Panel calls it on startup and every 12 hours after that, and whatever you return surfaces in the Panel's unified updates page alongside panel-core and node updates.

You implement it on your `Extension` trait:

```rs
use shared::{
    State,
    extensions::{Extension, ExtensionUpdateInfo},
};

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn check_for_updates(
        &self,
        state: State,
        current_version: &semver::Version,
    ) -> Result<Option<ExtensionUpdateInfo>, anyhow::Error> {
        let latest: semver::Version = fetch_latest_version_somehow(&state).await?;

        if latest > *current_version {
            Ok(Some(ExtensionUpdateInfo {
                version: latest,
                changes: vec![
                    compact_str::format_compact!("{latest}: fixed the thing that was broken"),
                    compact_str::format_compact!("{latest}: added a new feature"),
                ],
            }))
        } else {
            Ok(None)
        }
    }
}
```

The return shape:

- **`Ok(None)`**: you're up to date, nothing to show.
- **`Ok(Some(ExtensionUpdateInfo { version, changes }))`**: there's a newer version. `version` is the new `semver::Version`, `changes` is a list of human-readable changelog lines. The changes list *should* cover everything between the current version and the new one, so if there have been multiple releases since the user's version, walk your changelog and collect every entry that's newer than `current_version`.
- **`Err(...)`**: something went wrong (a network issue, a malformed response from your update server, and so on). The Panel records the error text against your extension, the admin updates page lists it in its extension errors block, and the check runs again on the next cycle.

An empty `changes` vec is fine: the Panel still shows the update, just without a changelog list.

### Where to Check

`check_for_updates` receives the `State`, so you have the full Panel context available. Most extensions fetch from an HTTP endpoint, such as the GitHub releases API or their own server:

```rs
async fn check_for_updates(
    &self,
    state: State,
    current_version: &semver::Version,
) -> Result<Option<ExtensionUpdateInfo>, anyhow::Error> {
    let release_info: ReleaseInfo = state
        .client
        .get("https://api.github.com/repos/you/your-extension/releases/latest")
        .send()
        .await?
        .json()
        .await?;

    let latest = semver::Version::parse(&release_info.tag_name.trim_start_matches('v'))?;

    if latest > *current_version {
        Ok(Some(ExtensionUpdateInfo {
            version: latest,
            changes: release_info.body.lines().map(compact_str::CompactString::from).collect(),
        }))
    } else {
        Ok(None)
    }
}
```

Use `state.client` (the Panel's shared reqwest client) instead of creating your own; timeouts, the user agent and connection pooling are already set up.

### Caching

`check_for_updates` runs on every Panel startup and every 12 hours, on the primary instance only, and again whenever an admin presses the recheck button on the updates page. If your update source is rate-limited (GitHub's unauthenticated API, for example, allows 60 requests/hour per IP), wrap the fetch in `state.cache.cached(...)` so repeated calls during development, frequent restarts or repeated rechecks don't use up your quota. The cached type needs `Serialize` as well as `Deserialize`, since the value is stored encoded:

```rs
let release_info: ReleaseInfo = state
    .cache
    .cached("my-extension::latest-release", 60 * 60, || async {
        state
            .client
            .get("https://api.github.com/repos/you/your-extension/releases/latest")
            .send()
            .await?
            .json()
            .await
    })
    .await?;
```

The cache key should be scoped to your extension (prefix with your package name) and the TTL should be long enough to matter; an hour is usually fine, since the Panel only calls this every 12 hours.

### Not Implementing It

`check_for_updates` has a default implementation that returns `Ok(None)`, so if your extension doesn't need update checks (because a marketplace handles updates, or it's an internal tool), don't override the method.

## Extension Calls

`process_call` is how your extension exposes a callable surface to *other extensions* running in the same Panel. It's an in-process async call, not HTTP or events: one extension awaits a function on another.

The sending side looks like this:

```rs
let result: Option<ExtensionCallValue> = state
    .extensions
    .call("myorg.my-ext:get-thing", &[
        Box::new("some-id".to_string()),
    ])
    .await;
```

And the receiving side is the `process_call` method on your `Extension` trait:

```rs
use shared::extensions::{Extension, ExtensionCallValue};

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn process_call(
        &self,
        name: &str,
        args: &[ExtensionCallValue],
    ) -> Option<ExtensionCallValue> {
        match name {
            "myorg.my-ext:get-thing" => {
                let id = args.get(0)?.downcast_ref::<String>()?;
                let thing = lookup_thing(id).await.ok()?;
                Some(Box::new(thing))
            }
            _ => None,
        }
    }
}
```

What each part does:

### `ExtensionCallValue` is `Box<dyn Any + Send + Sync>`

Values passed in and out of calls are type-erased Rust values, not serialized JSON. Concretely:

```rs
pub type ExtensionCallValue = Box<dyn std::any::Any + Send + Sync>;
```

This has two big implications.

**You can pass any Rust type that's `Send + Sync + 'static`.** Strings, numbers, your own structs, `Vec<T>`, `HashMap<K, V>`. There's no `serde::Serialize` bound, no JSON round-trip and no field renaming. The value goes from caller to callee as a pointer.

**Both sides must agree on the concrete type at the downcast site.** The caller boxes up a `String`; the callee does `.downcast_ref::<String>()`. If the callee asks for `.downcast_ref::<&str>()` instead, the downcast returns `None`: the data is a string, but the type tag doesn't match. There's no structural matching or coercion; the types have to match exactly.

::: warning
Same-shaped types with different names are still different: `MyStruct` and `OtherStruct` with the same fields are still different types as far as `Box<dyn Any>` is concerned. If you want to share complex data structures across extensions, serialize them into an intermediate form, such as a `serde_json::Value`, and pass that through the call. Both sides then only need to agree on its schema, not the Rust type.
:::

This makes extension calls fast (no serialization) and flexible (any type works), but it also means the contract between two extensions is an unwritten agreement about the exact type of each positional argument and the return. Document that contract somewhere both extensions can see, or it's going to break mysteriously when one side changes.

### Dispatch is "First Extension to Return `Some` Wins"

When someone calls `state.extensions.call("some-name", &args)`, the Panel iterates through every loaded extension in registration order and calls its `process_call` with that name. The first extension whose `process_call` returns `Some(value)` wins; the rest are never asked.

This means:

- **Your `process_call` must return `None` for names it doesn't recognize.** If you match everything, you swallow calls meant for extensions loaded after yours. The `_ => None` catch-all in the example above is required.
- **Call names are a shared namespace across every extension.** If two extensions both claim the name `get-user`, whichever loaded first will handle every call to that name, and the other will silently never run. You have no way to target a specific extension from the caller side.
- **Load order matters.** The Panel doesn't guarantee any particular extension load order, so your call name needs to be unique across the entire ecosystem, not just unique within your extension. As with admin routes and CLI group names, prefix with your package name: `"dev.yourname.my-ext:get-thing"` rather than `"get-thing"`.

::: warning
A call name collision is silent: two extensions claiming the same name both compile, both load, and both run, but only one ever gets invoked and there's no warning. Pick names that can't collide: prefix with your package name, and if you're wrapping a common verb, prefix the verb with a scope too (`dev.yourname.my-ext:thing.get` rather than just `dev.yourname.my-ext:get`).
:::

### When to Use It (and When Not To)

Extension calls are the right tool when:

- You're building a suite of extensions that need to share data or functionality, and you control both sides.
- You want one extension to expose a library-like API (lookup helpers, computed state) to others.
- The value being passed is complex enough that HTTP round-trips would be silly overhead.

They're the wrong tool when:

- The "extension" is conceptually a separate process or service. HTTP routes are what you want.
- The caller and receiver are in the same extension. Call the function directly.
- The data needs to cross a trust boundary. `Box<dyn Any>` dispatch has no schema validation: if the receiver gets a different type than it expects, it returns `None` and the caller has no idea why. Only use extension calls between extensions you control or trust.

Arguments are always borrowed. Every extension in the chain sees the same `&[ExtensionCallValue]` until one answers, so a call cannot hand ownership of a large value to the receiver; clone what you need, or pass an `Arc`. (Panels before 1.2.3 also declared a `process_call_owned` method, which nothing ever dispatched to; it has been removed.)
