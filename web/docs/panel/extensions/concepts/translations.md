---
title: Extension Translations
description: Declare and use translated strings in your extension with the Panel integrated translation system.
---

# Translations

Extensions use the Panel's built-in translation system, with no backend wiring or separate i18n library. You declare your translation keys once with their English values, lookups are type-checked, and JSON files for other languages, shipped by you or an operator, are picked up when a user selects that language.

This page covers declaring translation keys for your extension, using them in your React components and TypeScript code, and shipping translations for languages other than English.

## Defining Translations

All Panel translations use English as the base language. Every key needs an English translation; the framework uses that as the fallback if a translation for the user's selected language is unavailable. Practically speaking, this means **English is non-negotiable, every other language is optional**.

Create a `translations.ts` file in your extension's frontend `src/` directory:

```ts
import { defineTranslations } from 'shared';

const translations = defineTranslations({
  items: {},
  translations: {},
});

export const useExtTranslations = translations.useTranslations.bind(translations);
export const getExtTranslations = translations.getTranslations.bind(translations);

export default translations;
```

This is the empty skeleton; fill in the `items` and `translations` objects with your keys.

::: info
`defineTranslations` infers the types of every key you add. So `t('helloWrld', {})` (typo) or `t('fileCount', {})` (missing the `files` interpolation variable) will be a TypeScript compile error before it's a runtime error. You don't need a separate type definition.
:::

### Item Translations

The `items` object is for keys with a count attached: "1 File" vs "2 Files", "1 User" vs "5 Users". The framework uses [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules), so the same key picks the right plural form for whatever language is active (English has just `one`/`other`; Russian and Polish have several; Japanese has none).

```ts
import { defineEnglishItem, defineTranslations } from 'shared';

const translations = defineTranslations({
  items: {
    file: defineEnglishItem('File', 'Files'),
  },
  translations: {},
});

export const useExtTranslations = translations.useTranslations.bind(translations);
export const getExtTranslations = translations.getTranslations.bind(translations);

export default translations;
```

`defineEnglishItem(singular, plural)` is the English-specific helper. English only distinguishes one from many, so two strings are enough. The framework expands this internally to all six plural categories (`zero`, `one`, `two`, `few`, `many`, `other`), with everything that isn't `one` getting the plural form. For non-English translation files (covered later), authors fill in each plural category for their language individually.

### Regular Translations

The `translations` object is for everything else: labels, sentences and paragraphs without a count. Keys can be nested as deeply as you like; the access path uses dot notation:

```ts
import { defineEnglishItem, defineTranslations } from 'shared';

const translations = defineTranslations({
  items: {
    file: defineEnglishItem('File', 'Files'),
  },
  translations: {
    helloWorld: 'Hello World',
    fileCount: 'You have {files}',
    pages: {
      home: {
        title: 'My Extension',
        welcome: 'Welcome back, {username}!',
      },
    },
  },
});

export const useExtTranslations = translations.useTranslations.bind(translations);
export const getExtTranslations = translations.getTranslations.bind(translations);

export default translations;
```

Anything wrapped in `{braces}` is an **interpolation variable**, a placeholder you fill in at the call site. The base Panel uses these heavily (`'Showing {start} to {end} of {total} results.'`, for example), and you can do the same. The variable name in the template (`{files}`, `{username}`) needs to match what you pass in the call site object; both are type-checked.

::: info Look at the base Panel for naming conventions
The Panel's own translations are at [frontend/src/translations.ts](https://github.com/calagopus/panel/blob/main/frontend/src/translations.ts) and are worth reading before you invent your own structure. The convention used by core is `pages.<section>.<page>.<element>` (e.g. `pages.account.home.title`), with leaf categories like `button`, `modal`, `form`, `toast`, `error`, `alert`, `tooltip`, `placeholder`. Using the same shape in your extension makes its translation files easier for translators to find their way around.
:::

## Using Translations in Your Extension Code

You'll typically destructure `useExtTranslations` to keep its name distinct from the base Panel's `useTranslations`. The convention is to alias to `tExt`, `tExtReact`, and `tExtItem` so callsites read clearly:

```tsx
import { useExtTranslations } from './translations.ts';

export default function MyComponent() {
  const { t: tExt, tReact: tExtReact, tItem: tExtItem } = useExtTranslations();

  return (
    <div>
      <h1>{tExt('helloWorld', {})}</h1>
      <p>{tExt('fileCount', { files: tExtItem('file', 5) })}</p>
      <h2>{tExt('pages.home.title', {})}</h2>
    </div>
  );
}
```

