# Updating the Panel

Updating the panel gets you bug fixes, security patches, and new features. Unlike Wings, the panel's web interface and API will be briefly unavailable while it restarts, so plan around a short interruption rather than zero downtime.

Pick the method matching how you installed the panel:

::::tabs
=== Docker (Recommended)

#### 1. Pull and restart
```bash
docker compose pull
docker compose up -d
```

#### 2. Clean up old images (optional)
If you're on the `:heavy` image or have limited disk space, old image layers can pile up quickly. Remove unused ones:
```bash
docker image prune -a
```

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
systemctl restart calagopus-panel
```

=== Binary

Pick your platform:

:::tabs
== Linux

##### 1. Stop the service
```bash
systemctl stop calagopus-panel
```

##### 2. Replace the binary
```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-linux" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel
```

##### 3. Verify the new version
```bash
calagopus-panel version
```
Check the output against the [latest release](https://github.com/calagopus/panel/releases/latest) to confirm the update applied.

##### 4. Start the service
```bash
systemctl start calagopus-panel
```

== Windows

##### 1. Stop the service
```powershell
nssm stop "Calagopus Panel"
```

##### 2. Replace the executable
Download the latest executable [here](https://github.com/calagopus/panel/releases/latest/download/panel-rs-x86_64-windows.exe) and place it in the same directory as the existing `calagopus-panel.exe` (e.g. `C:\bin`). Delete the old executable and rename the new one to `calagopus-panel`.

![Placing executable to C:\bin](./installation/images/bin.webp)
![Renaming executable](./installation/images/rename.webp)

##### 3. Start the service
```powershell
nssm start "Calagopus Panel"
```
:::

::::