---
title: Package Manager DB Agent Installation
description: How to install Calagopus DB Agent via a system package manager (APT, RPM, APK). The simplest installation method for supported Linux distributions.
---

# Package Manager DB Agent Installation

Install DB Agent directly from the APT, RPM or APK repository, or from the Arch User Repository (AUR). Select your package manager. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block. If your system doesn't have `sudo`, like Alpine, run the commands as root and leave it out.

::::tabs key:pkg
=== APT (Debian / Ubuntu)

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
sudo docker --version
```

::: details Docker isn't installed yet
If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | sudo CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).
:::

### Install DB Agent

```bash
sudo curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
sudo apt update
sudo apt install -y calagopus-db-agent
sudo calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
sudo ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

### Configure DB Agent

Set an API token that clients will use to authenticate against the management API:

```bash
sudo calagopus-db-agent configure --token <TOKEN>
```

This writes the token into the config file at the default path (`/etc/calagopus-db-agent/config.yml`), creating it with defaults first if it doesn't exist yet. See the [Configuration](../configuration.md) reference for every other available option.

Test the configuration by running DB Agent in the foreground:

```bash
sudo calagopus-db-agent
```

Kill it with `Ctrl-C` once you've confirmed it starts without errors.

### Install as a Service

This creates and enables a systemd or OpenRC service (auto-detected) that starts on boot, then shows its status:

```bash
sudo calagopus-db-agent service-install
sudo systemctl status db-agent --no-pager
```

=== RPM (RHEL / Fedora / Rocky / Alma)

### Install a Container Runtime

DB Agent needs either Docker or Podman installed and running. RHEL-family distributions ship Podman by default, so you may already have it.

::: info Already have Podman?
You can keep it. Skip ahead to [Install DB Agent](#install-db-agent-1). After DB Agent is installed, point `docker.socket` in your `config.yml` at the Podman socket instead of Docker's. For a rootless setup, see [Running DB Agent Rootless](../advanced/running-db-agent-rootless.md).
:::

To use Docker instead, remove Podman first:

```bash
sudo dnf remove podman buildah
```

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
sudo docker --version
```

::: details Docker isn't installed yet
If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | sudo CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).
:::

### Install DB Agent

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
sudo dnf install -y calagopus-db-agent
sudo calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
sudo ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

### Configure DB Agent

Set an API token that clients will use to authenticate against the management API:

```bash
sudo calagopus-db-agent configure --token <TOKEN>
```

This writes the token into the config file at the default path (`/etc/calagopus-db-agent/config.yml`), creating it with defaults first if it doesn't exist yet. See the [Configuration](../configuration.md) reference for every other available option.

Test the configuration by running DB Agent in the foreground:

```bash
sudo calagopus-db-agent
```

Kill it with `Ctrl-C` once you've confirmed it starts without errors.

### Install as a Service

This creates and enables a systemd or OpenRC service (auto-detected) that starts on boot, then shows its status:

```bash
sudo calagopus-db-agent service-install
sudo systemctl status db-agent --no-pager
```

=== APK (Alpine)

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
docker --version
```

::: details Docker isn't installed yet
If Docker is not installed, enable the community repository and install it:

```bash
apk add docker docker-cli-compose
rc-update add docker
rc-service docker start
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).
:::

### Install DB Agent

```bash
wget -q -O /etc/apk/keys/calagopus.rsa.pub https://packages.calagopus.com/apk/calagopus.rsa.pub
echo "https://packages.calagopus.com/apk" >> /etc/apk/repositories
apk update
apk add calagopus-db-agent
calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

### Configure DB Agent

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

### Install as a Service

This creates and enables a systemd or OpenRC service (auto-detected) that starts on boot, then shows its status:

```bash
calagopus-db-agent service-install
rc-service db-agent status
```

=== AUR (Arch Linux)

### Install Docker

DB Agent requires Docker to manage database containers. Verify your installation:

```bash
sudo docker --version
```

::: details Docker isn't installed yet
If Docker is not installed, install it from the official repositories:

```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).
:::

### Install DB Agent

DB Agent is published to the [AUR](https://aur.archlinux.org/packages/calagopus-db-agent-bin). Install it with your preferred AUR helper:

```bash
yay -S --noconfirm calagopus-db-agent-bin
sudo calagopus-db-agent version
```

### Add an Alias (Optional)

If you'd prefer to type `db-agent` instead of `calagopus-db-agent`, create a symlink:

```bash
sudo ln -s $(whereis -b calagopus-db-agent | awk '{print $2}') /usr/local/bin/db-agent
```

### Configure DB Agent

Set an API token that clients will use to authenticate against the management API:

```bash
sudo calagopus-db-agent configure --token <TOKEN>
```

This writes the token into the config file at the default path (`/etc/calagopus-db-agent/config.yml`), creating it with defaults first if it doesn't exist yet. See the [Configuration](../configuration.md) reference for every other available option.

Test the configuration by running DB Agent in the foreground:

```bash
sudo calagopus-db-agent
```

Kill it with `Ctrl-C` once you've confirmed it starts without errors.

### Install as a Service

This creates and enables a systemd or OpenRC service (auto-detected) that starts on boot, then shows its status:

```bash
sudo calagopus-db-agent service-install
sudo systemctl status db-agent --no-pager
```

::::

## Next Steps

With DB Agent running, connect it to the Panel and secure its connections. See [Next Steps](../next-steps/index.md).
