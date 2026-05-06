# File Storage

Some extensions need to store files - user-uploaded avatars, generated reports, exported backups, cached external assets, anything that doesn't fit into a database row. The Panel handles this through a `Storage` abstraction available at `state.storage`, which routes file operations to either the local filesystem or an S3-compatible bucket depending on what the operator has configured.

The big win of going through `state.storage` rather than calling `tokio::fs` directly is that your extension Just Works regardless of the deployment shape. An operator running everything on a single VPS gets a filesystem-backed install; an operator running a horizontally-scaled deployment configures S3 in their settings; your extension code is identical in both cases. Same `store(...)`, same `remove(...)`, same public URLs handed back to clients.

This page covers the storage API, the convention around well-known directory prefixes, and a handful of escape hatches for cases the high-level API doesn't fit.

## The Three Operations You'll Actually Use

Most extensions only ever need three methods on `state.storage`:

- **`store(path, data, content_type)`** - write a file. Takes any `AsyncRead` for the body, returns the number of bytes written.
- **`remove(path)`** - delete a file by path. No-op if the file doesn't exist.
- **`retrieve_urls()`** - get a helper that turns paths into publicly-accessible URLs.

Here's a concrete example - storing a user-uploaded image and returning a URL the frontend can use to display it:

```rs
use shared::{
    GetState,
    models::{server::GetServer, user::GetPermissionManager},
    response::{ApiResponse, ApiResponseResult},
};
use uuid::Uuid;

pub async fn route(
    state: GetState,
    permissions: GetPermissionManager,
    server: GetServer,
    mut multipart: axum::extract::Multipart,
) -> ApiResponseResult {
    permissions.has_server_permission("my-feature.upload")?;

    let field = multipart
        .next_field()
        .await?
        .ok_or_else(|| ApiResponse::error("no file uploaded"))?;

    let content_type = field
        .content_type()
        .map(String::from)
        .unwrap_or_else(|| "application/octet-stream".to_string());

    let path = format!(
        "privatedata/extensions/dev.yourname.my-feature/{}/{}.bin",
        server.uuid,
        Uuid::new_v4(),
    );

    let body = field.bytes().await?;
    let bytes_written = state
        .storage
        .store(&path, std::io::Cursor::new(body), &content_type)
        .await?;

    let urls = state.storage.retrieve_urls().await?;
    let url = urls.get_url(&path);

    ApiResponse::new_serialized(serde_json::json!({
        "url": url,
        "size": bytes_written,
    }))
    .ok()
}
```

A few things to call out:

- **`store` accepts any `AsyncRead`** - direct from a multipart upload, from a `tokio::fs::File`, from a `Cursor` over an in-memory buffer, from an HTTP stream, anything. No need to buffer the whole file into memory unless you want to.
- **The path is yours to construct.** No `id`-keyed lookup, no auto-generated names. The path you pass to `store` is the path used to retrieve and remove later. UUIDs in the filename are a good idea if you don't want users to be able to guess each other's filenames.
- **`retrieve_urls()` returns a helper, not a URL directly.** This is because it needs to read the storage settings, and that's an awaited operation - getting the helper once and calling `.get_url(...)` repeatedly is cheaper than awaiting per call. Hold on to it for the lifetime of your handler if you're constructing many URLs.

::: info
The path **must not** contain `..`, start with `/`, or be empty. The store method enforces this and returns an error if you violate it. This is your built-in protection against path-traversal bugs, but only if you're using `state.storage.store` directly - if you reach for the lower-level cap filesystem API (covered later), you have to enforce it yourself.
:::

## The Well-Known Directory Prefixes

Storage paths are global - whatever you write to `foo/bar.txt` is reachable as `foo/bar.txt` to everyone using the same backend. To keep extensions, the core Panel, and admin operations from stepping on each other, there's a convention around top-level directories.

| Prefix | Public? | What it's for |
| --- | --- | --- |
| `assets/` | Yes | Admin assets - logos, branding images, anything the admin panel needs publicly available. |
| `avatars/` | Yes | User avatar images. Structure is `avatars/{user_uuid}/{random}.webp`. **Don't write here directly** unless you're confident; the core Panel manages this and a botched write can leave a user with a missing or corrupted avatar. |
| `userdata/` | Yes | Currently unused by the base Panel; available for extension use. Suggested structure: `userdata/extensions/{your.package.identifier}/...`. |
| `privatedata/` | No | Not publicly accessible. Same suggested structure as `userdata/`: `privatedata/extensions/{your.package.identifier}/...`. |

The "publicly accessible" distinction is enforced at the storage layer - paths under public prefixes are reachable via the URL `retrieve_urls().get_url(path)` returns, and paths under `privatedata/` aren't. If you write to `privatedata/...` and then call `get_url(...)` on it, the returned URL won't actually serve the file; it's the responsibility of your extension's own routes to authenticate-and-serve from `privatedata/`.

The most common pattern for extensions:

- **User-facing files that anyone with the link can see** (display avatars, exported chart images, etc.) → `userdata/extensions/dev.yourname.my-feature/...`
- **Files that should require authentication** (private user data, internal exports, anything sensitive) → `privatedata/extensions/dev.yourname.my-feature/...` and serve them through your own permissioned route.

Both prefixes accept the same path shape. Picking between them is purely about whether you want anyone-with-the-URL access or not.

::: warning Don't reach for `assets/` or `avatars/` unless you mean it
The `assets/` prefix is for admin-managed branding; the `avatars/` prefix is structured around user UUIDs and managed by core. Writing into either of these from your extension can collide with core Panel operations - extensions should default to `userdata/` or `privatedata/` and only use `assets/` or `avatars/` if you have a specific, documented reason to be touching that namespace.
:::

