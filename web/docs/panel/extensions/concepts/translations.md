# Translations

The Panel ships with an integrated translation system, and your extension gets to use it for free - no backend wiring, no separate i18n library, no string-bundle nightmares. You declare your translation keys once with their English values, the framework handles type-safe lookup at runtime, and operators (or you, if you're shipping translations yourself) can ship JSON files for other languages that automatically get picked up when a user has that language selected.

This page covers the whole lifecycle: declaring translation keys for your extension, using them in your React components and TypeScript code, and shipping translations for languages other than English.

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

This is the empty skeleton - you'll fill in the `items` and `translations` objects with your actual keys.

::: info
`defineTranslations` infers the types of every key you add. So `t('helloWrld', {})` (typo) or `t('fileCount', {})` (missing the `files` interpolation variable) will be a TypeScript compile error before it's a runtime error. You don't need to maintain a separate type definition - the call site is the contract.
:::

### Item Translations

The `items` object is for keys that have a count attached - "1 File" vs "2 Files," "1 User" vs "5 Users." The framework uses [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) under the hood, which means the same key automatically does the right plural form for whatever language is active (English has just `one`/`other`; Russian and Polish have several; Japanese has none).

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

`defineEnglishItem(singular, plural)` is the English-specific helper - English only distinguishes between one and many, so two strings is enough. The framework expands this internally to all six plural categories (`zero`, `one`, `two`, `few`, `many`, `other`), with everything that isn't `one` getting the plural form. For non-English translation files (covered later), authors fill in each plural category for their language individually.

### Regular Translations

The `translations` object is for everything else - labels, sentences, paragraphs, anything without a count. Keys can be nested as deeply as you like; the access path uses dot notation:

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

Anything wrapped in `{braces}` is an **interpolation variable** - a placeholder you fill in at use time. The base Panel uses these heavily (`'Showing {start} to {end} of {total} results.'`, for example), and you can do the same. The variable name in the template (`{files}`, `{username}`) needs to match what you pass in the call site object; both are type-checked.

::: info Look at the base Panel for naming conventions
The Panel's own translations are at [frontend/src/translations.ts](https://github.com/calagopus/panel/blob/main/frontend/src/translations.ts) and they're worth a skim before you invent your own structure. The convention used by core is `pages.<section>.<page>.<element>` (e.g. `pages.account.home.title`), with leaf categories like `button`, `modal`, `form`, `toast`, `error`, `alert`, `tooltip`, `placeholder`. Following the same shape in your extension makes operators' translation files less arbitrary to navigate.
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

For non-React contexts (utility functions, async API handlers, anything outside a component), use `getExtTranslations` instead - same API surface, no React dependencies.

```ts
import { getExtTranslations } from './translations.ts';

export function buildEmailSubject(filesCount: number): string {
  const { t, tItem } = getExtTranslations();
  return t('email.fileSummary.subject', { files: tItem('file', filesCount) });
}
```

### The Full Method Surface

Both `useExtTranslations()` and `getExtTranslations()` return an object with these methods:

| Method | Returns | Use when |
| --- | --- | --- |
| `t(key, values)` | `string` | Plain text rendering. Most cases. |
| `tReact(key, values)` | `ReactNode` | Your interpolation values include React nodes (links, icons, styled spans). Renders the surrounding text as Markdown. |
| `tItem(key, count)` | `string` | Pluralized count rendering. Returns "5 Files" / "1 File" / etc. |
| `setLanguage(lang)` | `void` | Programmatically switch the user's active language. |
| `language` | `string` | The currently active language code (e.g. `'en'`, `'de'`, `'es'`). |

`setLanguage` and `language` are useful when building a custom language picker or reacting to the active language elsewhere in your code. The Panel itself ships a language picker in user account settings, so you usually don't need to wire your own - but the hooks are there if you do.

### Markdown in Translations

Translations support Markdown. There are two ways to render it, depending on what you're putting into the translation:

**`.md()` on the result of `t()`** for plain Markdown with no React content:

```tsx
const { t: tExt } = useExtTranslations();

return <p>{tExt('myMarkdownTranslation', {}).md()}</p>;
```

This is a `String.prototype` extension - calling `.md()` on any string returns a React element rendering it as Markdown. So it works on the result of `t(...)` (since that returns a string), but it would equally work on any other string you have lying around.

**`tReact()` for translations that interpolate React nodes:**

```tsx
const { tReact: tExtReact } = useExtTranslations();

return (
  <p>
    {tExtReact('userMessage', {
      user: <strong>{currentUser.name}</strong>,
      link: <a href="/help">help center</a>,
    })}
  </p>
);
```

`tReact` does the markdown rendering for the surrounding text *and* splices ReactNode values into the right places at the placeholders. This is the only way to get React content into a translated string while keeping the surrounding text translatable.

**Pick by what you're putting in, not by what you're rendering:**

- All your interpolation values are strings or numbers? → use `t(...)`, optionally with `.md()` if you need markdown
- One or more interpolation values is a React node? → use `tReact(...)`

`tReact` *also* renders markdown for the non-ReactNode parts of the translation, so a translation like `'Welcome **{name}**'` works fine through `tReact` even with a string `name` - but if you don't actually need React interpolation, `t(...).md()` is the simpler option.

### Missing Keys

If you call `t`, `tReact`, or `tItem` with a key that doesn't exist (in the active language *or* in the English base), the call **throws an Error**. There is no runtime fallback to the key name, no empty string, no warning - it throws and your component bubbles up to the error boundary.

This is intentional. With TypeScript-inferred key types, missing keys are caught at compile time before they reach runtime. The runtime throw is a backstop for cases where the key is constructed dynamically (e.g. `t(\`status.${state}\`, {})` where `state` is a value from an API), and in those cases throwing is what you want - you'd rather know immediately that your data has a value the translation system can't handle than ship a UI showing literal "status.frobnicated" to users.

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
frontend/extensions/
  (package_name_with_underscores)/
    public/translations/
      es/
        dev.yourname.extension.json
      de/
        dev.yourname.extension.json
```

The filename is your package identifier - if your `Metadata.toml` says `name = "dev.0x7d8.test"`, the file is `dev.0x7d8.test.json`. The directory says the language code (`es` for Spanish, `de` for German, etc.).

To get a starter file with the right shape, generate the English equivalent first:

```bash
pnpm build:translations
```

You'll find the result at `public/translations/en/dev.yourname.extension.json`. Copy it, replace the English strings with translations for your target language, save under the right language folder. Repeat per language.

The shape of the JSON file is **flat** - `items` and `translations` at the top level, with keys exactly as you defined them in `translations.ts`. The framework handles namespacing across extensions internally; you don't put your package identifier inside the JSON, only on the filesystem path.

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
If you ship a Spanish translation file, every translation key your extension uses needs a Spanish value. Users with their language set to Spanish will see your Spanish file, and any missing key falls back to the **English** translation - mixed-language UIs look broken and confused. If you'd rather not ship Spanish at all than ship 80% of it, that's fine: users get the English fallback for the whole extension, which is consistent.

You can check for missing keys in a translation file by running:

```bash
pnpm diff:translations public/translations/es/dev.yourname.extension.json
```

This compares your target file against the generated English file and reports any keys present in English but missing in the target.
:::

## Using Base Panel Translations

You don't have to redefine translations the base Panel already provides. Common things like "Save", "Cancel", "Delete", "Loading...", "Are you sure?" - those are all in [the base Panel translation file](https://github.com/calagopus/panel/blob/main/frontend/src/translations.ts) and accessible from your extension via the **base** translation hook (not the extension-specific one):

```tsx
import { useTranslations } from '@/providers/TranslationProvider.tsx';

export default function MyConfirmDialog() {
  const { t } = useTranslations();

  return (
    <Modal>
      <Button>{t('common.button.cancel', {})}</Button>
      <Button>{t('common.button.confirm', {})}</Button>
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

The `t` / `tExt` split makes it obvious at a glance whether a key lives in the base Panel or your extension - useful when you're searching the codebase later trying to find where a label came from.

## A Note on Sample File Generation

The earlier "Sample Generated JSON Translation File" section showed what the generator produces from your `translations.ts`. As of the example earlier on this page, with `helloWorld`, `fileCount`, the `pages.home.*` block, and the `file` item, the generated `en/dev.yourname.extension.json` would look like:

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

Use this as the starting point for any non-English translation file - same structure, just with the values replaced.
