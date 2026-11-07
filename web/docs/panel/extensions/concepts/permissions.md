---
title: Permissions
description: Gate your extension routes and UI behind the Panel permission system with your own permission keys.
---

# Permissions

Every mutating route in your extension should check a permission at the top of the handler, such as `permissions.has_server_permission("settings.egg-changer")?`. The [routing page](./routing.md) covers the check itself. This page covers **where those permission strings come from** and how to register them so admins can grant or revoke them in the UI.

Extensions declare permissions through the `ExtensionPermissionsBuilder` in their `initialize_permissions` method, the same way routes are declared through `ExtensionRouteBuilder` in `initialize_router`. The Panel then lists them in the permission picker, so users assigning subusers and admins configuring roles can toggle each one.

## The Three Permission Scopes

There are three independent permission scopes:

| Scope | Who it applies to | Where it's checked |
| ----- | ----------------- | ------------------ |
| **User permissions** | A user's own account scope (things they can do that aren't server-specific) | Client routes that aren't server-scoped |
| **Server permissions** | Subusers on a specific server | Client-server routes |
| **Admin permissions** | Admin roles | Admin routes |

These map 1:1 to the `has_user_permission(...)`, `has_server_permission(...)`, and `has_admin_permission(...)` methods you've already seen on `GetPermissionManager`. The scope you add a permission under has to match the scope of the route that checks it: an admin permission can't be checked by `has_server_permission`, and vice versa.

## The Shape of a Permission

Permissions are organized into **groups**, and each group contains one or more named permissions. The underlying types are:

```rs
pub struct PermissionGroup {
    pub description: &'static str,
    pub permissions: IndexMap<&'static str, &'static str>,
}
```

A group has a description (what the group is about, shown in the permission picker), and a map of permission names to their descriptions. So a group like `settings` might contain permissions `read`, `update`, and `egg-changer`, each with its own description of what granting it allows.

**The dotted strings you see in permission checks are `<group_name>.<permission_name>`.** `settings.egg-changer` means "the `egg-changer` permission inside the `settings` group". This is the full permission node; the group name is part of the identifier, not just a heading.

::: info
Use **kebab-case** for both group names and permission names: `egg-changer`, not `eggChanger` or `egg_changer` or `EggChanger`. This matches the convention the core Panel uses and keeps the permission picker visually consistent.
:::

## Registering Permissions

Permissions are declared by implementing the `initialize_permissions` method on your `Extension` trait. The signature is almost identical to `initialize_router`:

```rs
use shared::{
    State,
    extensions::{Extension, ExtensionPermissionsBuilder},
    permissions::PermissionGroup,
};
use indexmap::IndexMap;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize_permissions(
        &mut self,
        _state: State,
        builder: ExtensionPermissionsBuilder,
    ) -> ExtensionPermissionsBuilder {
        builder.add_server_permission_group(
            "my-feature",
            PermissionGroup {
                description: "Permissions for the My Feature extension.",
                permissions: IndexMap::from([
                    ("read", "Allows viewing My Feature data on this server."),
                    ("update", "Allows changing My Feature settings on this server."),
                ]),
            },
        )
    }
}
```

The builder exposes three `add_*_permission_group` methods (one per scope), each taking a group name and a `PermissionGroup`. All three return `Self`, so you can chain as many as you need. Once registered, your permissions show up in the UI automatically, and you can check them from your handlers:

```rs
permissions.has_server_permission("my-feature.read")?;
permissions.has_server_permission("my-feature.update")?;
```

## Giving a Group an Icon

New groups show up in the permission picker without an icon. An icon is optional, but it makes the group easier to spot next to the core Panel's groups.

Icons are attached **from the frontend**, on the extension registry, not in the backend permission builder:

```tsx
import { Extension, ExtensionContext } from 'shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';

class MyExtension extends Extension {
  public cardConfigurationPage: React.FC | null = null;
  public cardComponent: React.FC | null = null;

  public initialize(ctx: ExtensionContext): void {
    ctx.extensionRegistry.permissionIcons.addServerPermissionIcon(
      'my-feature',
      <FontAwesomeIcon icon={faCube} />,
    );
  }
}

export default new MyExtension();
```

