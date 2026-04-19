# Extensions
Extensions are the primary way to extend the functionality of the Panel. They allow you to add backend logic, frontend interfaces, database migrations, and deep system integrations in a structured and controlled way.

For a high-level architectural breakdown of how extensions work within the system, see the [Technical Overview section](overview.md#technical-overview).

## Getting Started
If you are new to extensions, start here:

- [Installing Extensions](./extensions/installing-extensions.md) - Learn how to install `.c7s.zip` extensions in the Panel  
- [Development Environment](./extensions/dev-environment.md) - Set up a local environment for building extensions  
- [Extension File Structure](./extensions/file-structure.md) - Learn how extensions are structured across frontend, backend, and database layers  

## Concepts
Extensions are built around several core systems:

- [Events](./extensions/concepts/events.md) - React to system and user actions  
- [Settings](./extensions/concepts/settings.md) - Define configurable extension options  
- [Routing](./extensions/concepts/routing.md) - Add custom backend routes  
- [Permissions](./extensions/concepts/permissions.md) - Control access to extension features  
- [CLI Commands](./extensions/concepts/cli-commands.md) - Extend the Panel command line interface  
- [Background Tasks and Shutdown Handlers](./extensions/concepts/background-tasks-and-shutdown-handlers.md) - Run async or lifecycle-based logic  
- [Update Checks and Extension Calls](./extensions/concepts/update-checks-and-extension-calls.md) - Communicate between extensions and system services  
- [Frontend API Calls](./extensions/concepts/frontend-api.md) - Interact with backend APIs from the UI  
- [Activity Logging](./extensions/concepts/activity-logging.md) - Record extension-related actions  
- [Translations](./extensions/concepts/translations.md) - Provide multi-language support  
- [Mounting UI](./extensions/concepts/mounting-ui.md) - Inject UI elements into the Panel interface  

## Installation Methods
Extensions can be installed in multiple ways depending on your setup:

- Docker-based installation (requires `:heavy` or `:nightly-heavy` image)
- Development environment installation
- Manual `.c7s.zip` placement into the extensions directory

See [Installing Extensions](./extensions/installing-extensions.md) for full instructions.

## Structure Overview
Extensions follow a standardized multi-part structure consisting of:

- Frontend (React-based UI layer)
- Backend (Rust-based logic layer)
- Database migrations (optional)

This structure defines how extensions are loaded, initialized, and integrated into the Panel.

For a complete breakdown of directories, required files, package naming, and extension entrypoints, see [Extension File Structure](./extensions/file-structure.md).

## Next Steps
Once you're familiar with the basics, continue with the Concepts section:

- [Events](./extensions/concepts/events.md)
- [Settings](./extensions/concepts/settings.md)
- [Routing](./extensions/concepts/routing.md)
- [Permissions](./extensions/concepts/permissions.md)
- [CLI Commands](./extensions/concepts/cli-commands.md)
- [Background Tasks and Shutdown Handlers](./extensions/concepts/background-tasks-and-shutdown-handlers.md)
- [Update Checks and Extension Calls](./extensions/concepts/update-checks-and-extension-calls.md)
- [Frontend API Calls](./extensions/concepts/frontend-api.md)
- [Activity Logging](./extensions/concepts/activity-logging.md)
- [Translations](./extensions/concepts/translations.md)
- [Mounting UI](./extensions/concepts/mounting-ui.md)