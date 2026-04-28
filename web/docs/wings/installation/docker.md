# Docker Wings Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Wings Overview documentation.

## Docker Image Variants

The Calagopus Panel Docker image comes in multiple variants, depending on your needs:

| Variant | Description |
| ------- | ----------- |
| `:latest` | The latest stable release of Calagopus Wings. This is the recommended image for most users. It is optimized for production use. |
| `:latest-pre` | The latest pre-release version of Calagopus Wings. This image may contain new features and bug fixes that are not yet available in the `:latest` image, but it may also contain bugs and is not recommended for production use. |
| `:nightly` | The latest development build of Calagopus Wings. This image is updated more frequently and may contain new features and bug fixes that are not yet available in the `:latest` or `:latest-pre` image. However, it may also contain bugs and is not recommended for production use. |

## Getting Started

### Install Docker

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

### Download the Wings Compose Stack

Now that Docker is installed, you can download the Calagopus Wings Docker Compose stack. You can do this by running the following commands:

```bash
mkdir calagopus-wings
cd calagopus-wings

curl -o compose.yml https://raw.githubusercontent.com/calagopus/wings/refs/heads/main/compose.local.yml
ls -lh # should show you the compose.yml file
```

### Change the Docker Image Variant (Optional)

By default, the `compose.yml` file uses the `:latest` variant of the Calagopus Wings Docker image. If you want to use a different variant, you can edit the `compose.yml` file and change the image tag in the `wings` service definition. [See the Docker Image Variants section above](#docker-image-variants) for more information on the available variants and their use cases. For example, if you want to use the `:nightly` variant, you would change the image tag from `calagopus/wings:latest` to `calagopus/wings:nightly`.

```bash
# Example of changing the image variant to `:nightly`
sed -i -e "s/calagopus\/wings:latest/calagopus\/wings:nightly/g" compose.yml

# or just open the compose.yml file in your preferred text editor and change the image tag manually
```

### Configure Wings

Before starting Wings, you need to configure it by creating a `config/config.yml` file in the same directory as your `compose.yml` file. The contents for this file can be found on your Node Configuration page on the Calagopus Panel. Make sure to replace the contents of `config/config.yml` with the configuration provided by the panel.

```bash
mkdir config
nano config/config.yml
```

Then, copy the contents from the Node Configuration page on the Calagopus Panel and paste it into the `config/config.yml` file. Save and exit the file.

::: warning
If you intend to change volume locations, make sure to have the **EXACT** same paths in your compose and your config, these cannot be relative paths and need to have the same locations in the container and host, this is because the Docker Daemon that runs the container needs to have access to the same paths as specified in the config file, otherwise Wings will not be able to create servers properly.
:::

### Start Wings

You almost made it! Now you can start Calagopus Wings by running:

```bash
docker compose up -d
```

This command will download the necessary Docker images and start Wings in detached mode.
If everything went well, your panel should be able to connect to the Wings instace and you can start managing your servers!

If any issues arise, you can check the logs of the Wings container by running:

```bash
docker compose logs -f wings
```

### Next Steps

Congratulations! You have now installed Calagopus Wings on your server. The next step is to set up Allocations, which is a combination of IP and Port that you can assign to a server. Please see the [Setting up Allocations](../next-steps/setting-up-allocations.md) documentation in the Next Steps part of the documentation.
