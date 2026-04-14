
::: warning
⚠️ **PAGE UNDER CONSTRUCTION** ⚠️

This section is currently being drafted. Some configuration options and troubleshooting steps may be missing or incomplete.
:::

# Configuration
This page covers all the configuration options for the Calagopus Wings Daemon, including how to set up and manage these configurations. It also includes troubleshooting tips for common configuration issues.

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
```yaml
sudo systemctl restart wings
```


## Core Configuration
### debug
Enables debug mode for Wings. When enabled, detailed logs are printed for troubleshooting.

Default value:
```yaml
test
```

### app_name
Human-readable name of this Wings instance, shown in logs.

Default value:
```yaml
test
```

### uuid
Unique identifier for this Wings node.

Default value:
```yaml
test
```

### token_id / token
Authentication credentials used by Wings to validate requests from the Panel. Must be kept secret.

Default value:
```yaml
test
```


## API Settings
### api.host
The IP address Wings binds its internal API to.

Default value:
```yaml
test
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
test
```

### api.ssl.cert
Path to the SSL certificate file.

Default value:
```yaml
test
```

### api.ssl.key
Path to the SSL private key file.

Default value:
```yaml
test
```

### api.redirects
Custom HTTP redirects for the API server (e.g. `/ → Panel URL`).

Default value:
```yaml
test
```

### api.disable_openapi_docs
Disables or enables the `/openapi.json` endpoint.

Default value:
```yaml
test
```

### api.disable_remote_download
Prevents servers from downloading files via remote URLs.

Default value:
```yaml
test
```

### api.server_remote_download_limit
Maximum number of concurrent remote file downloads per server.

Default value:
```yaml
test
```

### api.remote_download_blocked_cidrs
List of blocked CIDR ranges for remote downloads to prevent SSRF attacks.

Default value:
```yaml
test
```

### api.disable_directory_size
Disables directory size calculation in file listings.

Default value:
```yaml
test
```

### api.directory_entry_limit
Maximum number of entries returned per directory listing request.

Default value:
```yaml
test
```

### api.send_offline_server_logs
If enabled, cached logs from offline servers are sent when connecting via websocket.

Default value:
```yaml
test
```

### api.file_search_threads
Number of threads used for file search operations.

Default value:
```yaml
test
```

### api.file_copy_threads
Number of threads used for copying files and directories.

Default value:
```yaml
test
```

### api.file_decompression_threads
Number of threads used for decompressing archives (zip, 7z, etc).

Default value:
```yaml
test
```

### api.file_compression_threads
Number of threads used for compressing archives (gz, xz, etc).

Default value:
```yaml
test
```

### api.upload_limit
Maximum upload size in MB for the web file manager.

Default value:
```yaml
test
```

### api.max_jwt_uses
Number of times a JWT token can be used for downloads before expiring.

Default value:
```yaml
test
```

### api.trusted_proxies
List of trusted proxy IPs used for real IP resolution.

Default value:
```yaml
test
```

## System Configuration
### system.root_directory
Base directory where all Wings server data is stored.

Default value:
```yaml
test
```

### system.log_directory
Directory where Wings logs are written.

Default value:
```yaml
test
```

### system.vmount_directory
Directory used for virtual mount points.

Default value:
```yaml
test
```

### system.data
Directory containing server volume data.

Default value:
```yaml
test
```

### system.archive_directory
Temporary directory used for archives.

Default value:
```yaml
test
```

### system.backup_directory
Directory where backups are stored.

Default value:
```yaml
test
```

### system.tmp_directory
Temporary working directory for Wings.

Default value:
```yaml
test
```

### system.username
System user that Wings runs under.

Default value:
```yaml
test
```

### system.timezone
Timezone used by Wings (e.g. `+00:00`).

Default value:
```yaml
test
```

### system.user.rootless.enabled
Enables rootless container execution.

Default value:
```yaml
test
```

### system.user.rootless.container_uid
UID used inside rootless containers.

Default value:
```yaml
test
```

### system.user.rootless.container_gid
GID used inside rootless containers.

Default value:
```yaml
test
```

### system.user.uid
Host system UID used by Wings.

Default value:
```yaml
test
```

### system.user.gid
Host system GID used by Wings.

Default value:
```yaml
test
```

### system.passwd.enabled
Enables dynamic passwd generation for containers.

Default value:
```yaml
test
```

### system.passwd.directory
Directory where passwd files are generated.

Default value:
```yaml
test
```

### system.disk_check_interval
Interval (in seconds) between disk usage checks.

Default value:
```yaml
test
```

### system.disk_check_use_inotify
Uses inotify to track filesystem changes for disk usage.

Default value:
```yaml
test
```

### system.disk_limiter_mode
Disk quota backend mode:
- `none`
- `btrfs_subvolume`
- `zfs_dataset`
- `xfs_quota`

Default value:
```yaml
test
```

### system.activity_send_interval
Interval (seconds) between sending activity updates to Panel.

