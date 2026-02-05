# Setting up your Development Environment

This guide will help you set up a development environment for creating extensions for the Calagopus Panel. Follow the steps below to get started.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (version 24 or higher)
- pnpm (version 10 or higher)
- Rust (latest stable version)
- A code editor (e.g., Visual Studio Code)
- Git (any reasonable version)

## Step 1: Clone the Repository

Start by cloning the Calagopus Panel repository to your local machine:

```bash
git clone https://github.com/calagopus/panel.git calagopus-panel
cd calagopus-panel
```

## Step 2: Install Dependencies

Next, install the necessary dependencies using pnpm:

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

## Step 3: Set Up Environment Variables

Copy the `.env.example` file to `.env` and modify it as needed:

```bash
cp .env.example .env
```

Make sure to configure PostgreSQL/Redis and your app encryption keys in the `.env` file.

## Step 4: Build the Project

To build the project, run the following command from the root directory:

```bash
# build frontend, required to build the backend
cd frontend
pnpm build
cd ..

# migrate database
cargo run -p database-migrator -- migrate

# build & run backend
cargo run
```

This will compile the frontend and backend components of the Calagopus Panel.

## Step 5: Running the Development Server

Now that you have a working backend, hopefully, you can run the frontend development server:

```bash
cd frontend
pnpm dev

# start dev server on port 8081
# pnpm dev --port 8081

# backend is on port 9999
# BACKEND_PORT=9999 pnpm dev
```

By default, the frontend will be available at `http://localhost:5173`, the dev server automatically proxies API requests to the backend server running at `http://localhost:8000`. If you use a different port for the backend, you can set the `BACKEND_PORT` environment variable.
