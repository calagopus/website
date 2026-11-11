---
title: Patching and Adding Translations
description: Patch the Panel translations or add whole languages from the heavy image, with JSON override files deep-merged over the shipped strings.
---

# Patching and Adding Translations

The heavy image lets you patch the Panel's own translations, for example to reword a label or fill in keys for a language, without forking the Panel or building the image yourself. You drop small JSON override files into a directory, trigger a rebuild, and the heavy image deep-merges your changes on top of the base translations the Panel ships.

::: info This is the operator-level mechanism, not the extension one
This page is about overriding the **base Panel's** translations as an operator running the heavy image. If you're an extension author and want to ship translations _with your extension_, that's a different, simpler workflow; see [Concepts → Translations](./concepts/translations.md). The two don't conflict: extensions declare their own keys, and this override mechanism patches whatever ends up in the final translation files.

This only works on the **heavy image**. If you're still on the regular image, start with [Switching to the Heavy Image](./switching-to-the-heavy-image.md).
:::

## How It Works

When you switched to the heavy image you added a `./build/translations` volume mount that maps to `/app/translations` inside the container:

```yml
volumes:
  - ./build/translations:/app/translations
```

The heavy image's entrypoint does three things:

1. **Copies the Panel's base translation files** into `/app/translations/`, one flat JSON file per language (`en.json`, `de.json`, `es.json`, `fr.json` and so on). This runs on every boot and after every rebuild, so these top-level files are _regenerated from the shipped Panel_ each time. They are there for you to read, as the reference for what keys exist.
2. **Stages your changes, before the frontend is built.** Any top-level `<lang>.json` that isn't one of the shipped filenames is staged as a new language, and every `*.json` in `/app/translations/overrides/` is deep-merged onto the base language with the **same filename**. So `overrides/en.json` merges into `en.json`, `overrides/de.json` into `de.json`, and so on.
3. **Builds the frontend from that staged set.** The result is compiled into the Panel binary, which is where the Panel serves translations from, so your changes only take effect through a rebuild (see [Applying Your Changes](#applying-your-changes)).

Mapped back to your host, the override directory is:

```text
./build/translations/overrides/
```

::: warning Edit the overrides, never the top-level files
The top-level files for languages the Panel already ships (`./build/translations/en.json`, etc.) are **overwritten from the base Panel on every boot**, and edits to them are both wiped and ignored by the build. The `overrides/` directory is the place for your changes. Because step 1 regenerates the base and step 2 reapplies your overrides on top, your patches survive Panel upgrades automatically (as long as the keys still exist).
:::

## The Merge

The merge is a recursive deep-merge:

- **Objects are merged key-by-key**, recursively. You only name the keys you want to change; everything else keeps the Panel's value.
- **Strings, numbers, and arrays are replaced** wholesale at the leaf.

An override file only mirrors the part of the structure you change, not the whole file.

## File Shape

Each language file has two top-level keys, `items` and `translations`, exactly like the [extension translation files](./concepts/translations.md#shipping-custom-translations-with-your-extension):

- **`translations`**: regular strings, nested as deeply as the Panel nests them. The Panel's convention is `pages.<section>.<page>.<element>` with leaf categories like `button`, `modal`, `form`, `toast`, `error`. Anything in `{braces}` is an interpolation variable; keep it intact or the string breaks.
- **`items`**: pluralized count strings, each with the six CLDR plural categories (`zero`, `one`, `two`, `few`, `many`, `other`).

The base file you're patching against is the Panel's [`frontend/src/translations.ts`](https://github.com/calagopus/panel/blob/main/frontend/src/translations.ts) (the generated JSON lives at `./build/translations/en.json` on your host once the container has booted; open it to find the exact key path you want to change).

## Patching an Existing String

Say you want to reword the English account page title and tweak a button label. Find the keys in `en.json`, then create `./build/translations/overrides/en.json` containing **only** those keys, nested to match:

```json
{
  "translations": {
    "pages": {
      "account": {
        "home": {
          "title": "My Dashboard"
        }
      }
    },
    "common": {
      "button": {
        "save": "Save changes"
      }
    }
  }
}
```

Everything else in `en.json` stays as it is; the merge only overwrites `pages.account.home.title` and `common.button.save`.

## Filling In or Fixing a Translated Language

The exact same mechanism works for any language the Panel ships. To override a German string, create `./build/translations/overrides/de.json`:

```json
{
  "translations": {
    "common": {
      "button": {
        "save": "Speichern"
      }
    }
  }
}
```

If you're filling in a pluralized item, provide every plural category your language uses. The [Unicode CLDR plural rules table](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) is the authoritative reference for which categories a language needs.

```json
{
  "items": {
    "server": {
      "zero": "{count} Server",
      "one": "{count} Server",
      "two": "{count} Server",
      "few": "{count} Server",
      "many": "{count} Server",
      "other": "{count} Server"
    }
  }
}
```

You can patch any language the Panel already ships. To see what's available, look at the top-level `<lang>.json` files under `./build/translations/` after a rebuild, or hit `GET /api/languages`.

## Adding a Brand-New Language

For a language the Panel doesn't ship yet, drop a top-level file straight into the translations volume. (An `overrides/` file with no base is staged as a standalone language too, but the top-level file is the intended place and keeps the two directories meaning different things.)

```text
./build/translations/<lang>.json
```

The easiest way to start is to copy the shipped English file and translate it in place:

```bash
sudo cp ./build/translations/en.json ./build/translations/eo.json
# then translate the values in eo.json
```

On the next rebuild this file is compiled into the Panel binary alongside the shipped languages, so the new language is **served** at `/translations/<lang>.json` _and_ listed by `/api/languages`, which is what populates the language picker in account settings. The picker labels it using the browser's own locale data, so a valid language code shows up under its proper name with nothing further to register. (The boot-time copy of the shipped defaults only writes over their own filenames - it leaves your extra file alone.)

Pick a filename the Panel doesn't already ship. A top-level file whose name matches a shipped language is treated as the regenerated base copy and ignored; to change a shipped language, use `overrides/` instead. The supervisor keeps the list of shipped names in `./build/translations/.shipped.json`, and the list only grows, so a language the Panel once shipped stays reserved even if a later release drops it.

You don't have to translate everything up front. Any key you leave out falls back to its **English** value, so a partial file works: users on that language see English for whatever you haven't translated yet, and you can fill more in over time. Where your language uses extra plural forms, fill in the CLDR categories that apply (`zero`, `one`, `two`, `few`, `many`, `other`); the [Unicode CLDR plural rules table](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) is the reference.

::: info overrides/ vs. a top-level file
A file in `overrides/` _patches_ a language: it is merged on top, so it can be a small partial. A file directly in `./build/translations/` _is_ a language: it stands on its own (with English filling any gaps). Use the first to tweak a shipped language, the second to introduce a new one.
:::

## Applying Your Changes

Translations are compiled into the binary, so they take effect **through a rebuild**. After you add or edit a language file or an override, trigger one:

- **From the admin UI:** go to the extensions management page and click **Rebuild extensions**. (Requires the `extensions.manage` admin permission.)
- It also runs automatically as part of any extension install/uninstall rebuild.
- A `sudo docker compose restart` picks the change up too: the entrypoint notices the translations differ from whatever the cached binary was built with and rebuilds on boot.

Rebuilds are cached by the combination of your installed extensions _and_ your translation files, so a translations-only edit is enough to invalidate the cache and produce a real build. Once it finishes, reload the Panel and your strings are live.

::: info The rebuild takes a while, and the Panel stays up
A rebuild compiles the frontend and the binary. The Panel keeps serving on the previous binary while that happens and switches over when it finishes, so there is no downtime, but your strings don't change until it completes. Watch the extension build log if you want to follow along.
:::

::: warning Reverting a change also needs a rebuild
Removing a language file or an override doesn't take effect until the next rebuild either. Because the cache key follows your translation files, deleting them often returns you to a binary that was already built and cached, which makes that particular rebuild instant; the cache only keeps the three newest builds, though, so an older state may need a real rebuild.
:::

## Caveats

- **Override existing keys, don't invent new ones.** The override is merged into the base file, but the Panel's frontend only _reads_ keys it knows about. Adding a key the Panel never references does nothing; patch keys that already exist.
- **Keep interpolation variables intact.** If the original string is `Showing {start} to {end} of {total} results.`, your override has to keep `{start}`, `{end}` and `{total}`; dropping or renaming them breaks the rendered string.
- **Patches follow the base, not the other way around.** Because the base is regenerated every rebuild, if a Panel upgrade renames or removes a key, your override for the old key simply has nothing to merge into and silently stops applying. After a major upgrade, skim the diff in `./build/translations/en.json` if a patched string reverts.
- **Valid JSON only.** A malformed override file is logged and skipped during the rebuild; check the extension build log if a change doesn't apply.
