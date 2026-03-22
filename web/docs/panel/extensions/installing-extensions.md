# Installing Extensions

In this guide, you will learn how to install `.c7s.zip` extensions in your Calagopus Panel.

This process is *meant* to be done via either the `:heavy` docker image or a full development environment, nothing in between. If
you are using the regular `:latest` or `:nightly` docker image, you will need to switch it over to `:heavy` (or `:nightly-heavy`) to be able to install extensions. [Click here to view the guide on how to change the Docker image variant](../installation/docker.md#change-the-docker-image-variant-optional).

## Install an Extension

To install an extension, the steps will vary depending on whether you are using the Docker image or a local installation. Use the tabs below to navigate to the instructions for your installation method.

::::tabs
=== With Docker

The process for installing extensions with the Docker image pretty straightforward. First, ensure you are using the `:heavy` or `:nightly-heavy` Docker image variant, as the regular `:latest` and `:nightly` images do not include the necessary tools to install extensions. [Click here to view the guide on how to change the Docker image variant](../installation/docker.md#change-the-docker-image-variant-optional).

Then, after you have ran `docker compose up -d` to (re)start the Panel with the new image variant, you can then access the extension management page in the Panel and upload the `.c7s.zip` file for your extension. The Panel will handle the rest of the installation process for you.

Alternatively, you can also copy the `.c7s.zip` file for your extension directly into the `extensions` directory of the Panel's data volume. If you are using the default heavy compose stack, this will be at `./build/extensions` relative to your compose file. The Panel will automatically detect the new extension and install it for you after you restart the Container. (e.g. by running `docker compose restart web`).

=== With Development Environment

If you have a local installation of the Panel, you can install extensions by running the following command in your terminal, replacing `path/to/extension.c7s.zip` with the actual path to your extension file:

```bash
panel-rs extensions add path/to/extension.c7s.zip
```

And thats *almost* it, the extension src has now been added to the Panel, however you will now need to compile the frontend and backend of the Panel to be able to use the extension. To do this, run the following command in your terminal:

```bash
panel-rs extensions apply --profile balanced
```

If you are developing locally, you can also use the `dev` profile instead (which will use the `dev` profile in cargo whereas `balanced` will use the `heavy-release` profile), this will make the compilation process faster, but it is not recommended for production use as it may have some performance implications.

Alternatively, you can also compile the frontend and backend separately by running the following commands:

```bash
cd frontend
pnpm i # required, since the extension may have added new dependencies to the frontend
pnpm build:fast

cd ..
cargo b --profile heavy-release

# bin now at ./target/heavy-release/panel-rs
```

::::
