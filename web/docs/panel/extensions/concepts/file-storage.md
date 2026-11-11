---
next: false
description: How Calagopus extensions store and serve files through the Panel's Storage abstraction, which targets the local filesystem or an S3-compatible bucket.
---

# File Storage

Some extensions need to store files that don't fit in a database row, such as user uploads, generated reports, exports or cached external assets. The Panel handles this through a `Storage` abstraction available at `state.storage`, which routes file operations to either the local filesystem or an S3-compatible bucket depending on what the operator has configured.

Going through `state.storage` instead of calling `tokio::fs` directly means your extension works on any deployment. A single VPS uses the filesystem, a horizontally scaled deployment configures S3, and your code is the same in both cases: the same `store(...)`, `remove(...)` and public URLs.

This page covers the storage API, the convention around well-known directory prefixes, and a handful of escape hatches for cases the high-level API doesn't fit.

## The Three Operations You'll Actually Use

Most extensions only ever need three methods on `state.storage`:

- **`store(path, data, content_type)`**: write a file. Takes any `AsyncRead` for the body, returns the number of bytes written.
- **`remove(path)`**: delete a file by path. Takes an `Option`, so `None` is a no-op; it's also a no-op if the file doesn't exist.
- **`retrieve_urls()`**: get a helper that turns paths into public URLs.

This example stores a user-uploaded image and returns a URL the frontend can display:

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

- **`store` accepts any `AsyncRead + Unpin`**: a multipart upload, a `tokio::fs::File`, a `Cursor` over an in-memory buffer, an HTTP stream. You don't have to buffer the whole file in memory. The `content_type` only reaches S3; the filesystem driver ignores it and serves public files with a type derived from the extension, so name files with a real extension rather than `.bin` if browsers should render them.
- **The path is yours to construct.** No `id`-keyed lookup, no auto-generated names. The path you pass to `store` is the path used to retrieve and remove later. UUIDs in the filename are a good idea if you don't want users to be able to guess each other's filenames.
- **`retrieve_urls()` returns a helper, not a URL directly.** It has to read the storage settings, which is an awaited operation, so getting the helper once and calling `.get_url(...)` repeatedly is cheaper. Keep it for the lifetime of your handler if you build many URLs.

::: info
The path **must not** contain `..`, start with `/`, or be empty. The store method enforces this and returns an error if you violate it. That protects against path traversal, but only through `state.storage.store`; with the lower-level cap filesystem API (covered later), you have to enforce it yourself.
:::

## The Well-Known Directory Prefixes

Storage paths are global: whatever you write to `foo/bar.txt` is `foo/bar.txt` for everyone using the same backend. A convention for top-level directories keeps extensions, the core Panel and admin operations apart.

| Prefix         | Public? | What it's for                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/`      | Yes     | Admin assets: logos, branding images and anything else the admin panel makes public.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `avatars/`     | Yes     | User avatar images. Structure is `avatars/{user_uuid}/{identifier}.webp`, where the identifier is random for an uploaded avatar, and for one imported from an OAuth provider is a digest of the source URL followed by a digest of the stored image. An avatar path never gets new content, so browsers can cache it forever. **Don't write here directly** unless you're confident; the core Panel manages this and a botched write can leave a user with a missing or corrupted avatar. |
| `publicdata/`  | Yes     | Currently unused by the base Panel; available for extension use. Suggested structure: `publicdata/extensions/{your.package.identifier}/...`.                                                                                                                                                                                                                                                                                                                                              |
| `privatedata/` | No      | Not publicly accessible. Same suggested structure as `publicdata/`: `privatedata/extensions/{your.package.identifier}/...`.                                                                                                                                                                                                                                                                                                                                                               |

The "publicly accessible" distinction is enforced by the Panel's HTTP layer, not by `Storage` itself, and only on the filesystem driver: the Panel serves `assets/`, `avatars/` and `publicdata/` from disk and answers 404 for everything else, so a `privatedata/` URL is dead there. On S3 the Panel serves nothing at all and `get_url` is plain string concatenation onto the configured public URL, which means whether `privatedata/...` is reachable depends entirely on the bucket or CDN policy the operator set up. Treat `privatedata/` as a convention you enforce yourself: keep the bucket private, and have your extension's own routes authenticate and stream those files.

The most common pattern for extensions:

- **User-facing files that anyone with the link can see** (display avatars, exported chart images, etc.) → `publicdata/extensions/dev.yourname.my-feature/...`
- **Files that should require authentication** (private user data, internal exports, anything sensitive) → `privatedata/extensions/dev.yourname.my-feature/...` and serve them through your own permissioned route.

