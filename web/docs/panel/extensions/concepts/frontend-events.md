---
title: Frontend Events
description: Intercept, change or cancel things the Panel frontend is about to do, such as showing a toast, sending an API request or copying to the clipboard.
---

# Frontend Events

[Events](./events.md) covers the backend: Rust handlers that run when a model is created, updated or deleted. The frontend has its own event system for a different job: letting your extension step in right before the Panel does something in the browser, change it, or stop it.

Every frontend event is registered in `initialize()` through `enterEvents`, and every event is a `CancellableEvent`.

::: info
Frontend events arrived in Panel 1.2.6. On 1.2.5 and older there is no `enterEvents` and no events registry, so an extension using this API won't build against an older Panel.
:::

## `CancellableEvent<D>`

All frontend events share one shape:

| Member | What it is |
| ------ | ---------- |
| `data` | What the Panel is about to do. It's mutable, and whatever it holds after the handlers ran is what the Panel uses |
| `cancel()` | Stops the Panel from doing it at all |
| `uncancel()` | Undoes an earlier `cancel()` |
| `cancelled` | Whether the event is currently cancelled |

Each event type extends this with read-only context about what happened, such as the toast's id or the server the websocket belongs to. That context is information for your handler. Changing it does nothing, so edit `data` instead.

## Priority And Cancellation

Every `add*Handler` takes an optional second argument:

```ts
toast.addShowHandler(handler, { priority: 'high', receiveCancelled: false });
```

- **`priority`** is one of `highest`, `high`, `normal` (the default), `low` or `lowest`. Handlers run from `highest` to `lowest`. Within one priority they run in the order they were registered.
- **`receiveCancelled`** defaults to `false`. Once a handler cancels an event, the remaining handlers are skipped unless they registered with `receiveCancelled: true`. Those still run and can call `uncancel()`.

A common pattern is a `lowest` handler with `receiveCancelled: true` that gets the final word:

```ts
toast.addShowHandler(
  (event) => {
    if (event.cancelled && event.data.type === 'error') event.uncancel();
  },
  { priority: 'lowest', receiveCancelled: true },
);
```

Handlers are synchronous. The Panel acts on the event as soon as the last handler returns, so a handler that returns a promise has no effect once the promise resolves. If a handler throws, the error is logged and the remaining handlers still run.

Each `add*Handler` has a matching `remove*Handler` that takes the same function back, so keep a reference if you need to unregister later. Both return the registry, so calls chain like the rest of `ExtensionRegistry`.

::: warning
Doing the thing an event intercepts from inside its own handler, such as showing a toast from a toast handler, fires the handlers again. The Panel stops after 8 levels of nesting and logs an error. That limit counts across all frontend events, so a websocket handler that shows a toast which triggers another handler adds to the same count.
:::

## Event Groups

