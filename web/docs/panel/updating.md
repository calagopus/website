---
title: Updating the Panel
description: Update the Calagopus Panel for bug fixes, security patches, and new features, with a brief restart of the web interface and API.
---

# Updating the Panel

Updating the panel gets you bug fixes, security patches, and new features. Its web interface and API will be briefly unavailable while it restarts. An AIO update also restarts the bundled Wings, briefly interrupting console connections and server management.

Read the [release notes](../releases/index.md) and back up the Panel database, configuration, and encryption key before updating. Keep standalone Panel and Wings installations on compatible releases; see [Versions and Clocks](../additional/troubleshooting.md#versions-and-clocks). AIO updates both components together.

Pick the method matching how you installed the panel. Each block below is the whole update, so you can copy it in one go. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block. If your system doesn't have `sudo`, like Alpine, run the commands as root and leave it out.

::::tabs
=== Docker (Recommended)

Return to the directory containing your existing `compose.yml`, then run:

```bash
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail 50
```

This updates every service in the stack: the Panel image (including bundled Wings for AIO), the database, and the cache. Only containers whose image changed are recreated. Keep your existing Compose file and encryption key.

::: details Clean up old images
If you're on the `:heavy` image or have limited disk space, old image layers can pile up quickly. Remove unused ones:

```bash
sudo docker image prune -a
```
:::

::: info Still on the old version? (heavy image only)
The heavy image keeps the last binary it built under `./build/binaries` and keeps running it until extensions have been rebuilt. If the version shown doesn't change, or extensions fail to build against the new release, see [Extensions troubleshooting](./extensions/installing-extensions.md#troubleshooting).
:::

=== APT / RPM / APK / AUR

::: code-group
```bash [APT]
sudo apt update
sudo apt install -y --only-upgrade calagopus-panel
sudo systemctl restart calagopus-panel
```

```bash [RPM]
sudo dnf upgrade -y calagopus-panel
sudo systemctl restart calagopus-panel
```

```bash [APK]
apk update
apk upgrade calagopus-panel
rc-service calagopus-panel restart
```

```bash [AUR]
yay -S --noconfirm calagopus-panel-bin
sudo systemctl restart calagopus-panel
```
:::

Installed the AIO package? Use `calagopus-panel-aio` as the package name, or `calagopus-panel-aio-bin` on the AUR. The service name stays the same.

These commands target the named package and any required dependencies. Schedule OS-wide updates separately.

=== Binary

::: code-group
```bash [Linux]
sudo systemctl stop calagopus-panel
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-linux" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel
sudo /usr/local/bin/calagopus-panel version
sudo systemctl start calagopus-panel
```

```powershell [Windows]
nssm stop "Calagopus Panel"
Invoke-WebRequest "https://github.com/calagopus/panel/releases/latest/download/panel-rs-x86_64-windows.exe" -OutFile "C:\bin\calagopus-panel.exe"
calagopus-panel version
nssm start "Calagopus Panel"
```
:::

Compare the printed version with the [latest release](https://github.com/calagopus/panel/releases/latest) to confirm the update applied. On Windows, run this in an administrator PowerShell, and change `C:\bin` if you keep the executable somewhere else.

::::

After updating, sign in, check the Panel version in Admin, and open a server console to confirm its connection works.
