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

::: warning
WSL shuts down the VM once you leave the terminal, which makes Valkey inaccessible once closed. 
::::

#### Download the binary
Depending on your operating system, select your operating system here:
::::tabs
=== Linux
Run theses commands:
```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-linux" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel

calagopus-panel version
```
=== MacOS
Run theses commands:
```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-macos" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel

calagopus-panel version
```
=== Windows
Grab the latest executable by downloading it [here](https://github.com/calagopus/panel/releases/latest/download/panel-rs-x86_64-windows.exe), and add it to PATH.

To add the executable to PATH, first move the executable to a folder you would keep all the CLI tools. It can be `C:\bin`, `C:\Tools` or anything. For this example, we will use `C:\bin`.
![Placing executable to C:\bin](./images/bin.png)

Rename the executable to `calagopus-panel` so that you don't have to manually type out the file name:
![Renaming executable](./images/rename.png)

Then, press `Win + R` and type `rundll32.exe sysdm.cpl,EditEnvironmentVariables`, and click on `OK` like shown:
![Open the Run dialog](./images/winr.png)

Then, under the `System variables` section (the bottom half), find the variable `Path`, select it and then click on `Edit`.
![Show ENVs](./images/env.png)

Click on `New` and put the full path of the folder where you moved the panel executable. In this guide we used `C:\bin`, and then press on `Enter`.
![Add PATH](./images/path.png)

Finally, click on `OK` on the `Edit environment variable` window, and `OK` again on the `Environment Variables` window. You can now open a new terminal window, and run this command:
```powershell
calagopus-panel version
```
::::

#### Database Configuration
You will need a database setup and a user with the correct permissions created for that database before continuing any further. To do so, first login to PostgreSQL:
::::tabs
=== Linux/MacOS
Run this command:
```bash
sudo -u postgres psql
```
=== Windows
Enter the SQL Shell by typing `sql` on the search bar, and find this application:
![psql Shell](./images/psqlshell.png)

Once on the psql shell, you will be prompted on which server you want to connect to, the port, the username and the database. Theses can be skipped if you are hosting PostgreSQL locally by pressing enter, until you will reach the password prompt where you set during the setup process:
![](./images/auth.png)
::::

Then, create the user and database and grant the user all permissions:
```sql
CREATE USER calagopus WITH PASSWORD 'yourPassword';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
exit
```

#### Configure Environment Variables 

Before starting the Panel, you need to configure the environment variables. By default, the `.env` is not included in the package, you can download it manually by running the following commands:
::::tabs
=== Linux/MacOS
```bash
mkdir -p /etc/calagopus
cd /etc/calagopus

curl -o .env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
ls -lha # should show you the .env file
```
=== Windows
Windows does not come with an `/etc` folder, so you will need to create your `.env` file at the same directory the executable is. For example, if the executable is located at `C:\bin\calagopus-panel.exe`, the `.env` file would be located at `C:\bin\.env`
![](./images/dotenv.png)

Inside your newly created `.env` file, paste the contents of [this file](https://github.com/calagopus/panel/blob/main/.env.example) inside.
![](./images/contents.png)
::::

Edit the `.env` with your preferred text editor and modify the environment variables as needed. See the [Environment Configuration documentation](../environment.md) for more details on each variable. Make sure to configure PostgreSQL/Redis and your app encryption keys in the `.env` file.

To set the `DATABASE_URL` variable, replace the value below with your own values, for example: `calagopus` is the user, `yourPassword` is your user's password, and `panel` is your database name:
```
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

`REDIS_URL` can stay to the default value `redis://localhost`, unless Redis is on another server, where you will have to modify this string.

You can use this script to set the `APP_ENCRYPTION_KEY` variable to a random value:

::::tabs
=== Linux/MacOS
```bash
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" .env
```
=== Windows
Make sure to run theses commands on PowerShell!
```powershell
$RandomString = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
(Get-Content .env) -replace 'CHANGEME', $RandomString | Set-Content .env
```
::::

#### Test the configuration

To test the configuration, you can run:
```bash
calagopus-panel
```

If everything works correctly, the panel should not show any errors and will start the HTTP server, in which case you can kill the panel with Ctrl-C.

#### Install Panel as a Service
This guide will depend on your operating system. Please select your operating system below:
::::tabs
=== Linux
To ensure that the panel starts automatically on system boot, you can install it as a systemd service. Create a new service file by running:
```bash
calagopus-panel service-install
```
This will also start the service and enable it to start on boot. To check the status of the Panel service, you can run:
```bash
systemctl status calagopus-panel
```
If everything went well, you should be able to access the Panel by navigating to `http://<your-server-ip>:8000` in your web browser and see the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.png)
=== MacOS
*wip: wait for robert to do brew probably*
=== Windows
To ensure that the panel starts automatically on system boot, you can install it as a NSSM service. First, [download](https://github.com/dkxce/NSSM/releases/download/v2.25/NSSM_v2.25.zip) NSSM and extract the `nssm.exe` file appropriate to your architechture (if x86 use the contents of the win32 folder, if x64 use the contents of win64 folder) to the same path where your Calagopus Panel executable is located at.
![](./images/nssm.png)

Then, open a terminal, and run theses 2 commands:
```powershell
# Install the service
nssm install "Calagopus Panel" "C:\bin\calagopus-panel.exe"

# Start the service
nssm start "Calagopus Panel"
```
It should normally look like this:
![](./images/nssmcli.png)

If everything went well, you should be able to access the Panel by navigating to `http://<your-server-ip>:8000` in your web browser and see the OOBE (Out Of Box Experience) setup screen.

![Calagopus Panel OOBE](../oobe.png)
::::
