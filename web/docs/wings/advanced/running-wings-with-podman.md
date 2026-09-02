---
prev: true
next: false
description: Run Wings with Podman instead of Docker, covering socket setup and the configuration changes needed for rootful and rootless Podman.
---

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
When `rootless.enabled` is `true`, Wings fills in `system.username`, `system.user.uid`, and `system.user.gid` from the user Wings is running as, and derives `docker.userns_mode` as `keep-id:uid=<container_uid>,gid=<container_gid>`. These are written into `config.yml` on the next start.

`container_uid` and `container_gid` are **not** filled in for you - they stay at whatever you set, defaulting to `0`. If you set `docker.userns_mode` yourself it is left alone, so you can opt out of the derived mapping.
:::

### Container UID and GID

`container_uid` and `container_gid` decide which UID the server process runs as inside the container. Either of the two common values works, as long as it matches the user namespace mapping:

- **`0`** - the server runs as container root, which the default rootless mapping already points at your host user. This is the simplest option and the default.
- **your host UID** (`id -u`) - the server runs as that UID inside the container, and the derived `keep-id` mapping points it back at your host user.

Both end up with server files owned by your user on the host. Do not set these to a UID that nothing maps to, or containers will see the server directory as owned by `nobody` and be unable to enter it.

### File ownership

Wings chowns server files to `system.user.uid`/`system.user.gid`, which in rootless mode is the user Wings itself runs as, so the chown succeeds as a no-op and still reconciles anything an installer left behind as a different owner.

If the chown is refused - which happens when `system.user.uid` does not match the UID Wings actually runs as - Wings logs a single debug line per server and leaves ownership as written rather than failing the operation. If servers behave oddly and you see `chown refused under a rootless engine` in the logs, that mismatch is what to fix.

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

## SELinux

On SELinux hosts - RHEL, AlmaLinux, Rocky, Fedora - every container is confined with its own MCS category pair, and a container is denied access to files carrying a different container's categories no matter what their ownership or permissions are.

Wings detects SELinux and asks the engine to relabel the bind mounts it creates with the shared `z` option, so server, installer and script containers can all reach their own volumes. Kernel filesystems (`/dev`, `/proc`, `/sys`) are never relabelled. Nothing changes on hosts without SELinux.

### Running Wings itself in a container

If you run Wings in a container, be careful which relabel option you give its data volume. Uppercase `Z` stamps the directory with the **Wings container's private categories**, which then locks out every server container Wings creates - installs fail with `cd: /mnt/server: Permission denied` and servers fail with `cd: /home/container: Permission denied`, while the file manager keeps working because Wings itself still has access.

Use lowercase `z`, which applies the shared label:

```diff
 volumes:
-  - "./wings/data:/var/lib/calagopus-wings:rw,Z,U"
+  - "./wings/data:/var/lib/calagopus-wings:rw,z,U"
```

If a directory was already stamped with the private label, clear it once:

```bash
chcon -R -t container_file_t -l s0 ./wings/data
```

::: warning
Also make sure `WINGS_UID` and `WINGS_GID` match the user the Wings container runs as. Wings takes its ownership settings from those environment variables when containerized, and if they disagree with the actual process UID, every chown is refused.
:::
