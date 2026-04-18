# Permissions

Every mutating route in your extension should be gated on a permission check - something like `permissions.has_server_permission("settings.egg-changer")?` at the top of the handler. The routing docs already covered *how* to do that check; this page is about the other side, which is **where those permission strings come from** and how you register them so admins can actually grant or revoke them in the UI.

The short version: extensions declare their permissions through the `ExtensionPermissionsBuilder` in their `initialize_permissions` method, exactly like routes are declared through `ExtensionRouteBuilder` in `initialize_router`. The Panel then exposes those permissions in the permission-picker UI, so users assigning subusers to a server or admins configuring roles can toggle each one individually.

## The Three Permission Scopes

There are three independent permission surfaces, one per "who's being permissioned":

| Scope | Who it applies to | Where it's checked |
| ----- | ----------------- | ------------------ |
| **User permissions** | A user's own account scope (things they can do that aren't server-specific) | Client routes that aren't server-scoped |
| **Server permissions** | Subusers on a specific server | Client-server routes |
| **Admin permissions** | Admin roles | Admin routes |

These map 1:1 to the `has_user_permission(...)`, `has_server_permission(...)`, and `has_admin_permission(...)` methods you've already seen on `GetPermissionManager`. The scope you add a permission under has to match the scope of the route that checks it - an admin permission can't be checked by `has_server_permission` and vice versa.

## The Shape of a Permission

Permissions are organized into **groups**, and each group contains one or more named permissions. The underlying types are:

```rs
pub struct PermissionGroup {
    pub description: &'static str,
    pub permissions: IndexMap<&'static str, &'static str>,
}
```

A group has a description (what the group is about, shown in the permission picker), and a map of permission names to their descriptions. So a group like `settings` might contain permissions `read`, `update`, and `egg-changer`, each with its own blurb explaining what granting that permission does.

**The dotted strings you see in permission checks are `<group_name>.<permission_name>`.** `settings.egg-changer` means "the `egg-changer` permission inside the `settings` group". This is the full "permission node" - the group name isn't just organizational, it's part of the identifier.

::: info
Use **kebab-case** for both group names and permission names - `egg-changer`, not `eggChanger` or `egg_changer` or `EggChanger`. This matches the convention the core Panel uses and keeps the permission picker visually consistent.
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

New groups you register show up in the permission-picker UI with no icon by default, which looks a bit bare next to the core Panel's groups. Giving your group an icon is optional but recommended - it makes the picker scannable and signals to users at a glance what the group is for.

Icons are attached **from the frontend**, not the backend. This is a presentation concern and lives on the extension registry, not the permission builder:

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

Each takes the **group name** (not a permission node - icons are per-group, not per-permission) and a `ReactNode`. The `ReactNode` is usually a `<FontAwesomeIcon>` to match the rest of the Panel's visual style, but technically any React element works.

::: info
Registering an icon for a group name that doesn't exist is harmless - the icon is simply never rendered. This means you can safely register icons for groups you've only *mutated* rather than created, and it means adding icons before you've finalized the group name won't crash anything. But in the typical case, add the icon for the same group name you registered in `initialize_permissions` on the backend.
:::

This also works for core groups you've mutated - if you add a new permission to the existing `settings` group on the backend (see the next section), you usually *don't* want to also replace the core icon, but the capability exists if you really need to.

## Mutating Core Permission Groups

Here's where it gets interesting. Instead of creating a brand-new group for one or two permissions, you can **add your permission to an existing core group**. This is usually the right call when your permission is conceptually part of an existing surface area - for example, a permission that lets a subuser change their server's egg fits cleanly into the existing `settings` group on server permissions, rather than needing its own top-level group.

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

Your check then reads `permissions.has_server_permission("settings.egg-changer")?` — it looks exactly like a core permission to the rest of the codebase, because as far as the permission system is concerned, it is one.

**When to pick which:**

- **Add a new group** when you're introducing a whole area of functionality - a new page, a new resource type, something that would warrant its own section in the permission picker. Users scanning permissions should see "ah, this is all the X extension's stuff" at a glance.
- **Mutate an existing group** when you're adding one or two permissions that fit naturally into something that already exists. Server operators shouldn't have to learn a new top-level category just because you added one checkbox.

