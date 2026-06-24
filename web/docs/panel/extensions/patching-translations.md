# Patching and Adding Translations

The heavy image lets you patch the Panel's own translations - reword a label, fix a phrasing you don't like, or fill in keys for a language - without forking the Panel or rebuilding the image yourself. You drop small JSON override files into a directory, trigger a rebuild, and the heavy image deep-merges your changes on top of the base translations the Panel ships.

::: info This is the operator-level mechanism, not the extension one
This page is about overriding the **base Panel's** translations as an operator running the heavy image. If you're an extension author and want to ship translations *with your extension*, that's a different (and simpler) workflow - see [Concepts → Translations](./concepts/translations.md). The two don't conflict: extensions declare their own keys, and this override mechanism patches whatever ends up in the final translation files.

This only works on the **heavy image**. If you're still on the regular image, start with [Switching to the Heavy Image](./switching-to-the-heavy-image.md).
:::

## How It Works

When you switched to the heavy image you added a `./build/translations` volume mount that maps to `/app/translations` inside the container:

```yml
volumes:
  - ./build/translations:/app/translations
```

On every rebuild, the heavy image's entrypoint does two things, in order:

1. **Copies the Panel's base translation files** into `/app/translations/` - one flat JSON file per language (`en.json`, `de.json`, `es.json`, `fr.json`, …). This always runs, so these top-level files are *regenerated from the shipped Panel* each time.
2. **Applies your overrides.** For every `*.json` file in `/app/translations/overrides/`, it deep-merges that file into the top-level file with the **same filename**. So `overrides/en.json` merges into `en.json`, `overrides/de.json` into `de.json`, and so on.

Mapped back to your host, the override directory is:

```text
./build/translations/overrides/
```

::: warning Edit the overrides, never the top-level files
The top-level files (`./build/translations/en.json`, etc.) are **overwritten from the base Panel on every rebuild**. Any edit you make there is wiped. The `overrides/` directory is the durable, upgrade-safe place to put your changes - because step 1 regenerates the base and step 2 reapplies your overrides on top, your patches survive Panel upgrades automatically (as long as the keys still exist).
:::

## The Merge

The merge is a recursive deep-merge (see [`applyJson.js`](https://github.com/calagopus/panel/blob/main/docker/applyJson.js)):

- **Objects are merged key-by-key**, recursively. You only name the keys you want to change; everything else keeps the Panel's value.
- **Strings, numbers, and arrays are replaced** wholesale at the leaf.

This means an override file is small - it mirrors only the slice of the structure you're touching, not the whole file.

## File Shape

Each language file has two top-level keys, `items` and `translations`, exactly like the [extension translation files](./concepts/translations.md#shipping-custom-translations-with-your-extension):

- **`translations`** - regular strings, nested as deeply as the Panel nests them. The Panel's convention is `pages.<section>.<page>.<element>` with leaf categories like `button`, `modal`, `form`, `toast`, `error`. Anything in `{braces}` is an interpolation variable - keep it intact or the string breaks.
- **`items`** - pluralized count strings, each with the six CLDR plural categories (`zero`, `one`, `two`, `few`, `many`, `other`).

The base file you're patching against is the Panel's [`frontend/src/translations.ts`](https://github.com/calagopus/panel/blob/main/frontend/src/translations.ts) (the generated JSON lives at `./build/translations/en.json` on your host after the first rebuild - open it to find the exact key path you want to change).

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

Everything else in `en.json` is left untouched - the merge only overwrites `pages.account.home.title` and `common.button.save`.

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

For a language the Panel doesn't ship yet, you don't use `overrides/` - those *merge into* an existing file, and there's nothing to merge into. Instead, drop a top-level file straight into the translations volume:

```text
./build/translations/<lang>.json
```

The easiest way to start is to copy the shipped English file and translate it in place:

```bash
cp ./build/translations/en.json ./build/translations/eo.json
# then translate the values in eo.json
```

On the next rebuild this file is compiled into the Panel binary alongside the shipped languages, so the new language is **served** at `/translations/<lang>.json` *and* listed by `/api/languages`, which is what populates the language picker in account settings. (The boot-time copy of the shipped defaults only writes over their own filenames - it leaves your extra file alone.)

You don't have to translate everything up front. Any key you leave out falls back to its **English** value, so a partial file is perfectly usable - users on that language just see English for whatever you haven't translated yet, and you can fill more in over time. Where your language uses extra plural forms, fill in the CLDR categories that apply (`zero`, `one`, `two`, `few`, `many`, `other`); the [Unicode CLDR plural rules table](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) is the reference.

::: info overrides/ vs. a top-level file
A file in `overrides/` *patches* a language - merged on top, so it can be a tiny partial. A file directly in `./build/translations/` *is* a language - it stands on its own (with English filling any gaps). Use the first to tweak a shipped language, the second to introduce a new one.
:::

## Applying Your Changes

Overrides are applied **during a rebuild**, not on a plain container restart. After you add or edit a file in `overrides/`, trigger a rebuild:

- **From the admin UI:** go to the extensions management page and click **Rebuild**. (Requires the `extensions.manage` admin permission.)
- It also runs automatically as part of any extension install/uninstall rebuild.

Once the rebuild finishes, reload the Panel and your strings are live.

::: warning A plain restart is not enough
On a bare `docker compose restart`, the entrypoint regenerates the top-level files from the base Panel but does **not** reapply overrides unless a rebuild actually runs. If your patched strings revert to the Panel defaults after a restart, trigger a rebuild from the admin UI to reapply the overrides.
:::

## Caveats

- **Override existing keys, don't invent new ones.** The override is merged into the base file, but the Panel's frontend only *reads* keys it knows about. Adding a key the Panel never references does nothing; patch keys that already exist.
- **Keep interpolation variables intact.** If the original string is `Showing {start} to {end} of {total} results.`, your override has to keep `{start}`, `{end}`, and `{total}` - dropping or renaming them breaks the rendered string.
- **Patches follow the base, not the other way around.** Because the base is regenerated every rebuild, if a Panel upgrade renames or removes a key, your override for the old key simply has nothing to merge into and silently stops applying. After a major upgrade, skim the diff in `./build/translations/en.json` if a patched string reverts.
- **Valid JSON only.** A malformed override file is logged and skipped during the rebuild rather than applied - check the extension build log if a change doesn't take.
