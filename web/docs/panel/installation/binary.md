# Binary Panel Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Panel Overview documentation.

Calagopus Panel comes shipped as a compiled binary file that you can download directly from [GitHub](https://github.com/calagopus/panel/releases/latest).

## Getting Started

#### Prerequisites
This guide assumes you have PostgreSQL and Valkey installed on your server. You can replace Valkey with Redis, although keep in mind that Valkey is much faster than Redis. This guide assume you are using Valkey.

If you do not have PostgreSQL and/or Valkey installed on your server, follow the instructions below depending of your package manager:
::::tabs
=== Linux (with APT)
To install PostgreSQL, [click me to view the guide](https://wiki.postgresql.org/wiki/Apt) to add the APT repository, and then install PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql-18
```
Then, start PostgreSQL when the server reboots:
```bash
sudo systemctl enable --now postgresql
```

To install Valkey, run the following commands:
```bash
sudo apt update
sudo apt install -y valkey
``` 

Then, start Valkey when the server reboots:
```bash
sudo systemctl enable valkey-server
sudo systemctl start valkey-server
```
=== Linux (with RPM)
To install PostgreSQL, [click me to view the guide](https://www.postgresql.org/download/linux/redhat/) to add the RPM repository, initialize the database and enable automatic start (the command should start with `sudo systemctl`). For example, if you use Fedora 43 and are on a x86_64 architecture, you would run:
```bash
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/F-43-x86_64/pgdg-fedora-repo-latest.noarch.rpm
sudo dnf install -y postgresql18-server
```

You may need to also install the contrib package of PostgreSQL:
```bash
sudo dnf install -y postgresql18-contrib
```

Then, start PostgreSQL when the server reboots:
```bash
sudo systemctl enable postgresql-18
sudo systemctl start postgresql-18
```

To install Valkey, run the following commands:
```bash
sudo yum install valkey
```

Then, start Valkey when the server reboots:
```bash
sudo systemctl enable valkey-server
sudo systemctl start valkey-server
```
=== MacOS
You can download PostgreSQL using [this guide](https://www.postgresql.org/download/macosx/) with either an interactive installer, [Postgres.app](https://postgresapp.com/), [Homebrew](https://brew.sh/), [MacPorts](https://www.macports.org/) or [Flink](https://www.finkproject.org/).

To install Valkey, first install [Homebrew](https://brew.sh):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then, install Valkey from Homebrew:
```bash
brew install valkey
```

Then, start Valkey when the server reboots:
```bash
brew services start valkey
```
=== Windows
You can download PostgreSQL using [this guide](https://www.postgresql.org/download/windows/) with an interactive installer. Instructions on how to use the installer can be found [here](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/).

Valkey (or Redis) isn't officially supported on Windows, so you will need to install WSL first. Microsoft provides [detailed instructions for installing WSL](https://docs.microsoft.com/en-us/windows/wsl/install). Follow these instructions, and take note of the default Linux distribution it installs. Then, depending of the default Linux distribution, select the package manager it installed.
The default is usually Ubuntu, so head to the `Linux (with APT)` tab to install Valkey.
::::

