---
title: Panel Releases
description: Changelog for the Calagopus Panel, newest release first.
---

# Panel Releases

Changelog for the Calagopus Panel. Versions are listed newest first. For the Wings
daemon changelog, see [Wings Releases](./wings.md).

## 1.1.0

::: warning Extensions
Extensions must be updated before using this version.
:::

::: warning Update Wings after the panel
After updating the panel, update Wings as well. **DO NOT UPDATE WINGS BEFOREHAND**, as this may lead to issues.
:::

### Added:
- Added [DB Agent](../db-agent/index.md) Integration
- Added Live File Collaboration support
- Added CLI Command for Shell Autocompletions
- Added support for defining backup groups
- Added new schedule steps for backup-related logic
- Added new schedule logic blocks for better conditions
- Added new schedule triggers for resource usage over time
- Added wings query tunnel to allow websocket-proxied tcp/udp tunnels into servers
- Added support for binary payloads in file write/read endpoints
- Added resource duplication to tons of models
- Added overview pages for servers and nodes
- Added ability to export backups to the server filesystem
- Added more deployment customization to server deployment
- Added async backup deletion to prevent long deletions from causing silent failures
- Added ability to select "other" servers in copy remote and group add modals
- Added ability to define compression type for raw s3 backups
- Added readme preview for egg repository eggs when browsing
- Added proper, readable error displays for tables
- Added ability to look up users/servers/oauth using external id/identifiers
- Added "advanced" system for forms, to reduce confusion for unimportant fields
- Added placeholder system for server routing
- Added better error messages to security key creation
- Added ability to remote copy individual files instead of just mass-selections
- Added new default avatars that display initials instead of the calagopus logo
- Added better error messages for captcha api errors
- Added ability to disable built-in panel frontend for deploying only the api

### Fixed:
- Fixed some wings-proxy body proxying issues
- Fixed json ordering issues in pterodactyl/pelican import
- Fixed ports that were removed from a server but not yet deallocated being able to be assigned to new servers
- Fixed some endpoints logging out the frontend by accident
- Fixed invalid owner uuid check in copy remote
- Fixed general performance issues on some pages due to giant state subscriptions
- Fixed some issues in backup transfer reassignment
- Fixed general fetching/state issues by switching more and more to tanstack
- Fixed mobile responsiveness in the sidebar and on some pages in particular
- Fixed giant page shifts when opening certain modals
- Fixed issues in server websocket handler that caused pointless reconnects and issues on transfer finishes
- Fixed issue where server stats would show a very high initial "per second" value instead of waiting for a tick
- Fixed unability to press enter in some modals/forms
- Fixed impersonation being stored in localStorage instead of session storage, therefore affecting other tabs
- Fixed issue where certain code paths ended up not correctly downcasting DisplayErrors causing useless user error messages

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.1.0)

## 1.0.11

::: warning Update Wings first
Update Wings **before** updating the Panel to this version to prevent servers getting
stuck loading forever. This was the last release before 1.1.0.
:::

### Added

- Added support for Wings to update backup checksums
- Added support for Proxmox Backup Server backups (community contribution)
- Added support for Kopia backups
- Added ability to drag & drop files in the file manager (community contribution)
- Added pps stats in the console server details

### Fixed

- Fixed missing CLI deps in AIO images
- Fixed issue where 401 file uploads would cause a logout
- Fixed issue where operation time could go negative
- Fixed auth redirection issue on OAuth + 2FA
- Fixed panel not switching to RTL mode on RTL languages
- Fixed rare OOBE edgecase that could trap users
- Fixed some frontend state issues with backup browsing
- Fixed debug logs containing more info than wikipedia
- Fixed console messages sometimes logging out of order
- Fixed admin assets upload progress being between the two buttons
- Fixed z-index issue on console page that would make charts overlap with the titlebar
- Fixed absolute CPU usage not correctly working on servers with unlimited CPU
- Fixed transfers finishing saying that permissions were revoked
- Fixed heavy docker image never cleaning up old, unused binaries

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.11)

## 1.0.10

### Added

