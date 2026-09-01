---
title: Permissions Reference
description: Full reference of every user, server, and admin permission available for Calagopus API keys.
---

# Permissions Reference

Every permission available when creating or editing an [API Key](./api-keys.md), grouped the same way they're grouped in the panel. **User** permissions apply to your account as a whole, **Server** permissions apply per-server, and **Admin** permissions apply to the instance and are only available to accounts that already have them.

## User Permissions

### Account

Permissions that control the ability to change account settings.

| Permission | Description |
| --- | --- |
| `account.infos` | Allows changing the account's basic account information. |
| `account.email` | Allows changing the account's email address. |
| `account.password` | Allows changing the account's password. |
| `account.password-login` | Allows enabling and disabling password login for the account. |
| `account.two-factor` | Allows adding and removing two-factor authentication. |
| `account.avatar` | Allows updating and removing the account's avatar. |

### Servers

Permissions that control the ability to list servers and manage server groups.

| Permission | Description |
| --- | --- |
| `servers.create` | Allows creating new server groups. |
| `servers.read` | Allows viewing servers and server groups. |
| `servers.update` | Allows modifying server groups. |
| `servers.delete` | Allows deleting server groups. |

### API Keys

Permissions that control the ability to manage API keys on an account. API keys can never edit themselves or assign permissions they do not have.

| Permission | Description |
| --- | --- |
| `api-keys.create` | Allows creating new API keys. |
| `api-keys.read` | Allows viewing API keys and their permissions. |
| `api-keys.update` | Allows modifying other API keys. |
| `api-keys.delete` | Allows deleting API keys. |
| `api-keys.recreate` | Allows recreating API keys. |

### Security Keys

Permissions that control the ability to manage security keys on an account.

| Permission | Description |
| --- | --- |
| `security-keys.create` | Allows creating new security keys. |
| `security-keys.read` | Allows viewing security keys. |
| `security-keys.update` | Allows modifying security keys. |
| `security-keys.delete` | Allows deleting security keys. |

### SSH Keys

Permissions that control the ability to manage SSH keys on an account.

| Permission | Description |
| --- | --- |
| `ssh-keys.create` | Allows creating or importing new SSH keys. |
| `ssh-keys.read` | Allows viewing SSH keys. |
| `ssh-keys.update` | Allows modifying other SSH keys. |
| `ssh-keys.delete` | Allows deleting SSH keys. |

### OAuth Links

Permissions that control the ability to manage OAuth links on an account.

| Permission | Description |
| --- | --- |
| `oauth-links.create` | Allows creating new OAuth links. |
| `oauth-links.read` | Allows viewing OAuth links. |
| `oauth-links.delete` | Allows deleting OAuth links. |

### Command Snippets

Permissions that control the ability to manage command snippets on an account.

| Permission | Description |
| --- | --- |
| `command-snippets.create` | Allows creating new command snippets. |
| `command-snippets.read` | Allows viewing command snippets. |
| `command-snippets.update` | Allows modifying command snippets. |
| `command-snippets.delete` | Allows deleting command snippets. |

### Sessions

Permissions that control the ability to manage sessions on an account.

| Permission | Description |
| --- | --- |
| `sessions.read` | Allows viewing sessions and their IP addresses. |
| `sessions.delete` | Allows deleting sessions. |

### Settings

Permissions that control the ability to manage synced user settings on an account.

| Permission | Description |
| --- | --- |
| `settings.read` | Allows viewing the account's synced user settings. |
| `settings.update` | Allows modifying the account's synced user settings. |

### Activity

Permissions that control the ability to view the activity log on an account.

| Permission | Description |
| --- | --- |
| `activity.read` | Allows viewing the account's activity logs. |

## Server Permissions

### Control

Permissions that control the ability to control the power state of a server, read the console, or send commands.

| Permission | Description |
| --- | --- |
| `control.read-console` | Allows reading the server console logs. |
| `control.console` | Allows sending commands to the server instance via the console. |
| `control.start` | Allows starting the server if it is stopped. |
| `control.stop` | Allows stopping the server if it is running. |
| `control.restart` | Allows restarting the server. Permits starting it if offline, but not placing it in a fully stopped state. |

