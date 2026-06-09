# Configuration

This page is a reference for all Wings configuration options. The configuration file is located at `/etc/pterodactyl/config.yml` on Linux (the path defaults to the Pterodactyl location for migration compatibility).

## Core Configuration
### debug
Enables debug mode for Wings. When enabled, detailed logs are printed for troubleshooting.

Default value:
```yaml
debug: false
```

### app_name
A human-readable name for this Wings instance used to identify the node in log outputs.

Default value:
```yaml
app_name: Pterodactyl
```

### uuid
Unique identifier for this Wings node.

Default value:
```yaml
uuid: UUID
```

### token_id / token
Authentication credentials used by Wings to validate requests from the Panel. Must be kept secret.

Default value:
```yaml
token_id: TOKEN_ID
token: TOKEN
```


## API Settings
### api.host
The IP address Wings binds its internal API to. Alternatively, a Unix socket path can be specified here.

Default value:
```yaml
host: 0.0.0.0
```

### api.port
The port used by the Wings internal API.

Default value:
```yaml
port: 8080
```

### api.ssl.enabled
Determines whether HTTPS is enabled for the Wings API to ensure encrypted communication.

Default value:
```yaml
enabled: false
```

### api.ssl.cert
The absolute filesystem path to the SSL certificate file used for API encryption.

Default value:
```yaml
cert: ''
```

### api.ssl.key
The absolute filesystem path to the SSL private key file corresponding to the certificate.

Default value:
```yaml
key: ''
```

### api.redirects
Custom HTTP redirects for the API server (e.g. `/ → Panel URL`).

Default value:
```yaml
redirects: {}
```

### api.disable_openapi_docs
Controls the availability of the `/openapi.json` endpoint.

Default value:
```yaml
disable_openapi_docs: false
```

### api.disable_remote_download
Whether to prevent servers from downloading files directly through remote URLs via the file manager or API.

Default value:
```yaml
disable_remote_download: false
```

### api.server_remote_download_limit
The maximum number of concurrent remote file pulls (downloads via URL) allowed for a single server.

Default value:
```yaml
server_remote_download_limit: 3
```

### api.remote_download_blocked_cidrs
A security list of CIDR ranges blocked for remote downloads to prevent SSRF (Server-Side Request Forgery) attacks.

Default value:
```yaml
remote_download_blocked_cidrs:
- 127.0.0.0/8
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16
- 169.254.0.0/16
- ::1
- fe80::/10
- fc00::/7
```

### api.disable_directory_size
Whether to disable the calculation of total directory sizes in the file manager.

Default value:
```yaml
disable_directory_size: false
```

### api.directory_entry_limit
The maximum number of files/folders returned in a single `/list-directory` API call (`0` = unlimited).

Default value:
```yaml
directory_entry_limit: 10000
```

### api.send_offline_server_logs
When enabled, Wings will transmit cached logs from an offline server immediately upon a websocket connection. This only works when containers are not removed on stop.

Default value:
```yaml
send_offline_server_logs: false
```

### api.file_search_threads
The number of concurrent worker threads Wings spawns to crawl and scan through server files during a search request.

Default value:

```yaml
file_search_threads: 4
```

### api.file_copy_threads
The number of concurrent worker threads allocated for duplicating files and directories within the file manager.

Default value:
```yaml
file_copy_threads: 4
```

### api.file_decompression_threads
The number of threads used for extracting archives. Applies to `.tar.xz`, `.tar.lz`, `.zip`, `.ddup`, `.7z`.

Default value:
```yaml
file_decompression_threads: 2
```

### api.file_compression_threads
The number of threads used for creating archives. Applies to `.tar.xz`, `.tar.lz`, `.zip`, `.ddup`, `.7z`.

Default value:
```yaml
file_compression_threads: 2
```

### api.upload_limit
The maximum file size in `MiB` that can be uploaded through the web-based file manager.

Default value:
```yaml
upload_limit: 10240
```

### api.max_jwt_uses
The number of times a single JWT can be used for a download or backup before it is invalidated. This provides a security layer to prevent the reuse of temporary access tokens for file and backup downloads.

Default value:
```yaml
max_jwt_uses: 5
```

### api.trusted_proxies
A list of trusted IP addresses from proxy servers (like Cloudflare, NGINX, or a Load Balancer) that Wings uses to resolve the actual IP address of a user using the `X-Forwarded-For` or `X-Real-IP` header.

