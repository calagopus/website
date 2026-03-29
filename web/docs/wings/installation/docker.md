# Docker Wings Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Wings Overview documentation.

## Install Docker

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

## Download the Wings Compose

Now that Docker is installed, you can download the Calagopus Panel Docker Compose file. You can do this by running the following commands:

```bash
mkdir calagopus-wings
cd calagopus-wings

curl -o compose.yml https://raw.githubusercontent.com/calagopus/wings/refs/heads/main/compose.yml
ls -lh # should show you the compose.yml file
```

