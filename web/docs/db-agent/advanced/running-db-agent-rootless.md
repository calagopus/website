---
title: Running DB Agent Rootless
next: false
description: Run Calagopus DB Agent as an unprivileged user under rootless Podman, with a systemd user service and the configuration changes it needs.
---

# Running DB Agent Rootless

DB Agent talks to its container engine through the Docker API, and rootless Podman exposes a compatible socket under your user account. This guide sets DB Agent up to run entirely as a normal user: the binary, its config, its data and the database containers all belong to that user, and nothing runs as root.

Root is still needed once, to install Podman and to let the user's services run without an open login session. After that, DB Agent and every database container run unprivileged.

::: info Podman only
Rootless mode relies on Podman's `keep-id` user namespace mapping. Rootless Docker has no equivalent, so this guide covers Podman only.
:::

## Before You Start

Install Podman through your distribution's package manager (`sudo apt install podman`, `sudo dnf install podman`), then enable the Podman socket as the user DB Agent will run as:

```bash
systemctl --user enable --now podman.socket
```

User services normally stop when the user logs out. Enable lingering so the socket, DB Agent and the databases keep running and come back up after a reboot. This is the one step that needs root:

```bash
sudo loginctl enable-linger $USER
```

Check that the user's UID has a subordinate ID range, which Podman needs to map container users:

```bash
grep "^$USER:" /etc/subuid /etc/subgid
```

Most distributions add one when the user is created. If either file has no line for the user, add one as root, for example `sudo usermod --add-subuids 100000-1099999 --add-subgids 100000-1099999 $USER`.

## Install the Binary

Install DB Agent into your home directory instead of `/usr/local/bin`:

```bash
mkdir -p ~/.local/bin
curl -L "https://github.com/calagopus/db-agent/releases/latest/download/db-agent-$(uname -m)-linux" -o ~/.local/bin/calagopus-db-agent
chmod +x ~/.local/bin/calagopus-db-agent
~/.local/bin/calagopus-db-agent version
```

## Create the Config

DB Agent looks for its config in `/etc/calagopus-db-agent/config.yml` by default, which a normal user can't write. Keep it in your home directory and pass its path with `--config` every time:

```bash
mkdir -p ~/.config/calagopus-db-agent
~/.local/bin/calagopus-db-agent --config ~/.config/calagopus-db-agent/config.yml configure --token <TOKEN>
```

This writes a config with all defaults and your API token. The defaults assume root, so change the following.

### Directories

The default socket, data and log directories are system paths. Move them somewhere the user owns, and move the SQLite database with the data directory:

```diff
-socket_dir: /run/calagopus-db-agent
+socket_dir: /run/user/1000/calagopus-db-agent
-data_dir: /var/lib/calagopus-db-agent/data
+data_dir: /home/robert/.local/share/calagopus-db-agent/data
-log_dir: /var/log/calagopus-db-agent
+log_dir: /home/robert/.local/state/calagopus-db-agent
 database:
-  url: sqlite:///var/lib/calagopus-db-agent/data/database.db
+  url: sqlite:///home/robert/.local/share/calagopus-db-agent/data/database.db
```

Replace `1000` with your user ID (`id -u`) and `/home/robert` with your home directory. The socket directory lives under `/run/user/1000`, which is a tmpfs: it's emptied on reboot, and DB Agent recreates each database's socket directory when it starts that database.

### Socket path

Point DB Agent at the rootless Podman socket instead of Docker's:

```diff
 docker:
-  socket: /var/run/docker.sock
+  socket: /run/user/1000/podman/podman.sock
```

### Rootless mode

Set `docker.rootless.enabled` to `true`:

```diff
 docker:
   rootless:
-    enabled: false
+    enabled: true
```

Each template sets the UID and GID its image runs the database as, for example `70` for Alpine PostgreSQL and `999` for MariaDB. As root, DB Agent `chown`s the database's data and socket directories to that UID. A normal user can't do that, so without rootless mode every database fails to start.

With rootless mode on, DB Agent starts each container with `keep-id:uid=<image_uid>,gid=<image_gid>`, which maps the image's database user onto your host user. The database runs as its usual UID inside the container, and its files are owned by you on the host. The `chown` is still attempted, and when Podman refuses it DB Agent logs `chown refused under a rootless engine` once at debug level and carries on. `docker.userns_mode` is ignored in this mode.

The stock [templates](../templates.md) work unchanged.

### Log driver

Podman doesn't support the `local` log driver DB Agent uses by default, and every database fails to start with `invalid log driver`. Switch to `json-file`:

