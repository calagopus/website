# Translations

あなたを決してあきらめない - Oh Oops thats the wrong language, but you get the point, right? Well Calagopus has an integrated Translation System that YOU! (Yes, you, the person reading this right now) can use to add translations to your extension without having to write any backend code for it! Cool, right?

## Defining Translations

All Panel Translations use the same base language, which is English. This means that all translation keys must have an English translation, and the English translation will be used as a fallback if a translation for the user's language is not available.

To get started, create a `translations.ts` file in your extension's frontend `src/` directory, and add the following code:

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

This is the basic structure of the translations file, you can add your translation keys and translations to the `items` and `translations` objects respectively.

> `defineTranslations` infers the types of your keys, so t('helloWrld', {}) or a missing interpolation variable will be a TypeScript error - no need to keep your keys in sync with a separate type definition.

### Item Translations

The `items` object is where you define translation keys for items, an item is something that has a count attached to it, for example, "1 File" or "2 Files". The key is the name of the item. This supports all common internationalization plural rules using the official Intl.PluralRules API.

```ts
import { defineEnglishItem, defineTranslations } from 'shared';

const translations = defineTranslations({
  items: {
    file: defineEnglishItem('File', 'Files'), // This defines the "file" item with "File" as the singular form and "Files" as the plural form, all other forms are also the plural form in English
  },
  translations: {},
});

export const useExtTranslations = translations.useTranslations.bind(translations);
export const getExtTranslations = translations.getTranslations.bind(translations);

export default translations;
```

### Regular Translations

The `translations` object is where you define translation keys for regular translations, for example, "Hello World". The key is the name of the translation. You can also use interpolation in translations, for example, "Hello {name}" where `{name}` is a variable that can be replaced with a value when using the translation. Markdown is also supported, however read on that further down this guide.

```ts
import { defineEnglishItem, defineTranslations } from 'shared';

const translations = defineTranslations({
  items: {
    file: defineEnglishItem('File', 'Files'),
  },
  translations: {
    helloWorld: 'Hello World', // This defines the "helloWorld" translation with "Hello World" as the English translation
    fileCount: 'You have {files}', // This defines the "fileCount" translation with "You have {files}" as the English translation, where {files} is an interpolation variable that can be replaced with a value when using the translation
  },
});

export const useExtTranslations = translations.useTranslations.bind(translations);
export const getExtTranslations = translations.getTranslations.bind(translations);

export default translations;
```

## Using Translations in Your Extension Code

Okay, very cool, you have defined your translations, now how do you use them in your extension code? It's actually very simple, you can use the `useExtTranslations` hook in your React components, and the `getExtTranslations` function in any other TypeScript code.

```tsx
import { useExtTranslations } from './translations.ts'; // assumes translations.ts is in the same directory as your component

export default function MyComponent() {
  const { t, tItem } = useExtTranslations();

  return (
    <div>
      <h1>{t('helloWorld', {})}</h1>
      <p>{t('fileCount', { files: tItem('file', 5) })}</p>
    </div>
  );
}
```

And well, thats almost it, if you want to use Markdown in your translations, you can use the `.md()` method on the translation key, for example, `t('myMarkdownTranslation', {}).md()` will return a React component that renders the translation as Markdown.

```tsx
import { useExtTranslations } from './translations.ts';

export default function MyComponent() {
  const { t, tItem } = useExtTranslations();

  return (
    <div>
      <h1>{t('helloWorld', {}).md()}</h1>
      <p>{t('fileCount', { files: tItem('file', 5) }).md()}</p>
    </div>
  );
}
```

## Shipping Custom Translations with Your Extension

By default, the Panel will only use the English translations that you have defined in your `translations.ts` file, but what if you want to provide translations for other languages as well? Well, you can do that by creating a JSON file with the translations for the other language and placing it in the `public/` directory of your extension.

```yml
frontend/extensions/
  (package_name_with_underscores)/
    public/translations/
      es/
        dev.yourname.extension.json
```

In this example, we are creating a Spanish translation file for our extension, and placing it in the `public/translations/es/` directory of our extension. The name of the JSON file should be in the format of `{package_identifier}.json`, for example, if your package name is `dev.0x7d8.test`, then the JSON file should be named `dev.0x7d8.test.json`.

To see how to structure the JSON file and what the contents should look like, you can generate the english JSON file by running the following command in the frontend directory:

```bash
pnpm build:translations
```

You will then see the file in `public/translations/en/dev.yourname.extension.json`, you can use this file as a template for your other language translations, just replace the English translations with the translations for the other language.

::: warning
**NEVER** ship unfinished translations, if you want to ship a translation for a language, make sure that all translation keys are translated, otherwise, users who have their language set to that language will see missing translations in your extension, which they cannot manually overwrite. If you do not ship it instead, they can simply use their own.

You can check for missing translations by running the following command in the frontend directory:

```bash
pnpm diff:translations
```
:::

## Sample Generated JSON Translation File

For a quick overview, heres what the above example translations would look like in the generated, English JSON file:

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
    "fileCount": "You have {files}"
  }
}
```
