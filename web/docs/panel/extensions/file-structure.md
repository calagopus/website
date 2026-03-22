# Extension File Structure

Extensions are split into 3 main file structures. Frontend, Backend, Database.

All Extensions have a package name, which is defined in the backend `Cargo.toml` file, and is also required in the `Metadata.toml` file.
These are semi-java-like package names, so they should be all lowercase, and can contain dots, for example `dev.0x7d8.test`.

Package name with underscores (also referred to as package identifiers) simply means dots are replaced with underscores, so `dev.0x7d8.test` turns into `dev_0x7d8_test`.

## Initializing an Extension

If you want to save some time, you can use the extension templates to quickly get an extension up and running.

```bash
# create a new extension from the template, replace the name with your package name with underscores
panel-rs extensions init dev.0x7d8.test # <-- replace this with your package name
```

## Frontend

```bash
frontend/extensions/
  (package_name_with_underscores)/
    package.json # REQUIRED file containing additional dependencies
    public/ # optional directory to include static files,
      file1.jpg # this file would be available at <url>/file1.jpg
    src/ # REQUIRED directory for typescript src
      app.css # optional css file that will be bundled into the main panel css
      index.ts # REQUIRED file containing extension entrypoint
```

### package.json

You can add dependencies to your frontend extension code by adding them to this `package.json` file, or you can leave it like this. This will give you access to the required extension code and all dependencies of the base panel already.

```json
{
  "name": "extension",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "shared": "workspace:*"
  }
}
```

### src/index.ts

```ts
import { Extension, ExtensionContext } from 'shared';
import type { MantineThemeOverride } from '@mantine/core';

// the class name doesnt really matter, but changing it close to your package name is advisable
class Dev0x7d8TestExtension extends Extension {
  public cardConfigurationPage: React.FC | null = null;
  public cardComponent: React.FC | null = null;

  // Your extension entrypoint, this runs when the page is loaded
  public initialize(ctx: ExtensionContext): void {
    console.log('Dev0x7d8TestExtension initialized!', ctx);
  }

  // Your extension mantine theme entrypoint, this runs when the page is loaded
  public initializeMantineTheme(ctx: ExtensionContext): MantineThemeOverride {
    return {};
  }

  /**
   * Your extension call processor, this can be called by other extensions to interact with yours,
   * if the call does not apply to your extension, simply return `ctx.skip()` to continue the matching process.
   *
   * Optimally (if applies) make sure your calls are globally unique, for example by prepending them with `yourauthorname_yourextensioname_`
   */
  public processCall(ctx: ExtensionContext, name: string, args: object): unknown {
    return ctx.skip();
  }
  
  // https://typedocs.calagopus.com/classes/extensions_shared_src_extension.Extension
}

export default new Dev0x7d8TestExtension();
```

## Backend

```bash
backend-extensions/
  (package_name_with_underscores)/
    Cargo.toml # REQUIRED file containing extension identifier (again), Author information and dependencies
    Metadata.toml # REQUIRED file containing additional extension information
    src/ # REQUIRED directory for backend rust src
      lib.rs # REQUIRED file containing extension backend entrypoint
```

### Cargo.toml

```toml
[package]
name = "dev_0x7d8_test" # once again, package name with underscores
description = "Test John Pork effortlessly." # short description of your extension
authors = ["0x7d8"] # authors of your extension
version = "1.0.0" # version of your extension
edition = { workspace = true }

[dependencies]
shared = { workspace = true }
async-trait = { workspace = true }
tracing = { workspace = true }
```

### Metadata.toml

```toml
package_name = "dev.0x7d8.test" # package name without underscores
name = "0x7d8 Extension Test" # human-readable name of your extension
panel_version = ">=0.18.1" # panel version requirement of your extension, must be a valid semver comparator
```

### src/lib.rs

```rs
use shared::{State, extensions::Extension};

#[derive(Default)]
pub struct ExtensionStruct; // must be called this, and must implement Default trait, and well, must be `Send` if ykyk

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::info!("dev_0x7d8_test extension initialize called");
    }
    
    // https://cratedocs.calagopus.com/shared/extensions/trait.Extension
}
```

## Database (optional)

```bash
database/extension-migrations/
  (package_name_with_underscores)/
    (yyyymmddhhmmss)_migration_name/
      up.sql # REQUIRED file containing the SQL statements to apply the migration
      down.sql # REQUIRED file containing the SQL statements to rollback the migration
```

::: info
If you want it easy, you can auto-generate the migration files by running `panel-rs database-migrator create <package_name>`, this will create a new migration with the correct timestamp and file structure for you to fill in.
:::

### up.sql

```sql
-- SQL statements to apply the migration, for example:
CREATE TABLE IF NOT EXISTS dev_0x7d8_test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### down.sql

```sql
-- SQL statements to rollback the migration, for example:
DROP TABLE IF EXISTS dev_0x7d8_test_table;
```
