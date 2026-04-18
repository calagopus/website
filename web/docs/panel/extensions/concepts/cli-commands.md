# CLI Commands

Sometimes the right way to ship a feature isn't an HTTP route - it's a command the operator runs from the shell. Maybe you want a way to regenerate cached data without hitting an HTTP endpoint, a one-off migration helper, a support tool to disable 2FA for a locked-out user, or a `version` command that prints build info. Calagopus lets extensions add their own top-level commands to the `panel-rs` CLI, and this page is about how.

If you've used [clap](https://docs.rs/clap) before, you already know most of what you need - the extension side is a thin wrapper that lets you register command groups and individual commands with the Panel's root CLI parser. If you haven't used clap, the examples here should be enough to get you going, and clap's docs fill in the details when you need them.

## Registering a Command Group

CLI registration happens in your extension's `initialize_cli` method - the CLI counterpart to `initialize_router` and `initialize_permissions`:

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
**The name you pass to `add_group` becomes a top-level subcommand, unprefixed.** `add_group("my-tool", ...)` makes `panel-rs my-tool ...` - there's no automatic namespacing, the same way admin routes aren't namespaced for you either. Pick a group name unlikely to collide with the core CLI or other extensions. Something tied to your extension (like `minecraft-versions` or `egg-changer`) is a safe default; a generic name like `tools` or `admin` is asking for trouble.
:::

You can nest groups inside groups by calling `add_group` again from within a child builder - useful if your extension has several categories of commands and you want `panel-rs my-tool users disable-2fa` rather than a flat list. For most extensions a single group with a handful of commands is plenty.

## The File-System Convention

Just like routes, commands follow a file-system idiom that keeps things easy to navigate once you have more than one or two. The convention is:

```bash
backend/src/
  lib.rs # contains initialize_cli, calls commands::commands through add_group
  commands/
    mod.rs # wires up the child modules
    create.rs # one command per file
    disable_2fa.rs
    reset_password.rs
```

The `mod.rs` is intentionally boring - it declares the child modules and defines a single function that registers them all on a builder:

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

That function then gets passed straight to `add_group`, as shown in the previous section. Once you've written this `mod.rs` once you basically copy its shape and just swap out the command list.

If you nest a subgroup, do the same thing one level deeper - a `commands/users/mod.rs` exports its own `commands` function, and the parent `commands/mod.rs` calls `.add_group("users", "...", users::commands)` to wire it in.

## Writing a Command

A command is a type that implements `CliCommand<A>`, where `A` is a `clap::Args`-derived struct describing the command's arguments. The trait has two methods:

```rs
pub trait CliCommand<A: Args> {
    fn get_command(&self, command: Command) -> Command;
    fn get_executor(self) -> Box<ExecutorFunc>;
}
```

- **`get_command`** lets you customize the `clap::Command` beyond what `#[derive(Args)]` produces - adding aliases, tweaking help, registering arguments not expressible as struct fields. For simple commands, just return `command` unchanged.
- **`get_executor`** returns the async function that runs when the command is invoked. It receives an `Option<Arc<Env>>` (the parsed environment, if available) and the `ArgMatches` from clap, and returns `Result<i32, anyhow::Error>` where the `i32` is the process exit code.

Here's the simplest possible command - prints a version string, takes no arguments:

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

A few details worth highlighting:

- **The command struct is a unit struct** (`pub struct VersionCommand;`), not an enum or a config-holding struct. It has no state of its own - all the state lives in the `Args` and in whatever you construct inside the executor.
- **The `Args` struct describes the arguments.** For a command with no arguments, it's an empty unit struct with `#[derive(Args)]`. For a command with flags, add fields with `#[arg(...)]` attributes - see the next section.
- **Exit code `0` means success**, following Unix convention. Non-zero codes indicate failure; pick sensibly numbered codes if you need to distinguish failure modes (`1` for generic failure is fine for most extensions).
- **The executor is wrapped in `Box::new(|env, arg_matches| Box::pin(async move { ... }))`.** That's unavoidable boilerplate - `ExecutorFunc` is a boxed trait object returning a pinned future. Copy-paste the shape; the interesting code lives inside the `async move {}` block.

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

Whatever clap supports, you get - positional arguments, flags, value parsers, defaults, global arguments, required-vs-optional, `ValueEnum`-derived choices. The `CliCommandGroupBuilder` itself adds one implicit global flag, `--debug` / `-d`, which is available on every subcommand without you declaring it.