Default value:
```yaml
test
```

### system.activity_send_count
Maximum number of activity events sent per interval.

Default value:
```yaml
test
```

### system.check_permissions_on_boot
Runs permission correction on startup.

Default value:
```yaml
test
```

### system.check_permissions_on_boot_threads
Number of threads used for permission fixing.

Default value:
```yaml
test
```

### system.websocket_log_count
Number of log lines kept for websocket streaming.

Default value:
```yaml
test
```


## SFTP Configuration
### system.sftp.enabled
Enables built-in SFTP server.

Default value:
```yaml
test
```

### system.sftp.bind_address
IP address the SFTP server binds to.

Default value:
```yaml
test
```

### system.sftp.bind_port
Port used for SFTP connections.

Default value:
```yaml
test
```

### system.sftp.read_only
Makes SFTP access read-only.

Default value:
```yaml
test
```

### system.sftp.key_algorithm
SSH host key algorithm used.

Default value:
```yaml
test
```

### system.sftp.disable_password_auth
Disables password authentication for SFTP.

Default value:
```yaml
test
```

### system.sftp.directory_entry_limit
Maximum directory entries returned.

Default value:
```yaml
test
```

### system.sftp.directory_entry_send_amount
Number of entries sent per response chunk.

Default value:
```yaml
test
```

### system.sftp.limits.authentication_password_attempts
Maximum failed password attempts before cooldown.

Default value:
```yaml
test
```

### system.sftp.limits.authentication_pubkey_attempts
Maximum failed SSH key attempts before cooldown.

Default value:
```yaml
test
```

### system.sftp.limits.authentication_cooldown
Cooldown time (seconds) after exceeding login attempts.

Default value:
```yaml
test
```

### system.sftp.shell.enabled
Enables Wings remote shell access.

Default value:
```yaml
test
```

### system.sftp.shell.cli.name
Command name for the internal Wings CLI (e.g. `.wings`).

Default value:
```yaml
test
```

### system.sftp.activity.log_logins
Logs SFTP login events.

### system.sftp.activity.log_file_reads
Logs file read actions via SFTP.

Default value:
```yaml
test
```

## Crash Detection
### system.crash_detection.enabled
Enables crash detection for servers.

Default value:
```yaml
test
```

### system.crash_detection.detect_clean_exit_as_crash
Treats clean exits as crashes if enabled.

Default value:
```yaml
test
```

### system.crash_detection.timeout
Time (seconds) before a server is considered crashed.

Default value:
```yaml
test
```


## Backups Configuration
### system.backups.write_limit
Write speed limit for backups (0 = unlimited).

Default value:
```yaml
test
```

### system.backups.read_limit
Read speed limit for backups (0 = unlimited).

Default value:
```yaml
test
```

### system.backups.compression_level
Backup compression level (best_speed, best_compression, etc).

Default value:
```yaml
test
```

### system.backups.mounting.enabled
Enables backup browsing via file manager.

Default value:
```yaml
test
```

### system.backups.mounting.path
Path prefix used when mounting backups.

Default value:
```yaml
test
```

### system.backups.wings.create_threads
Threads used for creating backups.

Default value:
```yaml
test
```

### system.backups.wings.restore_threads
Threads used for restoring backups.

Default value:
```yaml
test
```

### system.backups.wings.archive_format
Backup archive format
Available options: `best_speed`, `good_speed`, `good_compression`, `best_compression`

Default value:
```yaml
test
```

### system.backups.s3.create_threads
Threads used for S3 backup creation.

Default value:
```yaml
test
```

### system.backups.s3.part_upload_timeout
Timeout (seconds) for S3 multipart uploads.

Default value:
```yaml
test
```

### system.backups.s3.retry_limit
Number of retries per failed upload part.

Default value:
```yaml
test
```

### system.backups.ddup_bak.create_threads
Threads used for ddup-bak backup creation.

Default value:
```yaml
test
```

### system.backups.ddup_bak.compression_format
Compression format used for ddup-bak:
- `none`
- `deflate`
- `gzip`
- `brotli`

Default value:
```yaml
test
```

### system.backups.restic.repository
Path to restic repository.

Default value:
```yaml
test
```

### system.backups.restic.password_file
Path to restic password file.

Default value:
```yaml
test
```

### system.backups.restic.retry_lock_seconds
Wait time for repository lock.

Default value:
```yaml
test
```

### system.backups.restic.environment
Environment variables passed to restic.

Default value:
```yaml
test
```

### system.backups.btrfs.restore_threads
Threads used for restoring BTRFS snapshots.

Default value:
```yaml
test
```

### system.backups.btrfs.create_read_only
Creates read-only snapshots.

Default value:
```yaml
test
```

### system.backups.zfs.restore_threads
Threads used for restoring ZFS snapshots.

Default value:
```yaml
test
```

## Transfers
### system.transfers.download_limit
Download rate limit for transfers (0 = unlimited).

