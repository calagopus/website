---
title: Development Environment
description: Set up a development environment for building Calagopus Panel extensions.
---

# Setting up your Development Environment

This guide walks through setting up a development environment for creating extensions for the Calagopus Panel.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (version 24 or higher)
- pnpm (version 11 or higher)
- Rust (latest stable version)
- A code editor (e.g., Visual Studio Code)
- Git (any reasonable version)
- A PostgreSQL server (version 16 or higher) for the database
- A Redis server (version 7 or higher) for caching

## Installing the Panel Locally

### Step 1: Clone the Repository

Clone the Calagopus Panel repository:

```bash
git clone https://github.com/calagopus/panel.git calagopus-panel
cd calagopus-panel
```

### Step 2: Install Dependencies

Install the dependencies with pnpm:

```bash
# Frontend dependencies
cd frontend
pnpm install
cd ..

# Database dependencies (technically optional)
cd database
pnpm install
cd ..
```

### Step 3: Set Up Environment Variables

Copy the `.env.example` file to `.env` and modify it as needed:

```bash
cp .env.example .env
```

Configure PostgreSQL/Redis and your app encryption keys in the `.env` file.

### Step 4: Build the Project

Run the following from the root directory:

```bash
# build frontend, required to build the backend
cd frontend
pnpm build
cd ..

# migrate database
SQLX_OFFLINE=true cargo run -p database-migrator -- migrate

# build & run backend
SQLX_OFFLINE=true cargo run
```

### Step 5: Running the Development Server

With a working backend, run the frontend development server:

```bash
cd frontend
pnpm dev

# start dev server on port 8081
# pnpm dev --port 8081

# backend is on port 9999
# BACKEND_PORT=9999 pnpm dev
```

By default, the frontend is available at `http://localhost:5173`; the dev server proxies API requests to the backend at `http://localhost:8000`. If your backend uses a different port, set the `BACKEND_PORT` environment variable.

## Updating the Development Environment

Pull the latest changes from the main repository:

```bash
rm Cargo.lock frontend/pnpm-lock.yaml # remove lockfiles to avoid git conflicts
git pull # if there are additional conflicts, resolve them here
```

Then rebuild the project:

```bash
# build frontend, required to build the backend
cd frontend
pnpm install # install any new dependencies
pnpm build
cd ..

# migrate database
SQLX_OFFLINE=true cargo run -p database-migrator -- migrate

# build & run backend
SQLX_OFFLINE=true cargo run
```