- Added Slovak translation (community contribution)
- Added frontend implementation for the `java_version` egg feature
- Added ability to modify keyboard shortcuts / disable them entirely
- Added support for browsing & opening a Calagopus server via VS Code / compatible IDEs
- Added support for callback-based API key creation
- Added better debugging messages to the deployment endpoint
- Added support for deleting all nests' eggs before deleting a nest
- Added deployment capacity tab to node subpages
- Added minimal file browser UI to the copy-remote modal
- Added ability to mass-rename files via rules in the file manager
- Added ability to develop an extension within a single directory (also adds easier git integration)
- Added 3 more ratelimits (password forgot, remote, remote SFTP auth)

### Fixed

- Fixed node stats failing in some reverse proxy setups
- Fixed node admin objects including tokens with only read permissions - now requires a dedicated `nodes.read-token` permission
- Fixed some code not using Mantine wrapper imports
- Fixed issue with some setups where wings-proxy would fail on unbounded responses
- Fixed issue in `rule_validator` where regexes including commas would get split
- Fixed logic issue when updating extensions that do not have db migrations
- Fixed API keys requesting a websocket token getting the user's permissions instead of the downscaled ones
- Fixed some destructive actions not having confirmation modals
- Fixed OOBE silently requiring a primary allocation for server creation
- Fixed admin extension modals not animating themselves properly
- Fixed small state issue in file manager search
- Fixed heavy image sometimes not updating the binary properly

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.10)

## 1.0.9

### Added

- Added final batch of admin translations - everything is now translatable
- Added mass-power actions to server list pages
- Added ability to freeze & suspend users
- Added proxied websocket for getting node statistics
- Added ability to reorder client routes like with server routes
- Added "Foreign" label to servers in listing when the current user is not the owner
- Added ability to add foreign servers to the current user's groups via the "Other" servers listing
- Added missing Pinned CPUs server option to the UI

### Fixed

- Fixed issue where allocation deployment used way too many queries and sometimes failed silently
- Fixed issue in user creation where password reset creation was not done via a transaction
- Fixed issue where an AIO node would not be reachable on first startup
- Fixed `vite:preloadError` not reloading the page properly
- Made heavy image load the last known good binary on startup to avoid existing without extensions
- Fixed network tx/rx colors being reversed on the server console
- Fixed server settings boxes not updating state properly

### Removed

- Removed unnecessary verify node step for the AIO binary

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.9)

## 1.0.8

### Added

- Added first batch of admin translations
- Added ability to temporarily toggle debug mode during runtime for enhanced logging
- Added ability to view audio files in the file manager
- Added deeper permission validation for schedule actions
- Added missing back buttons on auth pages
- Added ability to customize the console prelude
- Added ability to set different icons/banners for dark/light mode
- Added support for Implicit TLS in the SMTP email driver
- Added explicit ability to send an account created email via API with a password reset link
- Added support for defining restic prune jobs on a schedule to clean up unused storage
- Added ability to map OAuth scopes to roles/subusers

### Fixed

- Fixed issue where non-base64 `APP_KEY`s would be treated as base64 in imports
- Fixed Pelican TOTP secret decryption issue
- Fixed issue where egg repositories failed to sync eggs
- Fixed issue in heavy AIO image where all builds failed and Wings never stopped
- Fixed some UI sizing issues
- Fixed invalid validation on schedule step creation
- Fixed issue where passkey credential IDs wouldn't be displayed instantly

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.8)

## 1.0.7

::: info Migration note
If you get a migration error due to email templates, you will need to clear out that
table - some changes have been made that cannot be properly migrated with data inside.
Back up any modifications to those templates and reapply them afterwards.
:::

### Added

- Added fancy dark/light mode transition
- Added ability to filter activities by user in admin/server activities
- Added ability to copy-paste permissions in permission selectors
- Added ability to ignore mail TLS cert errors
- Added reminders to the frontend when servers need restarting to apply changes
- Added ability to recursively update folder permissions
- Added ability to add flags to locations
- Added more emails/email templates and allowed disabling certain emails
- Added quick view button to activity when writing a file to see the revision
- Added ability to import from Pelican postgres databases (community contribution)

