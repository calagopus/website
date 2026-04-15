
::: info
⚠️ **PAGE UNDER CONSTRUCTION** ⚠️

This section is currently being drafted. Some configuration options and troubleshooting steps may be missing or incomplete.
:::

# Configuration
This page covers all the configuration options for the Calagopus Wings Daemon, including how to set up and manage these configurations. It also includes troubleshooting tips for common configuration issues.

## Core Configuration
### debug
Enables debug mode for Wings. When enabled, detailed logs are printed for troubleshooting.

Default value:
```yaml
debug: false
```

### app_name
Human-readable name of this Wings instance, shown in logs.

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
The IP address Wings binds its internal API to.

Default value:
```yaml
host: 0.0.0.0
```

### api.port
The port used by the Wings internal API.

Default value:
```yaml
test
```

### api.ssl.enabled
Enables HTTPS for the Wings API.

Default value:
```yaml
enabled: false
```

### api.ssl.cert
Path to the SSL certificate file.

Default value:
```yaml
cert: ''
```

### api.ssl.key
Path to the SSL private key file.

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
disable_openapi_docs: true
```

### api.disable_remote_download
Prevents servers from downloading files via remote URLs.

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
Disables directory size calculation in file listings.

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
When enabled, Wings will transmit cached logs from an offline server immediately upon a websocket connection.

Default value:
```yaml
send_offline_server_logs: false
```

### api.file_search_threads
Number of threads used for file search operations.
Default value:

```yaml
file_search_threads: 4
```

### api.file_copy_threads
Number of Threads used for directory and file duplication.

Default value:
```yaml
file_copy_threads: 4
```

### api.file_decompression_threads
Number of threads used for decompressing archives (`.zip`, `.7z`, `.ddup` etc.).

Default value:
```yaml
file_decompression_threads: 2
```

### api.file_compression_threads
Number of threads used for compressing archives (`.zip`, `.7z`, `.ddup` etc.)

Default value:
```yaml
file_compression_threads: 2
```

### api.upload_limit
Maximum upload size in `MB` for the web file manager.

Default value:
```yaml
upload_limit: 10240
```

### api.max_jwt_uses
The number of times a single JWT can be used for a download/backup before it expires.

Default value:
```yaml
max_jwt_uses: 5
```

### api.trusted_proxies
List of trusted proxy IPs used for real IP resolution.

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
This is the directory where Wings stores virtual mounts for servers. Currently mainly used for spoofing hardware UUIDs for containers.

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
System user that Wings runs under.

Default value:
```yaml
username: pterodactyl
```

### system.timezone
Timezone used by Wings (e.g. `+00:00`).

Default value:
```yaml
timezone: +00:00
```

### system.user.rootless.enabled
Enables rootless container execution.

Default value:
```yaml
enabled: false
```

### system.user.rootless.container_uid
UID used inside rootless containers.

Default value:
```yaml
container_uid: 0
```

### system.user.rootless.container_gid
GID used inside rootless containers.

Default value:
```yaml
container_gid: 0
```

### system.user.uid
Host system UID used by Wings.

Default value:
```yaml
uid: 995
```

### system.user.gid
Host system GID used by Wings.

Default value:
```yaml
gid: 985
```

### system.passwd.enabled
Enables dynamic passwd generation for containers.

Default value:
```yaml
enabled: false
```

### system.passwd.directory
Directory where passwd files are generated.

Default value:
```yaml
directory: /run/wings/etc
```

### system.disk_check_interval
Defines how often (in seconds) Wings performs incremental disk usage checks using inotify. These checks are lightweight and rely on filesystem events rather than scanning the entire disk.

Default value:
```yaml
disk_check_interval: 150
```

### system.full_disk_check_every
Number of inotify disk check intervals before performing a full disk scan. Periodic full scans prevent desync between the OS and Wings (e.g. 150s × 6 = 900s / 15 min).

Default value:
```yaml
full_disk_check_every: 6
```

### system.disk_check_use_inotify
Uses inotify for selective scanning to reduce overhead.

Default value:
```yaml
disk_check_use_inotify: true
```

### system.disk_limiter_mode
The backend driver for enforcing storage quotas. Available Options:

`none`, `btrfs_subvolume`, `zfs_dataset`, `xfs_quota` or the experimental `fuse_quota`

Default value:
```yaml
disk_limiter_mode: none
```

### system.activity_send_interval
Interval (seconds) between sending activity updates to Panel.

Default value:
```yaml
activity_send_interval: 60
```

### system.activity_send_count
Maximum number of activity events sent per interval.

Default value:
```yaml
activity_send_count: 100
```

### system.check_permissions_on_boot
Runs permission correction on startup.

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
Number of log lines kept for websocket streaming.

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
IP address the SFTP server binds to.

Default value:
```yaml
bind_address: 0.0.0.0
```

### system.sftp.bind_port
Port used for SFTP connections.

Default value:
```yaml
bind_port: 2022
```

### system.sftp.read_only
Makes SFTP access read-only.

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
Maximum directory entries returned.

Default value:
```yaml
directory_entry_limit: 20000
```

### system.sftp.directory_entry_send_amount
Number of entries sent per response chunk.

Default value:
```yaml
directory_entry_send_amount: 500
```

### system.sftp.limits.authentication_password_attempts
Maximum failed password tries within the cooldown window.

Default value:
```yaml
authentication_password_attempts: 3
```

### system.sftp.limits.authentication_pubkey_attempts
Maximum failed key-based tries within the cooldown window.

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

### system.sftp.shell.enabled
Allows server management via the Wings remote shell over SSH.

Default value:
```yaml
enabled: true
```

### system.sftp.shell.cli.name
The name of the internal CLI tool used within the shell (e.g., `.wings help`)

Default value:
```yaml
name: .wings
```

### system.sftp.activity.log_logins
Whether successful SFTP logins appear in the server activity log.

Default value:
```yaml
log_logins: false
```

### system.sftp.activity.log_file_reads
Whether reading files via SFTP is logged in activity.

Default value:
```yaml
log_file_reads: false
```

## Crash Detection
### system.crash_detection.enabled
Enables crash detection for servers.

Default value:
```yaml
enabled: true
```

### system.crash_detection.detect_clean_exit_as_crash
Treats clean exits as crashes if enabled.

Default value:
```yaml
detect_clean_exit_as_crash: true
```

### system.crash_detection.timeout
Time (seconds) before a server is considered crashed.

Default value:
```yaml
timeout: 60
```


## Backups Configuration
### system.backups.write_limit
Write speed limit for backups (`0` = unlimited).

Default value:
```yaml
write_limit: 0
```

### system.backups.read_limit
Read speed limit for backups (`0` = unlimited).

Default value:
```yaml
read_limit: 0
```

### system.backups.compression_level
Defines the CPU vs. Compression ratio. Available options:

`best_speed`, `good_speed`, `good_compression`, `best_compression`

Default value:
```yaml
compression_level: best_speed
```

### system.backups.mounting.enabled
Allows users to browse and interact with backup contents via the File Manager.

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
Threads used for creating local backups (`.gz`, `.xz`, `.7z` etc.)

Default value:
```yaml
create_threads: 4
```

### system.backups.wings.restore_threads
Threads used for extracting local zip backups.

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
The amount of Threads used when creating a `.gz` S3 backup.

Default value:
```yaml
create_threads: 4
```

### system.backups.s3.part_upload_timeout
Maximum time (seconds) to wait for a single part of a multipart upload.

Default value:
```yaml
part_upload_timeout: 7200
```

### system.backups.s3.retry_limit
Number of retry attempts for failed upload parts.

Default value:
```yaml
retry_limit: 10
```

### system.backups.ddup_bak.create_threads
Threads used for `ddup-bak` backup creation.

Default value:
```yaml
create_threads: 4
```

### system.backups.ddup_bak.compression_format
Compression format used for each `ddup-bak` chunk. Available Options:

`none`, `deflate`, `gzip`, `brotli`

Default value:
```yaml
compression_format: deflate
```

### system.backups.restic.repository
The Restic repository path used for backups. Must already be initialized and can be overridden by the panel.

Default value:
```yaml
repository: /var/lib/pterodactyl/backups/restic
```

### system.backups.restic.password_file
Path to the Restic repository password file used for authentication (can be overridden by the panel).

Default value:
```yaml
password_file: /var/lib/pterodactyl/backups/restic_password
```

### system.backups.restic.retry_lock_seconds
Time to wait if the repository is currently locked by another process (can be overridden by the panel).

Default value:
```yaml
retry_lock_seconds: 60
```

### system.backups.restic.environment
Environment variables passed to restic.

Default value:
```yaml
environment: {}
```

### system.backups.btrfs.restore_threads
Threads used for restoring BTRFS snapshots.

Default value:
```yaml
restore_threads: 4
```

### system.backups.btrfs.create_read_only
Creates read-only snapshots.

Default value:
```yaml
create_read_only: true
```

### system.backups.zfs.restore_threads
Threads used for restoring ZFS snapshots.

Default value:
```yaml
restore_threads: 4
```

## Transfers
### system.transfers.download_limit
Download rate limit for transfers (`0` = unlimited).

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
Includes server name in container names.

Default value:
```yaml
server_name_in_container_name: false
```

### docker.delete_container_on_stop
When enabled, containers are deleted as soon as a server is stops, is killed, or crashes. This significantly reduces long-term CPU/resource overhead.

Default value:
```yaml
delete_container_on_stop: true
```

### docker.network.interface
IP interface used for Docker network bridge.

Default value:
```yaml
interface: 172.18.0.1
```

### docker.network.disable_interface_binding
Disables binding containers to a specific interface.

Default value:
```yaml
disable_interface_binding: false
```

### docker.network.dns
DNS servers used inside containers.

Default value:
```yaml
dns:
- 1.1.1.1
- 1.0.0.1
```

### docker.network.name
Name of the Docker network used by Wings.

Default value:
```yaml
name: pterodactyl_nw
```

### docker.network.ispn
Internal network flag used by Wings.

Default value:
```yaml
ispn: false
```

### docker.network.driver
Docker network driver (e.g. bridge).

Default value:
```yaml
driver: bridge
```

### docker.network.mode
Internal network mode identifier.

Default value:
```yaml
mode: pterodactyl_nw
```

### docker.network.is_internal
Marks network as internal-only.

Default value:
```yaml
is_internal: false
```

### docker.network.enable_icc
Enables inter-container communication.

Default value:
```yaml
enable_icc: true
```

### docker.network.network_mtu
Sets MTU size for container network.

Default value:
```yaml
network_mtu: 1500
```

### docker.network.interfaces.v4.subnet
IPv4 subnet used by Docker network.

Default value:
```yaml
subnet: 172.18.0.0/16
```

### docker.network.interfaces.v4.gateway
IPv4 gateway address.

Default value:
```yaml
gateway: 172.18.0.1
```

### docker.network.interfaces.v6.subnet
IPv6 subnet used by Docker network.

Default value:
```yaml
subnet: fdba:17c8:6c94::/64
```

### docker.network.interfaces.v6.gateway
IPv6 gateway address.

Default value:
```yaml
gateway: fdba:17c8:6c94::1011
```

### docker.domainname
Domain name assigned to containers.

Default value:
```yaml
domainname: ''
```

### docker.registries
Docker registry authentication configurations.

Default value:
```yaml
registries: {}
```

### docker.tmpfs_size
Size (MB) of `/tmp` mounted in containers.

Default value:
```yaml
tmpfs_size: 100
```

### docker.container_pid_limit
Maximum number of processes allowed per container.

Default value:
```yaml
container_pid_limit: 5120
```

### docker.installer_limits.timeout
Maximum time (seconds) allowed for an installation container to run before it is considered failed. (`0` = no limit)

Default value:
```yaml
timeout: 1800
```

### docker.installer_limits.memory
Memory limit (MB) for installer containers.

Default value:
```yaml
memory: 1024
```

### docker.installer_limits.cpu
CPU limit (%) for installer containers.

Default value:
```yaml
cpu: 100
```

### docker.overhead.override
Enables custom memory overhead multipliers.

Default value:
```yaml
override: false
```

### docker.overhead.default_multiplier
Default memory overhead multiplier.

Default value:
```yaml
default_multiplier: 1.05
```

### docker.overhead.multipliers
Map of memory thresholds to multipliers.

Default value:
```yaml
multipliers: {}
```

### docker.userns_mode
User namespace mode for containers.

Default value:
```yaml
userns_mode: ''
```

### docker.log_config.type
Docker logging driver type.

Default value:
```yaml
type: local
```

### docker.log_config.config.compress
Enables log compression.

Default value:
```yaml
compress: 'false'
```

### docker.log_config.config.max-file
Maximum number of log files.

Default value:
```yaml
max-file: '1'
```

### docker.log_config.config.max-size
Maximum size per log file.

Default value:
```yaml
max-size: 5m
```

### docker.log_config.config.mode
Log mode (e.g. non-blocking).

Default value:
```yaml
mode: non-blocking
```

## Backups & Throttles
### throttles.enabled
Enables console output throttling.

Default value:
```yaml
enabled: true
```

### throttles.lines
Maximum number of console lines stored.

Default value:
```yaml
lines: 2000
```

### throttles.line_reset_interval
Interval (seconds) for resetting throttle counters.

Default value:
```yaml
line_reset_interval: 100
```

## Remote Configuration
### remote
URL of the Panel instance Wings connects to.

Default value:
```yaml
remote: https://panel.example.com
```

### remote_headers
Custom HTTP headers included in requests sent from Wings to the Panel.

Default value:
```yaml
remote_headers: {}
```

### remote_query.timeout
Request timeout in seconds.
The maximum number of retries for critical API requests. This uses an exponential backoff strategy.

Default value:
```yaml
timeout: 30
```

### remote_query.boot_servers_per_page
Number of servers loaded per request.

Default value:
```yaml
boot_servers_per_page: 50
```

### remote_query.retry_limit
Number of retries for failed requests.

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
A list of specific URLs (origins) that are permitted to make cross-origin requests to the Wings API.

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
The Wings configuration file is located at `/etc/pterodactyl/config.yml`. To enable SSL for your node, you will need to modify the api section, specifically lines `10`, `11`, and `12`.

::: info
This guide assumes you have already generated your certificates using Certbot. Replacing `<domain>` with your actual node domain will point Wings to the correct Let's Encrypt directory.
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
  disable_openapi_docs: true
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

## Troubleshooting
::: info
⚠️ **PAGE UNDER CONSTRUCTION** ⚠️

This section is currently being drafted. Some configuration options and troubleshooting steps may be missing or incomplete.
:::