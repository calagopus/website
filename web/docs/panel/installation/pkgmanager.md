
# Package Manager Panel Installation

::: warning No extension support
The package manager installation method does not support extensions in any capacity. If you need extensions, use the [Docker](./docker.md) installation instead.
:::

Install Calagopus Panel directly from the APT or RPM repository. Select your package manager:

::::tabs
=== APT (Debian / Ubuntu)

#### Prerequisites

This guide assumes you have PostgreSQL and Valkey installed. You can substitute Redis for Valkey, though Valkey is notably faster.

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

#### Add the Repository

```bash
curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
apt update
```

#### Install Calagopus Panel

```bash
apt install -y calagopus-panel
```

#### Database Configuration

Connect to PostgreSQL and create the user and database:
```bash
sudo -u postgres psql
```
```sql
CREATE USER calagopus WITH PASSWORD 'yourPassword';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
exit
```

#### Configure Environment Variables

Download the example `.env` file:
```bash
mkdir -p /etc/calagopus
cd /etc/calagopus

curl -o .env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
ls -lha # should show you the .env file
```

Open it in your preferred editor and configure the variables. See the [Environment Configuration](../environment.md) reference for details. At minimum set these:

```
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

`REDIS_URL` defaults to `redis://localhost` and can stay as-is unless Valkey/Redis is on another host.

Set `APP_ENCRYPTION_KEY` to a random value:
```bash
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" .env
```

#### Test the Configuration

```bash
calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

#### Install as a Service

```bash
calagopus-panel service-install
```

This creates and enables a systemd service that starts on boot. Check its status with:
```bash
systemctl status calagopus-panel
```

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

=== RPM (RHEL / Fedora / Rocky / Alma)

#### Prerequisites

This guide assumes you have PostgreSQL and Valkey installed.

Add the PostgreSQL RPM repository following [this guide](https://www.postgresql.org/download/linux/redhat/). For example on Fedora 43 (x86_64):
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

#### Add the Repository

```bash
sudo rpm --import https://packages.calagopus.com/pubring.gpg
sudo tee /etc/yum.repos.d/calagopus.repo > /dev/null <<EOF
[calagopus]
name=Calagopus Repository
baseurl=https://packages.calagopus.com/rpm
enabled=1
gpgcheck=1
gpgkey=https://packages.calagopus.com/pubring.gpg
EOF
```

#### Install Calagopus Panel

```bash
dnf install calagopus-panel
```

#### Database Configuration

Connect to PostgreSQL and create the user and database:
```bash
sudo -u postgres psql
```
```sql
CREATE USER calagopus WITH PASSWORD 'yourPassword';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
exit
```

#### Configure Environment Variables

Download the example `.env` file:
```bash
mkdir -p /etc/calagopus
cd /etc/calagopus

curl -o .env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
ls -lha # should show you the .env file
```

Open it in your preferred editor. See the [Environment Configuration](../environment.md) reference for details. At minimum set these:

```
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

`REDIS_URL` defaults to `redis://localhost` and can stay as-is unless Valkey/Redis is on another host.

Set `APP_ENCRYPTION_KEY` to a random value:
```bash
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" .env
```

#### Test the Configuration

```bash
calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

#### Install as a Service

```bash
calagopus-panel service-install
```

This creates and enables a systemd service that starts on boot. Check its status with:
```bash
systemctl status calagopus-panel
```

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

::::