Default value:
```yaml
trusted_proxies: []
```

## System Configuration
### system.root_directory
This is the root directory where Wings stores its own persistent data (mainly state of servers so it can restore them on restart).

Default value:
```yaml
root_directory: /var/lib/pterodactyl
```

### system.log_directory
This is the directory where Wings stores its logs.

Default value:
```yaml
log_directory: /var/log/pterodactyl
```

### system.vmount_directory
This is the directory where Wings stores virtual mounts for servers. Currently mainly used for spoofing hardware UUIDs for containers. This directory **should not** be located on a tmpfs (temporary filesystem).


Default value:
```yaml
vmount_directory: /var/lib/pterodactyl/vmounts
```

### system.data
This is the directory where Wings stores server data. This is the directory that gets bind-mounted to server containers and is where all server files are stored.

Default value:
```yaml
data: /var/lib/pterodactyl/volumes
```

### system.archive_directory
This is the directory where Wings stores server archives. This is 100% unused in current code and is simply there for compatibility with Pterodactyl's codebase; it may be used in the future.

Default value:
```yaml
archive_directory: /var/lib/pterodactyl/archives
```

### system.backup_directory
This is the directory where Wings stores server backups. This applies to backups using the `Wings` backup driver; `btrfs` and `zfs` backups also use this directory for snapshots.

Default value:
```yaml
backup_directory: /var/lib/pterodactyl/backups
```

### system.tmp_directory
This is the directory where Wings stores temporary files. This is used for various temporary files that Wings needs to create during its operation.

Default value:
```yaml
tmp_directory: /tmp/pterodactyl
```

### system.username
The operating system user account that the Wings process runs under on the host.

Default value:
```yaml
username: pterodactyl
```

### system.timezone
The timezone used by Wings (e.g., `+00:00`) for logs and containers. It is auto-detected from the host, falls back to UTC if detection fails, and is passed into all created containers.

Default value:
```yaml
timezone: +00:00
```

### system.user.rootless.enabled
Enables rootless container execution, allowing Wings to run containers without requiring root privileges on the host.

Default value:
```yaml
enabled: false
```

### system.user.rootless.container_uid
The UID used inside rootless containers. This is typically set to `0` so the internal container user maps correctly to the user running Wings.

Default value:
```yaml
container_uid: 0
```

### system.user.rootless.container_gid
The GID used inside rootless containers. This is typically set to `0` so the internal container group maps correctly to the group running Wings.

Default value:
```yaml
container_gid: 0
```

### system.user.uid
The User ID (UID) on the host system that Wings uses when managing server files.

Default value:
```yaml
uid: 995
```

### system.user.gid
The Group ID (GID) on the host system that Wings uses when managing server files.

Default value:
```yaml
gid: 985
```

### system.passwd.enabled
Whether to enable dynamic generation of `/etc/passwd` files inside containers to ensure proper username resolution.

Default value:
```yaml
enabled: false
```

### system.passwd.directory
The absolute filesystem path where Wings generates and stores the dynamic passwd files.

Default value:
```yaml
directory: /run/wings/etc
```

### system.machine_id.enabled
Controls whether a unique, generated `machine-id` file should be mounted into each server container.

Default value:
```yaml
enabled: true
```

### system.disk_check_concurrency
The number of concurrent allowed disk scans Wings can perform across all servers. This limits the number of simultaneous disk usage checks to prevent excessive background resource consumption on large nodes.

Default value:
```yaml
disk_check_concurrency: 2
```

### system.disk_check_interval
Defines how often (in seconds) Wings performs incremental disk usage checks using inotify. These checks are lightweight and rely on filesystem events rather than scanning the entire disk.

Default value:
```yaml
disk_check_interval: 150
```

### system.full_disk_check_every
Number of inotify disk check intervals before performing a full disk scan. Periodic full scans prevent desync between the OS and Wings (e.g. 150s × 4 = 600s / 10 min).

Default value:
```yaml
full_disk_check_every: 4
```

### system.disk_check_use_inotify
Uses inotify for selective scanning to reduce scanning overhead of large servers. When disabled, Wings will perform a full disk scan every time instead of relying on inotify events. Disabling this can lead to increased CPU and disk usage, especially on servers with large file counts, but may be necessary in environments where inotify is unreliable or unavailable.