The registry exposes one method per scope, matching the three on the backend builder:

- `addUserPermissionIcon(groupName, icon)`
- `addAdminPermissionIcon(groupName, icon)`
- `addServerPermissionIcon(groupName, icon)`

Each takes the **group name** (icons are per group, not per permission) and a `ReactNode`. Use a `<FontAwesomeIcon>` to match the rest of the Panel, though any React element works.

::: info
Registering an icon for a group name that doesn't exist is harmless: the icon is never rendered. Normally you add the icon for the same group name you registered in `initialize_permissions` on the backend.
:::

It also works for core groups you've mutated. If you add a permission to the existing `settings` group (see the next section), you usually *don't* want to replace its core icon, but you can.

## Mutating Core Permission Groups

Instead of creating a new group for one or two permissions, you can **add your permission to an existing core group**. That is usually the right choice when the permission belongs to an existing area. For example, a permission that lets a subuser change their server's egg fits into the existing `settings` group on server permissions.

The builder exposes `mutate_*_permission_group` methods for this:

```rs
async fn initialize_permissions(
    &mut self,
    _state: State,
    builder: ExtensionPermissionsBuilder,
) -> ExtensionPermissionsBuilder {
    builder.mutate_server_permission_group("settings", |group| {
        group.add_permission("egg-changer", "Allows updating the egg of a server.");
    })
}
```

Your check then reads `permissions.has_server_permission("settings.egg-changer")?`. To the permission system, it is a core permission like any other.

**When to pick which:**

- **Add a new group** when you introduce a whole area of functionality, such as a new page or resource type, that deserves its own section in the permission picker.
- **Mutate an existing group** when you add one or two permissions that fit into something that already exists. A single new checkbox doesn't need a new top-level category.

The `settings` group is a common target, since many extensions add configuration that belongs there.

::: warning
**You can also remove permissions from core groups.** The `ExtensionPermissionsBuilder` fields are `pub`, and `PermissionGroup.permissions` is a mutable `IndexMap`, which means nothing at the API level stops you from calling `.remove(...)` inside a `mutate_*` closure to strip permissions the core Panel defined.

**Don't.** Removing a permission the Panel defined breaks core UI that depends on it, silently locks users out of features they should have, and makes other extensions' behavior depend on load order. It is possible only because the API is consistent, not because it is supported. If you think you need it, you probably want to *check* a different permission in your own code, or add an admin-level toggle your extension checks itself.

Changing existing permissions, such as a description, is possible too, but it changes UI that the rest of the Panel and other extensions see. Do it rarely.
:::

## Checking Permissions in Routes

