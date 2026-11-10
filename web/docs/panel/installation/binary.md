---
title: Binary Panel Installation
description: 'Install the Calagopus Panel as a standalone binary on Linux or Windows without Docker: prerequisites, database setup, configuration, and running as a service.'
---

# Binary Panel Installation

::: warning No extension support
The binary installation method does not support extensions in any capacity. If you need extensions, use the [Docker](./docker.md) installation instead.
:::

Calagopus Panel ships as a compiled binary available on [GitHub Releases](https://github.com/calagopus/panel/releases/latest). Pick your system:

::::tabs key:os
=== Linux

Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block.

### 1. Install PostgreSQL and Valkey

Skip this if you already have them. You can substitute Redis for Valkey, though Valkey is notably faster.

On APT, first add the PostgreSQL repository following [this guide](https://wiki.postgresql.org/wiki/Apt). The RPM example is for Fedora 43 (x86_64). On anything else, take the first line from the [PostgreSQL RPM guide](https://www.postgresql.org/download/linux/redhat/).

::: code-group
```bash [APT]
sudo apt update
sudo apt install -y postgresql-18 valkey
sudo systemctl enable --now postgresql valkey-server
```

```bash [RPM]
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/F-43-x86_64/pgdg-fedora-repo-latest.noarch.rpm
sudo dnf install -y postgresql18-server postgresql18-contrib valkey
sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
sudo systemctl enable --now postgresql-18 valkey
```
:::

### 2. Download the Binary

```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-linux" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel

sudo /usr/local/bin/calagopus-panel version
```

### 3. Create the Database and Configuration

This creates the user and database, downloads the example `.env` to `/etc/calagopus`, and fills in a random `APP_ENCRYPTION_KEY` and `DATABASE_URL`. Run it once: running it again replaces the `.env` and its encryption key.

```bash
DB_PASSWORD=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

sudo -u postgres psql <<SQL
CREATE USER calagopus WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
SQL

sudo mkdir -p /etc/calagopus
sudo curl -o /etc/calagopus/.env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sudo sed -i -e "s/CHANGEME/$RANDOM_STRING/g" /etc/calagopus/.env
sudo sed -i -e "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://calagopus:$DB_PASSWORD@localhost:5432/panel\"|" /etc/calagopus/.env
```

`REDIS_URL` defaults to `redis://localhost` and can stay as-is unless Valkey/Redis is on another host. See the [Environment Configuration](../environment.md) reference for every other variable.

### 4. Test the Configuration

Run the panel once from the folder with the `.env`, because that is where it looks for it:

```bash
cd /etc/calagopus
sudo /usr/local/bin/calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

### 5. Install as a Service

This creates and enables a systemd service that starts on boot, then shows its status:

```bash
sudo /usr/local/bin/calagopus-panel service-install
sudo systemctl status calagopus-panel --no-pager
```

If everything went well, the panel is available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

=== Windows

### 1. Install PostgreSQL and Valkey

Skip PostgreSQL if you already have it. Install it using the [interactive installer](https://www.postgresql.org/download/windows/). Setup instructions are available [here](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/).

Valkey is not available on Windows. If you cannot install Valkey, remove the `REDIS_URL` line from your `.env` file in step 3 and the panel will fall back to in-memory caching (not recommended for production due to rate-limiting limitations).

### 2. Download the Binary

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

### 3. Create the Database and Configuration

Open the SQL Shell by searching for `psql` in the Start menu. Press Enter through the server, port, and username prompts to accept the defaults, then enter the password you set during installation:
![psql Shell](./images/psqlshell.webp)
![SQL Shell (psql) with default prompts accepted and a postgres=# prompt after login](./images/auth.webp)

Create the user and database, with a password of your own:

```sql
CREATE USER calagopus WITH PASSWORD 'yourPassword';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
exit
```

Windows has no `/etc` folder, so place the `.env` file in the same directory as the executable. If the executable is at `C:\bin\calagopus-panel.exe`, the `.env` belongs at `C:\bin\.env`.

Paste the contents of [`.env.example`](https://github.com/calagopus/panel/blob/main/.env.example) into the file:
![Windows Explorer C:\bin folder with panel.exe and a .env file, noting hidden files may need enabling](./images/dotenv.webp)
![Notepad showing a .env file with Redis and PostgreSQL URLs, port 8000, and APP_ENCRYPTION_KEY set to CHANGEME](./images/contents.webp)

Open the `.env` and set `DATABASE_URL` to your database connection string:

```
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

From the same folder, set `APP_ENCRYPTION_KEY` to a random value:

```powershell
$RandomString = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
(Get-Content .env) -replace 'CHANGEME', $RandomString | Set-Content .env
```

`REDIS_URL` defaults to `redis://localhost` and can stay as-is unless Valkey/Redis is on another host. See the [Environment Configuration](../environment.md) reference for every other variable.

### 4. Test the Configuration

Run the panel once from the folder with the `.env`, because that is where it looks for it:

```powershell
cd C:\bin
calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

### 5. Install as a Service

Download [NSSM](https://github.com/dkxce/NSSM/releases/download/v2.25/NSSM_v2.25.zip) and extract the `nssm.exe` for your architecture (win32 for x86, win64 for x64) into the same folder as the panel executable.
![Explorer copying nssm.exe from the win64 folder into the folder with the panel executable](./images/nssm.webp)

Install and start the service:

```powershell
nssm install "Calagopus Panel" "C:\bin\calagopus-panel.exe"
nssm start "Calagopus Panel"
```

![PowerShell running nssm install and nssm start for the Calagopus Panel service, both succeeding](./images/nssmcli.webp)

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE setup screen.

![Calagopus Panel OOBE](../oobe.webp)

::::