For non-React contexts (utility functions, async API handlers, anything outside a component), use `getExtTranslations` instead. It has the same API without React.

```ts
import { getExtTranslations } from './translations.ts';

export function buildEmailSubject(filesCount: number): string {
  const { t, tItem } = getExtTranslations();
  return t('email.fileSummary.subject', { files: tItem('file', filesCount) });
}
```

### The Full Method Surface

Both `useExtTranslations()` and `getExtTranslations()` return an object with these methods:

| Method                | Returns     | Use when                                                                                                              |
| --------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| `t(key, values)`      | `string`    | Plain text rendering. Most cases.                                                                                     |
| `tReact(key, values)` | `ReactNode` | Your interpolation values include React nodes (links, icons, styled spans). Renders the surrounding text as Markdown. |
| `tItem(key, count)`   | `string`    | Pluralized count rendering. Returns "5 Files" / "1 File" / etc.                                                       |
| `setLanguage(lang)`   | `void`      | Programmatically switch the user's active language.                                                                   |
| `language`            | `string`    | The currently active language code (e.g. `'en'`, `'de'`, `'es'`).                                                     |

`setLanguage` and `language` are useful when building a custom language picker or reacting to the active language elsewhere in your code. The Panel itself ships a language picker in user account settings, so you usually don't need your own.

### Markdown in Translations

Translations support Markdown. There are two ways to render it, depending on what you're putting into the translation:

**`.md()` on the result of `t()`** for plain Markdown with no React content:

```tsx
const { t: tExt } = useExtTranslations();

return <p>{tExt('myMarkdownTranslation', {}).md()}</p>;
```

This is a `String.prototype` extension: calling `.md()` on any string returns a React element rendering it as Markdown. It works on the result of `t(...)`, which is a string, and on any other string.

**`tReact()` for translations that interpolate React nodes:**

```tsx
const { tReact: tExtReact } = useExtTranslations();

return (
  <p>
    {tExtReact('userMessage', {
      user: <strong>{currentUser.name}</strong>,
      link: <a href='/help'>help center</a>,
    })}
  </p>
);
```

`tReact` does the markdown rendering for the surrounding text _and_ splices ReactNode values into the right places at the placeholders. This is the only way to get React content into a translated string while keeping the surrounding text translatable.

**Pick by what you're putting in, not by what you're rendering:**

- All your interpolation values are strings or numbers? → use `t(...)`, optionally with `.md()` if you need markdown
- One or more interpolation values is a React node? → use `tReact(...)`

`tReact` _also_ renders markdown for the non-ReactNode parts of the translation, so a translation like `'Welcome **{name}**'` works through `tReact` even with a string `name`, but if you don't need React interpolation, `t(...).md()` is simpler.

### Missing Keys

If you call `t`, `tReact`, or `tItem` with a key that doesn't exist in the English base, the call **throws an Error**. A key that is only missing from the active language falls back to English, so the throw is reserved for keys nobody defined. There is no fallback to the key name, no empty string and no warning; the error goes up to the nearest error boundary.

This is intentional. With TypeScript-inferred key types, missing keys are caught at compile time. The runtime throw covers keys built dynamically (such as `t(\`status.${state}\`, {})`where`state` comes from an API): it is better to find out immediately than to show users a literal "status.frobnicated".

If you have genuinely-dynamic keys, narrow the input set with a TypeScript union or a runtime check before calling the translation function:

```ts
const STATES = ['running', 'stopped', 'starting'] as const;
type State = (typeof STATES)[number];

function statusLabel(state: State): string {
  // No dynamic-key footgun: TypeScript knows `state` is one of the three.
  return tExt(`status.${state}`, {});
}
```

## Shipping Custom Translations with Your Extension

By default, the Panel only uses the English translations you defined in `translations.ts`. To ship translations for other languages, drop a JSON file per language into your extension's `public/translations/<language>/` directory:

```yml
backend-extensions/
(package_name_with_underscores)/
frontend/
public/translations/
es/
dev.yourname.extension.json
de/
dev.yourname.extension.json
```

