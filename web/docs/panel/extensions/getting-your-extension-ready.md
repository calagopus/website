# Getting your Extension ready

Once you've finished developing your extension, there are a few things to do before it's ready to ship. This guide walks through the pre-export checks you should run, then how to produce the `.c7s.zip` file that users will install.

This guide assumes you already have a working [Development Environment](./dev-environment.md) and an extension initialized under `frontend/extensions/<package_identifier>` and `backend/extensions/<package_identifier>` (see [Extension File Structure](./file-structure.md) for how the layout works). Throughout this guide, `<package_name>` refers to your extension's regular (dotted) package name - for example, `dev.0x7d8.test`. The exported file uses the underscored form of that same name (e.g. `dev_0x7d8_test.c7s.zip`).

## Pre-export checks

These checks are not strictly required for `panel-rs extensions export` to succeed, but you should run them before every export. They catch the vast majority of issues that would otherwise bite your users on install.

### Backend: format and lint

Run these from the Panel repository root.

```bash
cargo fmt
cargo clippy
```

`cargo fmt` rewrites your extension's Rust code to match the project's formatting style. It edits files in place, so always commit or stash before running it if you want to review the diff.

`cargo clippy` runs Rust's linter against your code. Clippy warnings often point at real correctness issues (misuse of `unwrap`, unnecessary clones, suspicious patterns), not just style - read them rather than silencing them. Your extension should produce no new warnings before you export.

### Frontend: format, lint, and build check

Run these from the `frontend/` directory.

```bash
cd frontend
pnpm biome:fix-unsafe
pnpm build:ci
```

`pnpm biome:fix` runs [Biome](https://biomejs.dev) with its auto-fixes enabled. This normalizes formatting and fixes a broader set of lint issues - after running it once, run it again to see things that you need to manually look at. Like `cargo fmt`, it edits files in place, so commit or stash before running if you want to review the diff.

`pnpm build:ci` does a full production frontend build with all extensions compiled in. If your extension has a TypeScript error, a bad import, or a missing dependency in its `package.json`, this is where you'll catch it. The exported `.c7s.zip` ships your source, not a build artifact, so users will hit the same error on their side if you skip this step.

::: warning
If `pnpm build:ci` fails because of an extension other than yours, that extension has problems of its own - but your extension still won't build cleanly alongside it. Fix what you own; for anything else, reach out to that extension's author or temporarily remove it from `frontend/extensions/` while you iterate.
:::

## Exporting the extension

Once the checks above pass, run the export command from the Panel repository root:

```bash
panel-rs extensions export <package_name>
```

For example, for a package named `dev.0x7d8.test`:

```bash
panel-rs extensions export dev.0x7d8.test
```

This bundles the frontend, backend, database migrations, `Cargo.toml`, and `Metadata.toml` for that extension into a single `.c7s.zip` file and writes it to `./exported-extensions/` relative to your current directory. The output filename uses the underscored form of the package name:

```bash
ls -lh ./exported-extensions/
# dev_0x7d8_test.c7s.zip
```

That `.c7s.zip` is the file you distribute. Users can install it through either a `:heavy` Docker deployment or a local dev environment - see [Installing Extensions](./installing-extensions.md) for their side of the process.

## Shipping checklist

Before you publish a release, quickly run through:

- `cargo fmt` produced no unexpected changes (or you reviewed and committed them).
- `cargo clippy` is clean, or every remaining warning is something you've deliberately decided to accept.
- `pnpm biome:fix-unsafe` produced no unexpected changes.
- `pnpm build:ci` succeeds.
- The `version` field in your extension's `Cargo.toml` has been bumped if this is a new release.
- The panel version requirement in your extension's `Metadata.toml` is still correct - bump it if your extension relies on APIs added in a newer Panel release.
- `panel-rs extensions export <package_name>` produced a `.c7s.zip` in `./exported-extensions/`.
- You've test-installed the exported `.c7s.zip` into a clean Panel instance to confirm it works end-to-end.

The last step is the one most often skipped and most often responsible for broken releases. Do it.
