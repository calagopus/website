# Binary Wings Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Wings Overview documentation.

## Getting Started

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

#### Install the Wings Binary

Next, you need to download and install the Wings binary. You can do this by running the following commands:

```bash
curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings
```

This will download the latest version of Wings for your architecture and make it executable using `wings`.
To test that the installation was successful, you can run:

```bash
wings version
```

#### Configure Wings

Before starting Wings, you need to configure it to connect to your Calagopus Panel. To do this, create the Node on the Panel ((WIP INSERT GUIDE LINK HERE))
Then, paste the copied configuration command into your terminal, which will look something like this:

```bash
wings configure --join-data xxxxxx
```

To test the configuration, you can run:

```bash
wings
```

This will start Wings in the foreground, and you should see it connecting to the Panel.

#### Install Wings as a Service

To ensure that Wings starts automatically on system boot, you can install it as a systemd service. Create a new service file by running:

```bash
wings service-install
```

This will also start the service and enable it to start on boot. To check the status of the Wings service, you can run:

```bash
systemctl status wings
```