![Calagopus Logo](/fulllogo.svg)

# What is Calagopus?

Calagopus is a modern, open-source game server management panel built with Rust and React. It provides an intuitive interface for managing game servers, allowing users to easily deploy, monitor, and maintain their game servers with ease. Calagopus aims to be a powerful yet user-friendly solution for game server management, catering to both beginners and experienced users alike.

It is heavily inspired by the popular Pterodactyl panel, but is built from the ground up with modern technologies and a focus on performance and security. Calagopus is designed to be modular and extensible, allowing developers to create custom extensions to enhance its functionality. With a strong emphasis on community involvement, Calagopus encourages contributions and feedback from users to continuously improve the panel and make it the best game server management solution available.

## Is Calagopus open source?

Yes, Calagopus is open source and available on [GitHub](https://github.com/calagopus). Most of the code is licensed under the MIT License, but some components may have different licenses. Please refer to the individual repositories for more details.

## Does Calagopus have an Extension API?

Yes, Calagopus has an Extension API that allows developers to create custom extensions to enhance the functionality of the panel. You can find more information about developing extensions in the [Extension Development Guide](../panel/extensions/dev-environment.md).

## Does Calagopus support Blueprint?

No, Calagopus does not support Extensions made for the [Blueprint Framework](https://blueprint.zip). This is not something technologically possible due to the differences in language and architecture.

## Can I run Calagopus on Windows?

Yesn't. Calagopus is primarily designed to run on Linux-based systems, the panel can be ran on Windows natively, however Wings will require WSL2 or similar Virtualization software to run on Windows. For the best experience, it is recommended to run Calagopus on a Linux server.

## Can I run Calagopus on a Raspberry Pi?

Yes! Calagopus can run on a Raspberry Pi out of the box via the docker compose. Wings will also run perfectly fine, however make sure you know your limits, as the Raspberry Pi may struggle to run multiple containers at once, especially if you are running resource intensive games.

## Am I expected to know how to use Linux to use Calagopus?

No, while other panels often require basic understanding, we strive for simplicity and ease of use, so you can run Calagopus without needing to know how to use Linux, after initial setup you likely won't even need to touch a CLI at all! However, some basic knowledge of Linux may be helpful for troubleshooting and advanced configuration. You can always get help in our [Discord](https://discord.gg/uSM8tvTxBV) if you need assistance, we don't judge!

## Is Calagopus free to use?

Yes, Calagopus is free to use for personal and commercial use. You can download and use it without any cost. However, if you find the project useful and would like to support its development, you can consider donating or contributing to the project on GitHub.