### Fixed

- Fixed some S3 issues by changing the library to the official AWS SDK
- Fixed some light mode issues
- Fixed scrolling issues in the version history card
- Fixed heavy docker image being slightly larger than it needs to be
- Fixed schedule screen freezing when selecting a NOT condition in ensure
- Fixed searching issues in allocation-related paginations
- Hide announcements/notifications in virtual windows

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.7)

## 1.0.6

::: warning Update Wings first
Make sure to update Wings before installing this release.
:::

### Added

- Added ability to see basic file history (diffs) for individual text files
- Added support for light mode
- Added panel/extension version installation history
- Added session-related settings (cookie name, duration)
- Added support for dismissing announcements
- Added itaf archive support for server transfers
- Added support for updating node configuration
- Added metadata to backups, allowing fun stuff for extensions and restoration of startup settings
- Added ability to query largest directories recursively
- Added support for extensions to define optional license texts that need to be accepted

### Fixed

- Fixed some allocation logic in the deployment endpoint
- Fixed "shared" backups not being transferred to the new node in server transfers
- Fixed reattaching backup node assignments
- Fixed some asset state bugs in the admin asset manager
- Fixed some incorrect frontend margins
- Fixed missing database host connection string validation
- Fixed Markdown renderer styling by using Mantine components

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.6)

## 1.0.5

### Added

- Added Chinese translations ([HansHans135](https://github.com/HansHans135))
- Added proper backup config import support from Pterodactyl/Pelican
- Added support for limiting user server groups, API keys, command snippets, security keys & SSH keys
- Added support for setting max retention **counts** for activity logs
- Added announcement system
- Added ability to set up name translations for egg variables
- Added warning to auth screen when the app URL mismatches the browser origin
- Added ability to patch built-in translations via override files in the heavy image
- Added ability to see server resource limits while installing
- Added human readable cron previews in schedules

### Fixed

- Fixed location database host creation issues
- Fixed multi-where model updates not working (subusers)
- Fixed text being cut off in the file manager
- Fixed some user impersonation frontend issues
- Fixed tons of minor bugs
- Fixed some broken permission nodes/endpoints
- Cleaned up storage serving code for better extendibility
- Fixed issue in server deployment where location + overallocation check was not formed correctly
- Fixed default schedule limit being 0 when importing from Pterodactyl/Pelican
- Fixed issue where first AIO start would not correctly work
- Fixed default schedule second part being `*`, changed to `0`
- Fixed some issues with backup configuration S3 creation
- Fixed some issues with invalid `config_files` import from Pterodactyl/Pelican
- Fixed some xterm issues when changing font size in the console

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.5)

## 1.0.4

### Added

- Added Swedish translations (community contribution)
- Added chunked file upload support to the file manager - no more Cloudflare 100 MiB limits
- Added ratelimit headers when an infraction is reached
- Added proper ratelimit handling for file uploads
- Added support for changing the default email templates
- Added buttons for cancelling all file uploads/operations
- Added more stats and icons to the system overview
- Added support for adding choosable startup commands (the UI for it will likely be touched up more)
- Added directory support to the assets feature

### Fixed

- Fixed some dashboard UI responsiveness (community contribution)
- Fixed tons of small issues in the file manager UI
- Made the NavBar header/footer sticky
- Switched to Tanstack Query in more places for a better feeling UI
- Fixed file copy modal not allowing null to auto-generate
- Fixed some assumptions in the date sync detection for login/2FA
- Fixed heavy AIO image not aioing (not starting Wings)
- Fixed Pelican egg support
- Fixed bug where pending extensions could not be deleted
- Fixed admin settings UI having dementia when changing subpages
- Fixed some OAuth flow issues
- Fixed UI overflow with `MultiKeyValueInput`

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.4)

## 1.0.3

### Added

