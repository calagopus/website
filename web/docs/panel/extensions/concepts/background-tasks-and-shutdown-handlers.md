# Background Tasks and Shutdown Handlers

Routes and CLI commands both run in response to someone asking for something - a user hits an endpoint, an operator types a command. But sometimes your extension needs to do work on its own schedule: poll an external API every few minutes, expire stale cache entries hourly, or flush pending writes before the process exits. That's what background tasks and shutdown handlers are for.

Neither of these is particularly exciting - they're both "register a function, the Panel calls it at the right time" - but there are a couple of gotchas worth knowing (primary instance gating, how to actually get a schedule out of an otherwise-tight loop, what shutdown does to in-flight work) that the rest of this page covers.

## Background Tasks

A background task is an async function that the Panel runs in a loop for the lifetime of the process. You register it in `initialize_background_tasks`:

```rs
use shared::{
    State,
    extensions::{Extension, background_tasks::BackgroundTaskBuilder},
};
use std::time::Duration;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize_background_tasks(
        &mut self,
        _state: State,
        builder: BackgroundTaskBuilder,
    ) -> BackgroundTaskBuilder {
        builder
            .add_task("refresh-cache", |state| async move {
                crate::cache::refresh(&state).await?;
                tokio::time::sleep(Duration::from_secs(300)).await;
                Ok(())
            })
            .await;

        builder
    }
}
```

A few things to unpack here.

**The loop function runs in a tight loop.** Whatever function you pass to `add_task` gets called again immediately after it returns. There is no built-in sleep between iterations. This is intentional - different tasks want different cadences, and forcing a single model (cron-like, fixed-interval, adaptive) would be wrong for half the use cases. But it means **you are responsible for pacing your own task**: sleep at the end of each iteration to wait for the next one, or sleep in the middle if you want to wake up on a schedule and do some work. A loop function that returns instantly with no sleep will hot-spin and consume 100% of a CPU core.

The typical shape is "do work, then sleep":

```rs
builder
    .add_task("refresh-every-5-minutes", |state| async move {
        do_the_work(&state).await?;
        tokio::time::sleep(Duration::from_secs(300)).await;
        Ok(())
    })
    .await;
```

**Errors don't kill the task.** If your loop function returns `Err(...)`, the error is logged and sent to Sentry, and then the loop function is called again on the next iteration. This is the right default for background work - you want a transient network failure to be logged and retried, not to silently stop the task for the rest of the process's lifetime. If you want to give up after N consecutive failures, track that yourself inside the closure.

**Panics don't kill the task either.** The Panel catches panics via `catch_unwind`, logs them, and records the panic message as the task's last error. Unlike errors, though, a panic *does* terminate the loop - the task won't run again until the process restarts. Panics indicate programmer bugs rather than operational failures, so this is reasonable behavior, but be aware of it if you're writing defensive code.

### Scheduled Tasks (Cron)

If your task *does* need a strict schedule-like running at midnight every day, or at the top of every hour-calculating the exact sleep duration manually inside an `add_task` loop is tedious. For these cases, use `add_cron_task`:

```rs
use std::str::FromStr;

builder
    .add_cron_task(
        "daily-database-cleanup",
        cron::Schedule::from_str("0 0 0 * * *").unwrap(),
        |state| async move {
            crate::cleanup::run_daily(&state).await?;
            Ok(())
        }
    )
    .await;

```

**The Panel handles the pacing.** Unlike `add_task`, you do *not* need to sleep at the end of a cron task. When your function returns, the Panel automatically calculates the time until the next matching cron tick and sleeps for you before calling your function again.

Everything else behaves exactly like `add_task`: errors are logged and retried at the next scheduled tick, panics permanently park the task until a restart, and registrations silently overwrite previous tasks with the same name.

> Also, keep in mind, the cron syntax is "second minute hour day month weekday" - that extra seconds field is a common gotcha for folks used to the more traditional "minute hour day month weekday" format. If your task isn't running when you expect, double-check your cron expression.

### Primary Instance Only

::: warning
**Background tasks only run on the primary instance.** If the Panel is deployed with multiple instances behind a load balancer (a standard setup for HA), only the instance marked `app_primary` will actually execute registered tasks (both `add_task` and `add_cron_task`). Calls on other instances are silently no-ops.

This prevents the obvious "every instance runs the same cron, so the job runs N times" problem. But it means you cannot rely on your background task to run if the operator hasn't designated a primary - in practice every deployment has one, but extension authors occasionally forget and wonder why their job never fires in dev setups with `app_primary = false`.

If you need work to run *on every instance* rather than just the primary - for example, flushing per-instance caches - a background task is the wrong tool. Consider a shutdown handler (which runs everywhere) or a short-lived spawned task inside a request handler.
:::

