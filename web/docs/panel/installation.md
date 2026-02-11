# Panel Installation

Please see the [Minimum Requirements](./overview.md#minimum-requirements) section in the Panel Overview documentation.

## Getting Started

### On Linux using Docker

#### Install Docker

The recommended way to install the Calagopus Panel is by using Docker. Ensure you have Docker and Docker Compose installed on your system.
You can validate your Docker installation by running:

```bash
docker --version
docker compose version # if this says "command not found" you may need to use `docker-compose` instead or update your docker installation
```

If Docker is not installed, please refer to the [official Docker installation guide](https://docs.docker.com/engine/install) for your operating system.
In many cases running Dockers installation script is the easiest way to get started:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

This should automatically install docker compose as well, if not you can follow the [Docker Compose installation instructions](https://docs.docker.com/compose/install).

#### Download the Panel Compose Stack

Now that Docker is installed, you can download the Calagopus Panel Docker Compose stack. You can do this by running the following commands:

```bash
mkdir calagopus-panel
cd calagopus-panel

curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.yml
ls -lh # should show you the compose.yml file
```

#### Configure Environment Variables

Before starting the Panel, you need to configure the environment variables. Edit the `compose.yml` with your preferred text editor and modify the environment variables as needed. See the [Environment Configuration documentation](../panel/environment.md) for more details on each variable.

If you prefer doing the absolute minimum, you can use this script to set the `APP_ENCRYPTION_KEY` variable to a random value:

```bash
RANDOM_STRING=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml
```

#### Start the Panel

You almost made it! Now you can start the Calagopus Panel by running:

```bash
docker compose up -d
```

This command will download the necessary Docker images and start the Panel in detached mode.
If everything went well, you should be able to access the Panel by navigating to `http://<your-server-ip>:8000` in your web browser and see the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](./oobe.png)

### On Linux with APT/RPM

With the APT/RPM repository, you can directly install Calagopus from your package manager. Select your package manager below:

::::tabs
=== With APT
#### Add the repository
The first step to install Calagopus is to add the Calagopus APT repository. To do so, on your server run theses commands:

```bash
curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
apt update
```

#### Install Calagopus Panel
Now that the repository has been added, you can now install the Calagopus Panel package. You can do this by running the following commands:
```bash
apt install -y calagopus-panel
```

=== With RPM
dfg
::::

### On Windows Bare Metal

wip docs

### On MacOS Bare Metal

wip docs