- Added Spanish translations (community contribution)
- Added Arabic translations (community contribution)
- Added ability to import from Pelican (community contribution)
- Added support for AIO binaries - panel + Wings in one binary for simple setups
- Added ability to assign additional allocations to env variables via the UI
- Added **tons** of new extension APIs
- Added CLI for managing nodes
- Added ability to recreate API keys
- Added ability to adjust ratelimit settings in the admin UI
- Added support for MongoDB-compatible database hosts
- Added endpoint for retrieving a user using their OAuth provider and identifier
- Added ability to reattach node backups to other servers after being detached
- Added ability to manually detach node backups from servers
- Added CLI for importing missing S3 backups from a backup configuration's S3 credentials
- Added ability to enforce user 2FA even after logging in using OAuth
- Added native way to cancel server transfers from the UI as an admin
- Added page for viewing system updates (panel, extensions & nodes), and system health
- Added links back to Calagopus documentation for database hosts & backup configurations
- Added ability to restore backups to another server from the server admin UI instead of just the node admin UI

### Fixed

- Fixed responsiveness on the account page (community contribution)
- Fixed tons of bugs in the file manager UI
- Fixed permission selector being annoying to use
- Fixed long OAuth provider response data erroring the endpoint - data is now truncated
- Fixed `ServerItem` styling on mobile
- Switched to Tanstack for more of the frontend, which should make it feel more responsive
- Redesigned OOBE internally and UI-wise so it feels better to use
- Fixed ordering in egg docker images being discarded when saving
- Fixed frontend development on Windows systems
- Fixed schedule step D&D triggering while inside a modal (community contribution)
- Fixed a bug regarding complex automatic port allocation where node matching wouldn't instantly abort once it found a match
- Fixed some bugs regarding admin node backups

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.3)

## 1.0.2

### Added

- Added Dutch translations (community contribution)
- Added Vietnamese translations (community contribution)
- Added Turkish translations (community contribution)
- Added ability to send password reset emails as admin
- Added ability to recreate (wipe) server databases
- Added Unsaved Changes modal to the startup page
- Added extension API for route interceptors to be able to replace existing routes and change default ordering
- Added extension API for hooking into most elements to replace/modify them on the fly
- Added better extension API for modifying existing backend permission groups
- Added more extension APIs to the file manager to allow custom file view/edit pages
- Added app setting for an app banner instead of icon to allow more customizability of the logo
- Added `external_id` to admin API users and added it to the UI

### Fixed

- Fixed `SizeInput` not allowing decimals
- Fixed up some minor UI issues
- Fixed server power endpoint using the wrong permission node for killing
- Made email test run in the foreground to display errors
- Fixed bug in `useBlocker` causing invalid file editor unsaved changes modals
- Fixed validation issue in backup configuration creation
- Fixed app favicon not updating to the app icon
- Fixed tons of alignment issues with the `SizeInput` element

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.2)

## 1.0.1

### Added

- Added Russian translations (community contribution)
- Added server name to the admin server delete modal
- Added nests as groups in the egg configuration UI for the eggs input
- Added native file sorting support to the file manager
- Added loading spinner to startup variables
- Added check for minimum panel version in heavy image extension upload
- Added support for proxying public Wings endpoints through the panel to simplify home setups

### Fixed

- Fixed save issue in OOBE if you actually go through it
- Fixed allocation IP alias not being nullable in the UI (community contribution)
- Fixed egg import issues when the egg has an empty description that isn't null
- Removed unnecessary disabled guard on the heavy image rebuild button
- Fixed `/api/admin/nests/eggs` to include nest names
- Switched to Tanstack for most admin resource views to fix broken mutations
- Fixed charts looking like prototaxites in certain conditions
- Fixed various issues in the Pterodactyl import code
- Symlinked `panel-rs` in the heavy image to reflect the docs
- Fixed `HljsCode` element sometimes throwing an error if a race condition occurred
- Renamed CLI user and nest subcommands to their plural form to be more consistent
- Removed WebGL addon from the console xterm instance to minimize issues with browser fingerprinting

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.1)

## 1.0.0

### Added