Default value:
```yaml
disk_check_use_inotify: true
```

### system.disk_limiter_mode
::: info
**Switching between drivers may require additional manual work**. Enabling the quota driver requires specific filesystem support (like `prjquota` on `XFS` or `ext4`) and manual mounting configurations on the host machine. If not configured correctly at the OS level, Wings will fail to start or manage disk limits.
:::

The backend driver used to enforce storage quotas on servers. Available Options:

`none`, `btrfs_subvolume`, `zfs_dataset`, `xfs_quota` or the experimental `fuse_quota`

Default value:
```yaml
disk_limiter_mode: none
```

### system.activity_send_interval
The amount of time (in seconds) that elapses between sending aggregated server activity to the Panel. Wings collects activity over this period and sends it in a single batch.

Default value:
```yaml
activity_send_interval: 60
```

### system.activity_send_count
The number of activity events to send per batch to the Panel. This limits how many collected events are transmitted during each interval.

Default value:
```yaml
activity_send_count: 100
```

### system.check_permissions_on_boot
Whether to check and correct file permissions for a server whenever its process is booted. This can cause boot delays if the server has a large amount of files.

Default value:
```yaml
check_permissions_on_boot: true
```

### system.check_permissions_on_boot_threads
The number of concurrent threads used to verify and correct file permissions (chown) during the server startup process.

Default value:
```yaml
check_permissions_on_boot_threads: 4
```

### system.websocket_log_count
The number of lines to send when a user connects to the server websocket. This provides the initial "backlog" of console history visible in the Panel.

Default value:
```yaml
websocket_log_count: 150
```


## SFTP Configuration
### system.sftp.enabled
Whether to enable the integrated SFTP (SSH) server.

Default value:
```yaml
enabled: true
```

### system.sftp.bind_address
The IP address that the internal SFTP/SSH server binds to.

Default value:
```yaml
bind_address: 0.0.0.0
```

### system.sftp.bind_port
The port that the internal SFTP/SSH server binds to for incoming connections.

Default value:
```yaml
bind_port: 2022
```

### system.sftp.read_only
Whether the SFTP server should operate in read-only mode. If enabled, users can view and download files, but cannot upload, delete, or modify any content.

Default value:
```yaml
read_only: false
```

### system.sftp.key_algorithm
The cryptographic algorithm used for generating the SSH host key.

Default value:
```yaml
key_algorithm: ssh-ed25519
```

### system.sftp.disable_password_auth
If enabled, only SSH key authentication is permitted for SFTP/SSH.

Default value:
```yaml
disable_password_auth: false
```

### system.sftp.directory_entry_limit
The maximum number of files and folders returned in a single directory listing. This prevents the SFTP server from hanging when opening folders with massive amounts of data.

Default value:
```yaml
directory_entry_limit: 20000
```

### system.sftp.directory_entry_send_amount
The number of directory entries to send in each response chunk to the SFTP client.

Default value:
```yaml
directory_entry_send_amount: 500
```

### system.sftp.limits.authentication_password_attempts
The maximum number of failed password attempts allowed within the cooldown window before the connection is dropped.

Default value:
```yaml
authentication_password_attempts: 3
```

### system.sftp.limits.authentication_pubkey_attempts
The maximum number of failed public key authentication attempts allowed within the cooldown window before the connection is dropped.

Default value:
```yaml
authentication_pubkey_attempts: 20
```

### system.sftp.limits.authentication_cooldown
Cooldown period in seconds once attempts are exceeded. This is a sliding window based on the most recent attempt. (3 failed attempts in 1min = 60s wait time from the last attempt)

Default value:
```yaml
authentication_cooldown: 60
```

### system.sftp.limits.max_connections_per_user
The maximum number of simultaneous SFTP connections allowed per user account. This prevents a single user from opening too many connections and overwhelming the server.

Default value:
```yaml
max_connections_per_user: 10
```

### system.sftp.limits.max_channels_per_connection
The maximum number of concurrent channels (e.g., SFTP sessions, shell sessions) allowed within a single SSH connection. This limits the resources consumed by a single connection.

Default value:
```yaml
max_channels_per_connection: 10
```

### system.sftp.limits.max_handles_per_channel
The maximum number of open file handles allowed per channel in the SFTP server. This prevents resource exhaustion from too many open files in a single session.