### Subusers

Permissions that control the ability to manage subusers of a server. Users can never edit their own account or assign permissions they do not have.

| Permission | Description |
| --- | --- |
| `subusers.create` | Allows creating new subusers for the server. |
| `subusers.read` | Allows viewing subusers and their permissions. |
| `subusers.update` | Allows modifying other subusers. |
| `subusers.delete` | Allows deleting subusers from the server. |

### Files

Permissions that control the ability to modify the filesystem for this server.

| Permission | Description |
| --- | --- |
| `files.create` | Allows creating additional files and folders via the panel or direct upload. |
| `files.read` | Allows viewing the contents of a directory, but not reading or downloading individual files. |
| `files.read-content` | Allows viewing the contents of a specific file. Also permits downloading files. |
| `files.update` | Allows updating the contents of an existing file or directory. |
| `files.delete` | Allows deleting files or directories. |
| `files.archive` | Allows archiving the contents of a directory and decompressing files. |
| `files.sftp` | Allows connecting via SFTP to manage files. |
| `files.query-raw` | Allows running arbitrary SQL against a SQLite database file on this server. This grants full read and write access to that file's contents, equivalent to reading and updating it directly. |

### Backups

Permissions that control the ability to manage server backups.

| Permission | Description |
| --- | --- |
| `backups.create` | Allows creating new backups for the server. |
| `backups.read` | Allows viewing existing backups. |
| `backups.download` | Allows downloading backups. |
| `backups.restore` | Allows restoring backups. |
| `backups.update` | Allows updating existing backups. |
| `backups.delete` | Allows deleting backups. |

### Backup Groups

Permissions that control the ability to manage server backup groups (retention policies).

| Permission | Description |
| --- | --- |
| `backup-groups.create` | Allows creating new backup groups. |
| `backup-groups.read` | Allows viewing existing backup groups. |
| `backup-groups.update` | Allows updating existing backup groups. |
| `backup-groups.delete` | Allows deleting backup groups. |

### Schedules

Permissions that control the ability to manage server schedules.

| Permission | Description |
| --- | --- |
| `schedules.create` | Allows creating new schedules. |
| `schedules.read` | Allows viewing existing schedules. |
| `schedules.update` | Allows updating existing schedules. |
| `schedules.delete` | Allows deleting schedules. |

### Allocations

Permissions that control the ability to modify the port allocations for this server.

| Permission | Description |
| --- | --- |
| `allocations.read` | Allows viewing all allocations currently assigned. Users with any access can always view the primary allocation. |
| `allocations.create` | Allows assigning additional allocations to the server. |
| `allocations.update` | Allows changing the primary server allocation and attaching notes to allocations. |
| `allocations.delete` | Allows deleting allocations from the server. |

### Firewall

Permissions that control the ability to restrict which sources may reach this server's allocations.

| Permission | Description |
| --- | --- |
| `firewall.read` | Allows viewing the firewall rules of the server. |
| `firewall.update` | Allows adding, reordering, modifying and removing firewall rules. |

### Connections

Permissions that control the ability to connect this server privately to other servers, bypassing the public network.

| Permission | Description |
| --- | --- |
| `connections.create` | Allows putting the server on the private network and connecting it to another server. |
| `connections.read` | Allows viewing the server's private network membership, its connections and the ports it offers them. |
| `connections.update` | Allows changing the server's hostname and which ports it offers to the servers connected to it. |
| `connections.delete` | Allows removing one of the server's connections, and taking the server off the private network. |

### Startup

Permissions that control the ability to view and modify this server's startup parameters.

| Permission | Description |
| --- | --- |
| `startup.read` | Allows viewing the startup variables for the server. |
| `startup.update` | Allows modifying the startup variables. |
| `startup.command` | Allows modifying the command used to start the server. |
| `startup.docker-image` | Allows modifying the Docker image used when running the server. |

### Databases

Permissions that control the ability to manage databases on this server.

