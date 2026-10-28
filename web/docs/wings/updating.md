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

Return to the directory containing your Wings `compose.yml`. Pull the latest images and recreate the stack:

```bash
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail 50
```

Docker handles the restart as part of `up -d`. Keep the existing configuration and data mounts. Wings in a container cannot upgrade itself from the Panel.

Wings 1.2.6 changed the Compose file to share the host PID and cgroup namespaces (`pid: host`, `cgroup: host`), which Wings uses to reach server containers for bandwidth limits, resource stats and CFS burst. An existing `compose.yml` is not updated by `docker compose pull`; add the two lines to the `wings` service yourself, or download the file again. If you use bandwidth limits, set [`docker.bandwidth.backend`](./configuration.md#docker-bandwidth-backend) to `container` when you add `pid: host`, because the Wings container does not hold the capabilities the default `auto` choice then needs.

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

These commands target Wings and any required dependencies. Schedule OS-wide updates separately. Wings 1.2.7 and newer can also [upgrade itself from the Panel](../panel/features/admin/nodes.md#upgrading-wings), see the Binary tab.

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

::: tip Upgrading from the Panel
Wings 1.2.7 and newer, installed as a binary or package, can upgrade itself from the Panel: see [Upgrading Wings](../panel/features/admin/nodes.md#upgrading-wings). Wings downloads the release from GitHub, checks it against the release's SHA-256 digest, replaces its own binary and restarts in place, so the service does not need to be restarted. The steps below do the same by hand. On a package install, a Panel upgrade replaces the packaged binary, and the package manager keeps listing the old version until its next upgrade.
:::

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
