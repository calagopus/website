# Frontend API Calls

So you've got a backend route registered, it runs, it returns data, beautiful. Now you need your React components to actually *talk* to it. This page covers how extensions make HTTP requests to their own backend routes (or any Panel route, really) from the frontend - the axios instance, how keys get transformed between the Rust backend's `snake_case` and the frontend's `camelCase`, how to structure your API files, and a few gotchas around data shapes that'll save you pain later.

## The Axios Instance

Your frontend has a pre-configured axios instance available - auth tokens, base URL, and error interceptors are all wired up already, so you never instantiate your own:

```ts
import { axiosInstance } from '@/api/axios.ts';
```

The instance itself does **no key transformation** - what the backend sends is what you get, and what you send is what goes out on the wire. Key conversion between the backend's `snake_case` and idiomatic frontend `camelCase` is handled per-endpoint by schema-driven helpers, described next.

::: info Coming from an older Panel version?
Earlier builds auto-camelCased every JSON response in an interceptor and shipped a second `untransformedAxiosInstance` for opting out. Both are gone - the interceptor transform was replaced by the schema-based system below, which knows exactly which keys are field names (transform them) and which are data (leave them alone).
:::

## Schemas and the Transform Helpers

Every response and request body flows through a Zod schema plus one of these helpers from `@/lib/api-transform.ts`:

```ts
import { parseExtendedFromApi, parseFromApi, parsePaginationFromApi, serializeForApi } from '@/lib/api-transform.ts';
```

You define a schema per resource with **camelCase keys**, matching the snake_case keys your backend returns:

```ts
import { z } from 'zod';

export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxRetries: z.number(), // backend sends `max_retries`
  createdAt: z.coerce.date(), // backend sends `created_at` as an ISO string
});
```

