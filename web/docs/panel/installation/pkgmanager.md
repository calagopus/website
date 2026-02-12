# Package Panel Installation

Please see the [Minimum Requirements](../overview.md#minimum-requirements) section in the Panel Overview documentation.

With the APT/RPM repository, you can directly install Calagopus from your package manager. Select your package manager below:

::::tabs
=== With APT
#### Prerequisites
This guide assumes you have PostgreSQL and Redis installed on your server.

To install PostgreSQL, [click me to view the guide](https://wiki.postgresql.org/wiki/Apt) to add the APT repository, and then install PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql-18
```

To install Redis, run the following commands:
```bash
sudo apt install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt update
sudo apt install -y redis
```

Then, start Redis when the server reboots:
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

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

#### Database Configuration
You will need a database setup and a user with the correct permissions created for that database before continuing any further. To do so, first login to PostgreSQL:
```bash
sudo -u postgres psql
```
Then, create the user and database and grant the user all permissions:
```sql
CREATE USER calagopus WITH PASSWORD 'yourPassword';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
exit
```

#### Configure Environment Variables 

Before starting the Panel, you need to configure the environment variables. By default, the `.env` is not included in the package, you can download it manually by running the following commands:
```bash
mkdir -p /etc/calagopus
cd /etc/calagopus

curl -o .env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
ls -lha # should show you the .env file
```

Edit the `.env` with your preferred text editor and modify the environment variables as needed. See the [Environment Configuration documentation](../environment.md) for more details on each variable. Make sure to configure PostgreSQL/Redis and your app encryption keys in the `.env` file.

To set the `DATABASE_URL` variable, replace the value below with your own values, for example: `calagopus` is the user, `yourPassword` is your user's password, and `panel` is your database name:
```
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

`REDIS_URL` can stay to the default value `redis://localhost`, unless Redis is on another server, where you will have to modify this string.

You can use this script to set the `APP_ENCRYPTION_KEY` variable to a random value:

```bash
RANDOM_STRING=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" .env
```

#### Test the configuration

To test the configuration, you can run:
```bash
calagopus-panel
```

If everything works correctly, the panel should not show any errors and will start the HTTP server, in which case you can kill the panel with Ctrl-C.

#### Install Panel as a Service
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

=== With RPM
#### Prerequisites
This guide assumes you have PostgreSQL and Redis installed on your server.

To install PostgreSQL, [click me to view the guide](https://www.postgresql.org/download/linux/redhat/) to add the RPM repository, but do not do the optional steps unless you know what you are doing. For example, if you use Fedora 43 and are on a x86_64 architecture, you would run:
```bash
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/F-43-x86_64/pgdg-fedora-repo-latest.noarch.rpm
sudo dnf install -y postgresql18-server
```
Then, start PostgreSQL when the server reboots:
```bash
sudo systemctl enable postgresql-18
sudo systemctl start postgresql-18
```

To install Redis, follow the instructions for your specific operating system:
:::tabs
== Rocky Linux 9 and AlmaLinux 9
Create the `/etc/yum.repos.d/redis.repo` file with the following content:
```ini
[Redis]
name=Redis
baseurl=http://packages.redis.io/rpm/rockylinux9
enabled=1
gpgcheck=1
```
Then, run the following commands:
```bash
curl -fsSL https://packages.redis.io/gpg > /tmp/redis.key
sudo rpm --import /tmp/redis.key
sudo yum install redis
```
Then, start Redis when the server reboots:
```bash
sudo systemctl enable redis
sudo systemctl start redis
```

== Rocky Linux 8 and AlmaLinux 8
Create the `/etc/yum.repos.d/redis.repo` file with the following content:
```ini
[Redis]
name=Redis
baseurl=http://packages.redis.io/rpm/rockylinux8
enabled=1
gpgcheck=1
```
Then, run the following commands:
```bash
curl -fsSL https://packages.redis.io/gpg > /tmp/redis.key
sudo rpm --import /tmp/redis.key
sudo yum install redis
```
Then, start Redis when the server reboots:
```bash
sudo systemctl enable redis
sudo systemctl start redis
```

== Fedora
Run the following commands:
```bash
sudo dnf update
sudo dnf install redis
```
Then, start Redis when the server reboots:
```bash
sudo systemctl enable redis
sudo systemctl start redis
```

== Others
If your operating system isn't listed here, you can look up on Google on how to install Redis on your operating system.
:::

#### Add the repository
The first step to install Calagopus is to add the Calagopus RPM repository. To do so, on your server run theses commands:
```bash
sudo rpm --import https://packages.calagopus.com/pubring.gpg
sudo tee /etc/yum.repos.d/calagopus.repo > /dev/null <<EOF
[calagopus]
name=Calagopus Repository
baseurl=https://packages.calagopus.com/rpm
enabled=1
gpgcheck=1
gpgkey=https://packages.calagopus.com/pubring.gpg
EOF
```

#### Install Calagopus Panel
Now that the repository has been added, you can now install the Calagopus Panel package. You can do this by running the following commands:
```bash
dnf install calagopus-panel
```

#### Database Configuration
You will need a database setup and a user with the correct permissions created for that database before continuing any further. To do so, first login to PostgreSQL:
```bash
sudo -u postgres psql
```
Then, create the user and database and grant the user all permissions:
```sql
CREATE USER calagopus WITH PASSWORD 'yourPassword';
CREATE DATABASE panel OWNER calagopus;
GRANT ALL PRIVILEGES ON DATABASE panel TO calagopus;
exit
```

#### Configure Environment Variables 

Before starting the Panel, you need to configure the environment variables. By default, the `.env` is not included in the package, you can download it manually by running the following commands:
```bash
mkdir -p /etc/calagopus
cd /etc/calagopus

curl -o .env https://raw.githubusercontent.com/calagopus/panel/refs/heads/main/.env.example
ls -lha # should show you the .env file
```

Edit the `.env` with your preferred text editor and modify the environment variables as needed. See the [Environment Configuration documentation](../environment.md) for more details on each variable. Make sure to configure PostgreSQL/Redis and your app encryption keys in the `.env` file.

To set the `DATABASE_URL` variable, replace the value below with your own values, for example: `calagopus` is the user, `yourPassword` is your user's password, and `panel` is your database name:
```
DATABASE_URL="postgresql://calagopus:yourPassword@localhost:5432/panel"
```

`REDIS_URL` can stay to the default value `redis://localhost`, unless Redis is on another server, where you will have to modify this string.

You can use this script to set the `APP_ENCRYPTION_KEY` variable to a random value:

```bash
RANDOM_STRING=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" .env
```

#### Test the configuration

To test the configuration, you can run:
```bash
calagopus-panel
```

If everything works correctly, the panel should not show any errors and will start the HTTP server, in which case you can kill the panel with Ctrl-C.

#### Install Panel as a Service
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

::::