---
title: CLI Commands
description: Ship operator-facing shell commands with your extension instead of HTTP routes.
---

# CLI Commands

Some features are better as a command the operator runs from the shell than as an HTTP route: regenerating cached data, a one-off migration helper, a support tool that disables 2FA for a locked-out user, or a `version` command that prints build info. Extensions can add their own top-level commands to the `panel-rs` CLI.

Commands are built with [clap](https://docs.rs/clap). The extension side is a thin wrapper that registers command groups and commands with the Panel's root CLI parser. The examples below cover the basics; clap's docs have the rest.

## Registering a Command Group

CLI registration happens in your extension's `initialize_cli` method, the CLI counterpart to `initialize_router` and `initialize_permissions`, with one difference: it runs before the Panel reads which extensions are disabled, so a disabled extension's commands stay available (see [Disabling Extensions](../disabling-extensions.md)):

```rs
use shared::{
    State,
    extensions::{Extension, commands::CliCommandGroupBuilder},
};

mod commands;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize_cli(
        &mut self,
        _env: Option<&std::sync::Arc<shared::env::Env>>,
        builder: CliCommandGroupBuilder,
    ) -> CliCommandGroupBuilder {
        builder.add_group("my-tool", "Tools for the my-tool extension.", commands::commands)
    }
}
```

The `add_group` call creates a top-level subcommand on the root CLI, and the closure (or function pointer, like `commands::commands` above) populates its children. With the code above, users run:

```bash
panel-rs my-tool version
panel-rs my-tool disable-2fa --user alice
panel-rs my-tool --help
```

::: warning
**The name you pass to `add_group` becomes a top-level subcommand, unprefixed.** `add_group("my-tool", ...)` makes `panel-rs my-tool ...`. There's no automatic namespacing, just as admin routes aren't namespaced for you. Pick a group name unlikely to collide with the core CLI or other extensions. A name tied to your extension (like `minecraft-versions` or `egg-changer`) is safe; a generic name like `tools` or `admin` is likely to clash. Since Panel 1.2.7, a group or command whose name is already taken, or an `initialize_cli` that panics, marks the extension as failed to start, so none of its other entrypoints run either.
:::

You can nest groups inside groups by calling `add_group` again from within a child builder. That helps when your extension has several categories of commands and you want `panel-rs my-tool users disable-2fa` rather than a flat list. Most extensions need only one group with a few commands.

## The File-System Convention

Like routes, commands follow a file layout that keeps them easy to find once there are more than one or two:

```bash
backend/src/
  lib.rs # contains initialize_cli, calls commands::commands through add_group
  commands/
    mod.rs # wires up the child modules
    create.rs # one command per file
    disable_2fa.rs
    reset_password.rs
```

The `mod.rs` declares the child modules and defines one function that registers them all on a builder:

```rs
use shared::extensions::commands::CliCommandGroupBuilder;

mod create;
mod disable_2fa;
mod reset_password;

pub fn commands(cli: CliCommandGroupBuilder) -> CliCommandGroupBuilder {
    cli.add_command(
        "create",
        "Creates a new user for the Panel.",
        create::CreateCommand,
    )
    .add_command(
        "disable-2fa",
        "Disables two-factor authentication for a user.",
        disable_2fa::Disable2FACommand,
    )
    .add_command(
        "reset-password",
        "Resets a user's password.",
        reset_password::ResetPasswordCommand,
    )
}
```

That function is passed to `add_group`, as shown in the previous section.

For a nested subgroup, do the same one level deeper: a `commands/users/mod.rs` exports its own `commands` function, and the parent `commands/mod.rs` calls `.add_group("users", "...", users::commands)` to wire it in.

## Writing a Command

A command is a type that implements `CliCommand<A>`, where `A` is a `clap::Args`-derived struct describing the command's arguments. The trait has two methods:

```rs
pub trait CliCommand<A: Args> {
    fn get_command(&self, command: Command) -> Command;
    fn get_executor(self) -> Box<ExecutorFunc>;
}
```

- **`get_command`** lets you customize the `clap::Command` beyond what `#[derive(Args)]` produces such as adding aliases, changing help text, or registering arguments that can't be struct fields. For simple commands, return `command` unchanged.
- **`get_executor`** returns the async function that runs when the command is invoked. It receives an `Option<Arc<Env>>` (the parsed environment, if available) and the `ArgMatches` from clap, and returns `Result<i32, anyhow::Error>` where the `i32` is the process exit code.

The simplest possible command prints a version string and takes no arguments:

```rs
use clap::Args;

#[derive(Args)]
pub struct VersionArgs;

pub struct VersionCommand;

impl shared::extensions::commands::CliCommand<VersionArgs> for VersionCommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|_env, _arg_matches| {
            Box::pin(async move {
                println!("my-tool version {}", env!("CARGO_PKG_VERSION"));

                Ok(0)
            })
        })
    }
}
```

- **The command struct is a unit struct** (`pub struct VersionCommand;`), not an enum or a config-holding struct. It has no state of its own; the state lives in the `Args` and in whatever you construct inside the executor.
- **The `Args` struct describes the arguments.** For a command with no arguments, it's an empty unit struct with `#[derive(Args)]`. For a command with flags, add fields with `#[arg(...)]` attributes (see the next section).
- **Exit code `0` means success**, following Unix convention. Non-zero codes indicate failure; pick sensibly numbered codes if you need to distinguish failure modes (`1` for generic failure is fine for most extensions).
- **The executor is wrapped in `Box::new(|env, arg_matches| Box::pin(async move { ... }))`.** That boilerplate is unavoidable, because `ExecutorFunc` is a boxed trait object returning a pinned future. Copy the shape; your code goes inside the `async move {}` block.

## Arguments

For a command that takes arguments, define them as fields on the `Args` struct with clap's derive attributes, then parse them inside the executor with `A::from_arg_matches(&arg_matches)?`:

```rs
use clap::{Args, FromArgMatches};

#[derive(Args)]
pub struct Disable2FAArgs {
    #[arg(
        long = "user",
        help = "the username, email or uuid of the user to disable 2FA for"
    )]
    user: Option<String>,
}

pub struct Disable2FACommand;

impl shared::extensions::commands::CliCommand<Disable2FAArgs> for Disable2FACommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|env, arg_matches| {
            Box::pin(async move {
                let args = Disable2FAArgs::from_arg_matches(&arg_matches)?;

                // args.user is now Option<String>
                // ... rest of the command

                Ok(0)
            })
        })
    }
}
```

Everything clap supports works: positional arguments, flags, value parsers, defaults, global arguments, required-vs-optional, `ValueEnum`-derived choices. The `CliCommandGroupBuilder` itself adds one implicit global flag, `--debug` / `-d`, which is available on every subcommand without you declaring it.

For arguments that can't be expressed purely with `#[arg(...)]` attributes, use `get_command` to augment the `clap::Command` directly. Most commands don't need it.

## Accessing State

Commands often need the Panel's state: the database, the settings store, the shared HTTP client. It isn't created by default, because not every command needs it (a `version` command shouldn't connect to the database), so you construct it yourself:

```rs
let state = shared::AppState::new_cli(env).await?;
```

`AppState::new_cli` takes the `env: Option<Arc<Env>>` parameter from your executor and returns a fully initialized `State`, the same type your HTTP handlers get. Use it as you would in a route, including querying the database and reading settings.

A fuller example: a command that disables 2FA for a user, looking them up by username, email, or UUID, and prompting interactively if no `--user` flag was passed:

::: details Full example: disable 2FA for a user
```rs
use clap::{Args, FromArgMatches};
use colored::Colorize;
use compact_str::ToCompactString;
use dialoguer::{Input, theme::ColorfulTheme};
use shared::models::{ByUuid, user::User};
use std::io::IsTerminal;

#[derive(Args)]
pub struct Disable2FAArgs {
    #[arg(
        long = "user",
        help = "the username, email or uuid of the user to disable 2FA for"
    )]
    user: Option<String>,
}

pub struct Disable2FACommand;

impl shared::extensions::commands::CliCommand<Disable2FAArgs> for Disable2FACommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|env, arg_matches| {
            Box::pin(async move {
                let args = Disable2FAArgs::from_arg_matches(&arg_matches)?;
                let state = shared::AppState::new_cli(env).await?;

                let user = match args.user {
                    Some(user) => user,
                    None => {
                        if std::io::stdout().is_terminal() {
                            let user: String = Input::with_theme(&ColorfulTheme::default())
                                .with_prompt("Username, Email or UUID")
                                .interact_text()?;
                            user
                        } else {
                            eprintln!(
                                "{}",
                                "user arg is required when not running in an interactive terminal"
                                    .red()
                            );
                            return Ok(1);
                        }
                    }
                };

                let user = if let Ok(uuid) = user.parse() {
                    User::by_uuid_optional(&state.database, uuid).await
                } else if user.contains('@') {
                    User::by_email(&state.database, &user).await
                } else {
                    User::by_username(&state.database, &user).await
                }?;

                let Some(user) = user else {
                    eprintln!("{}", "user not found".red());
                    return Ok(1);
                };

                if !user.totp_enabled && !user.email_two_factor_enabled {
                    eprintln!(
                        "{}",
                        "two-factor authentication is not enabled for this user".red()
                    );
                    return Ok(1);
                }

                shared::models::user_recovery_code::UserRecoveryCode::delete_by_user_uuid(
                    &state.database,
                    user.uuid,
                )
                .await?;

                shared::models::user_two_factor_code::UserTwoFactorCode::delete_by_user_uuid(
                    &state.database,
                    user.uuid,
                )
                .await?;

                sqlx::query!(
                    "UPDATE users
                    SET totp_enabled = false, totp_last_used = NULL, totp_last_step = NULL,
                        totp_secret = NULL, email_two_factor_enabled = false
                    WHERE users.uuid = $1",
                    user.uuid
                )
                .execute(state.database.write())
                .await?;

                User::invalidate_cached(&state.database, user.uuid).await;

                eprintln!(
                    "2FA has been disabled for the user {}",
                    user.uuid.to_compact_string().cyan()
                );

                Ok(0)
            })
        })
    }
}
```
:::

- **Build state early**, right after parsing args. If it fails (no database, malformed env), the user sees the error before any other work happens.
- **Invalidate the cache after a raw write.** Models loaded by UUID are cached for a while, so a `sqlx::query!` that bypasses the model layer must be followed by `User::invalidate_cached(...)` or the running Panel keeps serving the stale row.
- **Interactive fallback for missing arguments**, guarded by `std::io::stdout().is_terminal()`. When the command is run interactively, prompt for what's missing; when it's piped or scripted, fail fast with a clear error message and exit `1`. The [dialoguer](https://docs.rs/dialoguer) crate handles the prompt rendering.
- **Use `eprintln!` for status and error messages**, not `println!`. Success output (like the "2FA disabled" line at the end) goes to stderr too in this example because it's user-facing information rather than a machine-readable value. Reserve `println!` for output that should be pipeable to another command.
- **Use [colored](https://docs.rs/colored) for ANSI output**. Red for errors, cyan for identifiers and green for success, as in the Panel's built-in CLI.

## The `env` Parameter

The `env: Option<Arc<Env>>` your executor receives reflects whether the Panel's environment file was loaded successfully:

- **`Some(env)`**: the env file was parsed. The Panel has config, a valid database connection is constructable, and everything the runtime expects is in place.
- **`None`**: the env file couldn't be read or parsed. This happens in install and setup commands that run *before* the Panel is configured, such as a `generate-env` or `first-time-setup` helper.

For most commands you want `Some(env)` and you'll bail out on `None`. `AppState::new_cli(env)` handles that case itself: with `None` it prints "please setup the new panel environment before using this command." and exits the process with code 1 on the spot. It never returns an `Err` for a missing env, so nothing you wrote after it runs in that case; if you need your own message or cleanup, check `env.is_some()` before calling it.

If your command has to work *without* the env (because it generates the env file, for example), branch on `env.is_some()` and handle both cases. The core Panel's `service install` command does this: it starts the service with `systemctl enable --now` if the env is present, and only registers it for later startup if not.

## Exit Codes

Return `Ok(0)` for success and `Ok(non_zero)` for failure; scripts calling your command check `$?` and expect Unix conventions. Don't return `Err(...)` for user-facing failures like "user not found" or "file already exists"; those are expected outcomes and should print a helpful message to stderr and return a non-zero exit code. Reserve `Err(...)` for genuine unexpected failures (database connection lost, filesystem I/O error). The Panel prints those as a debug dump of the error and exits with code 1, with a backtrace only if `RUST_BACKTRACE` is set.

A convention that works for most extensions: `0` for success, `1` for any expected failure with a printed error, and bubble up `Err(...)` for anything else.