```diff
   log_config:
-    type: local
+    type: json-file
```

### TCP congestion control

DB Agent tries to load `bbr` with `modprobe`, which a normal user can't run. A user also can't set a congestion control algorithm on a socket unless root has added it to `net.ipv4.tcp_allowed_congestion_control`. Leave the setting empty to keep the system default and skip the startup warnings:

```diff
-tcp_congestion_control: bbr
+tcp_congestion_control: ''
```

If you want BBR anyway, load it as root and allow it:

```bash
sudo modprobe tcp_bbr
sudo sysctl -w net.ipv4.tcp_allowed_congestion_control="reno cubic bbr"
```

### Ports

The default ports (`5432`, `3306`, `27017`, `6379`, and `8090` for the API) are all above 1024, so an unprivileged user can bind them. If you move any of them below 1024, lower `net.ipv4.ip_unprivileged_port_start` as root, or the listener will fail to bind.

## Test It

Run DB Agent in the foreground once:

```bash
~/.local/bin/calagopus-db-agent --config ~/.config/calagopus-db-agent/config.yml
```

It should end with `http listening on 0.0.0.0:8090`. Stop it with `Ctrl-C`.

## Install as a User Service

`calagopus-db-agent service-install` writes a system unit that runs as root, so don't use it here. Create a user unit at `~/.config/systemd/user/db-agent.service` instead:

```ini
[Unit]
Description=Calagopus DB Agent
After=podman.socket
Requires=podman.socket

[Service]
KillMode=process
LimitNOFILE=4096
RuntimeDirectory=calagopus-db-agent
RuntimeDirectoryMode=0700
RuntimeDirectoryPreserve=yes
ExecStart=%h/.local/bin/calagopus-db-agent --config %h/.config/calagopus-db-agent/config.yml
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=default.target
```

In a user unit, `RuntimeDirectory=` creates the directory under `/run/user/<UID>`, which is the `socket_dir` set above, and `%h` expands to your home directory.

Enable and start it:

```bash
systemctl --user daemon-reload
systemctl --user enable --now db-agent
systemctl --user status db-agent
```

Logs go to the user journal:

```bash
journalctl --user -u db-agent -f
```

Databases that were running when DB Agent stopped are started again when it comes back.

## Connect It to the Panel

Nothing changes on the Panel side. Add the DB Agent under the Panel's admin area with the host's address, port `8090` and the token you configured, exactly as for a root install.

## IO Weights

A template's `io_weight` needs the `io` cgroup controller. By default systemd only delegates `cpu`, `memory` and `pids` to user sessions, so a rootless database with an IO weight fails to start with:

```
preparing container ... for attach: container create failed (no logs from conmon)
```

Check what your user gets:

```bash
cat /sys/fs/cgroup/user.slice/user-$(id -u).slice/user@$(id -u).service/cgroup.subtree_control
```

If `io` isn't listed, either leave `io_weight` empty in your templates (the stock templates already do), or delegate the controller as root:

```bash
sudo mkdir -p /etc/systemd/system/user@.service.d
printf '[Service]\nDelegate=cpu cpuset io memory pids\n' | sudo tee /etc/systemd/system/user@.service.d/delegate.conf
sudo systemctl daemon-reload
```

Log the user out and back in, or reboot, for it to take effect. Even with the controller delegated, IO weights only do something on hosts whose IO scheduler enforces them (BFQ or an iocost model). DB Agent warns about this at start when it isn't the case.

## SELinux

On SELinux hosts (RHEL, AlmaLinux, Rocky, Fedora), DB Agent detects SELinux and asks Podman to relabel the bind mounts it creates with the shared `z` option, so each database container can reach its own data and socket directories. Nothing needs configuring for this.

## Full Diff

Everything changed from a default config:

```diff
-socket_dir: /run/calagopus-db-agent
+socket_dir: /run/user/1000/calagopus-db-agent
-data_dir: /var/lib/calagopus-db-agent/data
+data_dir: /home/robert/.local/share/calagopus-db-agent/data
-log_dir: /var/log/calagopus-db-agent
+log_dir: /home/robert/.local/state/calagopus-db-agent
-tcp_congestion_control: bbr
+tcp_congestion_control: ''
 database:
-  url: sqlite:///var/lib/calagopus-db-agent/data/database.db
+  url: sqlite:///home/robert/.local/share/calagopus-db-agent/data/database.db
 docker:
-  socket: /var/run/docker.sock
+  socket: /run/user/1000/podman/podman.sock
   rootless:
-    enabled: false
+    enabled: true
   log_config:
-    type: local
+    type: json-file
```
