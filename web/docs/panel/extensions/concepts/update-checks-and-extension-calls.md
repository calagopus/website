# Update Checks and Extension Calls

The `Extension` trait has a couple of methods that don't fit the "register stuff with a builder" mould of the other hooks - `check_for_updates` and `process_call`. They're both small, they're both independently optional, and neither has enough surface area to deserve a full page of its own. So this page covers both in one pass.

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

- **`Ok(None)`** - you're up to date, nothing to show.
- **`Ok(Some(ExtensionUpdateInfo { version, changes }))`** - there's a newer version. `version` is the new `semver::Version`, `changes` is a list of human-readable changelog lines. The changes list *should* cover everything between the current version and the new one, so if there have been multiple releases since the user's version, walk your changelog and collect every entry that's newer than `current_version`.
- **`Err(...)`** - something went wrong (network issue, malformed response from your update server, etc.). The Panel logs it and tries again on the next cycle; the user sees no update notification.

An empty `changes` vec is fine - the Panel will still show the update as available, it just won't render a changelog list.

### Where to Check

`check_for_updates` receives the `State`, so you have the full Panel context available. Most extensions fetch from an HTTP endpoint - a GitHub releases API, your own "product info" server, whatever:

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

Use `state.client` (the Panel's shared reqwest client) rather than instantiating your own - it has sensible defaults for timeouts, user agents, and connection pooling already set up.

### Caching

`check_for_updates` runs on every Panel startup and every 12 hours. If your update source is rate-limited (GitHub's unauthenticated API, for example, allows 60 requests/hour per IP), wrap the fetch in `state.cache.cached(...)` so repeated calls during development or after restart storms don't burn through your quota:

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

The cache key should be scoped to your extension (prefix with your package name) and the TTL should be long enough to matter - an hour is usually fine since the Panel only calls this every 12 hours anyway.

### Not Implementing It

`check_for_updates` has a default implementation that returns `Ok(None)`, so if your extension doesn't need update checking - it's distributed through a marketplace that handles updates itself, or it's a single-use internal tool - you just don't override the method and the Panel silently skips you on every update cycle.

## Extension Calls

`process_call` is how your extension exposes a callable surface to *other extensions* running in the same Panel. It's a synchronous in-process RPC - not HTTP, not events, just one extension calling a function on another.

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

A lot is going on in a small amount of code. Let's unpack it.

### `ExtensionCallValue` is `Box<dyn Any + Send + Sync>`

Values passed in and out of calls are type-erased Rust values, not serialized JSON. Concretely:

```rs
pub type ExtensionCallValue = Box<dyn std::any::Any + Send + Sync>;
```

This has two big implications.

**You can pass any Rust type that's `Send + Sync + 'static`.** Strings, numbers, your own structs, `Vec<T>`, `HashMap<K, V>`, whatever. No `serde::Serialize` bound, no JSON round-trip, no field renames. The value goes from caller to callee as a pointer.

**Both sides must agree on the concrete type at the downcast site.** The caller boxes up a `String`; the callee does `.downcast_ref::<String>()`. If the callee asks for `.downcast_ref::<&str>()` instead, the downcast returns `None` - even though the data is "really" a string, the type tag doesn't match. There's no structural matching, no coercion, no "well it's close enough." The types have to match exactly.

::: warning
A common mistake is to forget that even same-shaped types with different names are different - `MyStruct` and `OtherStruct` with the same fields are still different types as far as `Box<dyn Any>` is concerned. If you want to share complex data structures across extensions, serialize them into an Intermediate Representation (IR) - a `serde_json::Value`, for example - and pass the IR through the call. That way both sides just need to agree on the IR schema, not the Rust type.
:::

This makes extension calls fast (no serialization) and flexible (any type works), but it also means the contract between two extensions is an unwritten agreement about the exact type of each positional argument and the return. Document that contract somewhere both extensions can see, or it's going to break mysteriously when one side changes.

### Dispatch is "First Extension to Return `Some` Wins"

When someone calls `state.extensions.call("some-name", &args)`, the Panel iterates through every loaded extension in registration order and calls its `process_call` with that name. The first extension whose `process_call` returns `Some(value)` wins - the remaining extensions are never asked.

This means:

- **Your `process_call` must return `None` for names it doesn't recognize.** If you blanket-match everything, you'll start eating calls intended for other extensions that happen to be loaded after yours. The `_ => None` catch-all in the example above is mandatory, not optional.
- **Call names are a shared namespace across every extension.** If two extensions both claim the name `get-user`, whichever loaded first will handle every call to that name, and the other will silently never run. You have no way to target a specific extension from the caller side.
- **Load order matters.** The Panel doesn't guarantee any particular extension load order, so your call name needs to be unique across the entire ecosystem, not just unique within your extension. The convention - same as admin routes and CLI group names - is to prefix with your package name: `"dev.yourname.my-ext:get-thing"` rather than `"get-thing"`.

::: warning
A call name collision is silent - two extensions claiming the same name both compile, both load, and both run, but only one ever gets invoked and there's no warning. Pick names that can't collide: prefix with your package name, and if you're wrapping a common verb, prefix the verb with a scope too (`dev.yourname.my-ext:thing.get` rather than just `dev.yourname.my-ext:get`).
:::

### When to Use It (and When Not To)

Extension calls are the right tool when:

- You're building a suite of extensions that need to share data or functionality, and you control both sides.
- You want one extension to expose a library-like API (lookup helpers, computed state) to others.
- The value being passed is complex enough that HTTP round-trips would be silly overhead.

They're the wrong tool when:

- The "extension" is conceptually a separate process or service. HTTP routes are what you want.
- The caller and receiver are in the same extension. Just call the function directly; there's no reason to go through the dispatcher.
- The data needs to cross a trust boundary. `Box<dyn Any>` dispatch has no schema validation - if the receiver gets a different type than it expects, it returns `None` and the caller has no idea why. Only use extension calls between extensions you control or trust.

### Picking Between `process_call` and `process_call_owned`

The trait has two methods - `process_call(&self, name, &args)` and `process_call_owned(&self, name, Vec<args>)`. The default `process_call_owned` implementation just delegates to `process_call(&args)`, so you normally only implement `process_call` and get the owned version for free.

Override `process_call_owned` only if you specifically need to consume the args (move out of them, for example to avoid cloning a large value). For most extensions, implementing `process_call` alone is enough.