| Group | Entered with | Events |
| ----- | ------------ | ------ |
| Toasts | `enterToast` | Show, update and dismiss. See [Intercepting Toasts](./toasts.md#intercepting-toasts) |
| Server websocket | `enterServerWebsocket` | Frames received from and sent to Wings |
| API | `enterApi` | Requests and responses made through the Panel's axios instance |
| Auth | `enterAuth` | Logging out and impersonating |
| Clipboard | `enterClipboard` | Copying and pasting through the Panel's clipboard helpers |
| Quick actions | `enterQuickActions` | Selecting a row in the quick actions palette |

## Server Websocket

On a server's pages, the Panel keeps one websocket open to Wings. It carries console output, stats, status changes, backup and install progress, and the commands the user sends. Two events sit on that socket:

| Handler | Event | `data` | Extra info |
| ------- | ----- | ------ | ---------- |
| `addMessageHandler` | `ServerWebsocketMessageEvent` | `{ event, args }` received from Wings | `serverUuid`, `socket` |
| `addSendHandler` | `ServerWebsocketSendEvent` | `{ event, args }` about to be sent to Wings | `serverUuid`, `socket` |

`event` is the frame name (`'console output'`, `'stats'`, `'send command'`, ...), and `args` is the frame's arguments.

Since Panel 1.2.8, `args` is typed `unknown[]` rather than `string[]`. Plain text such as console lines is still a string, but the Panel now asks Wings for its `msgpack` transmission mode, and falls back to the older mode when Wings doesn't answer. In `msgpack` mode, structured arguments (the `stats` payload, backup progress) arrive as values and binary ones as `Uint8Array`; in the older mode they are JSON and base64 strings. Read them with the helpers `shared` exports from the same module as the events, which accept both forms:

```ts
import { binaryArg, structuredArg } from 'shared/src/registries/events/serverWebsocket.ts';

const stats = structuredArg<{ memory_bytes: number }>(event.data.args[0]);
const update = binaryArg(event.data.args[0]);
```

Check `typeof arg === 'string'` before treating an argument as text. The `SocketEvent` and `SocketRequest` enums in `@/plugins/websocket/useWebsocketEvent.ts` list the names the Panel itself uses.

```ts
import { Extension, ExtensionContext } from 'shared';
import { SocketEvent, SocketRequest } from '@/plugins/websocket/useWebsocketEvent.ts';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.enterEvents((events) =>
      events.enterServerWebsocket((socket) =>
        socket
          .addMessageHandler((event) => {
            if (event.data.event === SocketEvent.CONSOLE_OUTPUT) {
              event.data.args = event.data.args.map((line) =>
                typeof line === 'string' ? line.replaceAll('secret-token', '********') : line,
              );
            }
          })
          .addSendHandler((event) => {
            const command = event.data.args[0];
            if (event.data.event === SocketRequest.SEND_COMMAND && typeof command === 'string' && command.startsWith('op ')) {
              event.cancel();
            }
          }),
      ),
    );
  }
}
```

What cancelling does:

- A cancelled message never reaches the Panel's listeners. The console doesn't print it, stats don't update, and so on.
- A cancelled send never leaves the browser.

A message handler runs before any `useWebsocketEvent` listener, including your own extension's. Renaming `data.event` delivers the frame to the listeners for the new name instead.

Send handlers only see frames that will actually go out. If the socket is disconnected or waiting for a refreshed token, the frame is dropped before your handler runs.

### Frames You Can't Intercept

Authentication and socket setup bypass the handlers entirely: incoming `auth success`, `token expiring`, `token expired`, `jwt error` and `socket configured`, and outgoing `auth` and `configure socket`. Cancelling or rewriting any of these would leave the socket unable to authenticate or refresh its token, so they never reach your handler. For the same reason, a handler that renames a frame to one of these names has that frame dropped.

The Panel's own connection-state pseudo-events (`SOCKET_OPEN`, `SOCKET_CLOSE` and the rest) aren't frames, so they don't pass through these handlers either.

::: info
Console output and stats frames arrive many times a second. Keep message handlers cheap and check `event.data.event` first, before doing any work on the arguments.
:::

## API

Every request the Panel makes goes through one axios instance (`axiosInstance` from `@/api/axios.ts`), and so do yours if you use it. Two events sit on it:

| Handler | Event | `data` |
| ------- | ----- | ------ |
| `addRequestHandler` | `ApiRequestEvent` | The axios request config (`method`, `url`, `params`, `headers`, `data`, ...) before it's sent |
| `addResponseHandler` | `ApiResponseEvent` | The axios response (`status`, `headers`, `data`, ...) before the caller receives it |

```ts
ctx.extensionRegistry.enterEvents((events) =>
  events.enterApi((api) =>
    api
      .addRequestHandler((event) => {
        event.data.headers.set('X-My-Extension', '1');
      })
      .addResponseHandler((event) => {
        if (event.data.config.url === '/api/client/account') {
          console.log('account loaded', event.data.data);
        }
      }),
  ),
);
```

A few things to know before you rely on it:

- **Cancelling rejects the request.** The caller gets an `AxiosError` whose `code` is `API_REQUEST_CANCELLED_CODE` (exported from `shared`), with a translated "This request was blocked by an extension." message. Most Panel code shows that message in an error toast, the same way it shows any other failed request. Cancelling a response works the same way: the request already happened, but the caller sees it fail.
- **Request bodies aren't encoded yet.** `data.data` is the object the caller passed. Endpoints that use MessagePack encode it after your handler runs. For uploads, `data.data` is `FormData`.
- **Not every URL is under `/api/`.** File uploads post straight to the node's Wings URL through the same instance.
- **Only successful responses are emitted.** Failed requests (4xx, 5xx, network errors) skip `addResponseHandler`, and the Panel's own handling of expired sessions runs regardless of your handlers.
- **The very first request isn't covered.** The Panel loads its settings before any extension is initialized, because those settings decide which extensions are enabled.

::: warning
This sees everything: login and two-factor bodies, password changes, freshly created API keys. Treat it accordingly, and keep handlers cheap, because a busy page makes a lot of requests.
:::

## Auth

| Handler | Event | Extra info | Cancelling it |
| ------- | ----- | ---------- | ------------- |
| `addLogoutHandler` | `AuthLogoutEvent` | `kind` (`'logout'` or `'stopImpersonating'`), `user` | The user stays logged in (or keeps impersonating) |
| `addImpersonateHandler` | `AuthImpersonateEvent` | `user` (who is about to be impersonated), `currentUser` | The admin stays themselves |

Both have no `data`. They exist to veto the action, or to run cleanup right before it, such as flushing state your extension keeps for the current user:

```ts
events.enterAuth((auth) =>
  auth.addLogoutHandler((event) => {
    if (event.kind === 'logout' && hasUnsavedWork()) {
      event.cancel();
      showUnsavedWorkWarning();
    }
  }),
);
```

Logging in isn't an event. By the time the Panel's frontend learns about a login, the server session already exists, so there's nothing left to cancel. An expired session doesn't emit `AuthLogoutEvent` either. The Panel simply drops back to the login page.

## Clipboard

| Handler | Event | `data` |
| ------- | ----- | ------ |
| `addCopyHandler` | `ClipboardCopyEvent` | The text about to be written to the clipboard |
| `addPasteHandler` | `ClipboardPasteEvent` | The text read from the clipboard, before the Panel uses it |

These cover every copy and paste button in the Panel, and copying a selection in the server console with Ctrl+C. They don't cover the browser's own copy and paste in text fields, which never goes through the Panel.

```ts
events.enterClipboard((clipboard) =>
  clipboard.addCopyHandler((event) => {
    event.data = redactSecrets(event.data);
  }),
);
```

Cancelling makes `copyToClipboard` / `pasteFromClipboard` reject with a `ClipboardCancelledError` (exported from `shared`). The Panel's clipboard buttons stay silent on that error, so they show neither "Copied" nor "Failed to copy". If the user should be told why nothing happened, show your own toast from the handler.

## Quick Actions

`addSelectHandler` receives a `QuickActionSelectEvent` whenever a row in the [quick actions palette](./quick-actions.md) is picked, whether by click or Enter. That covers actions, navigation rows, servers and rows contributed by modes.

| Member | What it is |
| ------ | ---------- |
| `data` | A copy of the selected row (`key`, `category`, `label`, `onSelect`, ...) |
| `scope` | `'dashboard'`, `'server'` or `'admin'` |
| `serverId` | The current server, on server pages |
| `mode` | The id of the active prefix mode, if one is active |

Only `data.onSelect` is used after your handlers run. The other fields tell you what was picked, and changing them does nothing. Each row closes the palette from its own `onSelect`, so if you replace it, close the palette yourself with `useQuickActionsStore.getState().setOpen(false)` (from `@/stores/quickActions.ts`). Cancelling does nothing at all and leaves the palette open.

```ts
events.enterQuickActions((quickActions) =>
  quickActions.addSelectHandler((event) => {
    trackUsage(event.data.key, event.scope);
  }),
);
```