Default value:
```yaml
max_handles_per_channel: 32
```

### system.sftp.limits.max_handles_total
The maximum total number of open file handles across all channels and connections in the SFTP server. This is a global limit to prevent overall resource exhaustion.

Default value:
```yaml
max_handles_total: 1024
```

### system.sftp.shell.enabled
Determines whether to allow server management and command-line access via the Wings remote shell over SSH.

Default value:
```yaml
enabled: true
```

### system.sftp.shell.cli.name
The name used for the internal CLI tool when accessing a server via the remote shell. This is the command users type (e.g., `.wings help`) to interact with the Wings shell helper.

Default value:
```yaml
name: .wings
```

### system.sftp.activity.log_logins
Whether successful SFTP logins are recorded and displayed in the server's activity log.

Default value:
```yaml
log_logins: false
```

### system.sftp.activity.log_file_reads
Whether reading or downloading files via SFTP is recorded in the server's activity log.

Default value:
```yaml
log_file_reads: false
```

## Crash Detection
### system.crash_detection.enabled
Enables or disables the automatic crash detection system for all servers on the node.

Default value:
```yaml
enabled: true
```

### system.crash_detection.detect_clean_exit_as_crash
Whether to treat a "clean" exit (an exit code of `0`) as a server crash.

Default value:
```yaml
detect_clean_exit_as_crash: true
```

### system.crash_detection.timeout
The amount of time in seconds, that Wings waits after a server process stops before determining it has crashed and attempting a restart.

Default value:
```yaml
timeout: 60
```


## File History Configuration
### system.file_history.enabled
Enables or disables the file history tracking system. When enabled, Wings records a diff-based changelog of edits made to server files through the file manager and SFTP, allowing users to view and restore previous versions.

Default value:
```yaml
enabled: true
```