Both prefixes accept the same path shape. Picking between them is purely about whether you want anyone-with-the-URL access or not.

::: warning Don't reach for `assets/` or `avatars/` unless you mean it
The `assets/` prefix is for admin-managed branding; the `avatars/` prefix is structured around user UUIDs and managed by core. Writing into either from your extension can collide with core Panel operations. Use `publicdata/` or `privatedata/`, and only touch `assets/` or `avatars/` for a specific, documented reason.
:::

## Getting Public URLs

`retrieve_urls()` returns a `StorageUrlRetriever` that wraps the current settings. Call `.get_url(path)` on it to turn a storage path into a URL the frontend can hit:

```rs
let urls = state.storage.retrieve_urls().await?;

let avatar_url = urls.get_url("publicdata/extensions/dev.yourname.my-feature/some-image.webp");
// Filesystem backend: "https://panel.example.com/publicdata/extensions/dev.yourname.my-feature/some-image.webp"
// S3 backend:         "https://cdn.example.com/publicdata/extensions/dev.yourname.my-feature/some-image.webp"
```

The format depends on the configured driver: filesystem-backed installs serve through the Panel itself (URL prefixed with `app.url`), S3-backed installs serve from the configured `public_url` (typically a CDN). Either way, your code gets a URL string and hands it to the frontend.

For paths under `privatedata/`, `get_url(...)` will still return _a_ URL. On the filesystem driver hitting it is a 404; on S3 it is whatever the bucket policy says. Treat the returned value as a path identifier for your own routes' use, not as something to expose to clients.

The retriever holds a read guard on the settings for as long as it lives. Since Panel 1.2.9 that guard is a snapshot: holding one no longer blocks settings writes, and the retriever keeps using the settings it started with, missing later storage changes. Before 1.2.9 the guard blocked the next settings write. Either way, it is fine for the lifetime of a request handler, but don't park one in a long-running task.

## Cache Headers

How long browsers keep a public file depends on its prefix. On the filesystem driver the Panel sets the headers itself when it serves the file:

| Prefix                   | `Cache-Control`                       | Why                                                                                                                                                                   |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `avatars/`               | `public, max-age=31536000, immutable` | Every avatar path is unique to its content, so a browser never needs to ask again.                                                                                    |
| `assets/`, `publicdata/` | `no-cache`                            | Paths can be overwritten with new content. Browsers revalidate with `If-Modified-Since` against the file's `Last-Modified` time and get a `304` when nothing changed. |

You can't change this policy for filesystem storage, so an extension writing to `publicdata/` gets `no-cache`. If a file under your prefix is replaced, clients see the new version on their next request.

On S3 the Panel doesn't serve anything, so the headers come from the object itself. `store` uploads objects with no `Cache-Control`, which leaves caching up to the bucket and CDN. To attach one, use `store_with_cache_control`, which takes the same arguments plus an `Option<&str>`:

```rs
state
    .storage
    .store_with_cache_control(
        &path,
        std::io::Cursor::new(body),
        "image/webp",
        Some("public, max-age=31536000, immutable"),
    )
    .await?;
```

The value is stored as object metadata on S3 and ignored by the filesystem driver. Only send `immutable` for paths that never get new content: put a content hash or a fresh UUID in the file name, and write a new path instead of overwriting the old one. Otherwise browsers and CDNs keep serving the stale file for a year.

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
        "publicdata/extensions/dev.yourname.my-feature/cached-asset.bin",
        &mut reader,
        "application/octet-stream",
    )
    .await?;
```

This is also the right pattern for large files: a 500 MB upload stored through the streaming API keeps peak memory use low.

## Listing Files

For admin-style "show me what's in this directory" use cases, there's `state.storage.list(base, directory, page, per_page)`:

```rs
let page = state
    .storage
    .list("publicdata/extensions/dev.yourname.my-feature", "", 1, 50)
    .await?;

for asset in page.data {
    println!("{} ({} bytes) - {}", asset.name, asset.size, asset.url);
}
```

Returns a paginated list of `StorageAsset` entries, each with name, size, URL, creation time, and a flag indicating whether it's a directory or a file. Directories sort before files, both alphabetically.

`list` is shallow: it returns the immediate children of `directory` and nothing deeper. Each returned `name` is the entry's path relative to `base`, so within a subdirectory you'll get `images/logo.png` rather than a bare `logo.png`. `base` must not be empty and `directory` must not end in a slash; both `list` and `search` reject those with an "invalid directory path" error, on top of the usual `..` and leading-slash rules.

This method is primarily used by the admin panel's asset-browser UI; most extensions don't need it. If you're tracking your own files (you wrote them, you know where they are), keep a record in your own database table instead. That is faster than listing the storage backend and lets you query it however you need.

## Searching by Name

Where `list` is shallow, `state.storage.search(base, directory, search, limit)` walks the entire subtree below `directory` and returns every entry whose **own name** contains `search`, matched case-insensitively:

```rs
let results = state
    .storage
    .search("publicdata/extensions/dev.yourname.my-feature", "", "report", 50)
    .await?;

