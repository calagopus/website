# Docker Panel Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Panel Overview documentation.

## Docker Image Variants

The Calagopus Panel Docker image comes in multiple variants, depending on your needs:

| Variant | Description |
| ------- | ----------- |
| `:latest` | The latest stable release of the Calagopus Panel. This is the recommended image for most users. It is optimized for production use and does not include development tools. |
| `:latest-pre` | The latest pre-release version of the Calagopus Panel. This image may contain new features and bug fixes that are not yet available in the `:latest` image, but it may also contain bugs and is not recommended for production use. |
| `:nightly` | The latest development build of the Calagopus Panel. This image is updated more frequently and may contain new features and bug fixes that are not yet available in the `:latest` or `:latest-pre` image. However, it may also contain bugs and is not recommended for production use. |
| `:heavy` | This image includes all the development tools and dependencies needed to build and run the Calagopus Panel. It is meant for users who want to contribute to the development of the Panel or need to run extensions. This image is not optimized for production use and may have a larger attack surface due to the included tools. |
| `:heavy-pre` | This image is the pre-release variant of the `:heavy` image. It includes the latest pre-release version of the Calagopus Panel along with all the development tools and dependencies. Like the `:latest-pre` image, it may contain new features and bug fixes that are not yet available in the `:heavy` image, but it may also contain bugs and is not recommended for production use. |
| `:nightly-heavy` | This image is the development build variant of the `:heavy` image. It includes the latest development build of the Calagopus Panel along with all the development tools and dependencies. Like the `:nightly` image, it may contain new features and bug fixes that are not yet available in the `:heavy` or `:heavy-pre` image, but it may also contain bugs and is not recommended for production use. |

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

### Download the Panel Compose Stack

Now that Docker is installed, you can download the Calagopus Panel Docker Compose stack. You can do this by running the following commands:

::: code-group

```bash [Basic]
mkdir calagopus-panel
cd calagopus-panel

curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.yml
ls -lh # should show you the compose.yml file
```

```bash [Basic with automatic Database Backups]
mkdir calagopus-panel
cd calagopus-panel

curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.with-db-backups.yml
ls -lh # should show you the compose.yml file
```

```bash [Heavy Image for Support for Extensions]
mkdir calagopus-panel
cd calagopus-panel

curl -o compose.yml https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/compose.heavy.yml
ls -lh # should show you the compose.yml file
```

:::

### Change the Docker Image Variant (Optional)

By default, the `compose.yml` file uses the `:latest` variant of the Calagopus Panel Docker image. If you want to use a different variant, you can edit the `compose.yml` file and change the image tag in the `panel` service definition. [See the Docker Image Variants section above](#docker-image-variants) for more information on the available variants and their use cases. For example, if you want to use the `:heavy` variant, you would change the image tag from `calagopus/panel:latest` to `calagopus/panel:heavy`.

```bash
# Example of changing the image variant to `:heavy`
sed -i -e "s/calagopus\/panel:latest/calagopus\/panel:heavy/g" compose.yml

# or just open the compose.yml file in your preferred text editor and change the image tag manually
```

::: warning
If you switch from a non-heavy variant to a heavy variant, you may need to adjust the compose mounts to ensure the container can start and use extensions properly.
You can check the mounts section of the [`compose.heavy.yml`](https://github.com/calagopus/panel/blob/main/compose.heavy.yml) file for reference on how to set up the volumes for the heavy variant.
:::

### Configure Environment Variables

Before starting the Panel, you need to configure the environment variables. Edit the `compose.yml` with your preferred text editor and modify the environment variables as needed. See the [Environment Configuration documentation](../environment.md) for more details on each variable.

If you prefer doing the absolute minimum, you can use this script to set the `APP_ENCRYPTION_KEY` variable to a random value:

```bash
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml
```

### Start the Panel

You almost made it! Now you can start the Calagopus Panel by running:

```bash
docker compose up -d
```

This command will download the necessary Docker images and start the Panel in detached mode.
If everything went well, you should be able to access the Panel by navigating to `http://<your-server-ip>:8000` in your web browser and see the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.webp)