Most extensions end up doing at least some of the second pattern - the `settings` group in particular is a common target, since a lot of extensions add configuration surfaces that conceptually live under "settings".

::: warning
**You can also remove permissions from core groups.** The `ExtensionPermissionsBuilder` fields are `pub`, and `PermissionGroup.permissions` is a mutable `IndexMap`, which means nothing at the API level stops you from calling `.remove(...)` inside a `mutate_*` closure to strip permissions the core Panel defined.

**Don't.** Removing permissions the Panel defined will break core UI that depends on them, silently lock users out of functionality they're supposed to have, and if another extension is registered after yours, its behavior becomes load-order-dependent in ways that are genuinely hard to debug. The capability exists because the API is consistent, not because it's a supported workflow. If you think you need to remove a core permission, what you probably actually want is to *check* a different permission in your own code, or to introduce an admin-level toggle that your extension can gate on itself.

Mutating existing permissions (e.g. changing a description) is a similarly sharp tool - possible, but you're modifying UI that other parts of the Panel and other extensions see. Do it rarely and deliberately.
:::

## Checking Permissions in Routes

This is covered more fully in the [routing page](./routing.md#writing-a-route-handler), but for completeness: once a permission is registered, you check it at the top of your handler with `GetPermissionManager`:

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

The `?` bubbles a `403 Forbidden` with the permission node embedded in the message if the current user doesn't have it. Always put the check before any work that could leak data or side effects - treat it as the first line of the handler body.

## Checking Permissions on the Frontend

Backend checks are the security boundary - they're what actually stops a request from doing something the user shouldn't. But you almost always want the frontend to also know about permissions, so you can hide UI the user can't use rather than letting them click a button that just returns 403. For that, the Panel ships a `Can` component in two flavors:

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

If the user has the permission, the children render. If they don't, nothing renders - the whole block is hidden. This is the "if you can't use it, you don't see it exists" pattern, and it's the right default for most feature-level UI.

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

The default behavior (hide everything) is usually right for **whole features** - if a subuser can't use your egg-changer at all, showing them an empty card that's grayed out is just noise. Hide the card.

But for **inline actions inside a feature they *can* otherwise see**, a disabled button with a tooltip is often better UX. The user sees what they *would* be able to do, gets a clear signal they can't, and can ask their admin for the right permission if they need it. That's what `cantSave` and `cantDelete` are for on `AdminCan` - they render a stock disabled button with a "you don't have permission to save" tooltip:

```tsx
<AdminCan action='extensions.configure' cantSave>
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

If you need to branch on permissions in logic rather than in JSX - e.g. deciding whether to show a column in a table based on one field, or whether to include an action in a dropdown - you can call the hooks directly:

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

Prefer the `<Can>` components for rendering decisions and the hooks only for cases where the JSX wrapper is awkward.

::: warning
Frontend permission checks are a UX layer, not a security layer. Never skip the backend check just because you wrapped the UI in `<ServerCan>` - a user can trivially hit your API with curl or by editing the frontend bundle. The `<Can>` components decide what's *visible*; `has_server_permission(...)?` on the backend decides what's *allowed*. Both are needed for correct behavior.
:::

## Design Guidelines

A few things to keep in mind when designing your permission surface:

- **Err on the side of more granular permissions, not fewer.** If your extension has both a read-only view and a mutation, that's two permissions (`read` and `update`), not one. Operators want to grant subusers the ability to *look* at things without also being able to change them.

- **Permission names should describe capabilities, not implementation details.** `egg-changer` is good because it tells the user what granting this permission *lets someone do*. A name like `post-switch-endpoint` would be bad because it describes the route, not the capability - if you ever restructure your routes, the permission name becomes a lie.

- **Descriptions are shown to humans configuring permissions.** Write them as a full sentence, starting with "Allows ..." or similar, describing what the permission lets someone do in user-facing terms. Avoid jargon that only makes sense if you've read the code.

- **Don't register permissions you never check.** A permission that doesn't gate anything just confuses operators who turn it on and wonder why nothing changes.

- **Once a permission is live, its name is effectively a public API.** Renaming it breaks every role configuration that referenced it, and existing subusers lose access to the functionality it guarded. If you need to rename one, plan for a migration path (register the new name, keep checking the old for a release or two, deprecate the old in a later version).