| Permission | Description |
| --- | --- |
| `databases.create` | Allows creating new databases. |
| `databases.read` | Allows viewing databases associated with this server. |
| `databases.read-password` | Allows viewing the password associated with a database instance. |
| `databases.update` | Allows rotating the password on a database instance. Users without `read-password` won't see the new value. |
| `databases.recreate` | Allows deleting and recreating a database, wiping all data. |
| `databases.delete` | Allows removing database instances from this server. |
| `databases.query` | Allows browsing a database's tables and reading their rows through the panel. |
| `databases.query-raw` | Allows running arbitrary SQL against a database. This grants full read and write access to its contents and structure, equivalent to the database's own credentials. |
| `databases.edit-rows` | Allows inserting, updating and deleting individual table rows through the panel. Statements are built by the panel, so this cannot alter a database's structure. |
| `databases.edit-structure` | Allows creating and renaming tables and columns through the panel. Statements are built by the panel from validated names and types, so this cannot read or destroy stored data. |
| `databases.delete-structure` | Allows deleting tables and columns through the panel, permanently destroying any data they contain. |

### Database Instances

Permissions that control the ability to manage agent-managed database instances on this server.

| Permission | Description |
| --- | --- |
| `database-instances.create` | Allows creating new database instances. |
| `database-instances.read` | Allows viewing database instances associated with this server. |
| `database-instances.update` | Allows updating database instances, such as locking them. |
| `database-instances.apply-update` | Allows applying database agent template updates to database instances. |
| `database-instances.delete` | Allows removing database instances from this server. |
| `database-instances.power` | Allows starting, stopping and restarting database instances. |
| `database-instances.logs` | Allows viewing the logs of database instances. |
| `database-instances.databases` | Allows managing the databases inside database instances. |
| `database-instances.recreate` | Allows deleting and recreating databases inside database instances, wiping all data. |
| `database-instances.users` | Allows managing the users inside database instances, including viewing their credentials. |
| `database-instances.query` | Allows browsing an instance database's tables and reading their rows through the panel. |
| `database-instances.query-raw` | Allows running arbitrary SQL against an instance database. The agent connects as the instance administrator, so this grants full access to every database of the instance. |
| `database-instances.edit-rows` | Allows inserting, updating and deleting individual table rows through the panel. Statements are built by the panel, so this cannot alter a database's structure. |
| `database-instances.edit-structure` | Allows creating and renaming tables and columns through the panel. Statements are built by the panel from validated names and types, so this cannot read or destroy stored data. |
| `database-instances.delete-structure` | Allows deleting tables and columns through the panel, permanently destroying any data they contain. |
| `database-instances.import` | Allows importing data into database instances. |
| `database-instances.export` | Allows exporting data from database instances. |

### Mounts

Permissions that control the ability to manage server mounts.

| Permission | Description |
| --- | --- |
| `mounts.attach` | Allows attaching new mounts to the server. |
| `mounts.read` | Allows viewing existing mounts. |
| `mounts.detach` | Allows detaching mounts from the server. |

### Settings

Permissions that control the ability to manage settings on this server.

| Permission | Description |
| --- | --- |
| `settings.rename` | Allows renaming the server and changing its description. |
| `settings.timezone` | Allows changing the server's timezone. |
| `settings.auto-kill` | Allows changing the server's auto-kill settings. |
| `settings.auto-start` | Allows changing the server's auto-start settings. |
| `settings.install` | Allows triggering a reinstall of the server. |
| `settings.cancel-install` | Allows canceling the server's installation process. |

### Activity

Permissions that control the ability to view the activity log on this server.

| Permission | Description |
| --- | --- |
| `activity.read` | Allows viewing the server's activity logs. |
| `activity.read-ip` | Allows viewing IP addresses associated with activity logs. |

## Admin Permissions

### Stats

| Permission | Description |
| --- | --- |
| `stats.read` | Allows viewing panel statistics. |

### Settings

| Permission | Description |
| --- | --- |
| `settings.read` | Allows viewing panel settings and secrets. |
| `settings.update` | Allows modifying panel settings and secrets. |

