---
title: Binary Panel Installation
description: How to install the Calagopus Panel as a standalone binary on Linux, macOS, or Windows without Docker. Covers prerequisites, database setup, environment configuration, and running as a system service.
---

# Binary Panel Installation

::: warning No extension support
The binary installation method does not support extensions in any capacity. If you need extensions, use the [Docker](./docker.md) installation instead.
:::

Calagopus Panel ships as a compiled binary available on [GitHub Releases](https://github.com/calagopus/panel/releases/latest).

## Prerequisites

This guide assumes you have PostgreSQL and Valkey installed on your server. You can substitute Redis for Valkey, though Valkey is notably faster.

::::tabs
=== Linux (APT)
Add the PostgreSQL APT repository following [this guide](https://wiki.postgresql.org/wiki/Apt), then install:
```bash
sudo apt update
sudo apt install postgresql-18
sudo systemctl enable --now postgresql
```

Install Valkey:
```bash
sudo apt update
sudo apt install -y valkey
sudo systemctl enable valkey-server
sudo systemctl start valkey-server
```
=== Linux (RPM)
Add the PostgreSQL RPM repository following [this guide](https://www.postgresql.org/download/linux/redhat/), initialize the database, and enable automatic start. For example on Fedora 43 (x86_64):
```bash
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/F-43-x86_64/pgdg-fedora-repo-latest.noarch.rpm
sudo dnf install -y postgresql18-server
sudo dnf install -y postgresql18-contrib
sudo systemctl enable postgresql-18
sudo systemctl start postgresql-18
```

Install Valkey:
```bash
sudo yum install valkey
sudo systemctl enable valkey-server
sudo systemctl start valkey-server
```
=== macOS
Install PostgreSQL using the [official guide](https://www.postgresql.org/download/macosx/) via an interactive installer, [Postgres.app](https://postgresapp.com/), [Homebrew](https://brew.sh/), or your preferred method.

Install Valkey via [Homebrew](https://brew.sh/):
```bash
brew install valkey
brew services start valkey
```
=== Windows
Install PostgreSQL using the [interactive installer](https://www.postgresql.org/download/windows/). Setup instructions are available [here](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/).

Valkey is not available on Windows. If you cannot install Valkey, remove the `REDIS_URL` line from your `.env` file and the panel will fall back to in-memory caching (not recommended for production due to rate-limiting limitations).
::::

## Download the Binary

::::tabs
=== Linux
```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-linux" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel

calagopus-panel version
```
=== macOS
```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-macos" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel

calagopus-panel version
```
=== Windows
Download the latest executable [here](https://github.com/calagopus/panel/releases/latest/download/panel-rs-x86_64-windows.exe) and move it to a folder you keep CLI tools in (e.g. `C:\bin`).
![Placing executable to C:\bin](./images/bin.webp)

Rename it to `calagopus-panel`:
![Renaming executable](./images/rename.webp)

Open the Run dialog with `Win + R`, type `rundll32.exe sysdm.cpl,EditEnvironmentVariables`, and click OK:
![Open the Run dialog](./images/winr.webp)

Under **System variables**, find `Path`, click **Edit**, then **New**, and add the full path to the folder (e.g. `C:\bin`):
![Show ENVs](./images/env.webp)
![Add PATH](./images/path.webp)

Click OK on both dialogs. Open a new terminal and verify:
```powershell
calagopus-panel version
```
::::

## Database Configuration

Create the database user and database before continuing. Connect to PostgreSQL:

::::tabs
=== Linux / macOS
```bash
sudo -u postgres psql
```
=== Windows
Open the SQL Shell by searching for `psql` in the Start menu. Press Enter through the server, port, and username prompts to accept the defaults, then enter the password you set during installation:
![psql Shell](./images/psqlshell.webp)
![](./images/auth.webp)
::::

Then create the user and database:
```sql
CREATE USER calagopus WITH PASSWORD 'yourPassword';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
exit
```

## Configure Environment Variables

Download the example `.env` file:

::::tabs
=== Linux / macOS
```bash
mkdir -p /etc/calagopus
cd /etc/calagopus

curl -o .env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
ls -lha # should show you the .env file
```
=== Windows
Windows has no `/etc` folder, so place the `.env` file in the same directory as the executable. If the executable is at `C:\bin\calagopus-panel.exe`, the `.env` belongs at `C:\bin\.env`.

Paste the contents of [`.env.example`](https://github.com/calagopus/panel/blob/main/.env.example) into the file:
![](./images/dotenv.webp)
![](./images/contents.webp)
::::

Open the `.env` in your preferred editor and configure the variables. See the [Environment Configuration](../environment.md) reference for details on each one. At minimum set these:

Set `DATABASE_URL` to your database connection string:
```
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

`REDIS_URL` defaults to `redis://localhost` and can stay as-is unless Valkey/Redis is on another host.

Set `APP_ENCRYPTION_KEY` to a random value:

::::tabs
=== Linux / macOS
```bash
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" .env
```
=== Windows
```powershell
$RandomString = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
(Get-Content .env) -replace 'CHANGEME', $RandomString | Set-Content .env
```
::::

## Test the Configuration

Run the panel once to verify there are no errors:
```bash
calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C` and proceed to install it as a service.

## Install as a Service

::::tabs
=== Linux
```bash
calagopus-panel service-install
```

This creates and enables a systemd service that starts on boot. Check its status with:
```bash
systemctl status calagopus-panel
```

If everything went well, the panel is available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)
=== Windows
Download [NSSM](https://github.com/dkxce/NSSM/releases/download/v2.25/NSSM_v2.25.zip) and extract the `nssm.exe` for your architecture (win32 for x86, win64 for x64) into the same folder as the panel executable.
![](./images/nssm.webp)

Install and start the service:
```powershell
nssm install "Calagopus Panel" "C:\bin\calagopus-panel.exe"
nssm start "Calagopus Panel"
```
![](./images/nssmcli.webp)

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE setup screen.

![Calagopus Panel OOBE](../oobe.webp)
::::