The [routing page](./routing.md#writing-a-route-handler) covers this in detail. Once a permission is registered, check it at the top of your handler with `GetPermissionManager`:

```rs
pub async fn route(
    state: GetState,
    permissions: GetPermissionManager,
    mut server: GetServer,
) -> ApiResponseResult {
    permissions.has_server_permission("settings.egg-changer")?;

    // ... rest of the handler
}
```

The `?` bubbles a `403 Forbidden` with the permission node embedded in the message if the current user doesn't have it. Put the check before any work that could leak data or cause side effects, as the first line of the handler body.

## Checking Permissions on the Frontend

Backend checks are the security boundary. The frontend should still know about permissions, so it can hide UI the user can't use instead of showing a button that returns 403. For that, the Panel has a `Can` component in two variants:

```tsx
import { ServerCan, AdminCan } from '@/elements/Can.tsx';
```

Use `ServerCan` for server permissions (inside server routes / pages) and `AdminCan` for admin permissions. There's no `UserCan` component because user permissions are only relevant for API key scopes, not for UI.

The basic usage is to wrap any UI that requires a permission, passing the permission node as `action`:

```tsx
<ServerCan action='settings.egg-changer'>
  <TitleCard title='Change Egg' icon={<FontAwesomeIcon icon={faEgg} />}>
    {/* ... entire feature UI ... */}
  </TitleCard>
</ServerCan>
```

If the user has the permission, the children render. If they don't, the whole block is hidden. That is the right default for most feature-level UI.

### Props

| Prop | Type | Purpose |
| ---- | ---- | ------- |
| `action` | `string \| string[]` | The permission node(s) to check. A single string requires that one permission; an array requires all of them by default. |
| `matchAny` | `boolean` | When `action` is an array, require *any* of them instead of *all*. Defaults to `false`. |
| `renderOnCant` | `ReactNode \| null` | What to render when the user lacks permission. Defaults to nothing (the children are simply hidden). |
| `cantSave` | `boolean` | (`AdminCan` only) Render a disabled Save button with an explanatory tooltip when the user can't save. |
| `cantDelete` | `boolean` | (`AdminCan` only) Render a disabled Delete button with an explanatory tooltip when the user can't delete. |
| `children` | `ReactNode` | What to render when the user has permission. |

### Choosing between "hide" and "show disabled"

Hiding is usually right for **whole features**: if a subuser can't use your egg changer at all, a grayed-out card is just noise.

For **actions inside a feature the user can otherwise see**, a disabled button with a tooltip is often better. The user sees what exists and can ask an admin for the permission. That is what `cantSave` and `cantDelete` on `AdminCan` do: they render a disabled button with a "you don't have permission to save" tooltip:

```tsx
<AdminCan action='extensions.manage' cantSave>
  <Button onClick={doSave}>Save</Button>
</AdminCan>
```

For custom disabled states, pass your own `renderOnCant`:

```tsx
<ServerCan
  action='settings.my-feature'
  renderOnCant={<Tooltip label='Your admin has not granted you this permission.'><Button disabled>Apply</Button></Tooltip>}
>
  <Button onClick={doApply}>Apply</Button>
</ServerCan>
```

### Multiple permissions

Pass an array to require multiple permissions. By default **all** must be present:

```tsx
{/* User must have BOTH permissions */}
<ServerCan action={['settings.my-feature', 'settings.advanced']}>
  <AdvancedControls />
</ServerCan>
```

Add `matchAny` to require just one of them:

```tsx
{/* User must have EITHER permission */}
<ServerCan action={['files.read', 'files.write']} matchAny>
  <FileList />
</ServerCan>
```

### Imperative checks

To branch on permissions in logic instead of JSX, for example to decide whether a table shows a column or a dropdown includes an action, call the hooks directly:

```tsx
import { useServerPermissions, useCan } from '@/plugins/usePermissions.ts';

function MyComponent() {
  const canEditMatrix = useServerPermissions('settings.egg-changer');
  const canEdit = useCan(canEditMatrix, false);

  const actions = [
    { label: 'View', onClick: doView },
    ...(canEdit ? [{ label: 'Edit', onClick: doEdit }] : []),
  ];

  return <Dropdown actions={actions} />;
}
```

The same module also exports `useServerCan(action, matchAny?)` and `useAdminCan(action, matchAny?)`, which fold the two calls above into one boolean. Their `matchAny` defaults to `true`, the opposite of the `<Can>` components, so pass it explicitly when the distinction matters.

Prefer the `<Can>` components for rendering decisions and the hooks only for cases where the JSX wrapper is awkward.

::: warning
Frontend permission checks are a UX layer, not a security layer. Never skip the backend check because the UI is wrapped in `<ServerCan>`; anyone can call your API with curl. The `<Can>` components decide what's *visible*; `has_server_permission(...)?` on the backend decides what's *allowed*. You need both.
:::

## Design Guidelines

- **Prefer more granular permissions over fewer.** If your extension has both a read-only view and a mutation, that's two permissions (`read` and `update`), not one. Operators want to grant subusers the ability to *look* at things without also being able to change them.

- **Permission names should describe capabilities, not implementation details.** `egg-changer` is good because it tells the user what granting this permission *lets someone do*. A name like `post-switch-endpoint` describes the route instead, and stops being accurate once you restructure your routes.

- **Descriptions are shown to humans configuring permissions.** Write them as a full sentence, starting with "Allows ..." or similar, in terms a user understands without reading the code.

- **Don't register permissions you never check.** A permission that doesn't gate anything just confuses operators who turn it on and wonder why nothing changes.

- **Once a permission is live, its name is effectively a public API.** Renaming it breaks every role configuration that referenced it, and existing subusers lose access to the functionality it guarded. To rename one, plan a migration: register the new name, keep checking the old one for a release or two, then remove it.
