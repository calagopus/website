---
title: Package Manager DB Agent Installation
description: How to install Calagopus DB Agent via a system package manager (APT, RPM, APK). The simplest installation method for supported Linux distributions.
---

# Package Manager DB Agent Installation

Install DB Agent directly from the APT, RPM or APK repository, or from the Arch User Repository (AUR). Select your package manager:

::::tabs
=== APT (Debian / Ubuntu)

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Add the Repository

```bash
curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
apt update
```

### Install DB Agent

```bash
apt install -y calagopus-db-agent
```

Verify the installation:

```bash
calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

=== RPM (RHEL / Fedora / Rocky / Alma)

### Install a Container Runtime

DB Agent needs either Docker or Podman installed and running. RHEL-family distributions ship Podman by default, so you may already have it.

::: info Already have Podman?
You can keep it. Skip ahead to [Add the Repository](#add-the-repository-1). After DB Agent is installed, point `docker.socket` in your `config.yml` at the Podman socket instead of Docker's.
:::

To use Docker instead, remove Podman first:

```bash
dnf remove podman buildah
```

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Add the Repository

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

### Install DB Agent

```bash
dnf install calagopus-db-agent
```

Verify the installation:

```bash
calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

=== APK (Alpine)

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, enable the community repository and install it:

```bash
apk add docker docker-cli-compose
rc-update add docker
rc-service docker start
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Add the Repository

```bash
wget -q -O /etc/apk/keys/calagopus.rsa.pub https://packages.calagopus.com/apk/calagopus.rsa.pub
echo "https://packages.calagopus.com/apk" >> /etc/apk/repositories
apk update
```

### Install DB Agent

```bash
apk add calagopus-db-agent
```

Verify the installation:

```bash
calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

=== AUR (Arch Linux)

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, install it from the official repositories:

```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Install DB Agent

DB Agent is published to the [AUR](https://aur.archlinux.org/packages/calagopus-db-agent-bin). Install it with your preferred AUR helper:

```bash
yay -S calagopus-db-agent-bin
```

Verify the installation:

```bash
calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

::::

## Configure DB Agent

Set an API token that clients will use to authenticate against the management API:

```bash
calagopus-db-agent configure --token <TOKEN>
```

This writes the token into the config file at the default path (`/etc/calagopus-db-agent/config.yml`), creating it with defaults first if it doesn't exist yet. See the [Configuration](../configuration.md) reference for every other available option.

Test the configuration by running DB Agent in the foreground:

```bash
calagopus-db-agent
```

Kill it with `Ctrl-C` once you've confirmed it starts without errors.

## Install as a Service

```bash
calagopus-db-agent service-install
```

This creates and enables a systemd or OpenRC service (auto-detected) that starts on boot. Check its status with:

```bash
systemctl status db-agent
```
