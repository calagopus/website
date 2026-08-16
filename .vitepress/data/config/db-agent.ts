import { type ConfigDoc, float, type YamlValue } from './types.ts';

const TLS_DEFAULTS: YamlValue = { enabled: false, ktls_enabled: false, cert: 'cert.pem', key: 'key.pem' };

export const dbAgentConfigDoc: ConfigDoc = {
  outFile: 'docs/db-agent/configuration.md',
  sourceFile: '.vitepress/data/config/db-agent.ts',
  title: 'Configuration',
  pageTitle: 'DB Agent Configuration',
  description:
    'Reference for every DB Agent configuration option in config.yml, with defaults, explanations, and a full example file.',
  intro:
    'This page is a reference for all DB Agent configuration options. The configuration file is located at `/etc/calagopus-db-agent/config.yml` by default (override with `-c`/`--config`).',
  sections: [
    {
      title: 'Core Configuration',
      options: [
        {
          key: 'debug',
          description: 'Enables debug mode for DB Agent. When enabled, detailed logs are printed for troubleshooting.',
          default: false,
        },
        {
          key: 'socket_dir',
          description:
            'The directory where DB Agent creates the Unix sockets that get bind-mounted into each database container.',
          default: '/run/calagopus-db-agent',
        },
        {
          key: 'data_dir',
          description:
            'The directory where DB Agent stores database data. This is bind-mounted into each database container and is where all database files are stored.',
          default: '/var/lib/calagopus-db-agent/data',
        },
        {
          key: 'log_dir',
          description: 'The directory where DB Agent stores its logs.',
          default: '/var/log/calagopus-db-agent',
        },
        {
          key: 'disk_check_interval',
          description: 'The interval (in seconds) at which DB Agent checks disk usage for its data directory.',
          default: 60,
        },
        {
          key: 'disk_check_concurrency',
          description:
            'The number of concurrent allowed disk scans DB Agent can perform. This limits the number of simultaneous disk usage checks to prevent excessive background resource consumption.',
          default: 5,
        },
        {
          key: 'websocket_log_count',
          description:
            'The number of log lines to send when a client connects to a database instance websocket. This provides the initial "backlog" of console history and also sizes the buffer of live log lines a slow client may fall behind by before it starts missing output.',
          default: 150,
        },
        {
          key: 'tcp_congestion_control',
          description:
            'The TCP congestion control algorithm applied to the listeners DB Agent owns: the management API and every enabled database proxy. Linux only, and the algorithm has to be available to the kernel - DB Agent looks it up in `/proc/sys/net/ipv4/tcp_available_congestion_control`, tries `modprobe tcp_<algorithm>` once if it is missing, and keeps the system default with a warning if it still is not there. Set to an empty string to leave congestion control alone entirely.',
          default: 'bbr',
        },
      ],
    },
    {
      title: 'Database Proxies',
      body: 'DB Agent runs a proxy for each supported database engine, routing incoming connections to the correct database container. Each proxy can be individually disabled and has its own bind address and optional TLS configuration.',
      options: [
        {
          key: 'postgres.enabled',
          description: 'Whether the PostgreSQL proxy is enabled.',
          default: true,
        },
        {
          key: 'postgres.bind',
          description: 'The address the PostgreSQL proxy listens on.',
          default: '0.0.0.0:5432',
        },
        {
          key: 'postgres.tls',
          description: 'TLS configuration for the PostgreSQL proxy. See [TLS Configuration](#tls-configuration).',
          example: TLS_DEFAULTS,
        },
        {
          key: 'mariadb.enabled',
          description: 'Whether the MariaDB/MySQL proxy is enabled.',
          default: true,
        },
        {
          key: 'mariadb.bind',
          description: 'The address the MariaDB/MySQL proxy listens on.',
          default: '0.0.0.0:3306',
        },
        {
          key: 'mariadb.tls',
          description: 'TLS configuration for the MariaDB/MySQL proxy. See [TLS Configuration](#tls-configuration).',
          example: TLS_DEFAULTS,
        },
        {
          key: 'mongodb.enabled',
          description: 'Whether the MongoDB proxy is enabled.',
          default: true,
        },
        {
          key: 'mongodb.bind',
          description: 'The address the MongoDB proxy listens on.',
          default: '0.0.0.0:27017',
        },
        {
          key: 'mongodb.tls',
          description: 'TLS configuration for the MongoDB proxy. See [TLS Configuration](#tls-configuration).',
          example: TLS_DEFAULTS,
        },
        {
          key: 'redis.enabled',
          description: 'Whether the Redis proxy is enabled.',
          default: true,
        },
        {
          key: 'redis.bind',
          description: 'The address the Redis proxy listens on.',
          default: '0.0.0.0:6379',
        },
        {
          key: 'redis.tls',
          description: 'TLS configuration for the Redis proxy. See [TLS Configuration](#tls-configuration).',
          example: TLS_DEFAULTS,
        },
      ],
    },
    {
      title: 'Database Configuration',
      body: 'DB Agent stores its own state (registered database instances, users, and their metadata) in a local SQLite database, separate from the databases it provisions.',
      options: [
        {
          key: 'database.url',
          description: "The connection URL for DB Agent's internal SQLite state database.",
          default: 'sqlite:///var/lib/calagopus-db-agent/data/database.db',
        },
        {
          key: 'database.migrate',
          description:
            'Whether DB Agent should automatically run pending migrations against its internal state database on startup.',
          default: true,
        },
      ],
    },
    {
      title: 'Docker Configuration',
      options: [
        {
          key: 'docker.socket',
          description:
            'The path to the Docker daemon socket or HTTP address. Point this at a Podman socket to use Podman instead of Docker.',
          default: '/var/run/docker.sock',
        },
        {
          key: 'docker.registries',
          description:
            'The Docker registry authentication configurations used for pulling private images, keyed by registry hostname.',
          default: {},
        },
        {
          key: 'docker.tmpfs_size',
          description: 'The size (in `MiB`) of the `/tmp` directory mounted as a tmpfs in database containers.',
          default: 100,
        },
        {
          key: 'docker.shm_size',
          description:
            "The size (in `MiB`) of `/dev/shm` inside database containers. `0` leaves Docker's own default (64 MiB) in place. Raise it for engines that lean on shared memory, PostgreSQL puts the dynamic shared memory segments its parallel query workers use there and the 64 MiB default is a common source of `could not resize shared memory segment` errors.",
          default: 0,
        },
        {
          key: 'docker.container_pid_limit',
          description:
            'The maximum number of processes (PIDs) allowed to run simultaneously within a single database container.',
          default: 512,
        },
        {
          key: 'docker.container_apparmor_profile',
          description:
            'The name of an AppArmor profile to confine database containers with, passed to Docker as `apparmor=<profile>`. The profile must already be loaded on the host. Leaving this empty lets Docker apply its own `docker-default` profile.',
          default: '',
        },
        {
          key: 'docker.container_ulimits',
          description:
            'Per-container resource limits, applied to every database container DB Agent creates. Each entry is a `name`, a `soft` limit and a `hard` limit, matching the `--ulimit` flag of `docker run` (`-1` means unlimited). An empty list leaves the daemon defaults in place. A `nofile` hard limit larger than what the host lets DB Agent raise its own limit to is clamped down to that ceiling (and the soft limit with it), with a warning logged once.',
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
            'Kernel parameters set inside every database container, matching the `--sysctl` flag of `docker run`. Only namespaced sysctls can be set this way; the Docker daemon rejects the container outright for anything else.',
          default: {},
        },
        {
          key: 'docker.timezone',
          description: "The default timezone passed into database containers when a database doesn't specify its own.",
          default: 'UTC',
        },
        {
          key: 'docker.userns_mode',
          description:
            'The user namespace mode for database containers, used to isolate container users from host users for enhanced security. Ignored when `docker.rootless.enabled` is `true`.',
          default: '',
        },
        {
          key: 'docker.cpu_period',
          description:
            "The CFS scheduling period (in microseconds) used for container CPU limits. A database's CPU limit is turned into a quota of `limit% × cpu_period`, so a shorter period hands out CPU time in smaller, more frequent slices, at the cost of more scheduler overhead. Values are clamped to the kernel's accepted range of `1000` - `1000000`.",
          default: 100000,
        },
        {
          key: 'docker.cfs_burst.enabled',
          description:
            'Whether to grant containers CFS burst, letting a database bank unused CPU time within a period and spend it on a later spike instead of being throttled. Requires a kernel with CFS burst support (`cpu.max.burst` on cgroup v2, `cpu.cfs_burst_us` on v1); where it is unsupported, DB Agent leaves it alone and warns about it once. Databases without a CPU limit are unaffected, they are not throttled to begin with.',
          default: true,
        },
        {
          key: 'docker.cfs_burst.multiple',
          description:
            "The fraction of a database's CPU quota that may be banked as burst. `1.0` allows a full extra quota's worth of CPU time, so one more period at the database's own limit, `0.5` half of it, `0` disables bursting for the same effect as turning `enabled` off. The kernel refuses a burst larger than the quota, so values above `1.0` are clamped, and negative values are treated as `0`.",
          default: float(1),
        },
        {
          key: 'docker.registry_image_fetch_cache.enabled',
          description:
            'Whether to enable caching of image metadata (e.g., digests, tags) from Docker registries to reduce API calls and speed up repeated database container starts.',
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
            'Whether a stale image is refreshed in the background instead of holding up the database boot. When enabled and the image already exists on the host, DB Agent starts the database from the local copy right away and pulls the newer image in a background task, so the update only takes effect on the next start. Images that are not on the host yet are still pulled before the database boots. With `registry_image_fetch_cache.enabled` set to `false` the background pull fires on every start instead of being rate-limited by `duration`.',
          default: false,
        },
        {
          key: 'docker.rootless.enabled',
          description:
            "Enables rootless container execution. When enabled, each database container is started with a `keep-id` user namespace mapping derived from that database's own image UID/GID, so it maps correctly to the unprivileged user running DB Agent. `chown` on the database's host data directories is still attempted, but a refusal from the rootless engine is absorbed instead of failing the start, the files are already owned by the mapped user in that case, and every later `chown` is skipped.",
          default: false,
        },
        {
          key: 'docker.log_config.type',
          description: 'The Docker logging driver type used to capture and store database container output.',
          default: 'local',
        },
        {
          key: 'docker.log_config.config',
          description: 'The configuration passed to the selected logging driver.',
          default: { compress: 'false', 'max-file': '1', 'max-size': '5m' },
        },
      ],
    },
    {
      title: 'API Configuration',
      options: [
        {
          key: 'api.bind',
          description: 'The address the management API binds to.',
          default: '0.0.0.0:8090',
        },
        {
          key: 'api.tls',
          description: 'TLS configuration for the management API itself. See [TLS Configuration](#tls-configuration).',
          example: TLS_DEFAULTS,
        },
        {
          key: 'api.token',
          description:
            'The API token clients must present to authenticate against the management API. Must be kept secret. Set it with `calagopus-db-agent configure --token <TOKEN>` rather than editing this by hand.',
          default: '',
        },
        {
          key: 'api.disable_openapi_docs',
          description: 'Controls the availability of the `/openapi.json` endpoint.',
          default: false,
        },
        {
          key: 'api.disable_remote_import',
          description:
            'Whether to prevent databases from being imported directly from a remote database through a connection string. When disabled, the import endpoint rejects every request instead of dumping the source.',
          default: false,
        },
        {
          key: 'api.remote_import_blocked_cidrs',
          description:
            'A security list of CIDR ranges that remote imports may not connect to, preventing SSRF (Server-Side Request Forgery) attacks against databases reachable from the node. Every host in the connection string is checked, and hostnames are resolved and vetted before the dump runs, with the vetted address pinned so a second lookup cannot return a different one. A hostname that fails to resolve is rejected as well.',
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
        {
          key: 'api.trusted_proxies',
          description:
            'A list of trusted CIDR ranges from proxy servers (like Cloudflare, NGINX, or a Load Balancer) that DB Agent uses to resolve the actual IP address of a client using the `X-Forwarded-For` or `X-Real-IP` header.',
          default: [],
        },
      ],
    },
    {
      title: 'Remote Management',
      body: 'These options control what the Panel is allowed to change on this node through the management API. They are written at the very end of the config file.',
      options: [
        {
          key: 'ignore_config_updates',
          description:
            'When set to `true`, DB Agent will ignore configuration update requests sent to the management API.',
          default: false,
          notesAfter: [
            {
              type: 'info',
              title: 'Options the Panel can never change',
              body: 'Even with config updates enabled, a set of paths is stripped out of every patch the Panel sends, so they can only be changed by editing `config.yml` on the node itself:\n\n- Paths: `socket_dir`, `data_dir`, `log_dir`\n- Host access: `docker.socket`\n- Listener and authentication: `api.bind`, `api.tls`, `api.token`, `api.trusted_proxies`\n- Remote imports: `api.disable_remote_import`, `api.remote_import_blocked_cidrs`\n- The flags themselves: `ignore_config_updates`, `ignore_upgrades`\n\nThe rest of the patch still applies, the forbidden keys are dropped silently rather than failing the whole update.',
            },
          ],
        },
        {
          key: 'ignore_upgrades',
          description:
            'When set to `true`, DB Agent will ignore remote upgrade requests sent to the management API, reporting the upgrade as not applied instead of replacing its own binary. Upgrades are unsupported in containerized environments regardless of this option.',
          default: false,
        },
      ],
    },
    {
      title: 'TLS Configuration',
      body: "::: info\nThis section assumes you've already generated a certificate. See [Generating SSL Certificates](../additional/ssl-certificates.md) if you haven't.\n:::\n\nEvery proxy (`postgres`, `mariadb`, `mongodb`, `redis`) as well as the management API (`api`) has its own independent `tls` block with the same four options:",
      inExample: false,
      options: [
        {
          key: 'tls.enabled',
          description: 'Whether TLS is enabled for this listener.',
          default: false,
        },
        {
          key: 'tls.ktls_enabled',
          description:
            "Whether to hand connections off to the kernel's TLS implementation (kTLS) once the handshake completes, so the kernel encrypts and decrypts records instead of userspace. This mainly helps with bulk transfers. Linux only, and it requires the `tls` kernel module; DB Agent probes for kernel support on boot, warns once and stays on userspace TLS if the kernel cannot do it, and falls back per connection when the negotiated cipher suite isn't kTLS compatible. Has no effect unless `enabled` is `true`.",
          default: false,
        },
        {
          key: 'tls.cert',
          description: 'The absolute filesystem path to the SSL certificate file.',
          default: 'cert.pem',
        },
        {
          key: 'tls.key',
          description: 'The absolute filesystem path to the SSL private key file corresponding to the certificate.',
          default: 'key.pem',
        },
      ],
    },
  ],
  example: {
    title: 'Example Config',
    body: 'The following is an example of a standard generated `config.yml` for DB Agent with default values:',
    platforms: [{ id: 'default', label: 'Default' }],
  },
};