### Email Templates

| Permission | Description |
| --- | --- |
| `email-templates.read` | Allows viewing email templates. |
| `email-templates.update` | Allows modifying email templates. |

### Extensions

| Permission | Description |
| --- | --- |
| `extensions.read` | Allows viewing panel extensions. |
| `extensions.manage` | Allows installing, updating, and removing panel extensions; usually also manages extension settings. |

### Announcements

| Permission | Description |
| --- | --- |
| `announcements.create` | Allows creating new announcements. |
| `announcements.read` | Allows viewing announcements. |
| `announcements.update` | Allows modifying announcements. |
| `announcements.delete` | Allows deleting announcements. |

### Assets

| Permission | Description |
| --- | --- |
| `assets.read` | Allows viewing panel assets. |
| `assets.upload` | Allows creating and modifying assets. |
| `assets.delete` | Allows deleting panel assets. |

### Users

| Permission | Description |
| --- | --- |
| `users.create` | Allows creating new users. |
| `users.read` | Allows viewing users. |
| `users.update` | Allows modifying users. |
| `users.disable-two-factor` | Allows removing two-factor authentication from users. |
| `users.delete` | Allows deleting users. |
| `users.email` | Allows sending email actions to users, such as password resets, and marking a user's email as verified. |
| `users.activity` | Allows viewing a user's activity log. |
| `users.oauth-links` | Allows viewing and managing a user's OAuth links. |
| `users.impersonate` | Allows impersonating other users. |

### Roles

| Permission | Description |
| --- | --- |
| `roles.create` | Allows creating new roles. |
| `roles.read` | Allows viewing roles. |
| `roles.update` | Allows modifying roles. |
| `roles.delete` | Allows deleting roles. |

### Locations

| Permission | Description |
| --- | --- |
| `locations.create` | Allows creating new locations. |
| `locations.read` | Allows viewing locations. |
| `locations.update` | Allows modifying locations. |
| `locations.delete` | Allows deleting locations. |
| `locations.database-hosts` | Allows viewing and managing a location's database hosts. |
| `locations.database-agent-hosts` | Allows viewing and managing a location's database agent hosts. |

### Backup Configurations

| Permission | Description |
| --- | --- |
| `backup-configurations.create` | Allows creating new backup configurations. |
| `backup-configurations.read` | Allows viewing backup configurations and their passwords. |
| `backup-configurations.update` | Allows modifying backup configurations and their passwords. |
| `backup-configurations.delete` | Allows deleting backup configurations. |
| `backup-configurations.backups` | Allows viewing backups associated with a backup configuration. |

### System Backup Policies

Permissions that control the ability to manage [system backup policies](../admin/system-backup-policies.md) for the panel.

| Permission | Description |
| --- | --- |
| `system-backup-policies.create` | Allows creating new system backup policies. |
| `system-backup-policies.read` | Allows viewing system backup policies. |
| `system-backup-policies.update` | Allows modifying system backup policies and their attached nodes, locations and servers. |
| `system-backup-policies.delete` | Allows deleting system backup policies. |
| `system-backup-policies.backups` | Allows viewing backups associated with a system backup policy. |

### Nodes

| Permission | Description |
| --- | --- |
| `nodes.create` | Allows creating new nodes. |
| `nodes.read` | Allows viewing nodes. |
| `nodes.update` | Allows modifying nodes. |
| `nodes.delete` | Allows deleting nodes. |
| `nodes.read-token` | Allows viewing a node's token. |
| `nodes.reset-token` | Allows resetting a node's token. |
| `nodes.allocations` | Allows viewing and managing a node's allocations. |
| `nodes.mounts` | Allows viewing and managing a node's mounts. |
| `nodes.database-hosts` | Allows viewing and managing a node's database hosts. |
| `nodes.database-agent-hosts` | Allows viewing and managing a node's database agent hosts. |
| `nodes.backups` | Allows viewing and managing a node's backups. |
| `nodes.tunnel` | Allows viewing and managing a node's private network membership. |
| `nodes.power` | Allows executing mass-power actions on nodes. |
| `nodes.transfers` | Allows viewing and managing mass-server transfers between nodes. |

