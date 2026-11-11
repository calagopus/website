---
title: Updating DB Agent
description: Update the Calagopus DB Agent. Database containers keep running, but client connections briefly drop while the agent restarts.
---

# Updating DB Agent

Updating DB Agent periodically gets you bug fixes, security patches, and new features.

::: warning Active connections will be interrupted
Database containers run independently of the DB Agent daemon, so they stay up and keep their data intact across an update. However, all client connections go through DB Agent's proxies, so restarting it will drop every active connection to every database. Plan updates around a moment where a brief reconnect is acceptable.
:::

::: tip Upgrading from the Panel
DB Agent 1.2.4 and newer, installed as a binary or package, can upgrade itself from the Panel: see [Upgrading the Agent](../panel/features/admin/database-agent-hosts.md#upgrading-the-agent). The agent downloads the release from GitHub, checks it against the release's SHA-256 digest, replaces its own binary and restarts in place. It refuses while instances are booting, autostarting, changing power state or running operations, or while imports or exports run. Set [`ignore_upgrades`](./configuration.md#ignore-upgrades) to turn this off. An agent in a container cannot upgrade itself.
:::

Pick the method matching how you installed DB Agent. Each block below is the whole update, so you can copy it in one go. Run `sudo -v` first so a password prompt doesn't swallow the rest of a pasted block. If your system doesn't have `sudo`, like Alpine, run the commands as root and leave it out.

::::tabs
=== Docker (Recommended)

Return to the directory containing your DB Agent `compose.yml`, then run:

```bash
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail 50
```

Docker handles the restart as part of `up -d`.

=== APT / RPM / APK / AUR

::: code-group
```bash [APT]
sudo apt update
sudo apt install -y --only-upgrade calagopus-db-agent
sudo systemctl restart db-agent
```

```bash [RPM]
sudo dnf upgrade -y calagopus-db-agent
sudo systemctl restart db-agent
```

```bash [APK]
apk update
apk upgrade calagopus-db-agent
rc-service db-agent restart
```

```bash [AUR]
yay -S --noconfirm calagopus-db-agent-bin
sudo systemctl restart db-agent
```
:::

These commands target DB Agent and any required dependencies. Schedule OS-wide updates separately.

=== Binary

::: code-group
```bash [systemd]
sudo systemctl stop db-agent
sudo curl -L "https://github.com/calagopus/db-agent/releases/latest/download/db-agent-$(uname -m)-linux" -o /usr/local/bin/calagopus-db-agent
sudo chmod +x /usr/local/bin/calagopus-db-agent
sudo /usr/local/bin/calagopus-db-agent version
sudo systemctl start db-agent
```

```bash [OpenRC (Alpine)]
rc-service db-agent stop
curl -L "https://github.com/calagopus/db-agent/releases/latest/download/db-agent-$(uname -m)-linux" -o /usr/local/bin/calagopus-db-agent
chmod +x /usr/local/bin/calagopus-db-agent
calagopus-db-agent version
rc-service db-agent start
```
:::

Compare the printed version with the [latest release](https://github.com/calagopus/db-agent/releases/latest) to confirm the update applied.

::::