For arguments that can't be expressed purely with `#[arg(...)]` attributes, use `get_command` to augment the `clap::Command` directly. This is an escape hatch, not the path of least resistance - most commands don't need it.

## Accessing State

Commands often need the Panel's state - the database, the settings store, the shared HTTP client. That state isn't available by default because not every command needs it (a `version` command that prints a string shouldn't pay the cost of connecting to the database), so you opt in by constructing it yourself:

```rs
let state = shared::AppState::new_cli(env).await?;
```

`AppState::new_cli` takes the `env: Option<Arc<Env>>` parameter from your executor and returns a fully-initialized `State` - the same type your HTTP handlers get. From there you use it exactly like you would in a route, including querying the database and reading settings.

Here's a fuller example - a command that disables 2FA for a user, looking them up by username, email, or UUID, and prompting interactively if no `--user` flag was passed:

```rs
use clap::{Args, FromArgMatches};
use colored::Colorize;
use compact_str::ToCompactString;
use dialoguer::{Input, theme::ColorfulTheme};
use shared::models::ByUuid;
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
                            Input::with_theme(&ColorfulTheme::default())
                                .with_prompt("Username, Email or UUID")
                                .interact_text()?
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
                    shared::models::user::User::by_uuid_optional(&state.database, uuid).await
                } else if user.contains('@') {
                    shared::models::user::User::by_email(&state.database, &user).await
                } else {
                    shared::models::user::User::by_username(&state.database, &user).await
                }?;

                let Some(user) = user else {
                    eprintln!("{}", "user not found".red());
                    return Ok(1);
                };

                if !user.totp_enabled {
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

                sqlx::query!(
                    "UPDATE users
                    SET totp_enabled = false, totp_last_used = NULL, totp_secret = NULL
                    WHERE users.uuid = $1",
                    user.uuid
                )
                .execute(state.database.write())
                .await?;

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

A few patterns worth pulling out of this:

- **Build state early**, right after parsing args. If it fails (no database, malformed env), the user sees the error before any other work happens.
- **Interactive fallback for missing arguments**, guarded by `std::io::stdout().is_terminal()`. When the command is run interactively, prompt for what's missing; when it's piped or scripted, fail fast with a clear error message and exit `1`. The [dialoguer](https://docs.rs/dialoguer) crate handles the prompt rendering.
- **Use `eprintln!` for status and error messages**, not `println!`. Success output (like the "2FA disabled" line at the end) goes to stderr too in this example because it's user-facing information rather than a machine-readable value. Reserve `println!` for output that should be pipeable to another command.
- **Use [colored](https://docs.rs/colored) for ANSI output**. Red for errors, cyan for identifiers, green for success - matches the convention used across the Panel's built-in CLI.

## The `env` Parameter

The `env: Option<Arc<Env>>` your executor receives reflects whether the Panel's environment file was loaded successfully:

- **`Some(env)`** - the env file was parsed. The Panel has config, a valid database connection is constructable, and everything the runtime expects is in place.
- **`None`** - the env file couldn't be read or parsed. This happens during install/setup commands that need to run *before* the Panel is properly configured - think a `generate-env` or `first-time-setup` helper.

For most commands you want `Some(env)` and you'll bail out on `None`. `AppState::new_cli(env)` will fail gracefully if the env is `None` and the command can't proceed without state, so in practice you can just `?` it and get the right behavior.

If your command specifically needs to work *without* the env (e.g. it's the command that generates the env file in the first place), branch on `env.is_some()` and handle the cases explicitly - you've seen this pattern in the core Panel's `service install` command, which optionally starts the service with `systemctl enable --now` if the env is present, but registers the service for later startup if not.

## Exit Codes

Return `Ok(0)` for success and `Ok(non_zero)` for failure - scripts calling your command will check `$?` and expect Unix conventions. Don't return `Err(...)` for user-facing failures like "user not found" or "file already exists"; those are expected outcomes and should print a helpful message to stderr and return a non-zero exit code. Reserve `Err(...)` for genuine unexpected failures (database connection lost, filesystem I/O error) that you want propagated with a stack trace in debug mode.

A simple convention that works fine for most extensions: `0` for success, `1` for any expected failure with a printed error, and bubble up `Err(...)` for anything else.