### Servers

| Permission | Description |
| --- | --- |
| `servers.create` | Allows creating new servers. |
| `servers.read` | Allows viewing servers. |
| `servers.update` | Allows modifying servers. |
| `servers.delete` | Allows deleting servers. |
| `servers.transfer` | Allows transferring servers to other nodes or canceling ongoing transfers. |
| `servers.allocations` | Allows viewing and managing a server's allocations. |
| `servers.variables` | Allows viewing and managing a server's variables. |
| `servers.mounts` | Allows viewing and managing a server's mounts. |

### Nests

| Permission | Description |
| --- | --- |
| `nests.create` | Allows creating new nests. |
| `nests.read` | Allows viewing nests. |
| `nests.update` | Allows modifying nests. |
| `nests.delete` | Allows deleting nests. |

### Eggs

| Permission | Description |
| --- | --- |
| `eggs.create` | Allows creating and importing new eggs. |
| `eggs.read` | Allows viewing eggs. |
| `eggs.update` | Allows modifying eggs. |
| `eggs.delete` | Allows deleting eggs. |
| `eggs.mounts` | Allows viewing and managing an egg's mounts. |

### Egg Configurations

| Permission | Description |
| --- | --- |
| `egg-configurations.create` | Allows creating new egg configurations. |
| `egg-configurations.read` | Allows viewing egg configurations. |
| `egg-configurations.update` | Allows modifying egg configurations. |
| `egg-configurations.delete` | Allows deleting egg configurations. |

### Egg Repositories

| Permission | Description |
| --- | --- |
| `egg-repositories.create` | Allows creating new egg repositories. |
| `egg-repositories.read` | Allows viewing egg repositories. |
| `egg-repositories.update` | Allows modifying egg repositories. |
| `egg-repositories.delete` | Allows deleting egg repositories. |
| `egg-repositories.sync` | Allows synchronizing egg repositories with their remote sources. |

### Database Hosts

| Permission | Description |
| --- | --- |
| `database-hosts.create` | Allows creating new database hosts. |
| `database-hosts.read` | Allows viewing database hosts. |
| `database-hosts.update` | Allows modifying database hosts. |
| `database-hosts.delete` | Allows deleting database hosts. |
| `database-hosts.test` | Allows testing database host connections. |

### Database Agent Hosts

| Permission | Description |
| --- | --- |
| `database-agent-hosts.create` | Allows creating new database agent hosts. |
| `database-agent-hosts.read` | Allows viewing database agent hosts. |
| `database-agent-hosts.update` | Allows modifying database agent hosts. |
| `database-agent-hosts.delete` | Allows deleting database agent hosts. |
| `database-agent-hosts.read-token` | Allows viewing a database agent host's token. |
| `database-agent-hosts.reset-token` | Allows resetting database agent host tokens. |
| `database-agent-hosts.test` | Allows testing database agent host connections. |

### Database Agent Templates

| Permission | Description |
| --- | --- |
| `database-agent-templates.create` | Allows creating new database agent templates. |
| `database-agent-templates.read` | Allows viewing database agent templates. |
| `database-agent-templates.update` | Allows modifying database agent templates. |
| `database-agent-templates.delete` | Allows deleting database agent templates. |

### OAuth Providers

| Permission | Description |
| --- | --- |
| `oauth-providers.create` | Allows creating new OAuth providers. |
| `oauth-providers.read` | Allows viewing OAuth providers. |
| `oauth-providers.update` | Allows modifying OAuth providers. |
| `oauth-providers.delete` | Allows deleting OAuth providers. |

### Mounts

| Permission | Description |
| --- | --- |
| `mounts.create` | Allows creating new mounts. |
| `mounts.read` | Allows viewing mounts. |
| `mounts.update` | Allows modifying mounts. |
| `mounts.delete` | Allows deleting mounts. |

### Activity

| Permission | Description |
| --- | --- |
| `activity.read` | Allows viewing the activity logs for all admin operations. |