## Getting Public URLs

`retrieve_urls()` returns a `StorageUrlRetriever` that wraps the current settings. Call `.get_url(path)` on it to turn a storage path into a URL the frontend can hit:

```rs
let urls = state.storage.retrieve_urls().await?;

let avatar_url = urls.get_url("userdata/extensions/dev.yourname.my-feature/some-image.webp");
// Filesystem backend: "https://panel.example.com/userdata/extensions/dev.yourname.my-feature/some-image.webp"
// S3 backend:         "https://cdn.example.com/userdata/extensions/dev.yourname.my-feature/some-image.webp"
```

The format depends on the configured driver: filesystem-backed installs serve through the Panel itself (URL prefixed with `app.url`), S3-backed installs serve from the configured `public_url` (typically a CDN). Either way, your extension code doesn't care - you get a URL string, you hand it to the frontend.

For paths under `privatedata/`, `get_url(...)` will still return *a* URL, but hitting it won't serve the file. Treat the returned value as a path identifier for your own routes' use, not as something to expose to clients.

## Storing Streamed Data

The `store` signature takes `impl tokio::io::AsyncRead`, which means you can pipe directly from a download, a multipart upload, or any other async source without buffering the whole thing into memory:

```rs
// Streaming a file from another HTTP service
let response = state.client.get(remote_url).send().await?;
let stream = response
    .bytes_stream()
    .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e));
let mut reader = tokio_util::io::StreamReader::new(stream);

let bytes = state
    .storage
    .store(
        "userdata/extensions/dev.yourname.my-feature/cached-asset.bin",
        &mut reader,
        "application/octet-stream",
    )
    .await?;
```

This is also the right pattern for large files - if a user is uploading a 500 MB report and you store it through the streaming API, peak memory use stays low.

## Listing Files

For admin-style "show me what's in this directory" use cases, there's `state.storage.list(base, directory, page, per_page)`:

```rs
let page = state
    .storage
    .list("userdata/extensions/dev.yourname.my-feature", "", 1, 50)
    .await?;

for asset in page.data {
    println!("{} ({} bytes) - {}", asset.name, asset.size, asset.url);
}
```

Returns a paginated list of `StorageAsset` entries, each with name, size, URL, creation time, and a flag indicating whether it's a directory or a file. Directories sort before files, both alphabetically.

This method is primarily used by the admin panel's asset-browser UI; most extensions don't need it. If you're tracking your own files (you wrote them, you know where they are), prefer keeping a record in your own database table - that's both faster than listing the storage backend and more flexible for the kinds of queries your code actually wants to do.

## Temporary Files

Sometimes you need a file briefly - to write some intermediate output, to hand a path to a subprocess, to do anything that involves "I need this file to exist for the next ten seconds and then disappear." **Don't use `state.storage` for this.** That's persistent storage; using it for ephemeral data means your operator's S3 bill goes up and you have to remember to delete the file when you're done.

The right tool is the [tempfile](https://docs.rs/tempfile) crate, which is already in the workspace. You'll be able to use it directly:

```rs
use tempfile::NamedTempFile;

let mut tempfile = NamedTempFile::new()?;
// write to tempfile, hand it to a subprocess, do whatever
// drops on scope exit, file is deleted automatically
```

Use `state.storage` for things you want to keep; use `tempfile` for things you want to throw away.

## Cap Filesystem Access (Escape Hatch)

For cases where the high-level API isn't enough - random-access reads, complex directory traversal, file metadata operations - you can get a [cap-std](https://docs.rs/cap-std)-style filesystem rooted at a specific path under the storage base. This is **only available when the storage driver is Filesystem**; on S3 deployments, this method returns `None` and you're stuck with the high-level API.

```rs
use std::path::Path;

let settings = state.settings.get().await?;
let cap_fs = match settings.storage.get_cap_filesystem("userdata/extensions/dev.yourname.my-feature").await {
    Some(Ok(fs)) => fs,
    Some(Err(err)) => return Err(err.into()),
    None => {
        // S3 backend - fall back to the high-level API
        return Err(ApiResponse::error("operation requires filesystem storage backend"));
    }
};

// Now use cap_fs.async_read_dir, cap_fs.async_metadata, etc.
```

::: warning Path traversal is a real risk here
**The path you pass to `get_cap_filesystem` must not contain user input.** That argument is the *root* of the resulting cap filesystem, and a `..` or absolute-path injection at that point would let the user escape the storage area entirely. The whole reason cap-std exists is to safely contain user-controlled paths *inside* an opened filesystem, not when opening it.

The pattern is:
- Hardcode the root (or build it from values you fully control, like your own extension identifier)
- Open the cap filesystem rooted there
- *Then* let user input flow into operations on the opened filesystem - those operations are sandboxed to the root and `..` segments can't escape

If you put user input in the call to `get_cap_filesystem` itself, you've defeated the protection.
:::

A few more reasons most extensions shouldn't reach for this:

- It only works on filesystem deployments. If you ship an extension that requires it, operators on S3 can't use your extension.
- The high-level `store` / `remove` / `retrieve_urls` API does what most code needs and is portable across both backends.
- For temporary scratch space (which is the most common reason people *think* they need raw filesystem access), the [tempfile](https://docs.rs/tempfile) crate is what you actually want.

If you have a specific, justifiable reason to need cap-filesystem access - large directory operations, things the high-level API doesn't expose - this is the supported path. But default to the high-level API and only reach for this when you've established you actually need it.