### Naming

Task names are `&'static str` and must be unique within your extension. The name shows up in logs and in any task-status UI the Panel exposes, so pick something descriptive - `refresh-mcjars-cache` rather than `task1`. If you register two tasks with the same name, the second registration silently overwrites the first, which is almost never what you want.

## Shutdown Handlers

A shutdown handler is the mirror image: instead of running periodically for the process's lifetime, it runs once when the Panel is shutting down gracefully. Register it in `initialize_shutdown_handlers`:

```rs
use shared::{
    State,
    extensions::{Extension, shutdown_handlers::ShutdownHandlerBuilder},
};

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize_shutdown_handlers(
        &mut self,
        _state: State,
        builder: ShutdownHandlerBuilder,
    ) -> ShutdownHandlerBuilder {
        builder
            .add_handler("flush-pending-writes", |state| async move {
                crate::buffer::flush_all(&state).await?;
                Ok(())
            })
            .await;

        builder
    }
}

```

The handler gets called once during graceful shutdown, before the process exits. The Panel awaits it - if you take ten seconds to flush, the process waits ten seconds. This is the right place for:

* Flushing in-memory buffers to the database
* Committing pending work that can't be safely restarted
* Closing external connections cleanly (telling an upstream service "I'm going away", logging out of a session, etc.)
* Writing final metrics or a "shutdown complete" log line

### Shutdown Handlers Run Everywhere

Unlike background tasks, shutdown handlers run on **every** instance, primary or not. This is because every instance has its own local state that might need cleanup - even non-primary instances have connections to close and buffers to flush.

If your handler's logic only makes sense on the primary (e.g. it's wrapping up coordinator-style work), gate it yourself:

```rs
builder
    .add_handler("coordinator-cleanup", |state| async move {
        if !state.env.app_primary {
            return Ok(());
        }
        crate::coordinator::release_lock(&state).await?;
        Ok(())
    })
    .await;

```

### Interaction with Background Tasks

When shutdown starts, **background tasks are aborted abruptly.** Their `JoinHandle` is dropped and the loop is cancelled at its next `.await` point - whatever the task was mid-way through doing gets dropped. This means:

* Anything your background task writes needs to be atomic from the database's perspective. Don't use background tasks for "start a multi-step transaction, commit at the end" workflows where abrupt cancellation leaves data half-written.
* If your background task has persistent state that needs flushing, **do the flushing in a shutdown handler, not in the task's own cleanup code**. A shutdown handler is the only hook that's guaranteed to run during shutdown; your background task's code after the work is already cancelled and won't execute.

The typical pairing is a background task that accumulates work in memory and a shutdown handler that flushes whatever's accumulated:

```rs
async fn initialize_background_tasks(
    &mut self,
    _state: State,
    builder: BackgroundTaskBuilder,
) -> BackgroundTaskBuilder {
    builder
        .add_task("accumulate-metrics", |state| async move {
            crate::metrics::sample_and_buffer(&state).await?;
            tokio::time::sleep(Duration::from_secs(10)).await;
            Ok(())
        })
        .await;

    builder
}

async fn initialize_shutdown_handlers(
    &mut self,
    _state: State,
    builder: ShutdownHandlerBuilder,
) -> ShutdownHandlerBuilder {
    builder
        .add_handler("flush-metrics", |state| async move {
            crate::metrics::flush_buffer(&state).await?;
            Ok(())
        })
        .await;

    builder
}

```

With this shape, the background task accumulates samples in-memory at a 10-second cadence, and on shutdown the handler flushes whatever's left regardless of whether the task was mid-iteration when shutdown hit.

### Shutdown Errors

If a shutdown handler returns `Err(...)` or panics, the error is logged and sent to Sentry, and the Panel moves on to the next handler - one broken handler doesn't block the others from running. This is deliberate: shutdown is your last chance to clean up, so the Panel tries everything rather than bailing out on the first failure.

That said, design your handlers to succeed. A handler that panics loses whatever cleanup you intended, and the Panel can't tell you "your flush never happened" after the process exits.

### Not Every Shutdown Runs Handlers

Shutdown handlers only run on **graceful** shutdown - the Panel receiving a `SIGTERM` or equivalent and cleanly winding down. If the process is killed with `SIGKILL`, crashes from an unrecoverable error, or is terminated by the OS out-of-memory killer, handlers don't get a chance to run. Don't rely on shutdown handlers for correctness - they're a best-effort cleanup pass, not a durability guarantee. Anything that *must* be persisted should be persisted at the point of the state change, not deferred until shutdown.
