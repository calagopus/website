---
title: Package Manager Panel Installation
description: How to install the Calagopus Panel via a system package manager (APT, RPM, APK, AUR). The simplest installation method for supported Linux distributions.
---

# Package Manager Panel Installation

::: warning No extension support
The package manager installation method does not support extensions in any capacity. If you need extensions, use the [Docker](./docker.md) installation instead.
:::

Install Calagopus Panel directly from the APT, RPM or APK repository, or from the Arch User Repository (AUR). Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block. If your system doesn't have `sudo`, like Alpine, run the commands as root and leave it out.

This installs PostgreSQL, Valkey and the Panel. Already have PostgreSQL and Valkey? Leave out the lines that install and start them. You can substitute Redis for Valkey, though Valkey is notably faster.

If you only plan to run a single node (Panel + Wings on the same host), pick the **All-in-One** block. It bundles Wings alongside the Panel so you don't need to install it separately.

Select your package manager:

::::tabs key:pkg
=== APT (Debian / Ubuntu)

### Install the Packages

Add the PostgreSQL APT repository following [this guide](https://wiki.postgresql.org/wiki/Apt), then run:

::: code-group
```bash [Panel]
sudo apt update
sudo apt install -y postgresql-18 valkey
sudo systemctl enable --now postgresql valkey-server

sudo curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
sudo apt update
sudo apt install -y calagopus-panel
```
```bash [All-in-One]
sudo apt update
sudo apt install -y postgresql-18 valkey
sudo systemctl enable --now postgresql valkey-server

sudo curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
sudo apt update
sudo apt install -y calagopus-panel-aio
```
:::

### Create the Database and Configuration

This creates the database user and database, downloads the example `.env` to `/etc/calagopus`, and fills in a random `APP_ENCRYPTION_KEY` and `DATABASE_URL`. Run it once: running it again replaces the `.env` and its encryption key.

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

### Test the Configuration

Run the panel once from `/etc/calagopus`, because it looks for the `.env` in the current directory:

```bash
cd /etc/calagopus
sudo calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

### Install as a Service

This creates and enables a service that starts on boot, then shows its status:

```bash
sudo calagopus-panel service-install
sudo systemctl status calagopus-panel --no-pager
```

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

=== RPM (RHEL / Fedora / Rocky / Alma)

### Install the Packages

This example is for Fedora 43 (x86_64). On anything else, take the first line from the [PostgreSQL RPM guide](https://www.postgresql.org/download/linux/redhat/).

::: code-group
```bash [Panel]
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/F-43-x86_64/pgdg-fedora-repo-latest.noarch.rpm
sudo dnf install -y postgresql18-server postgresql18-contrib valkey
sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
sudo systemctl enable --now postgresql-18 valkey

sudo rpm --import https://packages.calagopus.com/pubring.gpg
sudo tee /etc/yum.repos.d/calagopus.repo > /dev/null <<EOF
[calagopus]
name=Calagopus Repository
baseurl=https://packages.calagopus.com/rpm
enabled=1
gpgcheck=1
gpgkey=https://packages.calagopus.com/pubring.gpg
EOF
sudo dnf install -y calagopus-panel
```
```bash [All-in-One]
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/F-43-x86_64/pgdg-fedora-repo-latest.noarch.rpm
sudo dnf install -y postgresql18-server postgresql18-contrib valkey
sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
sudo systemctl enable --now postgresql-18 valkey

sudo rpm --import https://packages.calagopus.com/pubring.gpg
sudo tee /etc/yum.repos.d/calagopus.repo > /dev/null <<EOF
[calagopus]
name=Calagopus Repository
baseurl=https://packages.calagopus.com/rpm
enabled=1
gpgcheck=1
gpgkey=https://packages.calagopus.com/pubring.gpg
EOF
sudo dnf install -y calagopus-panel-aio
```
:::

### Create the Database and Configuration

This creates the database user and database, downloads the example `.env` to `/etc/calagopus`, and fills in a random `APP_ENCRYPTION_KEY` and `DATABASE_URL`. Run it once: running it again replaces the `.env` and its encryption key.

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

### Test the Configuration

Run the panel once from `/etc/calagopus`, because it looks for the `.env` in the current directory:

```bash
cd /etc/calagopus
sudo calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

### Install as a Service

This creates and enables a service that starts on boot, then shows its status:

```bash
sudo calagopus-panel service-install
sudo systemctl status calagopus-panel --no-pager
```

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

=== APK (Alpine)

### Install the Packages

::: code-group
```bash [Panel]
apk add postgresql postgresql-contrib valkey
rc-update add postgresql
rc-update add valkey
rc-service postgresql start
rc-service valkey start

wget -q -O /etc/apk/keys/calagopus.rsa.pub https://packages.calagopus.com/apk/calagopus.rsa.pub
echo "https://packages.calagopus.com/apk" >> /etc/apk/repositories
apk update
apk add calagopus-panel
```
```bash [All-in-One]
apk add postgresql postgresql-contrib valkey
rc-update add postgresql
rc-update add valkey
rc-service postgresql start
rc-service valkey start

wget -q -O /etc/apk/keys/calagopus.rsa.pub https://packages.calagopus.com/apk/calagopus.rsa.pub
echo "https://packages.calagopus.com/apk" >> /etc/apk/repositories
apk update
apk add calagopus-panel-aio
```
:::

### Create the Database and Configuration

This creates the database user and database, downloads the example `.env` to `/etc/calagopus`, and fills in a random `APP_ENCRYPTION_KEY` and `DATABASE_URL`. Run it once: running it again replaces the `.env` and its encryption key.

```bash
DB_PASSWORD=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

su postgres -c psql <<SQL
CREATE USER calagopus WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
SQL

mkdir -p /etc/calagopus
curl -o /etc/calagopus/.env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" /etc/calagopus/.env
sed -i -e "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://calagopus:$DB_PASSWORD@localhost:5432/panel\"|" /etc/calagopus/.env
```

`REDIS_URL` defaults to `redis://localhost` and can stay as-is unless Valkey/Redis is on another host. See the [Environment Configuration](../environment.md) reference for every other variable.

### Test the Configuration

Run the panel once from `/etc/calagopus`, because it looks for the `.env` in the current directory:

```bash
cd /etc/calagopus
calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

### Install as a Service

This creates and enables a service that starts on boot, then shows its status:

```bash
calagopus-panel service-install
rc-service calagopus-panel status
```

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

=== AUR (Arch Linux)

### Install the Packages

The Panel is published to the AUR as [`calagopus-panel-bin`](https://aur.archlinux.org/packages/calagopus-panel-bin), and the All-in-One as [`calagopus-panel-aio-bin`](https://aur.archlinux.org/packages/calagopus-panel-aio-bin). Use another AUR helper if you prefer.

::: code-group
```bash [Panel]
sudo pacman -S --noconfirm postgresql valkey
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql valkey

yay -S --noconfirm calagopus-panel-bin
```
```bash [All-in-One]
sudo pacman -S --noconfirm postgresql valkey
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql valkey

yay -S --noconfirm calagopus-panel-aio-bin
```
:::

### Create the Database and Configuration

This creates the database user and database, downloads the example `.env` to `/etc/calagopus`, and fills in a random `APP_ENCRYPTION_KEY` and `DATABASE_URL`. Run it once: running it again replaces the `.env` and its encryption key.

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

### Test the Configuration

Run the panel once from `/etc/calagopus`, because it looks for the `.env` in the current directory:

```bash
cd /etc/calagopus
sudo calagopus-panel
```

If everything is configured correctly the panel will start the HTTP server without errors. Kill it with `Ctrl-C`.

### Install as a Service

This creates and enables a service that starts on boot, then shows its status:

```bash
sudo calagopus-panel service-install
sudo systemctl status calagopus-panel --no-pager
```

The panel is now available at `http://<your-server-ip>:8000` and will show the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)

::::
