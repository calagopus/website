# Updating Wings

Updating Wings periodically gets you bug fixes, security patches, and new features. The process is quick and safe to do whenever a new release comes out, you don't need to plan downtime around it.

::: tip No downtime required
Game server containers run independently of the Wings daemon. You can update Wings without stopping your servers, they will continue running as normal while Wings restarts.
:::

Pick the method matching how you installed Wings:

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
systemctl restart wings
```

=== Binary

#### 1. Stop the service

```bash
systemctl stop wings
```

#### 2. Replace the binary

```bash
curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings
```

#### 3. Verify the new version

```bash
wings version
```
Check the output against the [latest release](https://github.com/calagopus/wings/releases/latest) to confirm the update actually applied before starting it back up.

#### 4. Start the service

```bash
systemctl start wings
```
::::
