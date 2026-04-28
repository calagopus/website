# Package Wings Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Wings Overview documentation.

With the APT/RPM repository, you can directly install and update Calagopus from your package manager.

## Getting Started

::::tabs
=== With APT
### Install Docker

The Calagopus Wings Daemon requires Docker to be installed and running on the host machine to manage game server containers.
You can validate your Docker installation by running:

```bash
docker --version
```

If Docker is not installed, please refer to the [official Docker installation guide](https://docs.docker.com/engine/install) for your operating system.
In many cases running Dockers installation script is the easiest way to get started:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

### Add the repository
The first step to install Wings is to add the Calagopus APT repository. If the APT repository is already added, you can skip this step. To do so, on your server run theses commands:

```bash
curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
apt update
```

### Install Calagopus Wings
Now that the repository has been added, you need to download and install the Wings package. You can do this by running the following commands:
```bash
apt install -y calagopus-wings
```

This will download the latest version of Wings for your architecture and make it executable using `calagopus-wings`.
To test that the installation was successful, you can run:

```bash
calagopus-wings version
```

### Add alias (optional)
By default, to interact with Wings, you need to add `calagopus-` infront of `wings`, which can be annoying sometimes. You can instead make a symbolic link for Wings to allow using `wings` instead of `calagopus-wings`. To do so, run theses commands:
```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```
If Wings is installed somewhere else than `/usr/local/bin/`, make sure to replace that to the directory where Wings is installed.

=== With RPM
### Remove Podman (optional, but recommended)
In some operating systems, Podman comes preinstalled by default, which Wings does not (officially) support. If Podman is installed, run this command to remove Podman:
```bash
dnf remove podman buildah
```
::: warning
If you decide to keep Podman, don't install Docker and continue from the "Add the repository" step. Wings will work, but the CPU usage will not work properly.
:::

### Install Docker

The Calagopus Wings Daemon requires Docker to be installed and running on the host machine to manage game server containers.
You can validate your Docker installation by running:

```bash
docker --version
```

If Docker is not installed, please refer to the [official Docker installation guide](https://docs.docker.com/engine/install) for your operating system.
In many cases running Dockers installation script is the easiest way to get started:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

### Add the repository
The first step to install Wings is to add the Calagopus RPM repository. If the RPM repository is already added, you can skip this step. To do so, on your server run theses commands:
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

### Install Calagopus Wings
Now that the repository has been added, you can now install the Wings package. You can do this by running the following commands:
```bash
dnf install calagopus-wings
```
This will download the latest version of Wings for your architecture and make it executable using `calagopus-wings`.
To test that the installation was successful, you can run:

```bash
calagopus-wings version
```

### Add alias (optional)
By default, to interact with Wings, you need to add `calagopus-` infront of `wings`, which can be annoying sometimes. You can instead make a symbolic link for Wings to allow using `wings` instead of `calagopus-wings`. To do so, run theses commands:
```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```
If Wings is installed somewhere else than `/usr/local/bin/`, make sure to replace that to the directory where Wings is installed.

::::

### Configure Wings

Before starting Wings, you need to configure it to connect to your Calagopus Panel. To do this, create the Node on the Panel using this guide [here](../../panel/next-steps/add-node.md).
Then, paste the copied configuration command into your terminal, which will look something like this:

```bash
calagopus-wings configure --join-data xxxxxx
```

To test the configuration, you can run:

```bash
calagopus-wings
```

This will start Wings in the foreground, and you should see it connecting to the Panel.

### Install Wings as a Service

To ensure that Wings starts automatically on system boot, you can install it as a systemd service. Create a new service file by running:

```bash
calagopus-wings service-install
```

This will also start the service and enable it to start on boot. To check the status of the Wings service, you can run:

```bash
systemctl status wings
```

### Next Steps

Congratulations! You have now installed Calagopus Wings on your server. The next step is to set up Allocations, which is a combination of IP and Port that you can assign to a server. Please see the [Setting up Allocations](../next-steps/setting-up-allocations.md) documentation in the Next Steps part of the documentation.