- Added support for web extension management in the `heavy` docker images
- Added tons of new pages to the OOBE
- Added translations to the schedules page
- Added support for ignoring casing in schedule console line actions
- Added mass-context menu to files when right-clicking a selected file
- Added support for opening compressed text files (e.g. `.log.gz`)
- Added egg configuration system for layered egg-specific configurations (e.g. allocation-related / route order / filtering)
- Added server deployment endpoint for billing support
- Added more allocation modes to mass server transfers

### Fixed

- Fixed some issues with websocket error handling
- Improved note editing of server allocations
- Rewrote file manager upload code to be more reliable and less buggy

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.0)

## 1.0.0-pre.3

::: info
This release fixed a small change in the rustis library that caused all binary redis
writes to fail.
:::

### Added

- Added clock out of sync warning to 2FA setup
- Added link to the updating guide when a new version is available

### Fixed

- Fixed passing an incorrect type to rustis causing a syntax error
- Made Biome format translations in extension public folders

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.0-pre.3)

## 1.0.0-pre.2

::: warning Update Wings first
Please make sure to upgrade Wings before the panel to avoid any issues. If you are
already on Wings `1.0.0-pre.3` it will be fine.
:::

### Added

- Added ability to mass-update-from-repo for eggs
- Added ETA to backup restores and transfers
- Added more toasts for panel events, like installations finishing
- Added better toast API and better translation API for more control
- Added missing egg configuration options from the UI
- Added context menu to admin assets for quicker one-off deletions
- Added French translations
- Added ability to prevent users from changing their own language

### Fixed

- Completely reworked the heavy image so it uses less time and resources to compile
- Rely on Wings for determining whether files are editable or not to improve accuracy
- Reworked the OOBE UI
- Reorganized the file dropdown so it has fewer direct options
- Reworked the extension database system to be finally stable
- Fixed redirects when a server transfer finishes
- Fixed doubled ANSI-escape codes in tracing logs
- Completely fixed the extension translation system for better HMR and proper support for shipping translation files in extensions
- Fixed not being able to press enter in the console in some cases
- Fixed some missing autofocus in modals, mainly in the file manager
- Fixed admin/client `BackupRows` not properly handling failed/pending backups
- Allowed editing name/lock of pending and failed backups
- Migrated from Mantine 8 to Mantine 9

### Removed

- Removed requirement for redis/valkey - the panel can now run on only its internal cache for simple environments

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.0-pre.2)

## 1.0.0-pre.1

### Added

- Added line wrap option to the file editor
- Added tons of new extension APIs
- Switched to Vite 8
- Added option for non-admins to see transfer status
- Added ability to reset variables to their default value
- Added user preview when logging in and getting to the TOTP page
- Added server screen blocks (installing, transferring, restoring backup, ...)
- Added credential ID field to security keys
- Added file details modal with additional file entry information
- Added ability for users to acknowledge installation failures
- Added support for differentiating logical and physical sizes in the file manager
- Added extension support for extending API structs
- Added support for mass-transferring node servers
- Added transfer progress overview page to nodes
- Added SSH Details modal to the server console
- Added the last server UI tab - Mounts
- Added command snippets feature

### Fixed

- Translated more generic elements
- Fixed page shift when copying text with the secure context bypass
- Automatically disable the security key button when not in a secure context
- Automatically delete stale, unconfigured security keys
- Removed country from language names
- Fixed tons of issues with server resource fetching
- Fixed some backend cache invalidation issues
- Improved & simplified the auth UI
- Fixed performance issues in admin forms
- Fixed `TranslationProvider` doing unnecessary HTTP requests
- Fixed compatibility issue on the Pterodactyl import CLI
- Cleaned up the sidebar
- Switched file manager search to `CTRL + K` to keep working browser search
- Fixed TOTP QR code issues
- Fixed backup rows not handling failed backups properly
- Drastically improved websocket connection logic
- Limited the window provider to 32 open windows and reuse z-indexes to avoid cursed issues
- Fixed some D&D related z-index issues on schedules
- Fixed mobile scrolling on the grouped servers page

[View release on GitHub](https://github.com/calagopus/panel/releases/tag/release-1.0.0-pre.1)