### system.file_history.zstd_level
The [Zstandard](https://facebook.github.io/zstd/) compression level used when storing snapshots and delta entries in the history database. Higher values produce smaller stored history at the cost of more CPU time. Valid range is `1`–`22`.

Default value:
```yaml
zstd_level: 19
```

### system.file_history.anchor_interval
The number of delta (diff) entries written in a chain before Wings stores a full snapshot (anchor) instead. A lower value creates anchors more frequently, making history reconstruction faster at the cost of more disk space.

Default value:
```yaml
anchor_interval: 4
```

### system.file_history.keep_chains
The number of diff chains to retain per file. Once a new chain is started (after an anchor), older chains beyond this count are pruned. Increasing this retains more history depth.

Default value:
```yaml
keep_chains: 2
```

### system.file_history.file_size_cap
The maximum size (in bytes) of file content that Wings will read and track through the HTTP file manager. File writes whose pre-write or post-write content exceeds this size are silently skipped and not recorded in history.

Default value:
```yaml
file_size_cap: 1048576
```

### system.file_history.per_file_disk_budget
The maximum amount of disk space (in bytes) that the history database may use for a single file. When exceeded, Wings drops the oldest diff chains for that file until the budget is met.

Default value:
```yaml
per_file_disk_budget: 5242880
```

### system.file_history.per_server_disk_budget
The maximum total disk space (in bytes) that the history database may use across all files for a single server. When exceeded, Wings drops the globally oldest diff chains until the budget is met.

Default value:
```yaml
per_server_disk_budget: 209715200
```

### system.file_history.maintenance_interval
The interval (in seconds) between background maintenance runs that clean up stale history entries and enforce disk budgets.

Default value:
```yaml
maintenance_interval: 3600
```

## Backups Configuration
### system.backups.write_limit
The maximum disk write speed (in `MiB/s`) for creating backups. This prevents restoration processes from saturating the disk I/O and slowing down the rest of the node (`0` = unlimited).

Default value:
```yaml
write_limit: 0
```

### system.backups.read_limit
The maximum disk read speed (in `MiB/s`) when restoring backups. Prevents backups from slowing down the rest of the node (`0` = unlimited).

Default value:
```yaml
read_limit: 0
```

### system.backups.compression_level
Defines the CPU vs. compression ratio. Higher compression saves disk space but uses more CPU (`best_speed` = fastest, `best_compression` = smallest file). Available options:

`best_speed`, `good_speed`, `good_compression`, `best_compression`

Default value:
```yaml
compression_level: best_speed
```

### system.backups.mounting.enabled
Allows users to browse and interact with backup contents directly via the File Manager without needing to download them first.

Default value:
```yaml
enabled: true
```

### system.backups.mounting.path
The path prefix used for the virtual backup mount (e.g., `.backups/<uuid>`).

Default value:
```yaml
path: .backups
```

### system.backups.wings.create_threads
The number of CPU threads used when compressing local backups. This applies specifically to `.tar.gz`, `.tar.xz`, `.tar.lz`, `.tar.zst`, and `.7z`.

Default value:
```yaml
create_threads: 4
```

### system.backups.wings.restore_threads
The number of CPU threads used for extracting local backup archives. This applies specifically to `.tar.xz`, `.tar.lz`, `.zip`, `.ddup` and `.7z`.

Default value:
```yaml
restore_threads: 4
```

### system.backups.wings.archive_format
The compression format used for local backups. Available options:

`tar`, `tar_gz`, `tar_xz`, `tar_lzip`, `tar_bz2`, `tar_lz4`, `tar_zstd`, `zip`, `seven_zip`

Default value:
```yaml
archive_format: tar_gz
```

### system.backups.s3.create_threads
The number of threads used when creating a `.gz` S3 backup.

Default value:
```yaml
create_threads: 4
```

### system.backups.s3.part_upload_timeout
The maximum time (in seconds) to wait for a single part of a multipart upload.
Default value:
```yaml
part_upload_timeout: 7200
```

### system.backups.s3.retry_limit
The number of retry attempts for each failed upload part.

Default value:
```yaml
retry_limit: 10
```

### system.backups.ddup_bak.create_threads
The number of threads used for `ddup-bak` backup creation.

Default value:
```yaml
create_threads: 4
```

### system.backups.ddup_bak.compression_format
The compression format used for each `ddup-bak` chunk. Available Options:

`none`, `deflate`, `gzip`, `brotli`

Default value:
```yaml
compression_format: deflate
```

### system.backups.restic.repository
::: info
All restic options only apply when using Pterodactyl. On Calagopus, restic is fully managed by the panel, and these local configuration settings are ignored.
:::

The Restic repository path used for backups. This must already be initialized and can be overridden by the panel.

Default value:
```yaml
repository: /var/lib/pterodactyl/backups/restic
```

### system.backups.restic.password_file
The local path to the file containing the Restic repository password used for authentication. This can be overridden by the panel.

Default value:
```yaml
password_file: /var/lib/pterodactyl/backups/restic_password
```

### system.backups.restic.retry_lock_seconds
The amount of time (in seconds) Wings will wait if the Restic repository is locked by another process before failing the backup task. This can be overridden by the panel.

Default value:
```yaml
retry_lock_seconds: 60
```

### system.backups.restic.environment
The environment variables passed to the restic process for authentication and configuration. This can be overridden by the panel.

Default value:
```yaml
environment: {}
```

### system.backups.btrfs.restore_threads
The number of threads used for restoring Btrfs snapshots. Each thread processes one file, so with 4 threads, up to 4 files are restored concurrently.

Default value:
```yaml
restore_threads: 4
```

### system.backups.btrfs.create_read_only
Whether to create read-only snapshots to prevent data modification after the backup is taken.

Default value:
```yaml
create_read_only: true
```

### system.backups.zfs.restore_threads
The number of threads used for restoring ZFS snapshots. Each thread processes one file, so with 4 threads, up to 4 files are restored concurrently.

Default value:
```yaml
restore_threads: 4
```

## Transfers
### system.transfers.download_limit
The download rate limit for transfers in MiB/s (`0` = unlimited).

Default value:
```yaml
download_limit: 0
```

## Docker Configuration
### docker.socket
The path to the Docker daemon socket or HTTP address.

Default value:
```yaml
socket: /var/run/docker.sock
```

### docker.server_name_in_container_name
Whether to include the server's name within the Docker container name for easier identification in tools like `docker ps`.

Default value:
```yaml
server_name_in_container_name: false
```

### docker.delete_container_on_stop
When enabled, containers are deleted as soon as a server stops, is killed, or crashes. This significantly reduces long-term CPU/resource overhead.

Default value:
```yaml
delete_container_on_stop: true
```

### docker.network.interface
The specific IP interface used for the Docker network bridge.

Default value:
```yaml
interface: 172.18.0.1
```

### docker.network.disable_interface_binding
Whether to disable binding containers to a specific network interface on the host.

Default value:
```yaml
disable_interface_binding: false
```

### docker.network.dns
The list of DNS servers used by containers for name resolution.

Default value:
```yaml
dns:
- 1.1.1.1
- 1.0.0.1
```

### docker.network.name
The name of the Docker network used by Wings to manage container communication.

Default value:
```yaml
name: pterodactyl_nw
```

### docker.network.ispn
The flag that determines if the Docker network used by Wings is "internal", meaning it has no access to the external internet.

Default value:
```yaml
ispn: false
```

### docker.network.driver
The Docker network driver used for the container network (e.g. `bridge`). 

Default value:
```yaml
driver: bridge
```

### docker.network.mode
The internal network mode identifier used by the Docker daemon.

Default value:
```yaml
mode: pterodactyl_nw
```

### docker.network.is_internal
Whether to mark the network as internal-only, restricting containers from accessing the outside internet.

Default value:
```yaml
is_internal: false
```

### docker.network.enable_icc
Enables Inter-Container Communication, allowing containers on the same network to talk to one another.

Default value:
```yaml
enable_icc: true
```

### docker.network.network_mtu
Sets the Maximum Transmission Unit (MTU) size for the container network.

Default value:
```yaml
network_mtu: 1500
```

### docker.network.interfaces.v4.subnet
The IPv4 subnet range used by the Docker network.

Default value:
```yaml
subnet: 172.18.0.0/16
```

### docker.network.interfaces.v4.gateway
The IPv4 gateway address for the Docker network. This will automatically be incremented if the address is already in use by another network on the host.

Default value:
```yaml
gateway: 172.18.0.1
```

### docker.network.interfaces.v6.subnet
The IPv6 subnet range used by the Docker network.

Default value:
```yaml
subnet: fdba:17c8:6c94::/64
```

### docker.network.interfaces.v6.gateway
The IPv6 gateway address for the Docker network.

Default value:
```yaml
gateway: fdba:17c8:6c94::1011
```

### docker.domainname
The domain name assigned to containers, useful for internal networking resolution.

Default value:
```yaml
domainname: ''
```

### docker.registries
The Docker registry authentication configurations used for pulling private images.

Default value:
```yaml
registries: {}
```

### docker.tmpfs_size
The size (in `MiB`) of the `/tmp` directory mounted as a tmpfs in containers.

Default value:
```yaml
tmpfs_size: 100
```

### docker.container_pid_limit
The maximum number of processes (PIDs) allowed to run simultaneously within a single container.

Default value:
```yaml
container_pid_limit: 5120
```

### docker.container_apply_seccomp
Whether to apply a modified seccomp profile with additional syscalls toggled from the panel, this can break on podman.

Default value:
```yaml
container_apply_seccomp: true
```

### docker.installer_limits.timeout
The maximum time (in seconds) allowed for an installation container to run before it is considered failed (`0` = no limit).

Default value:
```yaml
timeout: 1800
```

### docker.installer_limits.memory
The memory limit (in `MiB`) for installer containers. This will be overwritten with the server's memory limit **if it is higher**.

Default value:
```yaml
memory: 1024
```

### docker.installer_limits.cpu
The CPU limit (`%`) for installer containers. This will be overwritten with the server's CPU limit **if it is higher**.

Default value:
```yaml
cpu: 100
```

### docker.overhead.override
The toggle to enable or disable custom memory overhead multipliers.

Default value:
```yaml
override: false
```

### docker.overhead.default_multiplier
The default multiplier applied to a server's memory limit to account for Docker container overhead.

Default value:
```yaml
default_multiplier: 1.05
```

### docker.overhead.multipliers
Map of memory thresholds to multipliers.
A map of specific memory thresholds to custom multipliers, allowing for granular overhead control based on server size.

Default value:
```yaml
multipliers: {}
```

### docker.userns_mode
The user namespace mode for containers, used to isolate container users from host users for enhanced security.

Default value:
```yaml
userns_mode: ''
```

### docker.log_config.type
The Docker logging driver type used to capture and store container output.

Default value:
```yaml
type: local
```

### docker.log_config.config.compress
Whether to enable compression for stored log files to save disk space.

Default value:
```yaml
compress: 'false'
```

### docker.log_config.config.max-file
The maximum number of log files to retain before the oldest ones are rotated out.

Default value:
```yaml
max-file: '1'
```

### docker.log_config.config.max-size
The maximum size allowed for a single log file before it is rotated.

Default value:
```yaml
max-size: 5m
```

### docker.log_config.config.mode
The delivery mode for logs (e.g. `non-blocking`), determining how Docker handles log data when the buffer is full. 

Default value:
```yaml
mode: non-blocking
```

## Backups & Throttles
### throttles.enabled
The toggle to enable or disable console output throttling for all containers.

Default value:
```yaml
enabled: true
```

### throttles.lines
The maximum number of console lines stored in the buffer for each server.

Default value:
```yaml
lines: 2000
```

### throttles.line_reset_interval
The interval (in seconds) at which the console line counters are reset.

Default value:
```yaml
line_reset_interval: 100
```

## Remote Configuration
### remote
The URL of the Panel instance that this Wings node communicates with.

Default value:
```yaml
remote: https://panel.example.com
```

### remote_headers
Custom HTTP headers that Wings includes in every outgoing HTTP request to the Panel.

Default value:
```yaml
remote_headers: {}
```

### remote_query.timeout
The maximum number of retries for critical API requests. This uses an exponential backoff strategy.

Default value:
```yaml
timeout: 30
```

### remote_query.boot_servers_per_page
The number of servers Wings requests from the Panel API in a single batch during the initial boot sequence.

Default value:
```yaml
boot_servers_per_page: 50
```

### remote_query.retry_limit
The maximum number of times Wings will attempt to re-send a failed request to the Panel before giving up.

Default value:
```yaml
retry_limit: 10
```

## Security / Behaviour Flags
### allowed_mounts
A security whitelist defining which specific directories or files on the host system are permitted to be mounted into a server's Docker container.

Default value:
```yaml
allowed_mounts: []
```

### allowed_origins
A list of specific URLs (origins) that are permitted to make cross-origin requests to the Wings API. By default, the URL defined in the `remote:` setting is the only allowed origin.

Default value:
```yaml
allowed_origins: []
```

### allow_cors_private_network
Determines whether Wings permits Cross-Origin Resource Sharing (CORS) requests originating from private network addresses.

Default value:
```yaml
allow_cors_private_network: false
```

### ignore_panel_config_updates
When set to `true`, Wings will ignore configuration update commands sent by the Panel.

Default value:
```yaml
ignore_panel_config_updates: false
```

### ignore_panel_wings_upgrades
When set to `true`, Wings will ignore remote upgrade commands sent by the Panel.

Default value:
```yaml
ignore_panel_wings_upgrades: false
```


## SSL Configuration

::: info
This section assumes you have already generated certificates using Certbot. Replace `<domain>` with your actual node domain.
:::

### Enabling SSL
By default, the SSL setting is disabled. To secure your Wings communication, change `enabled: false` to `true` and provide the paths to your certificate files.

If you are using Let's Encrypt, your configuration block should be updated to look like this:
```yaml
api:
  host: 0.0.0.0
  port: 8080
  ssl:
    enabled: true
    cert: /etc/letsencrypt/live/<domain>/fullchain.pem
    key: /etc/letsencrypt/live/<domain>/privkey.pem
```

### Applying Changes
After saving your changes to `config.yml`, you must restart the Wings service for the new SSL configuration to take effect:
```bash
sudo systemctl restart wings
```


## Example Config
The following is an example of a standard generated `config.yml` for Wings with standard values:

```yaml
debug: false
app_name: Pterodactyl
uuid: UUID
token_id: TOKEN_ID
token: TOKEN
api:
  host: 0.0.0.0
  port: 8080
  ssl:
    enabled: false
    cert: ''
    key: ''
  redirects: {}
  disable_openapi_docs: false
  disable_remote_download: false
  server_remote_download_limit: 3
  remote_download_blocked_cidrs:
  - 127.0.0.0/8
  - 10.0.0.0/8
  - 172.16.0.0/12
  - 192.168.0.0/16
  - 169.254.0.0/16
  - ::1
  - fe80::/10
  - fc00::/7
  disable_directory_size: false
  directory_entry_limit: 10000
  send_offline_server_logs: false
  file_search_threads: 4
  file_copy_threads: 4
  file_decompression_threads: 2
  file_compression_threads: 2
  upload_limit: 10240
  max_jwt_uses: 5
  trusted_proxies: []
system:
  root_directory: /var/lib/pterodactyl
  log_directory: /var/log/pterodactyl
  vmount_directory: /var/lib/pterodactyl/vmounts
  data: /var/lib/pterodactyl/volumes
  archive_directory: /var/lib/pterodactyl/archives
  backup_directory: /var/lib/pterodactyl/backups
  tmp_directory: /tmp/pterodactyl
  username: pterodactyl
  timezone: +00:00
  user:
    rootless:
      enabled: false
      container_uid: 0
      container_gid: 0
    uid: 995
    gid: 985
  passwd:
    enabled: false
    directory: /run/wings/etc
  machine_id:
    enabled: true
  disk_check_interval: 150
  full_disk_check_every: 6
  disk_check_use_inotify: true
  disk_limiter_mode: none
  activity_send_interval: 60
  activity_send_count: 100
  check_permissions_on_boot: true
  check_permissions_on_boot_threads: 4
  websocket_log_count: 150
  sftp:
    enabled: true
    bind_address: 0.0.0.0
    bind_port: 2022
    read_only: false
    key_algorithm: ssh-ed25519
    disable_password_auth: false
    directory_entry_limit: 20000
    directory_entry_send_amount: 500
    limits:
      authentication_password_attempts: 3
      authentication_pubkey_attempts: 20
      authentication_cooldown: 60
      max_connections_per_user: 10
      max_channels_per_connection: 10
      max_handles_per_channel: 32
      max_handles_total: 1024
    shell:
      enabled: true
      cli:
        name: .wings
    activity:
      log_logins: false
      log_file_reads: false
  crash_detection:
    enabled: true
    detect_clean_exit_as_crash: true
    timeout: 60
  file_history:
    enabled: true
    zstd_level: 19
    anchor_interval: 4
    keep_chains: 2
    file_size_cap: 1048576
    per_file_disk_budget: 5242880
    per_server_disk_budget: 209715200
    maintenance_interval: 3600
  backups:
    write_limit: 0
    read_limit: 0
    compression_level: best_speed
    mounting:
      enabled: true
      path: .backups
    wings:
      create_threads: 4
      restore_threads: 4
      archive_format: tar_gz
    s3:
      create_threads: 4
      part_upload_timeout: 7200
      retry_limit: 10
    ddup_bak:
      create_threads: 4
      compression_format: deflate
    restic:
      repository: /var/lib/pterodactyl/backups/restic
      password_file: /var/lib/pterodactyl/backups/restic_password
      retry_lock_seconds: 60
      environment: {}
    btrfs:
      restore_threads: 4
      create_read_only: true
    zfs:
      restore_threads: 4
  transfers:
    download_limit: 0
docker:
  socket: /var/run/docker.sock
  server_name_in_container_name: false
  delete_container_on_stop: true
  network:
    interface: 172.18.0.1
    disable_interface_binding: false
    dns:
    - 1.1.1.1
    - 1.0.0.1
    name: pterodactyl_nw
    ispn: false
    driver: bridge
    mode: pterodactyl_nw
    is_internal: false
    enable_icc: true
    network_mtu: 1500
    interfaces:
      v4:
        subnet: 172.18.0.0/16
        gateway: 172.18.0.1
      v6:
        subnet: fdba:17c8:6c94::/64
        gateway: fdba:17c8:6c94::1011
  domainname: ''
  registries: {}
  tmpfs_size: 100
  container_pid_limit: 5120
  installer_limits:
    timeout: 1800
    memory: 1024
    cpu: 100
  overhead:
    override: false
    default_multiplier: 1.05
    multipliers: {}
  userns_mode: ''
  log_config:
    type: local
    config:
      compress: 'false'
      max-file: '1'
      max-size: 5m
      mode: non-blocking
throttles:
  enabled: true
  lines: 2000
  line_reset_interval: 100
remote: https://panel.example.com
remote_headers: {}
remote_query:
  timeout: 30
  boot_servers_per_page: 50
  retry_limit: 10
allowed_mounts: []
allowed_origins: []
allow_cors_private_network: false
ignore_panel_config_updates: false
ignore_panel_wings_upgrades: false
```
