# Frontend API Calls

So you've got a backend route registered, it runs, it returns data, beautiful. Now you need your React components to actually *talk* to it. This page covers how extensions make HTTP requests to their own backend routes (or any Panel route, really) from the frontend - which axios instance to use, how keys get transformed, how to structure your API files, and a few gotchas around data shapes that'll save you pain later.

## The Two Axios Instances

Your frontend has two pre-configured axios instances available - auth tokens, base URL, and error interceptors are all wired up already, so you never instantiate your own. Pick whichever one matches the shape of the data you're working with:

```ts
import { axiosInstance, untransformedAxiosInstance } from '@/api/axios.ts';
```

- **`axiosInstance`** - the default. Automatically transforms response keys from `snake_case` to `camelCase` as they come off the wire, so your frontend code stays idiomatic JavaScript regardless of what the Rust backend returns. Use this 95% of the time.

- **`untransformedAxiosInstance`** - leaves response keys exactly as the backend sent them. Reach for this only when you have a response whose keys are *data*, not field names - see [The Map-Keyed-By-User-Input Trap](#prefer-arrays-over-maps-keyed-by-user-input) below.

::: warning
**Request bodies are not auto-transformed, only responses.** If you just hand `axiosInstance.put(...)` a camelCase object, it goes out the wire as camelCase, your Rust handler fails to deserialize it, and you get a confusing 400. This is an unfortunate asymmetry that we might fix eventually, but for now you have to convert request bodies yourself:

```ts
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

await axiosInstance.put('/api/admin/extensions/dev.yourname.test/settings', {
  ...transformKeysToSnakeCase(data),
});
```

The helper is recursive, so nested objects and arrays get handled too.
:::

## One File Per Endpoint

The convention is one file per endpoint in `src/api/`, each with a single default export. This keeps import sites clean (`import getItems from '@/api/getItems.ts'`) and makes each endpoint independently mockable, refactorable, and greppable.

Here's the canonical shape for a GET:

```ts
import { axiosInstance } from '@/api/axios.ts';

export type Item = {
  id: string;
  name: string;
  createdAt: string;
};

export default async (serverUuid: string, itemType: string): Promise<Item[]> => {
  const { data } = await axiosInstance.get(
    `/api/client/servers/${serverUuid}/my-feature/items/${itemType}`,
  );
  return data.items;
};
```

And for a mutation that takes a request body:

```ts
import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export type UpdateItemData = {
  name?: string;
  enabled?: boolean;
};

export default async (serverUuid: string, itemId: string, data: UpdateItemData): Promise<void> => {
  await axiosInstance.put(
    `/api/client/servers/${serverUuid}/my-feature/items/${itemId}`,
    transformKeysToSnakeCase(data),
  );
};
```

### Excluding keys from the transform

Sometimes a field in your payload shouldn't be transformed - typically because it's a map whose *keys* are data (the same pitfall as [the map-keyed-by-user-input trap](#prefer-arrays-over-maps-keyed-by-user-input)), and you don't want `transformKeysToSnakeCase` recursing into those keys. Pull that field out before the transform and re-add it afterward via object spread:

```ts
import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export type UpdateSettingsData = {
  apiUrl: string;
  typeOrder: Record<string, string[]>; // keys are user-defined category names
};

export default async (data: UpdateSettingsData): Promise<void> => {
  const { typeOrder, ...rest } = data;

  await axiosInstance.put('/api/admin/extensions/dev.yourname.test/settings', {
    ...transformKeysToSnakeCase(rest),
    type_order: typeOrder,
  });
};
```

Destructuring pulls `typeOrder` out so only the rest of the payload goes through the transform. Then you re-add it under the snake_case name the backend expects, passing the value straight through untouched. This keeps the rest of your request body ergonomic to write in camelCase while preserving whatever keys were in the map-shaped field verbatim.

The same pattern works for any number of excluded keys - destructure them all out, transform the rest, re-add them manually.

A few things worth noticing:

- **URLs are hardcoded.** There's no path helper - you just interpolate the server UUID (and any other path params) directly into the string. The `/api/admin/...`, `/api/client/...`, `/api/client/servers/{uuid}/...` prefixes match the router type you registered the route under on the backend (see [Routing](./routing.md)).
- **The function takes path/query params as arguments and the request body as the last argument.** This is a convention, not a rule, but it keeps call sites predictable.
- **Types are colocated.** Request/response types live in the same file as the function that uses them and are re-exported from there. For shapes shared across multiple endpoints, put them in `src/api/types.d.ts`.
- **Destructure `data` off the axios response.** `axiosInstance.get(...)` returns an object with `data`, `status`, `headers`, and so on - you almost always only care about `data`. Destructuring at the call site (`const { data } = await ...`) keeps the function short and makes the response shape obvious.

## Handling Errors

The Panel ships a utility called `httpErrorToHuman` that turns any axios error - whether it's a network failure, a validation 400 with a field list, or a raw 500 - into a single human-readable string. The standard pattern is to plug that string straight into a toast:

```tsx
import { httpErrorToHuman } from '@/api/axios.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import updateItem from '@/api/updateItem.ts';

export default function EditItemForm({ serverUuid, itemId }: Props) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const onSave = (values: UpdateItemData) => {
    setSaving(true);

    updateItem(serverUuid, itemId, values)
      .then(() => {
        addToast('Item updated.', 'success');
      })
      .catch((err) => {
        addToast(httpErrorToHuman(err), 'error');
      })
      .finally(() => setSaving(false));
  };

  // ... render
}
```

This three-callback shape (`.then` success toast → `.catch` error toast → `.finally` loading reset) is what you'll see across the Panel's own codebase, and matching it keeps behavior consistent for users across the UI. `httpErrorToHuman` already knows how to unpack the standard error shape your backend returns (see [Response Types and Errors](./routing.md#response-types-and-errors) in the routing docs), so you almost never need to inspect the raw error yourself.

::: info
If you need to branch on *what* went wrong - e.g. show a different message for a conflict vs a not-found - you can check `err.response?.status` before calling `httpErrorToHuman`. But for the overwhelmingly common case of "something went wrong, show the user a readable explanation", just pass the whole error to the helper.
:::

## Designing API Shapes

A few principles that will save you headaches down the line. These are about the *shape* of the JSON your backend returns, not the frontend code that consumes it - but since the frontend is where you feel the pain, it makes sense to cover them here.

### Prefer arrays over maps-keyed-by-user-input

This one deserves its own heading because it's the most common mistake, and it's the one that forces you to reach for `untransformedAxiosInstance`. Consider a route that returns a list of categories, each with some items:

```jsonc
// ❌ Bad: map keyed by category names
{
  "categories": {
    "VANILLA": { "items": [...] },
    "FORGE": { "items": [...] },
    "paper plugins": { "items": [...] }
  }
}
```

This looks clean, but the keys are *data* - they come from the user, a database, or an external API, and you don't control their casing. When `axiosInstance` runs its auto-transform over this, `paper plugins` becomes `paperPlugins`, `VANILLA` stays `VANILLA` (it has no snake_case to transform), and suddenly your frontend has to special-case which keys get mangled. The only way out is `untransformedAxiosInstance`, which means you also lose the transform for the *legitimate* field names in the same response.

The fix is to make the outer container an array of objects, where the user-controlled value lives in a *field* instead of being the key:

```jsonc
// ✅ Good: array of objects with stable field names
{
  "categories": [
    { "name": "VANILLA", "items": [...] },
    { "name": "FORGE", "items": [...] },
    { "name": "paper plugins", "items": [...] }
  ]
}
```

Now `categories` is a field name (safe to transform), `name` is a field name (safe to transform), and the user-controlled string lives in a value where transformation doesn't touch it. You get to use plain `axiosInstance` without any special handling, the data round-trips cleanly, and everyone's happy.

**Rule of thumb:** if the keys of an object are something a human or another system *typed in*, make them values in an array instead. Keys in JSON responses should be stable identifiers that you, the extension author, chose.

### When `untransformedAxiosInstance` is actually correct

Sometimes you genuinely do want a keyed structure and you know the keys are safe - for example, an endpoint that returns a map of stable constants (`{ "RED": {...}, "GREEN": {...} }` where the keys are enum variants you defined). In that case, either instance works and the choice is aesthetic. If the keys contain anything else - mixed case, spaces, Unicode, user input - use `untransformedAxiosInstance` and accept that you'll get snake_case field names inside the values.

## Summary

| Situation | Use |
| --------- | --- |
| Any normal response | `axiosInstance` |
| Response whose object *keys* are user-controlled data | `untransformedAxiosInstance` |
| Any request with a body | `axiosInstance` + `transformKeysToSnakeCase(data)` |
| Any error from any of the above | `httpErrorToHuman(err)` into a toast |

Keep your API files one-endpoint-per-file with a default export, colocate types next to the function that uses them, and match the three-callback success/error/loading pattern for any call triggered by user action.
