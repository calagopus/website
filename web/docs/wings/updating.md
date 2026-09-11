---
title: Updating Wings
description: Update Calagopus Wings with Docker, a package manager, or a binary, and check its connection after restarting.
---

# Updating Wings

Updating Wings gets you bug fixes, security patches, and new features. Read the [release notes](../releases/index.md), back up your Wings configuration, and check [Panel/Wings version compatibility](../additional/troubleshooting.md#versions-and-clocks) before updating.

::: info What restarts?
Game server containers run independently of Wings and normally keep running during a Wings-only restart. Console connections, server controls, and SFTP are interrupted while Wings is unavailable. Docker, host OS, and game updates are separate operations and may require stopping games.
:::

If you use the Panel's **All-in-One** image or package, follow [Updating the Panel](../panel/updating.md) instead. Its update includes Wings; there is no separate AIO `wings` Compose service to update.

Pick the method matching how you installed Wings:

::::tabs
=== Docker (Recommended)

Return to the directory containing your Wings `compose.yml`. Pull the latest image and recreate the `wings` service:

```bash
docker compose pull wings
docker compose up -d --no-deps wings
docker compose ps
docker compose logs --tail 50 wings
```

Docker handles the restart as part of `up -d`. Keep the existing configuration and data mounts.

=== APT / RPM / APK

#### 1. Upgrade the package

Run the command for your package manager:

::: code-group
```bash [APT]
apt update
apt install --only-upgrade calagopus-wings
```
```bash [RPM]
dnf upgrade calagopus-wings
```
```bash [APK]
apk update
apk upgrade calagopus-wings
```
:::

These commands target Wings and any required dependencies. Schedule OS-wide updates separately.

#### 2. Restart the service

Restart the service to load the updated binary:

::: code-group
```bash [systemd]
systemctl restart wings
```
```bash [OpenRC (Alpine)]
rc-service wings restart
```
:::

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
Check the output against the [latest release](https://github.com/calagopus/wings/releases/latest) to confirm the update applied.

#### 4. Start the service

```bash
systemctl start wings
```
::::

After updating, check **Admin → Nodes → (your node) → Overview** for the Wings version, then open a game console and confirm it reconnects.
