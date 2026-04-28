![Calagopus Logo](/fulllogo.svg)

# What is Calagopus?

Calagopus is a modern, open-source game server management panel built with Rust and React. It provides a fast, secure interface for deploying, monitoring, and maintaining game servers - built for everyone from solo homelabbers to large hosting operators.

It draws inspiration from Pterodactyl but is written from scratch with a focus on performance, security, and extensibility. The panel includes a rich extension API, and the project welcomes community contributions.

## Is Calagopus open source?

Yes. Calagopus is available on [GitHub](https://github.com/calagopus) and licensed primarily under the MIT License. Some components may carry different licenses - check the individual repositories for details.

## Does Calagopus have an Extension API?

Yes. Extensions can add backend logic, custom routes, UI elements, database migrations, and more. See the [Extension Development Guide](../panel/extensions/dev-environment.md) to get started.

## Does Calagopus support Blueprint?

No. Blueprint extensions are not compatible with Calagopus. The two projects use fundamentally different languages and architectures, making compatibility impossible at the integration level.

## Can I run Calagopus on Windows?

The panel itself runs on Windows natively. Wings, however, requires a Linux environment - WSL2 works for local testing, but for anything beyond that a Linux server is the better choice.

## Can I run Calagopus on a Raspberry Pi?

Yes. Calagopus supports ARM64 and the Docker Compose setup works out of the box on a Raspberry Pi. Keep resource limits in mind - multiple CPU-intensive game servers on constrained hardware will show its limits.

## Do I need Linux experience to use Calagopus?

Not much. After the initial setup you can manage everything through the web interface. Some familiarity with the terminal is helpful for troubleshooting, but day-to-day operation doesn't require it. The [Discord community](https://discord.gg/uSM8tvTxBV) is available if you get stuck.

## Is Calagopus free to use?

Yes, for personal and commercial use. If you find it useful, contributions and donations to the project are appreciated.