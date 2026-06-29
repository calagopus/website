---
title: Panel Overview
description: Overview of the Calagopus Panel — the central web UI and backend for game server management. Covers minimum requirements, the React + Rust tech stack, and real-world resource usage.
---

# Panel

The Calagopus **Panel** is the central management interface for game servers and related services. It provides the web UI and backend that handle server orchestration, user management, and integrations. The panel alone doesn't host game servers - for that you also need [Wings](../wings/overview.md) running on at least one node.

## Minimum Requirements

- **Operating System**: Windows 10 or later, macOS, Ubuntu 22.04 LTS or later, Debian 11 or later, or anything that supports modern Docker versions
- **CPU Architecture**: x86_64, ARM64, RISC-V, or PPC64LE (extensions require x86_64 or ARM64)
- **RAM**: 512 MB minimum (1 GB recommended; 2 GB recommended when using extensions)
- **Disk Space**: 1 GB minimum (10 GB recommended when using extensions)

### Real-World Usage Example

A panel managing 50 servers on x86_64 hardware:

```bash
CONTAINER ID   NAME                 CPU %     MEM USAGE / LIMIT     MEM %     NET I/O         BLOCK I/O        PIDS
1d385d84abbc   rjns-control_web     0.00%     88.47MiB / 91.99GiB   0.09%     671MB / 258MB   473MB / 345MB    31
775c970479c2   rjns-control_db      0.00%     66.44MiB / 91.99GiB   0.07%     190MB / 163MB   228MB / 686MB    20
f5925cc2dd3f   rjns-control_cache   0.09%     3.832MiB / 91.99GiB   0.00%     293MB / 18MB    12.8MB / 332MB   7
```

Extension support adds overhead for frontend and backend compilation; these numbers reflect the base panel without any extensions installed.

## Technical Overview

The Calagopus Panel is built using a modern web stack to ensure scalability, performance, and ease of use. Below is a high-level overview of its architecture:

### Frontend

The frontend is built with React and communicates with the backend via REST APIs.

- **Language**: TypeScript
- **Framework**: [React.js](https://reactjs.org/)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linting**: [Biome](https://biomejs.dev/)

### Backend

The backend is written in Rust and handles user management, server orchestration, and database interactions.

- **Language**: :crab: Rust
- **Web Framework**: [`axum`](https://crates.io/crates/axum)
- **Database**: PostgreSQL via [`sqlx`](https://crates.io/crates/sqlx)
- **Caching**: Redis/Valkey via [`rustis`](https://crates.io/crates/rustis)
- **Runtime**: [`tokio`](https://crates.io/crates/tokio)

Most other functionality is implemented from scratch or via small focused crates to keep the dependency tree lean.
