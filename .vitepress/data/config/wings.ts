import { type ConfigDoc, float } from './types.ts';

export const wingsConfigDoc: ConfigDoc = {
  outFile: 'docs/wings/configuration.md',
  sourceFile: '.vitepress/data/config/wings.ts',
  title: 'Configuration',
  pageTitle: 'Wings Configuration',
  description:
    'Reference for every Wings configuration option in config.yml, with defaults, explanations, and a full example file.',
  intro:
    "This page is a reference for all Wings configuration options. The configuration file is located at `/etc/calagopus-wings/config.yml` on Linux (`C:\\ProgramData\\Calagopus-Wings\\config.yml` on Windows).\n\n::: info Migrating from Pterodactyl/Pelican\nIf no `-c`/`--config` flag is passed and `/etc/calagopus-wings/config.yml` doesn't exist, Wings automatically looks for a config at `/etc/pterodactyl/config.yml`, then `/etc/pelican/config.yml`, then `./config.yml`, in that order, and uses the first one it finds. This means an existing Pterodactyl or Pelican Wings install keeps working without moving its config file, though it's recommended to migrate to the `calagopus-wings` path when convenient.\n:::",
  sections: [
    {
      title: 'Core Configuration',
      options: [
        {
          key: 'debug',
          description: 'Enables debug mode for Wings. When enabled, detailed logs are printed for troubleshooting.',
          default: false,
        },
        {
          key: 'app_name',
          description: 'A human-readable name for this Wings instance used to identify the node in log outputs.',
          default: 'Calagopus',
        },
        {
          key: 'uuid',
          description: 'Unique identifier for this Wings node.',
          default: 'UUID_HERE',
        },
        {
          key: 'token_id',
          description:
            'The identifier half of the credentials Wings uses to validate requests from the Panel. Written by `wings configure`.',
          default: 'TOKEN_ID_HERE',
        },
        {
          key: 'token',
          description:
            'The secret half of the credentials Wings uses to validate requests from the Panel. Must be kept secret. Written by `wings configure`.',
          default: 'TOKEN_HERE',
        },
      ],
    },
    {
      title: 'API Settings',
      options: [
        {
          key: 'api.host',
          description:
            'The IP address Wings binds its internal API to. Alternatively, a Unix socket path can be specified here.',
          default: '0.0.0.0',
        },
        {
          key: 'api.port',
          description: 'The port used by the Wings internal API.',
          default: 8080,
        },
        {
          key: 'api.ssl.enabled',
          description: 'Determines whether HTTPS is enabled for the Wings API to ensure encrypted communication.',
          default: false,
        },
        {
          key: 'api.ssl.ktls_enabled',
          description:
            "Whether to hand HTTPS connections off to the kernel's TLS implementation (kTLS) once the handshake completes, so the kernel encrypts and decrypts records instead of userspace. This mainly speeds up large file transfers and backup downloads. Linux only, and it requires the `tls` kernel module; Wings probes for kernel support on boot, warns once and stays on userspace TLS if the kernel cannot do it, and falls back per connection when the negotiated cipher suite isn't kTLS compatible. Has no effect unless `api.ssl.enabled` is `true`.",
          default: false,
        },
        {
          key: 'api.ssl.cert',
          description: 'The absolute filesystem path to the SSL certificate file used for API encryption.',
          default: '',
        },
        {
          key: 'api.ssl.key',
          description: 'The absolute filesystem path to the SSL private key file corresponding to the certificate.',
          default: '',
        },
        {
          key: 'api.redirects',
          description: 'Custom HTTP redirects for the API server (e.g. `/ → Panel URL`).',
          default: {},
        },
        {
          key: 'api.disable_openapi_docs',
          description: 'Controls the availability of the `/openapi.json` endpoint.',
          default: false,
        },
        {
          key: 'api.disable_remote_download',
          description:
            'Whether to prevent servers from downloading files directly through remote URLs via the file manager or API.',
          default: false,
        },
        {
          key: 'api.server_remote_download_limit',
          description:
            'The maximum number of concurrent remote file pulls (downloads via URL) allowed for a single server.',
          default: 3,
        },
        {
          key: 'api.remote_download_blocked_cidrs',
          description:
            'A security list of CIDR ranges blocked for remote downloads to prevent SSRF (Server-Side Request Forgery) attacks.',
          default: [
            '127.0.0.0/8',
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
            '169.254.0.0/16',
            '::1',
            'fe80::/10',
            'fc00::/7',
          ],
        },
        {
          key: 'api.disable_directory_size',
          description: 'Whether to disable the calculation of total directory sizes in the file manager.',
          default: false,
        },
        {
          key: 'api.directory_entry_limit',
          description:
            'The maximum number of files/folders returned in a single `/list-directory` API call (`0` = unlimited).',
          default: 10000,
        },
        {
          key: 'api.send_offline_server_logs',
          description:
            'When enabled, Wings will transmit cached logs from an offline server immediately upon a websocket connection. This only works when containers are not removed on stop.',
          default: false,
        },
        {
          key: 'api.file_search_threads',
          description:
            'The number of concurrent worker threads Wings spawns to crawl and scan through server files during a search request.',
          default: 4,
        },
        {
          key: 'api.file_copy_threads',
          description:
            'The number of concurrent worker threads allocated for duplicating files and directories within the file manager.',
          default: 4,
        },
        {
          key: 'api.file_decompression_threads',
          description:
            'The number of threads used for extracting archives. Applies to `.tar.xz`, `.tar.lz`, `.zip`, `.ddup`, `.7z`.',
          default: 2,
        },
        {
          key: 'api.file_compression_threads',
          description:
            'The number of threads used for creating archives. Applies to `.tar.xz`, `.tar.lz`, `.zip`, `.ddup`, `.7z`.',
          default: 2,
        },
        {
          key: 'api.upload_limit',
          description: 'The maximum file size in `MiB` that can be uploaded through the web-based file manager.',
          default: 100,
        },
        {
          key: 'api.max_jwt_uses',
          description:
            'The number of times a single JWT can be used for a download or backup before it is invalidated. This provides a security layer to prevent the reuse of temporary access tokens for file and backup downloads.',
          default: 5,
        },
        {
          key: 'api.trusted_proxies',
          description:
            'A list of trusted IP addresses from proxy servers (like Cloudflare, NGINX, or a Load Balancer) that Wings uses to resolve the actual IP address of a user using the `X-Forwarded-For` or `X-Real-IP` header.',
          default: [],
        },
      ],
    },
    {
      title: 'Schedule Steps',
      body: 'These options govern the `HTTP Request` step that server schedules can run. The step sends a request to an arbitrary URL from the node, optionally storing the response status and body into schedule variables.',
      options: [
        {
          key: 'api.schedule.steps.http_request.enabled',
          description:
            'Whether servers on this node are allowed to run the `HTTP Request` schedule step at all. When disabled, any schedule reaching such a step fails with an error instead of sending the request.',
          default: true,
        },
        {
          key: 'api.schedule.steps.http_request.requests',
          description:
            'The number of `HTTP Request` steps a single server may execute per rate limit window. Once the limit is hit, further requests fail until the window rolls over.',
          default: 5,
        },
        {
          key: 'api.schedule.steps.http_request.window_seconds',
          description:
            'The length (in seconds) of the rate limit window that `api.schedule.steps.http_request.requests` is counted against. The window is per server and restarts once it elapses.',
          default: 60,
        },
        {
          key: 'api.schedule.steps.http_request.max_response_size',
          description:
            'The maximum size (in bytes) of a response body captured by the step. Only relevant when the step stores the body into a schedule variable; anything past this limit is truncated. This should be kept at or below the 16 KiB schedule variable size limit, since a captured body larger than a variable may hold would fail the step outright.',
          default: 16384,
        },
        {
          key: 'api.schedule.steps.http_request.blocked_cidrs',
          description:
            'A security list of CIDR ranges that `HTTP Request` steps may not connect to, preventing SSRF (Server-Side Request Forgery) attacks against services reachable from the node. Enforced both on the URL host and on every address DNS resolves to, so a public hostname pointing at a private address is blocked as well.',
          default: [
            '0.0.0.0/8',
            '127.0.0.0/8',
            '10.0.0.0/8',
            '100.64.0.0/10',
            '172.16.0.0/12',
            '192.168.0.0/16',
            '169.254.0.0/16',
            '::1',
            'fe80::/10',
            'fc00::/7',
          ],
        },
      ],
    },
    {
      title: 'System Configuration',
      body: "::: info Path placeholders\n`data`, `diffs_directory`, `vmount_directory`, `log_directory`, `archive_directory`, `backup_directory` and `tmp_directory` accept the `{root_directory}` placeholder in their value. It's substituted with the configured `system.root_directory` every time the path is used, so these default to living under `root_directory` and move together if you repoint it. This is also how a freshly generated `config.yml` writes these values: literally as `{root_directory}/...`, not pre-resolved, so editing `root_directory` alone is enough to relocate everything else that still uses the placeholder. `log_directory` and `tmp_directory` default to fixed, independent paths on Unix - see their entries below.\n:::",
      options: [
        {
          key: 'system.root_directory',
          description:
            'This is the root directory where Wings stores its own persistent data (mainly state of servers so it can restore them on restart).',
          default: '/var/lib/calagopus-wings',
          platformDefaults: { windows: 'C:\\ProgramData\\Calagopus-Wings' },
        },
        {
          key: 'system.log_directory',
          description: 'This is the directory where Wings stores its logs.',
          default: '/var/log/calagopus-wings',
          platformDefaults: { windows: '{root_directory}\\logs' },
          notesAfter: [
            {
              type: 'info',
              body: 'Unlike the other directories on this page, `log_directory` defaults to a fixed path on Unix and does **not** move with `root_directory`. On Windows, it defaults to `{root_directory}\\logs` and does follow it.',
            },
          ],
        },
        {
          key: 'system.data',
          description:
            'This is the directory where Wings stores server data. This is the directory that gets bind-mounted to server containers and is where all server files are stored.',
          default: '{root_directory}/volumes',
          platformDefaults: { windows: '{root_directory}\\volumes' },
        },
        {
          key: 'system.diffs_directory',
          description:
            'This is the directory where Wings stores the per-server SQLite databases used by [file history](#system-file-history-enabled) to track diffs/revisions of edited files.',
          default: '{root_directory}/diffs',
          platformDefaults: { windows: '{root_directory}\\diffs' },
        },
        {
          key: 'system.vmount_directory',
          description:
            'This is the directory where Wings stores virtual mounts for servers. Currently mainly used for spoofing hardware UUIDs for containers. This directory **should not** be located on a tmpfs (temporary filesystem).',
          default: '{root_directory}/vmounts',
          platformDefaults: { windows: '{root_directory}\\vmounts' },
        },
        {
          key: 'system.archive_directory',
          description:
            "This is the directory where Wings stores server archives. This is 100% unused in current code and is simply there for compatibility with Pterodactyl's codebase; it may be used in the future.",
          default: '{root_directory}/archives',
          platformDefaults: { windows: '{root_directory}\\archives' },
        },
        {
          key: 'system.backup_directory',
          description:
            'This is the directory where Wings stores server backups. This applies to backups using the `Wings` backup driver; `btrfs` and `zfs` backups also use this directory for snapshots.',
          default: '{root_directory}/backups',
          platformDefaults: { windows: '{root_directory}\\backups' },
        },
        {
          key: 'system.tmp_directory',
          description:
            'This is the directory where Wings stores temporary files. This is used for various temporary files that Wings needs to create during its operation.',
          default: '/tmp/calagopus-wings',
          platformDefaults: { windows: '{root_directory}\\tmp' },
        },
        {
          key: 'system.username',
          description: 'The operating system user account that the Wings process runs under on the host.',
          default: 'calagopus',
        },
        {
          key: 'system.timezone',
          description:
            'The timezone used by Wings (e.g., `+00:00`) for logs and containers. It is auto-detected from the host, falls back to UTC if detection fails, and is passed into all created containers.',
          default: '+00:00',
        },
        {
          key: 'system.user.rootless.enabled',
          description:
            'Enables rootless container execution, allowing Wings to run containers without requiring root privileges on the host. When enabled, Wings takes `system.username`, `system.user.uid` and `system.user.gid` from the user it runs as and derives `docker.userns_mode` from the container UID/GID below.',
          default: false,
        },
        {
          key: 'system.user.rootless.container_uid',
          description:
            "The UID the server process runs as inside rootless containers. Left at `0` the server runs as container root, which the default rootless mapping already points at the user running Wings; setting it to that user's own UID works too, since Wings derives a matching `docker.userns_mode`. Unlike the other user settings, this one is never filled in automatically.",
          default: 0,
        },
        {
          key: 'system.user.rootless.container_gid',
          description:
            'The GID the server process runs as inside rootless containers. Follows the same rules as `system.user.rootless.container_uid`.',
          default: 0,
        },
        {
          key: 'system.user.uid',
          description: 'The User ID (UID) on the host system that Wings uses when managing server files.',
          default: 995,
        },
        {
          key: 'system.user.gid',
          description: 'The Group ID (GID) on the host system that Wings uses when managing server files.',
          default: 985,
        },
        {
          key: 'system.passwd.enabled',
          description:
            'Whether to enable dynamic generation of `/etc/passwd` files inside containers to ensure proper username resolution.',
          default: false,
          platforms: ['unix'],
        },
        {
          key: 'system.passwd.directory',
          description: 'The absolute filesystem path where Wings generates and stores the dynamic passwd files.',
          default: '/run/calagopus-wings/etc',
          platforms: ['unix'],
        },
        {
          key: 'system.machine_id.enabled',
          description:
            'Controls whether a unique, generated `machine-id` file should be mounted into each server container.',
          default: true,
          platforms: ['unix'],
        },
        {
          key: 'system.disk_check_concurrency',
          description:
            'The number of concurrent allowed disk scans Wings can perform across all servers. This limits the number of simultaneous disk usage checks to prevent excessive background resource consumption on large nodes.',
          default: 2,
        },
        {
          key: 'system.disk_check_interval',
          description:
            'Defines how often (in seconds) Wings performs incremental disk usage checks using inotify. These checks are lightweight and rely on filesystem events rather than scanning the entire disk.',
          default: 150,
        },
        {
          key: 'system.full_disk_check_every',
          description:
            'Number of inotify disk check intervals before performing a full disk scan. Periodic full scans prevent desync between the OS and Wings (e.g. 150s × 4 = 600s / 10 min).',
          default: 4,
        },
        {
          key: 'system.disk_check_use_inotify',
          description:
            'Uses inotify for selective scanning to reduce scanning overhead of large servers. When disabled, Wings will perform a full disk scan every time instead of relying on inotify events. Disabling this can lead to increased CPU and disk usage, especially on servers with large file counts, but may be necessary in environments where inotify is unreliable or unavailable.',
          default: true,
        },
        {
          key: 'system.disk_limiter_mode',
          description:
            'The backend driver used to enforce storage quotas on servers. Available Options:\n\n`none`, `btrfs_subvolume`, `zfs_dataset`, `xfs_quota` or the experimental `fuse_quota`',
          default: 'none',
          notesBefore: [
            {
              type: 'info',
              body: '**Switching between drivers may require additional manual work**. Enabling the quota driver requires specific filesystem support (like `prjquota` on `XFS` or `ext4`) and manual mounting configurations on the host machine. If not configured correctly at the OS level, Wings will fail to start or manage disk limits.',
            },
          ],
        },
        {
          key: 'system.activity_send_interval',
          description:
            'The amount of time (in seconds) that elapses between sending aggregated server activity to the Panel. Wings collects activity over this period and sends it in a single batch.',
          default: 60,
        },
        {
          key: 'system.activity_send_count',
          description:
            'The number of activity events to send per batch to the Panel. This limits how many collected events are transmitted during each interval.',
          default: 100,
        },
        {
          key: 'system.check_permissions_on_boot',
          description:
            'Whether to check and correct file permissions for a server whenever its process is booted. This can cause boot delays if the server has a large amount of files.',
          default: true,
        },
        {
          key: 'system.check_permissions_on_boot_threads',
          description:
            'The number of concurrent threads used to verify and correct file permissions (chown) during the server startup process.',
          default: 4,
        },
        {
          key: 'system.websocket_log_count',
          description:
            'The number of lines to send when a user connects to the server websocket. This provides the initial "backlog" of console history visible in the Panel.',
          default: 150,
        },
        {
          key: 'system.tcp_congestion_control',
          description:
            'The TCP congestion control algorithm applied to the sockets Wings owns: the API listener, the SFTP listener, and the outgoing connections used for server transfers and S3 backup uploads (those are routed through a loopback proxy so the algorithm applies to them as well). Linux only, and the algorithm has to be available to the kernel - Wings looks it up in `/proc/sys/net/ipv4/tcp_available_congestion_control`, tries `modprobe tcp_<algorithm>` once if it is missing, and keeps the system default with a warning if it still is not there. Set to an empty string to leave congestion control alone entirely.',
          default: 'bbr',
        },
      ],
    },
    {
      title: 'SFTP Configuration',
      options: [
        {
          key: 'system.sftp.enabled',
          description: 'Whether to enable the integrated SFTP (SSH) server.',
          default: true,
        },
        {
          key: 'system.sftp.bind_address',
          description: 'The IP address that the internal SFTP/SSH server binds to.',
          default: '0.0.0.0',
        },
        {
          key: 'system.sftp.bind_port',
          description: 'The port that the internal SFTP/SSH server binds to for incoming connections.',
          default: 2022,
        },
        {
          key: 'system.sftp.read_only',
          description:
            'Whether the SFTP server should operate in read-only mode. If enabled, users can view and download files, but cannot upload, delete, or modify any content.',
          default: false,
        },
        {
          key: 'system.sftp.key_algorithm',
          description: 'The cryptographic algorithm used for generating the SSH host key.',
          default: 'ssh-ed25519',
        },
        {
          key: 'system.sftp.disable_password_auth',
          description: 'If enabled, only SSH key authentication is permitted for SFTP/SSH.',
          default: false,
        },
        {
          key: 'system.sftp.directory_entry_limit',
          description:
            'The maximum number of files and folders returned in a single directory listing. This prevents the SFTP server from hanging when opening folders with massive amounts of data.',
          default: 20000,
        },
        {
          key: 'system.sftp.directory_entry_send_amount',
          description: 'The number of directory entries to send in each response chunk to the SFTP client.',
          default: 500,
        },
        {
          key: 'system.sftp.limits.authentication_password_attempts',
          description:
            'The maximum number of failed password attempts allowed within the cooldown window before the connection is dropped.',
          default: 3,
        },
        {
          key: 'system.sftp.limits.authentication_pubkey_attempts',
          description:
            'The maximum number of failed public key authentication attempts allowed within the cooldown window before the connection is dropped.',
          default: 20,
        },
        {
          key: 'system.sftp.limits.authentication_cooldown',
          description:
            'Cooldown period in seconds once attempts are exceeded. This is a sliding window based on the most recent attempt. (3 failed attempts in 1min = 60s wait time from the last attempt)',
          default: 60,
        },
        {
          key: 'system.sftp.limits.max_connections_per_user',
          description:
            'The maximum number of simultaneous SFTP connections allowed per user account. This prevents a single user from opening too many connections and overwhelming the server.',
          default: 10,
        },
        {
          key: 'system.sftp.limits.max_channels_per_connection',
          description:
            'The maximum number of concurrent channels (e.g., SFTP sessions, shell sessions) allowed within a single SSH connection. This limits the resources consumed by a single connection.',
          default: 10,
        },
        {
          key: 'system.sftp.limits.max_handles_per_channel',
          description:
            'The maximum number of open file handles allowed per channel in the SFTP server. This prevents resource exhaustion from too many open files in a single session.',
          default: 32,
        },
        {
          key: 'system.sftp.limits.max_handles_total',
          description:
            'The maximum total number of open file handles across all channels and connections in the SFTP server. This is a global limit to prevent overall resource exhaustion.',
          default: 1024,
        },
        {
          key: 'system.sftp.shell.enabled',
          description:
            'Determines whether to allow server management and command-line access via the Wings remote shell over SSH.',
          default: true,
        },
        {
          key: 'system.sftp.shell.cli.name',
          description:
            'The name used for the internal CLI tool when accessing a server via the remote shell. This is the command users type (e.g., `.wings help`) to interact with the Wings shell helper.',
          default: '.wings',
        },
        {
          key: 'system.sftp.activity.log_logins',
          description: "Whether successful SFTP logins are recorded and displayed in the server's activity log.",
          default: false,
        },
        {
          key: 'system.sftp.activity.log_file_reads',
          description: "Whether reading or downloading files via SFTP is recorded in the server's activity log.",
          default: false,
        },
      ],
    },
    {
      title: 'Crash Detection',
      options: [
        {
          key: 'system.crash_detection.enabled',
          description: 'Enables or disables the automatic crash detection system for all servers on the node.',
          default: true,
        },
        {
          key: 'system.crash_detection.detect_clean_exit_as_crash',
          description: 'Whether to treat a "clean" exit (an exit code of `0`) as a server crash.',
          default: true,
        },
        {
          key: 'system.crash_detection.timeout',
          description:
            'The amount of time in seconds, that Wings waits after a server process stops before determining it has crashed and attempting a restart.',
          default: 60,
        },
      ],
    },
    {
      title: 'File History Configuration',
      options: [
        {
          key: 'system.file_history.enabled',
          description:
            'Enables or disables the file history tracking system. When enabled, Wings records a diff-based changelog of edits made to server files through the file manager and SFTP, allowing users to view and restore previous versions.',
          default: true,
        },
        {
          key: 'system.file_history.zstd_level',
          description:
            'The [Zstandard](https://facebook.github.io/zstd/) compression level used when storing snapshots and delta entries in the history database. Higher values produce smaller stored history at the cost of more CPU time. Valid range is `1`–`22`.',
          default: 19,
        },
        {
          key: 'system.file_history.anchor_interval',
          description:
            'The number of delta (diff) entries written in a chain before Wings stores a full snapshot (anchor) instead. A lower value creates anchors more frequently, making history reconstruction faster at the cost of more disk space.',
          default: 4,
        },
        {
          key: 'system.file_history.keep_chains',
          description:
            'The number of diff chains to retain per file. Once a new chain is started (after an anchor), older chains beyond this count are pruned. Increasing this retains more history depth.',
          default: 5,
        },
        {
          key: 'system.file_history.file_size_cap',
          description:
            'The maximum size (in bytes) of file content that Wings will read and track through the HTTP file manager. File writes whose pre-write or post-write content exceeds this size are silently skipped and not recorded in history.',
          default: 1048576,
        },
        {
          key: 'system.file_history.per_file_disk_budget',
          description:
            'The maximum amount of disk space (in bytes) that the history database may use for a single file. When exceeded, Wings drops the oldest diff chains for that file until the budget is met.',
          default: 5242880,
        },
        {
          key: 'system.file_history.per_server_disk_budget',
          description:
            'The maximum total disk space (in bytes) that the history database may use across all files for a single server. When exceeded, Wings drops the globally oldest diff chains until the budget is met.',
          default: 209715200,
        },
        {
          key: 'system.file_history.maintenance_interval',
          description:
            'The interval (in seconds) between background maintenance runs that clean up stale history entries and enforce disk budgets.',
          default: 3600,
        },
      ],
    },
    {
      title: 'File Collaboration Configuration',
      options: [
        {
          key: 'system.file_collaboration.enabled',
          description:
            "Enables or disables the live file collaboration system. When enabled, multiple users can open and edit the same server file simultaneously through the file manager, seeing each other's changes in real time.",
          default: true,
        },
        {
          key: 'system.file_collaboration.file_size_cap',
          description:
            'The maximum size (in bytes) of a file that can be opened for collaborative editing. Files larger than this cannot be opened in a collaborative session.',
          default: 1048576,
        },
        {
          key: 'system.file_collaboration.max_sessions_per_server',
          description:
            'The maximum number of concurrent collaborative editing sessions (distinct open files) allowed per server.',
          default: 16,
        },
        {
          key: 'system.file_collaboration.max_sessions_per_connection',
          description:
            'The maximum number of concurrent collaborative editing sessions a single websocket connection may subscribe to at once.',
          default: 8,
        },
        {
          key: 'system.file_collaboration.max_editors_per_session',
          description:
            'The maximum number of editors (participants actively editing) allowed to join a single collaborative editing session at once.',
          default: 32,
        },
        {
          key: 'system.file_collaboration.max_cursors_per_connection',
          description:
            'The maximum number of remote cursors a single websocket connection will track across its subscribed collaborative sessions.',
          default: 64,
        },
        {
          key: 'system.file_collaboration.session_grace_period',
          description:
            'The amount of time (in seconds) Wings keeps a collaborative session alive after the last participant leaves before tearing it down. This allows a user to briefly disconnect and rejoin without losing the session state.',
          default: 30,
        },
      ],
    },
    {
      title: 'Backups Configuration',
      options: [
        {
          key: 'system.backups.write_limit',
          description:
            'The maximum disk write speed (in `MiB/s`) for creating backups. This prevents restoration processes from saturating the disk I/O and slowing down the rest of the node (`0` = unlimited).',
          default: 0,
        },
        {
          key: 'system.backups.read_limit',
          description:
            'The maximum disk read speed (in `MiB/s`) when restoring backups. Prevents backups from slowing down the rest of the node (`0` = unlimited).',
          default: 0,
        },
        {
          key: 'system.backups.compression_level',
          description:
            'Defines the CPU vs. compression ratio. Higher compression saves disk space but uses more CPU (`best_speed` = fastest, `best_compression` = smallest file).',
          values: ['best_speed', 'good_speed', 'good_compression', 'best_compression'],
          default: 'best_speed',
        },
        {
          key: 'system.backups.mounting.enabled',
          description:
            'Allows users to browse and interact with backup contents directly via the File Manager without needing to download them first.',
          default: true,
        },
        {
          key: 'system.backups.mounting.path',
          description: 'The path prefix used for the virtual backup mount (e.g., `.backups/<uuid>`).',
          default: '.backups',
        },
        {
          key: 'system.backups.wings.create_threads',
          description:
            'The number of CPU threads used when compressing local backups. This applies specifically to `.tar.gz`, `.tar.xz`, `.tar.lz`, `.tar.zst`, and `.7z`.',
          default: 4,
        },
        {
          key: 'system.backups.wings.restore_threads',
          description:
            'The number of CPU threads used for extracting local backup archives. This applies specifically to `.tar.xz`, `.tar.lz`, `.zip`, `.ddup` and `.7z`.',
          default: 4,
        },
        {
          key: 'system.backups.wings.archive_format',
          description: 'The compression format used for local backups.',
          values: ['tar', 'tar_gz', 'tar_xz', 'tar_lzip', 'tar_bz2', 'tar_lz4', 'tar_zstd', 'zip', 'seven_zip'],
          default: 'tar_gz',
        },
        {
          key: 'system.backups.s3.create_threads',
          description:
            'The number of CPU threads used when compressing backups for S3 storage. This applies specifically to `.tar.gz`, `.tar.xz`, `.tar.lz` and `.tar.zst`.',
          default: 4,
        },
        {
          key: 'system.backups.s3.part_upload_timeout',
          description: 'The maximum time (in seconds) to wait for a single part of a multipart upload.',
          default: 7200,
        },
        {
          key: 'system.backups.s3.retry_limit',
          description: 'The number of retry attempts for each failed upload part.',
          default: 10,
        },
        {
          key: 'system.backups.ddup_bak.create_threads',
          description: 'The number of threads used for `ddup-bak` backup creation.',
          default: 4,
        },
        {
          key: 'system.backups.ddup_bak.compression_format',
          description: 'The compression format used for each `ddup-bak` chunk.',
          values: ['none', 'deflate', 'gzip', 'brotli'],
          default: 'deflate',
        },
        {
          key: 'system.backups.restic.repository',
          description:
            'The Restic repository path used for backups. This must already be initialized and can be overridden by the panel.',
          default: '{root_directory}/backups/restic',
          platformDefaults: { windows: '{root_directory}\\backups\\restic' },
          notesBefore: [
            {
              type: 'info',
              body: 'All restic options only apply when using Pterodactyl. On Calagopus, restic is fully managed by the panel, and these local configuration settings are ignored.',
            },
          ],
        },
        {
          key: 'system.backups.restic.password_file',
          description:
            'The local path to the file containing the Restic repository password used for authentication. This can be overridden by the panel.',
          default: '{root_directory}/backups/restic_password',
          platformDefaults: { windows: '{root_directory}\\backups\\restic_password' },
        },
        {
          key: 'system.backups.restic.retry_lock_seconds',
          description:
            'The amount of time (in seconds) Wings will wait if the Restic repository is locked by another process before failing the backup task. This can be overridden by the panel.',
          default: 60,
        },
        {
          key: 'system.backups.restic.environment',
          description:
            'The environment variables passed to the restic process for authentication and configuration. This can be overridden by the panel.',
          default: {},
        },
        {
          key: 'system.backups.btrfs.restore_threads',
          description:
            'The number of threads used for restoring Btrfs snapshots. Each thread processes one file, so with 4 threads, up to 4 files are restored concurrently.',
          default: 4,
        },
        {
          key: 'system.backups.btrfs.create_read_only',
          description: 'Whether to create read-only snapshots to prevent data modification after the backup is taken.',
          default: true,
        },
        {
          key: 'system.backups.zfs.restore_threads',
          description:
            'The number of threads used for restoring ZFS snapshots. Each thread processes one file, so with 4 threads, up to 4 files are restored concurrently.',
          default: 4,
        },
        {
          key: 'system.backups.pbs.create_threads',
          description:
            'The number of threads used when creating Proxmox Backup Server (PBS) backups. Each thread processes one file concurrently while the backup is being uploaded.',
          default: 4,
        },
        {
          key: 'system.backups.pbs.download_concurrency',
          description:
            'The number of chunks downloaded concurrently when restoring a Proxmox Backup Server (PBS) backup.',
          default: 4,
        },
      ],
    },
    {
      title: 'Transfers',
      options: [
        {
          key: 'system.transfers.download_limit',
          description: 'The download rate limit for transfers in MiB/s (`0` = unlimited).',
          default: 0,
        },
      ],
    },
    {
      title: 'Docker Configuration',
      options: [
        {
          key: 'docker.socket',
          description: 'The path to the Docker daemon socket or HTTP address.',
          default: '/var/run/docker.sock',
          platformDefaults: { windows: '//./pipe/docker_engine' },
        },
        {
          key: 'docker.server_name_in_container_name',
          description:
            "Whether to include the server's name within the Docker container name for easier identification in tools like `docker ps`.",
          default: false,
        },
        {
          key: 'docker.delete_container_on_stop',
          description:
            'When enabled, containers are deleted as soon as a server stops, is killed, or crashes. This significantly reduces long-term CPU/resource overhead.',
          default: true,
        },
        {
          key: 'docker.network.interface',
          description: 'The specific IP interface used for the Docker network bridge.',
          default: '172.18.0.1',
        },
        {
          key: 'docker.network.disable_interface_binding',
          description: 'Whether to disable binding containers to a specific network interface on the host.',
          default: false,
        },
        {
          key: 'docker.network.dns',
          description: 'The list of DNS servers used by containers for name resolution.',
          default: ['1.1.1.1', '1.0.0.1'],
        },
        {
          key: 'docker.network.dns_options',
          description:
            "Resolver options (as used in `/etc/resolv.conf`'s `options` line) applied to containers alongside `docker.network.dns`.",
          default: ['ndots:0', 'timeout:2', 'attempts:3', 'single-request-reopen'],
        },
        {
          key: 'docker.network.name',
          description: 'The name of the Docker network used by Wings to manage container communication.',
          default: 'calagopus_nw',
        },
        {
          key: 'docker.network.ispn',
          description:
            'The flag that determines if the Docker network used by Wings is "internal", meaning it has no access to the external internet.',
          default: false,
        },
        {
          key: 'docker.network.driver',
          description: 'The Docker network driver used for the container network (e.g. `bridge`).',
          default: 'bridge',
        },
        {
          key: 'docker.network.mode',
          description:
            'The network mode containers are attached to, passed to the Docker daemon as-is. This should match `docker.network.name`; if `name` is changed without changing `mode`, Wings warns on startup that containers are being attached to a network that does not exist. Also accepted under the legacy key `network_mode`.',
          default: 'calagopus_nw',
        },
        {
          key: 'docker.network.is_internal',
          description:
            'Whether to mark the network as internal-only, restricting containers from accessing the outside internet.',
          default: false,
        },
        {
          key: 'docker.network.enable_icc',
          description:
            'Enables Inter-Container Communication, allowing containers on the same network to talk to one another.',
          default: true,
        },
        {
          key: 'docker.network.network_mtu',
          description: 'Sets the Maximum Transmission Unit (MTU) size for the container network.',
          default: 1500,
        },
        {
          key: 'docker.network.interfaces.v4.enabled',
          description:
            'Whether to enable IPv4 on the Docker network bridge. At least one of `docker.network.interfaces.v4.enabled` and `docker.network.interfaces.v6.enabled` must stay `true` - Wings refuses to create the network if both are disabled.',
          default: true,
        },
        {
          key: 'docker.network.interfaces.v4.subnet',
          description: 'The IPv4 subnet range used by the Docker network.',
          default: '172.18.0.0/16',
        },
        {
          key: 'docker.network.interfaces.v4.gateway',
          description:
            'The IPv4 gateway address for the Docker network. This will automatically be incremented if the address is already in use by another network on the host.',
          default: '172.18.0.1',
        },
        {
          key: 'docker.network.interfaces.v6.enabled',
          description:
            'Whether to enable IPv6 on the Docker network bridge. At least one of `docker.network.interfaces.v4.enabled` and `docker.network.interfaces.v6.enabled` must stay `true` - Wings refuses to create the network if both are disabled.',
          default: true,
        },
        {
          key: 'docker.network.interfaces.v6.subnet',
          description: 'The IPv6 subnet range used by the Docker network.',
          default: 'fdba:17c8:6c94::/64',
        },
        {
          key: 'docker.network.interfaces.v6.gateway',
          description: 'The IPv6 gateway address for the Docker network.',
          default: 'fdba:17c8:6c94::1011',
        },
        {
          key: 'docker.domainname',
          description: 'The domain name assigned to containers, useful for internal networking resolution.',
          default: '',
        },
        {
          key: 'docker.registries',
          description: 'The Docker registry authentication configurations used for pulling private images.',
          default: {},
        },
        {
          key: 'docker.registry_image_fetch_cache.enabled',
          description:
            'Whether to enable caching of image metadata (e.g., digests, tags) from Docker registries to reduce API calls and speed up repeated server starts.',
          default: true,
        },
        {
          key: 'docker.registry_image_fetch_cache.duration',
          description:
            'The duration (in seconds) that cached image metadata is considered valid before it is refreshed with a new request to the Docker registry.',
          default: 300,
        },
        {
          key: 'docker.registry_image_fetch_cache.background_refresh',
          description:
            'Whether a stale image is refreshed in the background instead of holding up the server boot. When enabled and the image already exists on the host, Wings boots the server from the local copy right away and pulls the newer image in a background task, so the update only takes effect on the next start. Images that are not on the host yet are still pulled before the server boots.',
          default: false,
        },
        {
          key: 'docker.tmpfs_size',
          description: 'The size (in `MiB`) of the `/tmp` directory mounted as a tmpfs in containers.',
          default: 100,
        },
        {
          key: 'docker.shm_size',
          description:
            "The size (in `MiB`) of `/dev/shm` inside containers. `0` leaves Docker's own default (64 MiB) in place. Raise it for games that map large amounts of shared memory.",
          default: 0,
        },
        {
          key: 'docker.container_pid_limit',
          description:
            'The maximum number of processes (PIDs) allowed to run simultaneously within a single container.',
          default: 5120,
        },
        {
          key: 'docker.container_apply_seccomp',
          description:
            'Whether to apply a modified seccomp profile with additional syscalls toggled from the panel, this can break on podman.',
          default: true,
        },
        {
          key: 'docker.container_apparmor_profile',
          description:
            'The name of an AppArmor profile to confine server containers with, passed to Docker as `apparmor=<profile>`. The profile must already be loaded on the host. Leaving this empty lets Docker apply its own `docker-default` profile.',
          default: '',
        },
        {
          key: 'docker.container_ulimits',
          description:
            'Per-container resource limits, applied to every server container Wings creates. Each entry is a `name`, a `soft` limit and a `hard` limit, matching the `--ulimit` flag of `docker run` (`-1` means unlimited). An empty list leaves the daemon defaults in place. A `nofile` hard limit larger than what the host lets Wings raise its own limit to is clamped down to that ceiling, with a warning logged once.',
          default: [],
          notesAfter: [
            {
              type: 'info',
              body: 'Each entry is a map, so a raised file descriptor limit looks like this:\n\n```yaml\ncontainer_ulimits:\n- name: nofile\n  soft: 65535\n  hard: 65535\n```',
            },
          ],
        },
        {
          key: 'docker.container_sysctls',
          description:
            'Kernel parameters set inside every server container, matching the `--sysctl` flag of `docker run`. Only namespaced sysctls can be set this way; the Docker daemon rejects the container outright for anything else. Entries starting with `net.` are skipped for containers that share a foreign network namespace (`host` or `container:<id>` network modes), since those sysctls belong to the namespace owner.',
          default: {},
        },
        {
          key: 'docker.numa_memory_binding',
          description:
            "Whether to bind a container's memory to the NUMA nodes its pinned CPU threads live on, keeping allocations local instead of spread across sockets. Only takes effect on a multi-node host for servers that have CPU pinning set; single-node machines and unpinned servers are unaffected.",
          default: true,
        },
        {
          key: 'docker.cpu_period',
          description:
            "The CFS scheduling period (in microseconds) used for container CPU limits. A server's CPU limit is turned into a quota of `limit% × cpu_period`, so a shorter period hands out CPU time in smaller, more frequent slices, at the cost of more scheduler overhead. Values are clamped to the kernel's accepted range of `1000` - `1000000`.",
          default: 100000,
        },
        {
          key: 'docker.cfs_burst.enabled',
          description:
            'Whether to grant containers CFS burst, letting a server bank unused CPU time within a period and spend it on a later spike instead of being throttled. Requires a kernel with CFS burst support (`cpu.max.burst` on cgroup v2, `cpu.cfs_burst_us` on v1); where it is unsupported, Wings leaves it alone and warns about it once. Servers without a CPU limit are unaffected, they are not throttled to begin with.',
          default: true,
        },
        {
          key: 'docker.cfs_burst.multiple',
          description:
            "The fraction of a server's CPU quota that may be banked as burst. `1.0` allows a full extra period's worth of CPU time, `0.5` half of it, `0` disables bursting for the same effect as turning `enabled` off. The kernel refuses a burst larger than the quota, so values above `1.0` are clamped.",
          default: float(1),
        },
        {
          key: 'docker.startup_boost.enabled',
          description:
            "Whether to lift a server's CPU limit while it is booting. With this on, a starting container runs without a CPU quota until it reports as running (or `docker.startup_boost.timeout` elapses), after which the configured limit and CFS burst are put back. This mainly helps single-threaded boot work like world generation or mod loading. Servers without a CPU limit are unaffected, they are already unthrottled.",
          default: false,
        },
        {
          key: 'docker.startup_boost.timeout',
          description:
            'The maximum time (in seconds) a server may stay boosted. Once the server leaves the starting state or this many seconds pass, whichever comes first, its CPU quota is restored.',
          default: 120,
        },
        {
          key: 'docker.startup_boost.max_concurrent',
          description:
            'The number of servers that may be boosted at the same time on this node. Servers that start while this many boosts are already active simply boot with their normal CPU limit, so a mass restart cannot hand out unlimited CPU to every server at once.',
          default: 3,
        },
        {
          key: 'docker.installer_limits.timeout',
          description:
            'The maximum time (in seconds) allowed for an installation container to run before it is considered failed (`0` = no limit).',
          default: 1800,
        },
        {
          key: 'docker.installer_limits.memory',
          description:
            "The memory limit (in `MiB`) for installer containers. This will be overwritten with the server's memory limit **if it is higher**.",
          default: 1024,
        },
        {
          key: 'docker.installer_limits.cpu',
          description:
            "The CPU limit (`%`) for installer containers. This will be overwritten with the server's CPU limit **if it is higher**.",
          default: 100,
        },
        {
          key: 'docker.overhead.override',
          description: 'The toggle to enable or disable custom memory overhead multipliers.',
          default: false,
        },
        {
          key: 'docker.overhead.default_multiplier',
          description:
            "The default multiplier applied to a server's memory limit to account for Docker container overhead.",
          default: 1.05,
        },
        {
          key: 'docker.overhead.multipliers',
          description:
            'A map of specific memory thresholds to custom multipliers, allowing for granular overhead control based on server size.',
          default: {},
        },
        {
          key: 'docker.userns_mode',
          description:
            'The user namespace mode for containers, used to isolate container users from host users for enhanced security. Left empty with `system.user.rootless.enabled` on, Wings derives `keep-id:uid=<container_uid>,gid=<container_gid>` from the rootless settings; setting it explicitly opts out of that and is passed through untouched.',
          default: '',
        },
        {
          key: 'docker.log_config.type',
          description: 'The Docker logging driver type used to capture and store container output.',
          default: 'local',
        },
        {
          key: 'docker.log_config.config.compress',
          description: 'Whether to enable compression for stored log files to save disk space.',
          default: 'false',
        },
        {
          key: 'docker.log_config.config.max-file',
          description: 'The maximum number of log files to retain before the oldest ones are rotated out.',
          default: '1',
        },
        {
          key: 'docker.log_config.config.max-size',
          description: 'The maximum size allowed for a single log file before it is rotated.',
          default: '5m',
        },
        {
          key: 'docker.log_config.config.mode',
          description:
            'The delivery mode for logs (e.g. `non-blocking`), determining how Docker handles log data when the buffer is full.',
          default: 'non-blocking',
        },
      ],
    },
    {
      title: 'Throttles',
      options: [
        {
          key: 'throttles.enabled',
          description: 'The toggle to enable or disable console output throttling for all containers.',
          default: true,
        },
        {
          key: 'throttles.lines',
          description: 'The maximum number of console lines stored in the buffer for each server.',
          default: 2000,
        },
        {
          key: 'throttles.line_reset_interval',
          description: 'The interval (in seconds) at which the console line counters are reset.',
          default: 100,
        },
      ],
    },
    {
      title: 'Remote Configuration',
      options: [
        {
          key: 'remote',
          description: 'The URL of the Panel instance that this Wings node communicates with.',
          default: 'https://panel.example.com',
        },
        {
          key: 'remote_headers',
          description: 'Custom HTTP headers that Wings includes in every outgoing HTTP request to the Panel.',
          default: {},
        },
        {
          key: 'remote_query.timeout',
          description:
            'The maximum number of retries for critical API requests. This uses an exponential backoff strategy.',
          default: 30,
        },
        {
          key: 'remote_query.boot_servers_per_page',
          description:
            'The number of servers Wings requests from the Panel API in a single batch during the initial boot sequence.',
          default: 50,
        },
        {
          key: 'remote_query.retry_limit',
          description:
            'The maximum number of times Wings will attempt to re-send a failed request to the Panel before giving up.',
          default: 10,
        },
      ],
    },
    {
      title: 'Security / Behaviour Flags',
      options: [
        {
          key: 'allowed_mounts',
          description:
            "A security whitelist defining which specific directories or files on the host system are permitted to be mounted into a server's Docker container.",
          default: [],
        },
        {
          key: 'allowed_origins',
          description:
            'A list of specific URLs (origins) that are permitted to make cross-origin requests to the Wings API. By default, the URL defined in the `remote:` setting is the only allowed origin.',
          default: [],
        },
        {
          key: 'allow_cors_private_network',
          description:
            'Determines whether Wings permits Cross-Origin Resource Sharing (CORS) requests originating from private network addresses.',
          default: false,
        },
        {
          key: 'ignore_panel_config_updates',
          description: 'When set to `true`, Wings will ignore configuration update commands sent by the Panel.',
          default: false,
          notesAfter: [
            {
              type: 'info',
              title: 'Options the panel can never change',
              body: 'Even with panel config updates enabled, a set of paths is stripped out of every patch the panel sends, so they can only be changed by editing `config.yml` on the node itself:\n\n- Node identity: `uuid`, `token`, `token_id`, `remote`, `remote_headers`\n- Paths: `system.root_directory`, `system.log_directory`, `system.data`, `system.diffs_directory`, `system.vmount_directory`, `system.archive_directory`, `system.backup_directory`, `system.tmp_directory`, `system.passwd.directory`, `system.backups.restic.repository`, `system.backups.restic.password_file`, `system.backups.mounting.path`\n- Host access: `system.username`, `system.user`, `system.passwd`, `docker.socket`, `allowed_mounts`\n- Listener and egress: `api.host`, `api.port`, `api.ssl`, `api.trusted_proxies`, `api.disable_remote_download`, `api.remote_download_blocked_cidrs`, `api.schedule.steps.http_request`\n- The flags themselves: `ignore_panel_config_updates`, `ignore_panel_wings_upgrades`\n\nThe rest of the patch still applies, the forbidden keys are dropped silently rather than failing the whole update.',
            },
          ],
        },
        {
          key: 'ignore_panel_wings_upgrades',
          description: 'When set to `true`, Wings will ignore remote upgrade commands sent by the Panel.',
          default: false,
        },
      ],
    },
    {
      title: 'SSL Configuration',
      body: "::: info\nThis section assumes you've already generated a certificate. See [Generating SSL Certificates](../additional/ssl-certificates.md) if you haven't. Replace `<domain>` with your actual node domain.\n:::\n\n### Enabling SSL\nSSL is disabled by default. To secure Wings' communication, set `enabled` to `true` under `api.ssl` and point `cert`/`key` to your certificate files.\n\nIf you're using Let's Encrypt, your config should look like this:\n\n```yaml\napi:\n  host: 0.0.0.0\n  port: 8080\n  ssl:\n    enabled: true\n    cert: /etc/letsencrypt/live/<domain>/fullchain.pem\n    key: /etc/letsencrypt/live/<domain>/privkey.pem\n```\n\n### Applying Changes\nAfter saving `config.yml`, restart Wings for the new SSL configuration to take effect:\n\n```bash\nsudo systemctl restart wings\n```",
    },
  ],
  example: {
    title: 'Example Config',
    body: 'The following is an example of a standard generated `config.yml` for Wings with standard values. A handful of defaults differ between platforms (mainly paths and the Unix-only `passwd`/`machine_id` sections), so both are shown below.',
    platforms: [
      { id: 'unix', label: 'Unix' },
      { id: 'windows', label: 'Windows' },
    ],
  },
};