for asset in results {
    println!("{} ({} bytes)", asset.name, asset.size);
}
```

Only the last path segment is matched, not the full path: a search for `report` finds `exports/q3-report.pdf` and the directory `reports/`, but not `reports/summary.pdf` (whose own name contains no `report`). Results are the same `StorageAsset` shape `list` returns, with `name` again relative to `base`, and directories sorted before files.

Two differences from `list` worth internalising:

- **It isn't paginated.** You get a flat `Vec<StorageAsset>` of at most `limit` entries. There's no page cursor and no total count; if more matched than `limit`, the rest are dropped without notice.
- **An empty `search` is an error**, not a "match everything". If your caller might pass a blank string, branch to `list` instead of forwarding it.

::: warning Searching is O(subtree), and on S3 that's network
Neither backend can do substring matching itself. On filesystem the Panel walks the directory tree; on S3 it issues `ListObjectsV2` **without a delimiter** across the whole prefix and filters the keys client-side, pulling up to 1000 keys per round trip. A search over a prefix holding tens of thousands of objects is many sequential API calls, and the cost falls on every keystroke if you wire it to a live-updating input.

An internal scan cap bounds this at 10,000 entries walked per call. Past that the walk stops and you get whatever matched so far, without any sign the results were cut short. On a large bucket, a broad search is not just slow but _incomplete_.

Debounce anything user-driven, scope the search to the narrowest `directory` you can, and treat the result as a browse aid rather than an authoritative answer to "does this file exist".
:::

The same advice as `list` applies, only more strongly: if the files are yours, index them in your own database table and query that. `search` exists for browsing storage nobody has indexed, as the admin panel's asset browser does, not as a general lookup.

## Temporary Files

Sometimes you need a file only briefly, for intermediate output or to hand a path to a subprocess. **Don't use `state.storage` for this.** It is persistent storage: temporary data there costs the operator S3 storage, and you have to remember to delete it.

The right tool is the [tempfile](https://docs.rs/tempfile) crate, which is already a workspace dependency. Add `tempfile = { workspace = true }` to your extension's `Cargo.toml` and use it directly:

```rs
use tempfile::NamedTempFile;

let mut tempfile = NamedTempFile::new()?;
// write to tempfile, hand it to a subprocess, do whatever
// drops on scope exit, file is deleted automatically
```

Use `state.storage` for things you want to keep; use `tempfile` for things you want to throw away.

## Cap Filesystem Access (Escape Hatch)

Where the high-level API isn't enough, such as random-access reads, complex directory traversal or file metadata operations, you can get a [cap-std](https://docs.rs/cap-std)-style filesystem rooted at a specific path under the storage base. This is **only available when the storage driver is Filesystem**; on S3 deployments it returns `None` and only the high-level API is available.

```rs
use std::path::Path;

let settings = state.settings.get().await?;
let cap_fs = match settings.storage_driver.get_cap_filesystem("publicdata/extensions/dev.yourname.my-feature").await {
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
**The path you pass to `get_cap_filesystem` must not contain user input.** That argument is the _root_ of the resulting cap filesystem, and a `..` or absolute-path injection at that point would let the user escape the storage area entirely. The whole reason cap-std exists is to safely contain user-controlled paths _inside_ an opened filesystem, not when opening it.

The pattern is:

- Hardcode the root (or build it from values you fully control, like your own extension identifier)
- Open the cap filesystem rooted there
- _Then_ let user input flow into operations on the opened filesystem; those operations are confined to the root, and `..` segments can't escape it

If you put user input in the call to `get_cap_filesystem` itself, you've defeated the protection.
:::

A few more reasons most extensions shouldn't reach for this:

- It only works on filesystem deployments. If you ship an extension that requires it, operators on S3 can't use your extension.
- The high-level `store` / `remove` / `retrieve_urls` API does what most code needs and is portable across both backends.
- For temporary scratch space (which is the most common reason people _think_ they need raw filesystem access), the [tempfile](https://docs.rs/tempfile) crate is what you actually want.

If you have a real need for cap-filesystem access, such as large directory operations the high-level API doesn't cover, this is the supported way. Otherwise, use the high-level API.
