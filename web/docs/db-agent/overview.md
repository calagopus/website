---
title: DB Agent Overview
description: Overview of Calagopus DB Agent, the Rust-based database proxy and provisioning agent for PostgreSQL, MariaDB/MySQL, MongoDB, and Redis.
---

# DB Agent

DB Agent is a high-performance, low-latency database proxy and provisioning agent. It handles database routing and provisioning for PostgreSQL, MariaDB/MySQL, MongoDB, and Redis, running each database in its own Docker container and exposing a REST API for management.

## Minimum Requirements

- **Operating System**: Ubuntu 22.04 LTS or later, Debian 11 or later, or any Linux distribution that supports modern Docker versions
- **CPU Architecture**: x86_64, ARM64, RISC-V, or PPC64LE
- **RAM**: 512 MB minimum (1 GB or more recommended)
- **Disk Space**: 256 MB minimum, additive to the storage needs of the databases it manages

::: warning Docker is required
DB Agent uses Docker to run and isolate database containers. Docker must be installed and running on the host. The minimum requirements above don't include the resources needed by the database containers themselves, those are additive.
:::

## Technical Overview

- **Language**: :crab: Rust
- **Container Management**: Docker/Podman via [`bollard`](https://crates.io/crates/bollard)
- **Web Framework**: [`axum`](https://crates.io/crates/axum)
- **Runtime**: [`tokio`](https://crates.io/crates/tokio)
- **State Storage**: SQLite via [`sqlx`](https://crates.io/crates/sqlx)

Only Linux is officially supported, due to reliance on Unix-specific features.

## Volumes

DB Agent uses several directories on the host. Knowing where each one is matters for troubleshooting, backups, and disk management.

| Volume | Description | Default Path |
| :--- | :--- | :--- |
| `socket_dir` | Unix sockets bind-mounted into each database container | `/run/calagopus-db-agent` |
| `data_dir` | Database data, bind-mounted into each database container | `/var/lib/calagopus-db-agent/data` |
| `log_dir` | DB Agent log files | `/var/log/calagopus-db-agent` |

::: info Running inside a container
When DB Agent itself runs inside a container (`OCI_CONTAINER` is set, as in the official Docker image), it inspects its own container on boot and translates bind mount sources to host paths automatically. This means the host side of the `data_dir`, `log_dir`, and `socket_dir` volumes can be relocated freely, only the paths inside the DB Agent container need to match the config.
:::
