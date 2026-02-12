# Package Wings Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Wings Overview documentation.

With the APT/RPM repository, you can directly install Calagopus from your package manager. Select your package manager below:

::::tabs
=== With APT
#### Install Docker

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

#### Add the repository
The first step to install Wings is to add the Calagopus APT repository. If the APT repository is already added, you can skip this step. To do so, on your server run theses commands:

```bash
curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
apt update
```

#### Install Calagopus Wings
Now that the repository has been added, you need to download and install the Wings package. You can do this by running the following commands:
```bash
apt install -y calagopus-wings
```

This will download the latest version of Wings for your architecture and make it executable using `calagopus-wings`.
To test that the installation was successful, you can run:

```bash
calagopus-wings version
```

#### Add alias (optional)
By default, to interact with Wings, you need to add `calagopus-` infront of `wings`, which can be annoying sometimes. To add an alias so that `wings` can go to `calagopus-wings`, add the following at the bottom of your `.bashrc` (or `.zshrc` when using ZSH):
```bash
alias wings='calagopus-wings'
```
Then, restart your terminal or run one of theses commands:
```bash
# If using bash
source ~/.bashrc

# If using ZSH
source ~/.zshrc
```

#### Configure Wings

Before starting Wings, you need to configure it to connect to your Calagopus Panel. To do this, create the Node on the Panel ((WIP INSERT GUIDE LINK HERE))
Then, paste the copied configuration command into your terminal, which will look something like this:

```bash
calagopus-wings configure --join-data xxxxxx
```

To test the configuration, you can run:

```bash
calagopus-wings
```

This will start Wings in the foreground, and you should see it connecting to the Panel.

#### Install Wings as a Service

To ensure that Wings starts automatically on system boot, you can install it as a systemd service. Create a new service file by running:

```bash
calagopus-wings service-install
```

This will also start the service and enable it to start on boot. To check the status of the Wings service, you can run:

```bash
systemctl status wings
```
=== With RPM
#### Remove Podman
In some operating systems, Podman comes preinstalled by default, which Wings does not support. If Podman is installed, run this command to remove Podman:
```bash
dnf remove podman buildah
```

#### Install Docker

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

#### Add the repository
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

#### Install Calagopus Wings
Now that the repository has been added, you can now install the Wings package. You can do this by running the following commands:
```bash
dnf install calagopus-wings
```
This will download the latest version of Wings for your architecture and make it executable using `calagopus-wings`.
To test that the installation was successful, you can run:

```bash
calagopus-wings version
```

#### Add alias (optional)
By default, to interact with Wings, you need to add `calagopus-` infront of `wings`, which can be annoying sometimes. To add an alias so that `wings` can go to `calagopus-wings`, add the following at the bottom of your `.bashrc` (or `.zshrc` when using ZSH):
```bash
alias wings='calagopus-wings'
```
Then, restart your terminal or run one of theses commands:
```bash
# If using bash
source ~/.bashrc

# If using ZSH
source ~/.zshrc
```

#### Configure Wings

Before starting Wings, you need to configure it to connect to your Calagopus Panel. To do this, create the Node on the Panel ((WIP INSERT GUIDE LINK HERE))
Then, paste the copied configuration command into your terminal, which will look something like this:

```bash
calagopus-wings configure --join-data xxxxxx
```

To test the configuration, you can run:

```bash
calagopus-wings
```

This will start Wings in the foreground, and you should see it connecting to the Panel.

#### Install Wings as a Service

To ensure that Wings starts automatically on system boot, you can install it as a systemd service. Create a new service file by running:

```bash
calagopus-wings service-install
```

This will also start the service and enable it to start on boot. To check the status of the Wings service, you can run:

```bash
systemctl status wings
```
::::