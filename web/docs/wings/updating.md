---
title: Updating Wings
description: Update Calagopus Wings with Docker, a package manager, or a binary, and check its connection after restarting.
---

# Updating Wings

Updating Wings gets you bug fixes, security patches, and new features. Read the [release notes](../releases/index.md), back up your Wings configuration, and check [Panel/Wings version compatibility](../additional/troubleshooting.md#versions-and-clocks) before updating.

::: info What restarts?
Game server containers run independently of Wings and normally keep running during a Wings-only restart. Console connections, server controls, and SFTP are interrupted while Wings is unavailable. Docker, host OS, and game updates are separate operations and may require stopping games.
:::

Moving a node from Pterodactyl or Pelican Wings? Follow [Migrating Wings Nodes](../additional/migrations/wings.md) instead.

If you use the Panel's **All-in-One** image or package, follow [Updating the Panel](../panel/updating.md) instead. Its update includes Wings; there is no separate AIO `wings` Compose service to update.

::: tip Upgrading from the Panel
Wings 1.2.7 and newer, installed as a binary or package, can upgrade itself from the Panel: see [Upgrading Wings](../panel/features/admin/nodes.md#upgrading-wings). Wings downloads the release from GitHub, checks it against the release's SHA-256 digest, replaces its own binary and restarts in place, so the service does not need to be restarted. The commands below do the same by hand. On a package install, a Panel upgrade replaces the packaged binary, and the package manager keeps listing the old version until its next upgrade. Wings in a container cannot upgrade itself.
:::

Pick the method matching how you installed Wings. Each block below is the whole update, so you can copy it in one go. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block. If your system doesn't have `sudo`, like Alpine, run the commands as root and leave it out.

::::tabs
=== Docker (Recommended)

Return to the directory containing your Wings `compose.yml`, then run:

```bash
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail 50
```

Docker handles the restart as part of `up -d`. Keep the existing configuration and data mounts.

::: details Updating to Wings 1.2.6 or newer from an older `compose.yml`
Wings 1.2.6 changed the Compose file to share the host PID and cgroup namespaces (`pid: host`, `cgroup: host`), which Wings uses to reach server containers for bandwidth limits, resource stats and CFS burst. An existing `compose.yml` is not updated by `sudo docker compose pull`; add the two lines to the `wings` service yourself, or download the file again.

If you use bandwidth limits on Wings 1.2.6 or 1.2.7, set [`docker.bandwidth.backend`](./configuration.md#docker-bandwidth-backend) to `container` when you add `pid: host`, because the Wings container does not hold the capabilities the default `auto` choice then needs. From Wings 1.2.8, `auto` checks for those capabilities and uses the helper container without them.
:::

=== APT / RPM / APK / AUR

::: code-group
```bash [APT]
sudo apt update
sudo apt install -y --only-upgrade calagopus-wings
sudo systemctl restart wings
```

```bash [RPM]
sudo dnf upgrade -y calagopus-wings
sudo systemctl restart wings
```

```bash [APK]
apk update
apk upgrade calagopus-wings
rc-service wings restart
```

```bash [AUR]
yay -S --noconfirm calagopus-wings-bin
sudo systemctl restart wings
```
:::

These commands target Wings and any required dependencies. Schedule OS-wide updates separately.

=== Binary

::: code-group
```bash [systemd]
sudo systemctl stop wings
sudo curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
sudo chmod +x /usr/local/bin/wings
sudo /usr/local/bin/wings version
sudo systemctl start wings
```

```bash [OpenRC (Alpine)]
rc-service wings stop
curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings
wings version
rc-service wings start
```
:::

Compare the printed version with the [latest release](https://github.com/calagopus/wings/releases/latest) to confirm the update applied.

::::

After updating, check **Admin → Nodes → (your node) → Overview** for the Wings version, then open a game console and confirm it reconnects.
