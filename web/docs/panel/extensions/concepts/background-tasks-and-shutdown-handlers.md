---
title: Background Tasks and Shutdown Handlers
description: Run extension work on your own schedule with background tasks, and clean up properly when the Panel shuts down.
---

# Background Tasks and Shutdown Handlers

Routes and CLI commands run when someone asks for something. Background tasks and shutdown handlers run on their own: polling an external API every few minutes, expiring stale cache entries hourly, or flushing pending writes before the process exits.

Both work the same way: you register a function and the Panel calls it at the right time. This page covers the details that matter: which instance runs tasks, how to pace a loop, and what shutdown does to work in progress.

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

**The loop function runs in a tight loop.** Whatever function you pass to `add_task` gets called again immediately after it returns. There is no built-in sleep between iterations. This is intentional: different tasks need different cadences, and no single model (cron-like, fixed-interval, adaptive) fits all of them. But it means **you are responsible for pacing your own task**: sleep at the end of each iteration to wait for the next one, or sleep in the middle if you want to wake up on a schedule and do some work. A loop function that returns instantly with no sleep will hot-spin and consume 100% of a CPU core.

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

**Errors don't kill the task.** If your loop function returns `Err(...)`, the error is logged and sent to Sentry, and then the loop function is called again on the next iteration. That suits background work: a transient network failure should be logged and retried, not to silently stop the task for the rest of the process's lifetime. If you want to give up after N consecutive failures, track that yourself inside the closure.

**Panics don't kill the task either.** The Panel catches panics via `catch_unwind`, logs them, and records the panic message as the task's last error. Unlike an error, though, a panic *does* end the loop: the task won't run again until the process restarts. Panics indicate bugs rather than operational failures.

### Scheduled Tasks (Cron)

For a fixed schedule, such as midnight every day or the top of every hour, use `add_cron_task` instead of calculating sleep durations inside an `add_task` loop:

```rs
use std::str::FromStr;

builder
    .add_cron_task(
        "daily-database-cleanup",
        croner::Cron::from_str("0 0 0 * * *").unwrap(),
        |state| async move {
            crate::cleanup::run_daily(&state).await?;
            Ok(())
        }
    )
    .await;

```

**The Panel handles the pacing.** Unlike `add_task`, you do *not* need to sleep at the end of a cron task. When your function returns, the Panel automatically calculates the time until the next matching cron tick and sleeps for you before calling your function again.

Everything else behaves exactly like `add_task`: errors are logged and retried at the next scheduled tick, and panics permanently park the task until a restart. The schedule is evaluated in UTC, and if one run overruns the next tick, the ticks it missed are skipped rather than run back to back.

> The cron parser accepts both the traditional five-field "minute hour day month weekday" form and a six-field form with a leading seconds field. The core Panel always writes six fields, and `0 0 0 * * *` above is midnight in that form; `0 0 * * *` would mean the same thing with five. If your task isn't running when you expect, double-check which form you wrote.

### Primary Instance Only

::: warning
**Background tasks only run on the primary instance.** If the Panel is deployed with multiple instances behind a load balancer (a standard setup for HA), only the instance marked `app_primary` will actually execute registered tasks (both `add_task` and `add_cron_task`). Calls on other instances are silently no-ops.

That stops a job from running once per instance. It also means your task doesn't run without a designated primary. Every deployment has one in practice, but a dev setup with `app_primary = false` won't run it.

For work that must run *on every instance*, such as flushing per-instance caches, a background task is the wrong tool. Consider a shutdown handler (which runs everywhere) or a short-lived spawned task inside a request handler.
:::

### Naming

Task names are `&'static str` and must be unique across the whole Panel, not just your extension: every extension registers into the same builder, and the core Panel adds its own tasks (`collect_telemetry`, `delete_old_activity`, `run_restic_prune_jobs`, `run_system_backup_policies` and a few more) to it afterwards. The name shows up in logs, so pick something descriptive and prefixed: `mcjars-refresh-cache`, not `task1`. Registering a second task under an existing name replaces the first: its loop is aborted at its next await point and a warning is logged. Panels before 1.2.3 left the first loop running alongside the second.

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

The handler gets called once during graceful shutdown, before the process exits. The Panel awaits it: if you take ten seconds to flush, the process waits ten seconds. Handlers run one after another, in no particular order across extensions. This is the right place for:

* Flushing in-memory buffers to the database
* Committing pending work that can't be safely restarted
* Closing external connections cleanly (telling an upstream service "I'm going away", logging out of a session, etc.)
* Writing final metrics or a "shutdown complete" log line

### Shutdown Handlers Run Everywhere

Unlike background tasks, shutdown handlers run on **every** instance, primary or not. Every instance has its own local state, such as connections to close and buffers to flush.

If your handler only makes sense on the primary (because it wraps up coordinator work, say), check that yourself:

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

When shutdown starts, **nothing tells a background task about it.** The Panel runs the shutdown handlers and then returns from `main`; the task loops keep running alongside the handlers the whole time, may even start a fresh iteration, and die wherever they happen to be when the runtime is torn down at process exit. This means:

* Anything your background task writes needs to be atomic from the database's perspective. Don't use background tasks for "start a multi-step transaction, commit at the end" workflows where being cut off at exit leaves data half-written.
* If your background task has persistent state that needs flushing, **do the flushing in a shutdown handler, not in the task's own cleanup code**. A shutdown handler is the only hook that's guaranteed to run during shutdown; a task has no cleanup phase of its own.
* Expect the two to overlap. A handler that flushes a buffer the task is still appending to should take whatever lock the task takes, or accept that a few late samples are lost.

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

With this shape, the background task accumulates samples in-memory at a 10-second cadence, and on shutdown the handler flushes whatever's left regardless of whether the task was mid-iteration when shutdown hit. Shutdown handler names live in the same shared, Panel-wide namespace as task names, and there a duplicate really does replace the earlier handler.

### Shutdown Errors

If a shutdown handler returns `Err(...)` or panics, the error is logged and sent to Sentry, and the Panel moves on to the next handler, so one broken handler doesn't block the others.

Still, design your handlers to succeed. A handler that panics loses whatever cleanup you intended, and the Panel can't tell you "your flush never happened" after the process exits.

### Not Every Shutdown Runs Handlers

Shutdown handlers only run on **graceful** shutdown, when the Panel receives a `SIGTERM` or `Ctrl+C`. If the process is killed with `SIGKILL`, crashes from an unrecoverable error, is terminated by the OS out-of-memory killer, or exits because the HTTP server itself stopped, handlers don't get a chance to run. In-flight HTTP requests are not drained either; the process exits once the handlers return. Don't rely on shutdown handlers for correctness; they're best-effort cleanup, not a durability guarantee. Anything that *must* be persisted should be persisted at the point of the state change, not deferred until shutdown.
