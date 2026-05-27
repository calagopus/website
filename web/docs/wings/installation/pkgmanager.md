# Package Manager Wings Installation

Install Wings directly from the APT or RPM repository. Select your package manager:

::::tabs
=== APT (Debian / Ubuntu)

### Install Docker

Wings requires Docker to manage game server containers. Verify your installation:

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

### Install Wings

```bash
apt install -y calagopus-wings
```

Verify the installation:

```bash
calagopus-wings version
```

### Add an Alias (Optional)

If you'd prefer to type `wings` instead of `calagopus-wings`, create a symlink:

```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```

=== RPM (RHEL / Fedora / Rocky / Alma)

### Install a Container Runtime

Wings needs either Docker or Podman installed and running. RHEL-family distributions ship Podman by default, so you may already have it.

::: tip Already have Podman?
You can keep it. Skip ahead to [Add the Repository](#add-the-repository-1). After Wings is installed, follow the [Running Wings with Podman](../../advanced/running-wings-with-podman.md) guide to configure Wings to use the Podman socket instead of Docker.
:::

To use Docker instead, remove Podman first:

```bash
dnf remove podman buildah
```

### Install Docker

Wings requires Docker to manage game server containers. Verify your installation:

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

### Install Wings

```bash
dnf install calagopus-wings
```

Verify the installation:

```bash
calagopus-wings version
```

### Add an Alias (Optional)

If you'd prefer to type `wings` instead of `calagopus-wings`, create a symlink:

```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```

::::

## Configure Wings

Before starting Wings, you need to register the node in the panel and get its configuration. Follow the [Adding a Node](../../panel/next-steps/add-node.md) guide to create the node, then run the auto-deploy command the panel provides:

```bash
calagopus-wings configure --join-data xxxxxx
```

Test the configuration by running Wings in the foreground - you should see it connect to the panel:

```bash
calagopus-wings
```

Kill it with `Ctrl-C` once you've confirmed it connects.

## Install as a Service

```bash
calagopus-wings service-install
```

This creates and enables a systemd service that starts on boot. Check its status with:

```bash
systemctl status wings
```

## Next Steps

With Wings running, the next step is to set up allocations - the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