Default value:
```yaml
test
```

## Docker Configuration
### docker.socket
Path to Docker socket used by Wings.

Default value:
```yaml
test
```

### docker.server_name_in_container_name
Includes server name in container names.

Default value:
```yaml
test
```

### docker.delete_container_on_stop
Removes containers immediately when a server stops.

Default value:
```yaml
test
```

### docker.network.interface
IP interface used for Docker network bridge.

Default value:
```yaml
test
```

### docker.network.disable_interface_binding
Disables binding containers to a specific interface.

Default value:
```yaml
test
```

### docker.network.dns
DNS servers used inside containers.

Default value:
```yaml
test
```

### docker.network.name
Name of the Docker network used by Wings.

Default value:
```yaml
test
```

### docker.network.ispn
Internal network flag used by Wings.

Default value:
```yaml
test
```

### docker.network.driver
Docker network driver (e.g. bridge).

Default value:
```yaml
test
```

### docker.network.mode
Internal network mode identifier.

Default value:
```yaml
test
```

### docker.network.is_internal
Marks network as internal-only.

Default value:
```yaml
test
```

### docker.network.enable_icc
Enables inter-container communication.

Default value:
```yaml
test
```

### docker.network.network_mtu
Sets MTU size for container network.

Default value:
```yaml
test
```

### docker.network.interfaces.v4.subnet
IPv4 subnet used by Docker network.

Default value:
```yaml
test
```

### docker.network.interfaces.v4.gateway
IPv4 gateway address.

Default value:
```yaml
test
```

### docker.network.interfaces.v6.subnet
IPv6 subnet used by Docker network.

Default value:
```yaml
test
```

### docker.network.interfaces.v6.gateway
IPv6 gateway address.

Default value:
```yaml
test
```

### docker.domainname
Domain name assigned to containers.

Default value:
```yaml
test
```

### docker.registries
Docker registry authentication configurations.

Default value:
```yaml
test
```

### docker.tmpfs_size
Size (MB) of /tmp mounted in containers.

Default value:
```yaml
test
```

### docker.container_pid_limit
Maximum number of processes allowed per container.

Default value:
```yaml
test
```

### docker.installer_limits.timeout
Timeout (seconds) before installer container is considered failed.

Default value:
```yaml
test
```

### docker.installer_limits.memory
Memory limit (MB) for installer containers.

Default value:
```yaml
test
```

### docker.installer_limits.cpu
CPU limit (%) for installer containers.

Default value:
```yaml
test
```

### docker.overhead.override
Enables custom memory overhead multipliers.

Default value:
```yaml
test
```

### docker.overhead.default_multiplier
Default memory overhead multiplier.

Default value:
```yaml
test
```

### docker.overhead.multipliers
Map of memory thresholds to multipliers.

Default value:
```yaml
test
```

### docker.userns_mode
User namespace mode for containers.

Default value:
```yaml
test
```

### docker.log_config.type
Docker logging driver type.

Default value:
```yaml
test
```

### docker.log_config.config.compress
Enables log compression.

Default value:
```yaml
test
```

### docker.log_config.config.max-file
Maximum number of log files.

Default value:
```yaml
test
```

### docker.log_config.config.max-size
Maximum size per log file.

Default value:
```yaml
test
```

### docker.log_config.config.mode
Log mode (e.g. non-blocking).

Default value:
```yaml
test
```

## Backups & Throttles
### throttles.enabled
Enables console output throttling.

Default value:
```yaml
test
```

### throttles.lines
Maximum number of console lines stored.

Default value:
```yaml
test
```

### throttles.line_reset_interval
Interval (seconds) for resetting throttle counters.

Default value:
```yaml
test
```

## Remote Configuration
### remote
URL of the Panel instance Wings connects to.

Default value:
```yaml
test
```

### remote_headers
Custom HTTP headers for Panel requests.

Default value:
```yaml
test
```

### remote_query.timeout
Request timeout in seconds.

Default value:
```yaml
test
```

### remote_query.boot_servers_per_page
Number of servers loaded per request.

Default value:
```yaml
test
```

### remote_query.retry_limit
Number of retries for failed requests.

Default value:
```yaml
test
```

## Security / Behaviour Flags
### allowed_mounts
List of allowed filesystem mounts for servers.

Default value:
```yaml
test
```

### allowed_origins
Allowed CORS origins for API access.

Default value:
```yaml
test
```

### allow_cors_private_network
Allows CORS requests from private networks.

Default value:
```yaml
test
```

### ignore_panel_config_updates
If true, ignores configuration updates from Panel.

Default value:
```yaml
test
```

### ignore_panel_wings_upgrades
If true, ignores upgrade requests from Panel.

Default value:
```yaml
test
```


# Example Config
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
    - 8.8.8.8
    - 1.1.1.1
    - 2001:4860:4860::8888
    - 2606:4700:4700::1111
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

