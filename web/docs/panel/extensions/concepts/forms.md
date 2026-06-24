# Forms

Panel forms are used everywhere: creating servers, editing users, configuring nodes, defining backup targets, tweaking application settings. The forms extension system lets your extension participate in any of those forms, adding new fields, providing their validation rules and default values, or tweaking properties of existing fields, without touching the built-in form components.

The mechanism is simple. Every extensible form has a string ID. You call `enterForms` in your `initialize` method, call `extend` with the form ID and a slot describing your changes, and the Panel merges your slot into the form the next time it renders.

## Registering

Inside your extension's `initialize` method:

```ts
import { ExtensionContext } from 'shared';
import { z } from 'zod';

public initialize(ctx: ExtensionContext): void {
  ctx.extensionRegistry.enterForms((forms) =>
    forms.extend('admin.servers.create', {
      fields: [
        {
          field: {
            type: 'text',
            name: 'custom_identifier',
            label: 'Custom Identifier',
            description: 'An internal label used by your provisioning system.',
          },
          position: { at: 'append' },
        },
      ],
      zodShape: {
        custom_identifier: z.string().max(64),
      },
      initialValues: {
        custom_identifier: '',
      },
    }),
  );
}
```

`enterForms` gives you the `FormRegistry`. Calling `.extend(formId, slot)` registers a **slot**, a bundle of field definitions, Zod schema additions, initial values, and/or field overrides. Multiple extensions can each register a slot for the same form and they all compose cleanly; slots are merged left-to-right in registration order.

## The Slot

Each `extend` call takes a `FormExtensionSlot` object. All four keys are optional, include only what your extension actually needs:

```ts
interface FormExtensionSlot {
  fields?: ExtensionField[]; // new fields to insert
  zodShape?: ZodFieldShape; // Zod schema additions for new fields
  initialValues?: Record<string, unknown>; // default values for new fields
  overrides?: Record<string, Partial<BaseFieldDef>>; // modify existing fields
}
```

### `fields`

An array of `ExtensionField` objects, each pairing a field definition with an insertion position:

```ts
interface ExtensionField {
  field: FieldDef;
  position: InsertPosition;
}
```

#### Insert Positions

`InsertPosition` controls where in the field list your field lands:

| Position | Description |
| -------- | ----------- |
| `{ at: 'prepend' }` | First field in the form |
| `{ at: 'append' }` | Last field in the form |
| `{ at: 'before', name: 'field_name' }` | Immediately before the named field |
| `{ at: 'after', name: 'field_name' }` | Immediately after the named field |

If `before` or `after` names a field that doesn't exist, the field is appended to the end.

### `zodShape`

A record mapping field names to Zod types. The Panel merges this into the form's Zod schema so that your new fields participate in validation:

```ts
zodShape: {
  custom_identifier: z.string().min(1).max(64),
  enable_feature_x: z.boolean(),
},
```

Only provide entries for **new fields your extension adds**. To prevent conflicts, don't overwrite built-in field names.

### `initialValues`

A record mapping field names to their initial (empty-state) values. These get merged into the form's initial state, so the form doesn't start with `undefined` for your new fields:

```ts
initialValues: {
  custom_identifier: '',
  enable_feature_x: false,
},
```

### `overrides`

A record mapping **existing** field names to partial `BaseFieldDef` overrides. You can change most display properties of built-in fields, label, description, required, colSpan, the `when` condition, without modifying the field's core definition:

```ts
overrides: {
  name: {
    label: 'Server Name (internal)',
    description: 'Must match your naming convention: env-region-number.',
  },
  // mark a normally optional field required
  description: {
    required: true,
  },
},
```

