# Extensions

Extensions are the primary way to extend the functionality of the Panel. They allow you to add backend logic, frontend interfaces, database migrations, and deep system integrations in a structured and controlled way.

For a high-level architectural breakdown of how extensions work within the system, see the [Technical Overview section](../overview.md#technical-overview).

## Getting Started

If you are new to extensions, start here:

- [Installing Extensions](./installing-extensions.md) - Learn how to install `.c7s.zip` extensions in the Panel
- [Uninstalling Extensions](./uninstalling-extensions.md) - How to remove extensions and what happens to their data
- [Switching to the Heavy Image](./switching-to-the-heavy-image.md) - Use the `:heavy` Docker image variant to enable extension support in a containerized setup
- [Development Environment](./dev-environment.md) - Set up a local environment for building extensions
- [Extension File Structure](./file-structure.md) - Learn how extensions are structured across frontend, backend, and database layers

## Concepts

Extensions are built around several core systems:

- [Events](./concepts/events.md) - React to system and user actions
- [Settings](./concepts/settings.md) - Define configurable extension options
- [Routing](./concepts/routing.md) - Add custom backend routes
- [Permissions](./concepts/permissions.md) - Control access to extension features
- [CLI Commands](./concepts/cli-commands.md) - Extend the Panel command line interface
- [Background Tasks and Shutdown Handlers](./concepts/background-tasks-and-shutdown-handlers.md) - Run async or lifecycle-based logic
- [Update Checks and Extension Calls](./concepts/update-checks-and-extension-calls.md) - Communicate between extensions and system services
- [Frontend API Calls](./concepts/frontend-api.md) - Interact with backend APIs from the UI
- [Activity Logging](./concepts/activity-logging.md) - Record extension-related actions
- [Translations](./concepts/translations.md) - Provide multi-language support
- [Mounting UI](./concepts/mounting-ui.md) - Inject UI elements into the Panel interface
- [Extending Models](./concepts/extending-models.md) - Add fields to existing data models
- [Email Templates](./concepts/email-templates.md) - Define custom email templates for notifications and communications
- [File Storage](./concepts/file-storage.md) - Manage files and directories within the Panel

## Installation Methods

Extensions can be installed in multiple ways depending on your setup:

- Docker-based installation (requires `:heavy` or `:nightly-heavy` image)
- Development environment installation
- Manual `.c7s.zip` placement into the extensions directory

See [Installing Extensions](./installing-extensions.md) for full instructions.

## Structure Overview

Extensions follow a standardized multi-part structure consisting of:

- Frontend (React-based UI layer)
- Backend (Rust-based logic layer)
- Database migrations (optional)

This structure defines how extensions are loaded, initialized, and integrated into the Panel.

For a complete breakdown of directories, required files, package naming, and extension entrypoints, see [Extension File Structure](./file-structure.md).
