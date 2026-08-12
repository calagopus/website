# Updating DB Agent

Updating DB Agent periodically gets you bug fixes, security patches, and new features.

::: warning Active connections will be interrupted
Database containers run independently of the DB Agent daemon, so they stay up and keep their data intact across an update. However, all client connections go through DB Agent's proxies, so restarting it will drop every active connection to every database. Plan updates around a moment where a brief reconnect is acceptable.
:::

Pick the method matching how you installed DB Agent:

::::tabs
=== Docker (Recommended)

Pull the latest image and recreate the container:

```bash
docker compose pull
docker compose up -d
```

That's it, Docker handles the restart as part of `up -d`.

=== APT / RPM / APK

#### 1. Upgrade the package

Run the command for your package manager:

::: code-group
```bash [APT]
apt update
apt upgrade -y
```
```bash [RPM]
dnf check-update
dnf upgrade -y
```
```bash [APK]
apk update
apk upgrade
```
:::

#### 2. Restart the service

The package upgrade alone doesn't restart the running daemon, do that explicitly:

```bash
systemctl restart db-agent
```

=== Binary

#### 1. Stop the service

```bash
systemctl stop db-agent
```

#### 2. Replace the binary

```bash
curl -L "https://github.com/calagopus/db-agent/releases/latest/download/db-agent-$(uname -m)-linux" -o /usr/local/bin/calagopus-db-agent
chmod +x /usr/local/bin/calagopus-db-agent
```

#### 3. Verify the new version

```bash
calagopus-db-agent version
```
Check the output against the [latest release](https://github.com/calagopus/db-agent/releases/latest) to confirm the update actually applied before starting it back up.

#### 4. Start the service

```bash
systemctl start db-agent
```
::::
