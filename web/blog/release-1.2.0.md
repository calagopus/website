---
title: Calagopus 1.2.0 released
description: Calagopus Panel 1.2.0 brings private networking between nodes, per-server firewalls, a keyboard-driven Quick Actions palette, a tree-style file editor, and DB Agent access control and backups.
date: 2026-09-06
---

# Calagopus 1.2.0 released

_6 September 2026_

Calagopus Panel 1.2.0 is out. Most of this release is about networking: servers can now reach each other
over an encrypted private network instead of the public internet, and every server gets its own firewall.
There is also a Quick Actions palette, a second file editor built around a file tree, and two things people
kept asking for on the DB Agent side: per-database access control and database backups.

The full changelog is on the [Panel releases page](/docs/releases/panel#v1-2-0) and on
[GitHub](https://github.com/calagopus/panel/releases/tag/release-1.2.0).

## Private Networking

Traditionally, servers on different nodes can only reach each other via the public internet, through
published ports. With private networking, node-to-node traffic goes through an encrypted tunnel instead
and never touches the public internet. Connected servers get a private hostname and address for each
other inside their own container, and the traffic does not consume a public allocation on either side.

Each node pair is linked by a mutual-TLS QUIC tunnel. We wrote a small daemon for this,
[Tundra](https://github.com/calagopus/tundra). Wings installs and updates it on its own on every node that
joins the network, so there is nothing extra to set up by hand.

This is what a simple game network may look like:

![The Connections page showing a proxy server connected to several game servers over the private network](./images/release-1.2/connections.png)

The [Connections](/docs/panel/features/server/network/connections) page documents the panel side of joining
servers together. Setting up the network on your nodes is covered in the Wings guide to
[the private network](/docs/wings/advanced/private-network).

## Firewalls

To stay on the topic of networking: every server now has a firewall. Allow or deny traffic by protocol,
by IP address, by whole subnets, or by an entire list of sources read from a file on the server. Rules
are evaluated top to bottom, the first match decides, and changes apply the moment you save.

Server owners can use it to keep out bad actors and spammers, or to let only a specific group of people
onto a server. A **Deny Everything Else** button turns a ruleset into a default-deny firewall in one click.

![The Firewall page with an allow rule sourced from a file, an allow rule for a single address, and a catch-all deny rule](./images/release-1.2/firewall.png)

Read more on the [Firewall](/docs/panel/features/server/network/firewall) page. Firewall rules are enforced
by Wings, so keep your nodes up to date to use them.

## Quick Actions

Also new in this release are Quick Actions. One keybind (`Ctrl+Space` by default) opens a palette you can
drive the whole panel from: type the name of a server, page, action or user, hit Enter, and you are there.
What it lists depends on where you are, so on a server page it also has that server's power actions and
page-specific operations.

![The Quick Actions palette listing servers, pages and actions](./images/release-1.2/quick-actions.png)

Prefixes filter the results by type:

| Prefix | Result                                                   |
| ------ | -------------------------------------------------------- |
| `=`    | Calculator; type an expression and get the answer inline |
| `#`    | Servers only                                             |
| `/`    | Pages only                                               |
| `@`    | Users only (in the admin area)                           |

![The Quick Actions palette evaluating a math expression after the = prefix](./images/release-1.2/quick-actions-calculator.png)

The best part? This can be extended. Read more about
[extending Quick Actions](/docs/panel/extensions/concepts/quick-actions).

## File Tree Editor

The file manager has gained a twin. The selector in the top right corner switches between the classic list
view and the new tree editor.

![The view selector in the file manager, switching between the list view and the tree editor](./images/release-1.2/file-manager-changer.png)

The tree editor looks and feels like a traditional code editor: the directory tree sits on the left,
multiple files can stay open in tabs at once, and two files can be viewed side by side in split view.

![The file tree editor with the directory tree on the left and several files open in tabs](./images/release-1.2/file-manager-tree-editor.png)

![The file tree editor showing two files side by side in split view](./images/release-1.2/file-manager-split-view.png)

The list view got some work too. Directories scroll instead of paginating, dragging files around is a lot
faster, and touch devices now default to a lighter editor built for mobile.

## DB Agent Access Control

Databases provisioned through the [DB Agent](/docs/db-agent/overview) now support per-database access
control. For every database user, pick which databases it may reach and at which level: no access,
read only, or read and write. A single user can hold a different level on each database in the instance.

![The Database Permissions modal listing each database with a No Access, Read Only or Read & Write control](./images/release-1.2/db-agent-acl.png)

## DB Agent Backups

More news for the [DB Agent](/docs/db-agent/overview): provisioned databases can now be backed up too.
Database backups use the server's backup configuration, count against the same backup limit, and can be
downloaded or restored like any other backup.

Read more about [Database Backups](/docs/panel/features/server/backups#database-backups).

## Also in This Release

### Servers

- [Schedules](/docs/panel/features/server/schedules) can pull a file from a URL as a step.
- Installation scripts can [report progress](/docs/panel/features/admin/nests#reporting-progress), turning the installing banner into a progress bar.
- Servers can be dragged [between groups](/docs/panel/features/dashboard/servers) on the dashboard, and [backup groups](/docs/panel/features/server/backups#backup-groups) can be reordered.
- Toasts can show progress for long-running operations.

### Accounts and Security

- Email verification for new accounts, and more two-factor authentication options.
- User settings [sync across devices](/docs/panel/extensions/concepts/user-settings), with the option to pin a setting to one device.
- API keys can be [disabled and re-enabled](/docs/panel/features/dashboard/api-keys) without deleting them.
- Logging out asks for confirmation, and a password reset offers to revoke every other session.
- File downloads send headers that stop browsers from guessing the content type.

### Administration

- Eggs can be [mass-imported from URLs](/docs/panel/features/admin/nests#importing-eggs), up to 25 at a time.
- Extensions can be [disabled and enabled](/docs/panel/extensions/disabling-extensions) without a rebuild, and extension management is now activity logged.
- Server creation looks up users by email and can create one on the spot. Creating a user with admin permissions now shows a warning.
- `Ctrl+S` saves in most admin forms.
- The SMTP [HELO/EHLO domain](/docs/panel/features/admin/settings#mail) can be overridden, for providers that reject the default.
- Backup policies got a slightly better cron editor.

## Fixes

Sixteen fixes went in as well. Among them: the backend caching issues, the clustered Redis connection URL,
the server websocket, keyboard shortcuts in Monaco, custom Docker images on server creation, and the charts
(again). The rest is in the [changelog](https://github.com/calagopus/panel/releases/tag/release-1.2.0).

## Upgrading

Follow the [updating guide](/docs/panel/updating). Private networking and firewalls are enforced by Wings,
so update your nodes too, and read the [private network guide](/docs/wings/advanced/private-network) before
turning it on.
