# Running Wings with Podman

Wings communicates with a container runtime through the Docker API. Podman exposes a compatible socket, so Wings works with Podman out of the box with a few configuration changes. This guide covers both **rootful** (running as root) and **rootless** (running as a normal user) Podman setups.

## Before You Start

Make sure the Podman socket is running before Wings starts. For rootful Podman, enable the system socket service:

```bash
sudo systemctl enable --now podman.socket
```

For rootless Podman, enable it as your user:

```bash
systemctl --user enable --now podman.socket
```

## Changes Common to Both Modes

Regardless of whether you're running rootful or rootless, three settings must be changed from the Wings defaults.

### Socket path

The Docker default is `/var/run/docker.sock`. Point it at the Podman socket instead:

::::tabs
=== Rootful

```diff
 docker:
-  socket: /var/run/docker.sock
+  socket: /run/podman/podman.sock
```

=== Rootless

```diff
 docker:
-  socket: /var/run/docker.sock
+  socket: /run/user/1000/podman/podman.sock
```

Replace `1000` with your actual user ID (`id -u`).
::::

### Log driver

Podman does not support the `local` log driver that Wings uses by default. Switch to `json-file`:

```diff
   log_config:
-    type: local
+    type: json-file
```

### Seccomp profile

The default seccomp profile can break under Podman. Disable it:

```diff
-  container_apply_seccomp: true
+  container_apply_seccomp: false
```

## Rootful Podman

In rootful mode, Podman runs as root. Wings configuration is essentially unchanged from a standard Docker setup - the only differences are the three above. Your `system.user` block stays at defaults (rootless disabled, UID/GID set to whatever user Wings runs as).

A minimal rootful Podman diff from a default Wings config:

```diff
 docker:
-  socket: /var/run/docker.sock
+  socket: /run/podman/podman.sock
-  container_apply_seccomp: true
+  container_apply_seccomp: false
   log_config:
-    type: local
+    type: json-file
```

## Rootless Podman

In rootless mode, Podman runs entirely under your user account without any root privileges. Wings needs to know this so it can map file ownership and container user namespaces correctly.

### Enable rootless mode in Wings

Set `system.user.rootless.enabled` to `true`:

```diff
   user:
     rootless:
-      enabled: false
+      enabled: true
```

::: info
When `rootless.enabled` is `true`, Wings automatically fills in `container_uid`, `container_gid`, `system.user.uid`, `system.user.gid`, `system.username`, and `docker.userns_mode` from the user Wings is running as. You do not need to set any of these manually - they will be written into `config.yml` on the next start.
:::

### File paths

In rootless mode, Wings cannot write to system directories. Point all paths to somewhere your user owns, typically under your home directory:

```diff
 system:
-  root_directory: /var/lib/pterodactyl
+  root_directory: /home/robert/pterodactyl
-  log_directory: /var/log/pterodactyl
+  log_directory: /home/robert/pterodactyl/logs
-  vmount_directory: /var/lib/pterodactyl/vmounts
+  vmount_directory: /home/robert/pterodactyl/vmounts
-  data: /var/lib/pterodactyl/volumes
+  data: /home/robert/pterodactyl/volumes
-  archive_directory: /var/lib/pterodactyl/archives
+  archive_directory: /home/robert/pterodactyl/archives
-  backup_directory: /var/lib/pterodactyl/backups
+  backup_directory: /home/robert/pterodactyl/backups
```

### Disk limiters

Most disk limiters require root to set up subvolumes or quotas. If you are not using a disk limiter, set `disk_limiter_mode` to `none`:

```diff
-  disk_limiter_mode: btrfs_subvolume
+  disk_limiter_mode: none
```

::: warning
Without a disk limiter, Wings cannot enforce per-server disk quotas. If you need disk enforcement in a rootless setup, look into user-level `fuse_quota` instead, though it is currently experimental.
:::

## Full Diff: Rootful vs. Rootless

The following shows the differences between a rootful and rootless Podman config, assuming both start from the same base. Lines marked `-` apply to rootful only; lines marked `+` apply to rootless.

```diff
 system:
-  root_directory: /var/lib/pterodactyl
+  root_directory: /home/robert/pterodactyl
-  log_directory: /var/log/pterodactyl
+  log_directory: /home/robert/pterodactyl/logs
-  vmount_directory: /var/lib/pterodactyl/vmounts
+  vmount_directory: /home/robert/pterodactyl/vmounts
-  data: /var/lib/pterodactyl/volumes
+  data: /home/robert/pterodactyl/volumes
-  archive_directory: /var/lib/pterodactyl/archives
+  archive_directory: /home/robert/pterodactyl/archives
-  backup_directory: /var/lib/pterodactyl/backups
+  backup_directory: /home/robert/pterodactyl/backups
   user:
     rootless:
-      enabled: false
+      enabled: true
-  disk_limiter_mode: btrfs_subvolume
+  disk_limiter_mode: none
 docker:
-  socket: /run/podman/podman.sock
+  socket: /run/user/1000/podman/podman.sock
```

Both rootful and rootless share these changes from the Wings defaults:

```yaml
docker:
  container_apply_seccomp: false
  log_config:
    type: json-file
```