The filename is your package identifier: if your `Metadata.toml` says `package_name = "dev.0x7d8.test"`, the file is `dev.0x7d8.test.json`. The directory says the language code (`es` for Spanish, `de` for German, etc.). The build discovers the files through the `frontend/extensions/<identifier>` compatibility symlink described in [Extension File Structure](../file-structure.md#frontend), so the older path works too.

To get a starter file with the right shape, generate the English equivalent first, from the Panel's `frontend/` directory:

```bash
pnpm build:translations
```

The generated file lands in the Panel's own public directory, at `frontend/public/translations/en/dev.yourname.extension.json`, not inside your extension. Copy it, translate the English strings, and save it under the right language folder in your extension. Repeat per language.

The JSON file is **flat**: `items` and `translations` at the top level, with keys exactly as you defined them in `translations.ts`. The framework handles namespacing across extensions internally; you don't put your package identifier inside the JSON, only on the filesystem path.

```json
{
  "items": {
    "file": {
      "zero": "{count} archivos",
      "one": "{count} archivo",
      "two": "{count} archivos",
      "few": "{count} archivos",
      "many": "{count} archivos",
      "other": "{count} archivos"
    }
  },
  "translations": {
    "helloWorld": "Hola Mundo",
    "fileCount": "Tienes {files}",
    "pages": {
      "home": {
        "title": "Mi Extensión",
        "welcome": "¡Bienvenido de vuelta, {username}!"
      }
    }
  }
}
```

For non-English item translations, you fill in **each plural category your language uses individually**. English collapses into singular and plural; Spanish does the same; Russian uses three or more distinct forms (`one`, `few`, `many`); Japanese only has `other`. The [Unicode CLDR plural rules table](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) is the authoritative reference for which categories your language needs.

::: warning Never ship incomplete translations
If you ship a Spanish translation file, every translation key your extension uses needs a Spanish value. Users with their language set to Spanish will see your Spanish file, and any missing key falls back to the **English** translation, which gives a mixed-language UI. Shipping no Spanish at all is better than shipping 80% of it: users then get English for the whole extension, which is at least consistent.

The Panel's `pnpm diff:translations` script compares the Panel's _own_ language files, which carry every namespace at once, so pointing it at a per-extension file reports every one of your keys as extra. To find gaps in your file, diff it against the generated English file yourself; the two share a structure, so any JSON diff tool shows the missing keys.
:::

## Using Base Panel Translations

You don't have to redefine translations the base Panel already provides. Common strings like "Save", "Cancel", "Delete", "Loading..." and "Are you sure?" are all in [the base Panel translation file](https://github.com/calagopus/panel/blob/main/frontend/src/translations.ts) and accessible from your extension via the **base** translation hook (not the extension-specific one):

```tsx
import { useTranslations } from '@/providers/TranslationProvider.tsx';

export default function MyDeleteDialog() {
  const { t } = useTranslations();

  return (
    <Modal>
      <Button>{t('common.button.cancel', {})}</Button>
      <Button color='red'>{t('common.button.delete', {})}</Button>
    </Modal>
  );
}
```

When you mix base and extension translations in the same component, alias them clearly:

```tsx
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useExtTranslations } from './translations.ts';

export default function MyComponent() {
  const { t } = useTranslations();
  const { t: tExt, tItem: tExtItem } = useExtTranslations();

  return (
    <div>
      <h1>{tExt('pages.home.title', {})}</h1>
      <p>{tExt('fileCount', { files: tExtItem('file', 5) })}</p>
      <Button>{t('common.button.save', {})}</Button>
    </div>
  );
}
```

The `t` / `tExt` split shows at a glance whether a key lives in the base Panel or your extension, which helps when tracking down where a label comes from.

## A Note on Sample File Generation

For the example `translations.ts` on this page, with `helloWorld`, `fileCount`, the `pages.home.*` block, and the `file` item, the generated `en/dev.yourname.extension.json` would look like:

```json
{
  "items": {
    "file": {
      "zero": "{count} Files",
      "one": "{count} File",
      "two": "{count} Files",
      "few": "{count} Files",
      "many": "{count} Files",
      "other": "{count} Files"
    }
  },
  "translations": {
    "helloWorld": "Hello World",
    "fileCount": "You have {files}",
    "pages": {
      "home": {
        "title": "My Extension",
        "welcome": "Welcome back, {username}!"
      }
    }
  }
}
```

Use this as the starting point for any non-English translation file: same structure, values replaced.