`name` is the one field you cannot override (it's the key used to look up the field in the first place). Everything else in `BaseFieldDef` is fair game.

## Field Types

The `field` inside each `ExtensionField` is a `FieldDef`, a discriminated union keyed on `type`. Every type except `custom` shares a set of base properties:

**Base properties (all field types except `custom`):**

| Property | Type | Description |
| -------- | ---- | ----------- |
| `name` | `string` | Field name, must match the form value key |
| `label` | `string` | Label shown above the input |
| `description` | `string?` | Helper text shown below the label |
| `required` | `boolean?` | Shows an asterisk and enforces the field is non-empty |
| `advanced` | `boolean?` | Hidden unless the user has enabled Advanced Mode |
| `colSpan` | `'full' \| 1` | `'full'` stretches across both columns; omit for the default half-width |
| `when` | `(values) => boolean` | Receives the current form values; field is hidden when this returns `false` |

### Text fields

```ts
{ type: 'text', name: '...', label: '...', props?: Partial<TextInputProps> }
{ type: 'password', name: '...', label: '...', props?: Partial<PasswordInputProps> }
{ type: 'textarea', name: '...', label: '...', rows?: number, props?: Partial<TextareaProps> }
```

### Numeric

```ts
{ type: 'number', name: '...', label: '...', props?: Partial<NumberInputProps> }
```

### Boolean

```ts
{ type: 'switch', name: '...', label: '...' }
{ type: 'checkbox', name: '...', label: '...' }
```

### Selection

```ts
{ type: 'select', name: '...', label: '...', options: { value: string; label: string }[] }
{ type: 'multiselect', name: '...', label: '...', options: { value: string; label: string }[] }
{ type: 'multiselectgroup', name: '...', label: '...', data: { group: string; items: { value: string; label: string }[] }[] }
{ type: 'autocomplete', name: '...', label: '...', options?: string[] }
```

### Date / time

```ts
{ type: 'date', name: '...', label: '...', props?: Partial<DateTimePickerProps> }
```

### Tags

```ts
{
  type: 'tags',
  name: '...',
  label: '...',
  placeholder?: string,
  allowReordering?: boolean,
  allowDuplicates?: boolean,
}
```

Stores a `string[]` value. Users can type entries and press Enter to add them to the list.

### Size

```ts
{ type: 'size', name: '...', label: '...', mode: 'b' | 'mb', min: number }
```

A numeric input with byte/megabyte units. Store the value as a number in your Zod schema.

### Localized text

```ts
{
  type: 'localizedtext',
  name: '...',
  label: '...',
  translationsName: string,  // the field name holding the translations map
  languages: string[],
}
{
  type: 'localizedtextarea',
  name: '...',
  label: '...',
  translationsName: string,
  languages: string[],
  rows?: number,
}
```

Renders a text input paired with per-language override inputs. The main value lives under `name`; the translations object lives under `translationsName`. You need both keys in your `zodShape` and `initialValues`.

### Custom

```ts
{
  type: 'custom',
  name: '...',
  label?: string,
  advanced?: boolean,
  colSpan?: ColSpan,
  when?: (values) => boolean,
  render: (form: UseFormReturnType<T>) => ReactNode,
}
```

For anything the built-in types don't cover. The `render` prop receives the full Mantine form object so you can call `form.getInputProps`, `form.setFieldValue`, read `form.values`, and so on. Use this as an escape hatch, not a default, the built-in types cover most cases and compose more predictably.

## A Complete Example

An extension that adds a "Provisioning Tag" and "Enable Monitoring" field to the server creation form, each validated by Zod:

```ts
import { Extension, ExtensionContext } from 'shared';
import { z } from 'zod';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterForms((forms) =>
      forms.extend('admin.servers.create', {
        fields: [
          {
            field: {
              type: 'text',
              name: 'provisioning_tag',
              label: 'Provisioning Tag',
              description: 'Passed to the provisioning system on first start.',
              colSpan: 'full',
            },
            position: { at: 'after', name: 'description' },
          },
          {
            field: {
              type: 'switch',
              name: 'monitoring_enabled',
              label: 'Enable Monitoring',
              advanced: true,
            },
            position: { at: 'append' },
          },
        ],
        zodShape: {
          provisioning_tag: z.string().max(128),
          monitoring_enabled: z.boolean(),
        },
        initialValues: {
          provisioning_tag: '',
          monitoring_enabled: false,
        },
      }),
    );
  }
}

export default new MyExtension();
```

The new field values are included in the form's submit payload alongside the built-in fields. Your backend route receives them and can act on them however it needs to, storing them as server metadata, passing them to a provisioner, and so on. See [Extending Models](./extending-models.md) for how to persist per-server data on the backend.

## Advanced Mode

Fields marked `advanced: true` are hidden by default. The Panel exposes an **Advanced Mode** toggle (persisted in `localStorage`) that shows all advanced fields globally. This is the right tool for fields that most operators will never need, configuration that's correct by default and only relevant in non-standard setups. When in doubt, don't mark a field advanced; it's better to show an unfamiliar field than to hide one someone needs.

## Conditional Fields

The `when` function lets you show or hide a field based on the current form values:

```ts
{
  field: {
    type: 'text',
    name: 'custom_driver_path',
    label: 'Driver Path',
    when: (values) => values.driver === 'custom',
  },
  position: { at: 'append' },
},
```

`when` is called on every render with the latest form values. The field is rendered when it returns `true` and omitted when it returns `false`. This is pure display logic, the field's value stays in the form state even when `when` returns `false`, so it can be safely submitted without losing user input if the condition toggles.