- **`parseFromApi(schema, data)`** - for incoming responses. It walks the raw data guided by the schema (nested objects, arrays, records, and unions all work), remaps each snake_case wire key to your camelCase schema key, then validates with the schema. If validation fails it logs a detailed breakdown to the console (which field, what it got, which API file called it) and throws, so backend/schema mismatches surface loudly during development instead of silently producing `undefined`s downstream.
- **`parsePaginationFromApi(schema, raw)`** - for paginated list responses. Pass it the raw paginated object (`{ total, per_page, page, data }`) and it returns a `Pagination<T>` with each entry run through `parseFromApi`.
- **`parseExtendedFromApi(schema, parsed)`** - for reading fields a backend extension added to a *core* response. `parseFromApi` keeps every field the schema didn't declare on the parsed object under a hidden `__extension_data` property (at every nesting level), and this helper parses your typed slice back out of it - the frontend counterpart of the backend's `parse_model_extension`. See [Extending Models](./extending-models.md#from-frontend-components) for the full pattern.
- **`serializeForApi(schema, data, extraSchemas?)`** - for outgoing request bodies. The reverse direction: camelCase keys in your typed object become snake_case on the wire. Fields that are `undefined` are skipped entirely. The optional third argument is an array of additional schemas whose serialized output is deep-merged into the result - this is how the core endpoints for extensible forms include extension-registered fields: they pass `formExtensionSchemas(formId)`, which returns the `zodShape`s extensions registered for that form (see [Forms](./forms.md)).

Two properties of the transform worth knowing:

- **It's schema-guided, not blind.** Only keys that appear in the schema (or in one of the `extraSchemas`) are transformed - and, for `serializeForApi`, only those keys are *sent*; anything else in the object is dropped. A field typed as `z.record(...)` has its keys passed through verbatim in both directions, so maps whose keys are data (user-provided names, UUIDs, enum constants) survive untouched. The old "auto-transform mangled my map keys" trap no longer exists.
- **Requests and responses are symmetric.** Define the schema once and use it on both sides; there's no separate "remember to snake_case your request body by hand" step anymore.

## One File Per Endpoint

The convention is one file per endpoint in `src/api/`, each with a single default export. This keeps import sites clean (`import getItems from '@/api/getItems.ts'`) and makes each endpoint independently mockable, refactorable, and greppable.

Here's the canonical shape for a GET:

```ts
import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { parseFromApi } from '@/lib/api-transform.ts';
import { itemSchema } from '../lib/schemas.ts';

export default async (serverUuid: string, itemType: string): Promise<z.infer<typeof itemSchema>[]> => {
  const { data } = await axiosInstance.get(
    `/api/client/servers/${serverUuid}/my-feature/items/${itemType}`,
  );
  return data.items.map((item: unknown) => parseFromApi(itemSchema, item));
};
```

For a paginated list:

```ts
import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { parsePaginationFromApi } from '@/lib/api-transform.ts';
import { itemSchema } from '../lib/schemas.ts';

export default async (page: number, search?: string): Promise<Pagination<z.infer<typeof itemSchema>>> => {
  const { data } = await axiosInstance.get('/api/admin/extensions/dev.yourname.test/items', {
    params: { page, search },
  });
  return parsePaginationFromApi(itemSchema, data.items);
};
```

And for a mutation that takes a request body:

```ts
import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { serializeForApi } from '@/lib/api-transform.ts';

export const updateItemSchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().optional(),
});

export default async (serverUuid: string, itemId: string, data: z.infer<typeof updateItemSchema>): Promise<void> => {
  await axiosInstance.put(
    `/api/client/servers/${serverUuid}/my-feature/items/${itemId}`,
    serializeForApi(updateItemSchema, data),
  );
};
```

A few things worth noticing:

- **URLs are hardcoded.** There's no path helper - you just interpolate the server UUID (and any other path params) directly into the string. The `/api/admin/...`, `/api/client/...`, `/api/client/servers/{uuid}/...` prefixes match the router type you registered the route under on the backend (see [Routing](./routing.md)).
- **Note the top-level unwrap happens before the parse.** The backend wraps payloads in a keyed object (`data.items`, `data.item`, ...) - the wrapper key comes off the wire in snake_case, so access it with the exact key your backend sends (`data.node_mounts`, not `data.nodeMounts`) and hand the inner value to `parseFromApi` / `parsePaginationFromApi`.
- **The function takes path/query params as arguments and the request body as the last argument.** This is a convention, not a rule, but it keeps call sites predictable.
- **Schemas are colocated or shared.** A schema used by a single endpoint can live in that file; schemas shared across endpoints belong in a `src/lib/schemas.ts` in your extension. (The Panel keeps its own in `@/lib/schemas/` - you can import those when consuming core Panel resources, but define your own for your own endpoints.)
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

### Maps keyed by user input: use `z.record`

Consider a route that returns categories keyed by their (user-provided) names:

```jsonc
{
  "categories": {
    "VANILLA": { "items": [...] },
    "FORGE": { "items": [...] },
    "paper plugins": { "items": [...] }
  }
}
```

Those keys are *data* - they come from the user, a database, or an external API, and you don't control their casing. Type the field as a record and the transform leaves the keys alone while still transforming the field names *inside* the values:

```ts
const responseSchema = z.object({
  categories: z.record(z.string(), z.object({ items: z.array(itemSchema) })),
});
```

That said, arrays of objects are still usually the better shape - they preserve ordering, are easier to iterate and render, and make the "name" an explicit, validated field:

```jsonc
{
  "categories": [
    { "name": "VANILLA", "items": [...] },
    { "name": "paper plugins", "items": [...] }
  ]
}
```

**Rule of thumb:** if the keys of an object are something a human or another system *typed in*, prefer making them values in an array. If you do want a keyed structure, `z.record` handles it correctly - the keys round-trip untouched.

## Data-Fetching Hooks

Writing raw `useEffect` + `useState` fetches is tedious and error-prone. The Panel ships five hooks that cover the common patterns; they handle loading state, error toasts, and TanStack Query wiring for you. Because they toast internally, adding your own toast around one of them double-reports the same event - see [Toasts the data hooks already raise](./toasts.md#toasts-the-data-hooks-already-raise) for what each one covers and how to opt out.

All five are in `@/plugins/`:

```ts
import { useResource } from '@/plugins/useResource.ts';
import { usePollingResource } from '@/plugins/usePollingResource.ts';
import { useSearchableResource } from '@/plugins/useSearchableResource.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePaginatedTable.ts';
import { useResourceForm } from '@/plugins/useResourceForm.ts';
```

### Query Keys

TanStack Query identifies cached data by a query key - an array compared structurally. `invalidateQueries` invalidates every cached query whose key starts with the given prefix (exact matching is off by default), so your key structure determines how broadly invalidation spreads.

The Panel's own code builds keys using `@/lib/queryKeys.ts`. **Extensions must not import from that file.** Those keys are Panel internals, and sharing a prefix with a Panel query means invalidation can flush Panel caches or vice versa. Define your own inline arrays instead, namespaced under `'extensions'` and your extension ID:

```ts
queryKey: ['extensions', 'dev.yourname.test', 'items']
queryKey: ['extensions', 'dev.yourname.test', 'items', serverUuid]
```

Because of prefix matching, invalidating `['extensions', 'dev.yourname.test', 'items']` also invalidates `['extensions', 'dev.yourname.test', 'items', serverUuid]` and any deeper keys. Use narrow keys when you only want one server's cache to re-fetch; use the shorter prefix when you want everything under that namespace to re-fetch.

The hooks append their own dynamic segments to the key you supply - your `deps` array (if any) and a final object containing the current search term and/or page number. You never include those yourself.

### `useResource` - simple fetches

Use this when you need to fetch a resource and don't need search or pagination. It wraps TanStack Query's `useQuery`, automatically shows an error toast on failure, and returns `refetch` and `invalidate` helpers.

```tsx
import { useResource } from '@/plugins/useResource.ts';
import getFeatureSettings from '@/api/getFeatureSettings.ts';

export default function FeatureSettings({ serverUuid }: { serverUuid: string }) {
  const { data, loading, refetch, invalidate } = useResource({
    queryKey: ['extensions', 'dev.yourname.test', 'settings', serverUuid],
    queryFn: () => getFeatureSettings(serverUuid),
  });

  if (loading) return <Spinner />;

  return (
    <>
      <p>Current limit: {data?.limit}</p>
      <Button onClick={refetch}>Refresh</Button>
    </>
  );
}
```

`data` is `T | undefined` - it starts as `undefined` before the first fetch resolves, so guard it with optional chaining. `loading` is `isFetching` from TanStack Query, which is `true` whenever a request is in flight, including background re-fetches triggered by `invalidate`. If you want to show a spinner only on the initial load and not on background re-fetches, check `loading && !data` instead of just `loading`.

**`invalidate`** calls `queryClient.invalidateQueries({ queryKey })`. The query is marked stale and re-fetches in the background if any component is subscribed. The component continues rendering existing data until the re-fetch completes. Use this after a mutation - e.g. after a save in a child component, invalidate the parent's fetch so it picks up the change.

**`refetch`** calls the TanStack Query `refetch` function returned by `useQuery`, which fires the query immediately regardless of staleness. Use this for an explicit user-triggered refresh.

**`enabled`** is passed directly to `useQuery`. When `false`, the query never fires - `data` stays `undefined` and `loading` is `false`. Use it to gate fetches on values that may not be ready yet:

```ts
const { data } = useResource({
  queryKey: ['extensions', 'dev.yourname.test', 'items', serverUuid],
  queryFn: () => getItems(serverUuid),
  enabled: !!serverUuid,
});
```

**`silent`** suppresses the automatic error toast. `error` is always returned regardless - `silent` only controls whether the hook itself reacts to it - so you can take over error handling yourself:

```ts
const { data, error } = useResource({
  queryKey: ['extensions', 'dev.yourname.test', 'items', serverUuid],
  queryFn: () => getItems(serverUuid),
  silent: true,
});
```

### `usePollingResource` - fetches that re-run on an interval

Use this when you need to re-fetch a resource on a fixed interval - a build status, a transfer's progress, anything that changes on the backend while the user watches. It's `useResource` plus an `interval`, and an optional `stopWhen` predicate that halts the polling once the data reaches a terminal state. It returns the same `{ data, loading, error, refetch, invalidate }` as `useResource`.

```tsx
import { usePollingResource } from '@/plugins/usePollingResource.ts';
import getJobStatus from '@/api/getJobStatus.ts';

export default function JobStatus({ jobId }: { jobId: string }) {
  const { data } = usePollingResource({
    queryKey: ['extensions', 'dev.yourname.test', 'jobs', jobId],
    queryFn: () => getJobStatus(jobId),
    interval: 5000,
    stopWhen: (status) => status.done,
  });

  return <p>State: {data?.state ?? 'loading'}</p>;
}
```

**`interval`** is the poll period in milliseconds. It's passed to TanStack Query's `refetchInterval`, so the timer resets after each fetch resolves rather than firing on a fixed wall-clock schedule.

**`stopWhen`** receives the latest `data` and returns `true` to stop polling. Polling halts as soon as it returns `true`; if the data later moves back to a non-terminal state - for example you optimistically write `isBuilding: true` into the cache with `queryClient.setQueryData` to kick off a new build - the interval restarts automatically. Omit it to poll forever while the component is mounted.

**`pollInBackground`** (default `false`) maps to `refetchIntervalInBackground`. By default TanStack Query pauses interval re-fetches while the browser tab is unfocused; pass `true` when the poll must keep running in the background - e.g. so a completion toast still fires if the user switches tabs mid-build.

Polling also stops while the query is in an error state, so a persistently failing endpoint isn't hammered every interval. It resumes automatically on the next successful fetch - for example when the tab regains focus (TanStack Query re-fetches on window focus by default) or when you call `refetch` - so transient failures recover on their own.

**`enabled`** and **`silent`** behave exactly as in `useResource`. Note there is no per-fetch success callback (TanStack Query v5 removed `onSuccess` from `useQuery`) - to run a side-effect when the polled value crosses into a terminal state, watch `data` in a `useEffect` and detect the transition yourself:

```tsx
const wasRunningRef = useRef(false);
useEffect(() => {
  const running = data?.isBuilding;
  if (running === undefined) return;
  if (wasRunningRef.current && !running) {
    // build just finished
  }
  wasRunningRef.current = running;
}, [data?.isBuilding]);
```

### `useSearchableResource` - searchable dropdowns

Use this when populating a `<Select>` or `<MultiSelect>` from a backend search endpoint. The hook maintains two separate pieces of state: `search`, which is updated immediately as the user types and bound directly to the input, and an internal debounced copy that drives the actual query. This keeps the input snappy while throttling network requests.

The fetcher signature is `(search: string) => Promise<Pagination<T>>`. The global `Pagination<T>` type is:

```ts
interface Pagination<T> {
  total: number;
  perPage: number;
  page: number;
  data: T[];
}
```

This is exactly what `parsePaginationFromApi` returns, so a paginated API file plugs straight in. The hook unwraps `data?.data ?? []` for you, so the returned `items` field is directly `T[]`.

```tsx
import { useSearchableResource } from '@/plugins/useSearchableResource.ts';
import getItems from '@/api/getItems.ts';
import Select from '@/elements/input/Select.tsx';

export default function ItemPicker({ serverUuid }: { serverUuid: string }) {
  const items = useSearchableResource<Item>({
    queryKey: ['extensions', 'dev.yourname.test', 'items', serverUuid],
    fetcher: (search) => getItems(serverUuid, search),
  });

  return (
    <Select
      label='Item'
      data={items.items.map((item) => ({ label: item.name, value: item.uuid }))}
      searchable
      searchValue={items.search}
      onSearchChange={items.setSearch}
      loading={items.loading}
    />
  );
}
```

The hook builds the final query key as `[...queryKey, ...deps, { search: debouncedSearch }]`. Each distinct debounced search term gets its own cache entry, so typing the same string twice in a row hits the cache on the second pass without firing a network request. The default debounce is 150ms; pass `debounceMs` to override it.

**`deps`** is an array of values that participate in two ways: they're spread into the query key (so changing one invalidates that cache entry rather than overwriting it), and the query is gated on `deps.every(Boolean)` when `deps` is non-empty. Pass it when the fetcher depends on something that may not yet be available:

```ts
const items = useSearchableResource<Item>({
  queryKey: ['extensions', 'dev.yourname.test', 'items', serverUuid],
  fetcher: (search) => getItems(serverUuid, search),
  deps: [serverUuid],
});
```

**`canRequest`** is an additional gate on top of `deps`. The query runs only when `canRequest` is true *and* every element of `deps` is truthy (or `deps` is empty). Default is `true`. Use it for conditions that aren't naturally part of the fetcher's argument list - permission flags, parent-component readiness, modal-open state.

**`defaultSearchValue`** sets the initial value for both `search` and the internal debounced state on mount. This is useful in edit forms where you already know the currently selected item's name and want it to appear in the input without the user having to open and search the dropdown:

```ts
const items = useSearchableResource<Item>({
  queryKey: ['extensions', 'dev.yourname.test', 'items'],
  fetcher: (search) => getItems(search),
  defaultSearchValue: existing?.name,
});
```

### `useSearchablePaginatedTable` - paginated tables

Use this for full table pages with search and pagination. It manages page and search state, syncs both to URL search params, renders previous data while the next page loads via TanStack Query's `placeholderData: keepPreviousData`, and calls `setStoreData` when fresh data arrives. The actual paginated data lives in your store, not in the hook's return value - the hook drives the store, and the component reads from the store directly.

```tsx
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePaginatedTable.ts';
import getMyItems from '@/api/getMyItems.ts';
import Table from '@/elements/Table.tsx';
import { useMyStore } from '@/stores/myStore.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

export default function MyItemsTable({ serverUuid }: { serverUuid: string }) {
  const { t } = useTranslations();
  const { items, setItems } = useMyStore();

  const { loading, search, setSearch, page, setPage } = useSearchablePaginatedTable({
    queryKey: ['extensions', 'dev.yourname.test', 'items', serverUuid],
    fetcher: (page, search) => getMyItems(serverUuid, page, search),
    setStoreData: setItems,
  });

  return (
    <Table
      columns={[
        t('common.table.columns.name'),
        t('common.table.columns.created'),
        ''
      ]}
      loading={loading}
      pagination={items}
      onPageSelect={setPage}
    >
      {items.data.map((item) => (
        <ItemRow key={item.uuid} item={item} />
      ))}
    </Table>
  );
}
```

The fetcher signature is `(page: number, search: string) => Promise<T>`. The hook builds the final query key as `[...queryKey, ...deps, { page, search: debouncedSearch }]`, so each page/search combination has its own cache entry.

**URL params:** On mount, the hook initialises `search` from `?search=` and `page` from `?page=` in the URL (the page param is parsed and ignored unless it's a finite integer `>= 1`). Whenever either changes, `setSearchParams` is called with both values, which replaces the entire search string - any other params in the URL will be dropped. The immediate `search` value (not debounced) is written to the URL on every keystroke; the debounced copy is what drives the query. Clearing the search field bypasses the debounce entirely and immediately resets both the debounced state and the query.

**Pagination auto-correction:** When a fetch returns, the hook inspects `total`, `perPage`, and `page` on the response (or on `response[paginationKey]` if `paginationKey` is set) *before* calling `setStoreData`. If the current page exceeds the last valid page, it calls `setPage(totalPages)` and skips the store update for this fetch - the resulting re-fetch will populate the store. If the total is zero and the current page isn't 1, it resets to page 1 the same way. Only when the page is already valid does `setStoreData` get called with the response. This handles the common case of deleting the last item on a page.

**`paginationKey`** handles responses where the paginated shape is nested under a key. Without it, the hook looks for `total`, `perPage`, and `page` at the root of the fetcher's return value. With it, it looks at `response[paginationKey]` for those fields, while still passing the full response to `setStoreData`:

```ts
useSearchablePaginatedTable({
  queryKey: ['extensions', 'dev.yourname.test', 'items', serverUuid],
  fetcher: getMyItems,
  setStoreData: setItems,
  paginationKey: 'items',
  // fetcher returns: { items: { data, total, perPage, page } }
});
```

**`modifyParams: false`** disables URL param reading and writing entirely. Use this when the table is inside a modal or a sub-panel where touching the URL would be wrong. **`initialPage`** sets the starting page when `modifyParams` is false or when the URL has no `?page=` param.

**`deps`** behaves the same as in `useSearchableResource` - spread into the query key so each combination gets its own cache entry. Unlike `useSearchableResource`, there's no `deps.every(Boolean)` gate here, so use `canRequest` if you need to block the fetch on a precondition.

**`canRequest`** gates the query - when `false`, no fetch fires. Default is `true`.

### `useResourceForm` - create / update / delete forms

Use this for forms that manage a single resource's full lifecycle. It takes a Mantine `useForm` instance and your API functions, then handles loading state, success/error toasts, cache invalidation, and navigation.

```tsx
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import { useResourceForm } from '@/plugins/useResourceForm.ts';
import createItem from '@/api/createItem.ts';
import updateItem from '@/api/updateItem.ts';
import deleteItem from '@/api/deleteItem.ts';

const schema = z.object({
  name: z.string().min(1),
  enabled: z.boolean(),
});

export default function ItemCreateOrUpdate({ existing }: { existing?: Item }) {
  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: existing?.name ?? '',
      enabled: existing?.enabled ?? true,
    },
    validate: zod4Resolver(schema),
    validateInputOnBlur: true,
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm({
    form,
    createFn: () => createItem(schema.parse(form.getValues())),
    updateFn: existing ? () => updateItem(existing.uuid, schema.parse(form.getValues())) : undefined,
    deleteFn: existing ? () => deleteItem(existing.uuid) : undefined,
    doUpdate: !!existing,
    basePath: '/admin/my-feature/items',
    resourceName: 'Item',
  });

  return (
    <form onSubmit={form.onSubmit(() => doCreateOrUpdate(false, ['extensions', 'dev.yourname.test', 'items']))}>
      <TextInput label='Name' {...form.getInputProps('name')} />
      <Switch label='Enabled' {...form.getInputProps('enabled', { type: 'checkbox' })} />
      <Group>
        <Button type='submit' loading={loading}>Save</Button>
        {!existing && (
          <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
            Save & Stay
          </Button>
        )}
        {existing && (
          <Button color='red' onClick={doDelete} loading={loading}>Delete</Button>
        )}
      </Group>
    </form>
  );
}
```

**`doUpdate`** is the flag that determines which function is called. When `true`, `doCreateOrUpdate` calls `updateFn`; when `false`, it calls `createFn`. Pass `!!existing` or equivalent - the hook trusts this flag completely and does not inspect anything else to decide.

**`createFn` and `updateFn`** are zero-argument closures (from the consumer's perspective - the public `doCreateOrUpdate` signature doesn't expose a way to pass arguments through). They capture form values from the surrounding scope via `form.getValues()` and run schema validation inside the closure.

**`doCreateOrUpdate(stay, bustCacheKey)`:**

- `stay: boolean` controls what happens after a successful create. When `false`, the hook navigates to `${basePath}/${result.uuid}`. This requires your `createFn` to return an object with a `uuid: string` field (the hook has a `HasUuid` constraint on the generic). When `true`, navigation is skipped and any fields listed in `toResetOnStay` are reset to their initial values, allowing the user to create another item without leaving the page. `stay` has no effect on updates - they never navigate or reset, regardless.
- `bustCacheKey` is an optional query key to invalidate on success. `queryClient.invalidateQueries` is called with this key after both creates and updates. Pass your list key here so any mounted table re-fetches after a save.

**`toResetOnStay`** is an array of field name strings to reset when `stay` is `true`. Only those specific fields are reset; the rest of the form retains its values. This is useful when some fields (a category, a server) should persist across repeated creates, but others (a name) should clear:

```ts
useResourceForm({
  // ...
  toResetOnStay: ['name'],
});
```

**`resourceName`** is interpolated directly into the toast messages: `"Item created."`, `"Item updated."`, `"Item deleted."`. After a delete, the hook also calls `navigate(basePath)` to return to the list.

**`setLoading`** is exposed in the return value so you can drive the shared loading flag from outside the hook. Use it when an extra action button in the same component needs to participate in the same disabled/loading state - flip it `true` before your own async work and `false` in a `finally`.

## Summary

| Situation | Use |
| --------- | --- |
| Any response | `axiosInstance` + `parseFromApi(schema, data.<wrapper_key>)` |
| Paginated list response | `parsePaginationFromApi(schema, data.<wrapper_key>)` |
| Any request with a body | `axiosInstance` + `serializeForApi(schema, data)` |
| Map whose object *keys* are data | type the field as `z.record(...)` - keys pass through untouched |
| Any error from any of the above | `httpErrorToHuman(err)` into a toast |
| Simple one-off data fetch | `useResource` |
| Data that must re-fetch on an interval | `usePollingResource` |
| Searchable `<Select>` or `<MultiSelect>` options | `useSearchableResource` |
| Full paginated table with search | `useSearchablePaginatedTable` |
| Create / update / delete form | `useResourceForm` |

Keep your API files one-endpoint-per-file with a default export, define one Zod schema per resource and run every request and response through the `api-transform` helpers, and match the three-callback success/error/loading pattern for any call triggered by user action. Define query keys inline as extension-namespaced arrays - never import from `@/lib/queryKeys.ts`.
