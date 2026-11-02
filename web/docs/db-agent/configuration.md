---
title: DB Agent Configuration
description: Reference for every DB Agent configuration option in config.yml, with defaults, explanations, and a full example file.
---

<!-- Generated from .vitepress/data/config/db-agent.ts by .vitepress/plugins/config-docs.ts - do not edit by hand. -->

# Configuration

This page is a reference for all DB Agent configuration options. The configuration file is located at `/etc/calagopus-db-agent/config.yml` by default (override with `-c`/`--config`).

## Core Configuration

### debug <Badge type="info" text="Optional" />

Enables debug mode for DB Agent. When enabled, detailed logs are printed for troubleshooting.

Default: `false`

### socket_dir <Badge type="info" text="Optional" />

The directory where DB Agent creates the Unix sockets that get bind-mounted into each database container.

Default: `/run/calagopus-db-agent`

### data_dir <Badge type="info" text="Optional" />

The directory where DB Agent stores database data. This is bind-mounted into each database container and is where all database files are stored.

Default: `/var/lib/calagopus-db-agent/data`

### log_dir <Badge type="info" text="Optional" />

The directory where DB Agent stores its logs.

Default: `/var/log/calagopus-db-agent`

### disk_check_interval <Badge type="info" text="Optional" />

The interval in seconds between database instance disk checks, with a minimum of 1 second. A running instance at or above its nonzero disk limit is stopped, and cannot start again while full. These periodic checks can allow temporary overage; they are not a hard filesystem quota.

Default: `60`

### disk_check_concurrency <Badge type="info" text="Optional" />

The number of concurrent allowed disk scans DB Agent can perform. This limits the number of simultaneous disk usage checks to prevent excessive background resource consumption. Values below 1 are treated as 1.

Default: `5`

### boot_autostart_concurrency <Badge type="info" text="Optional" />

The number of database instances DB Agent may start at the same time while restoring state on boot. On startup DB Agent reads the state each instance was last recorded in and restarts the ones that were running or starting but no longer have a live container, spreading those starts across this many slots so a node reboot does not try to bring every database up at once. Set to `0` to disable restoring instances on boot entirely.

Default: `5`

### websocket_log_count <Badge type="info" text="Optional" />

The number of log lines to send when a client connects to a database instance websocket. This provides the initial "backlog" of console history and also sizes the buffer of live log lines a slow client may fall behind by before it starts missing output.

Default: `150`

### tcp_congestion_control <Badge type="info" text="Optional" />

The TCP congestion control algorithm applied to the listeners DB Agent owns: the management API and every enabled database proxy. Linux only, and the algorithm has to be available to the kernel: DB Agent looks it up in `/proc/sys/net/ipv4/tcp_available_congestion_control`, tries `modprobe tcp_<algorithm>` once if it is missing, and keeps the system default with a warning if it still is not there. Set to an empty string to leave congestion control alone entirely.

Default: `bbr`

## Database Proxies

DB Agent runs a proxy for each supported database engine, routing incoming connections to the correct database container. Each proxy can be individually disabled and has its own bind address and optional TLS configuration.

### postgres.enabled <Badge type="info" text="Optional" />

Whether the PostgreSQL proxy is enabled.

Default: `true`

### postgres.bind <Badge type="info" text="Optional" />

The address the PostgreSQL proxy listens on.

Default: `0.0.0.0:5432`

### postgres.tls <Badge type="info" text="Optional" />

TLS configuration for the PostgreSQL proxy. See [TLS Configuration](#tls-configuration).

### mariadb.enabled <Badge type="info" text="Optional" />

Whether the MariaDB/MySQL proxy is enabled.

Default: `true`

### mariadb.bind <Badge type="info" text="Optional" />

The address the MariaDB/MySQL proxy listens on.

Default: `0.0.0.0:3306`

### mariadb.tls <Badge type="info" text="Optional" />

TLS configuration for the MariaDB/MySQL proxy. See [TLS Configuration](#tls-configuration).

### mongodb.enabled <Badge type="info" text="Optional" />

Whether the MongoDB proxy is enabled.

Default: `true`

### mongodb.bind <Badge type="info" text="Optional" />

The address the MongoDB proxy listens on.

Default: `0.0.0.0:27017`

### mongodb.tls <Badge type="info" text="Optional" />

TLS configuration for the MongoDB proxy. See [TLS Configuration](#tls-configuration).

### redis.enabled <Badge type="info" text="Optional" />

Whether the Redis proxy is enabled.

Default: `true`

### redis.bind <Badge type="info" text="Optional" />

The address the Redis proxy listens on.

Default: `0.0.0.0:6379`

### redis.tls <Badge type="info" text="Optional" />

TLS configuration for the Redis proxy. See [TLS Configuration](#tls-configuration).

## Database Configuration

DB Agent stores its own state (registered database instances, users, and their metadata) in a local SQLite database, separate from the databases it provisions.

### database.url <Badge type="info" text="Optional" />

The connection URL for DB Agent's internal SQLite state database.

Default: `sqlite:///var/lib/calagopus-db-agent/data/database.db`

### database.migrate <Badge type="info" text="Optional" />

Whether DB Agent should automatically run pending migrations against its internal state database on startup.

Default: `true`

## Docker Configuration

### docker.socket <Badge type="info" text="Optional" />

The path to the Docker daemon socket or HTTP address. Point this at a Podman socket to use Podman instead of Docker.

Default: `/var/run/docker.sock`

### docker.registries <Badge type="info" text="Optional" />

The Docker registry authentication configurations used for pulling private images, keyed by registry hostname. Each entry needs a `username` and a `password`.

Default: `{}`

### docker.tmpfs_size <Badge type="info" text="Optional" />

The size (in `MiB`) of the `/tmp` directory mounted as a tmpfs in database containers.

Default: `100`

### docker.shm_size <Badge type="info" text="Optional" />

The size (in `MiB`) of `/dev/shm` inside database containers. `0` leaves Docker's own default (64 MiB) in place. Raise it for engines that lean on shared memory, PostgreSQL puts the dynamic shared memory segments its parallel query workers use there and the 64 MiB default is a common source of `could not resize shared memory segment` errors.

Default: `0`

### docker.container_pid_limit <Badge type="info" text="Optional" />

The maximum number of processes (PIDs) allowed to run simultaneously within a single database container.

Default: `512`

### docker.container_apparmor_profile <Badge type="info" text="Optional" />

The name of an AppArmor profile to confine database containers with, passed to Docker as `apparmor=<profile>`. The profile must already be loaded on the host. Leaving this empty lets Docker apply its own `docker-default` profile.

Default: `""`

### docker.container_ulimits <Badge type="info" text="Optional" />

Per-container resource limits, applied to every database container DB Agent creates. Each entry is a `name`, a `soft` limit and a `hard` limit, matching the `--ulimit` flag of `docker run` (`-1` means unlimited). An empty list leaves the daemon defaults in place. A `nofile` hard limit larger than what the host lets DB Agent raise its own limit to is clamped down to that ceiling (and the soft limit with it), with a warning logged once.

Default: `[]`

::: info
Each entry is a map, so a raised file descriptor limit looks like this:

```yaml
container_ulimits:
- name: nofile
  soft: 65535
  hard: 65535
```
:::

### docker.container_sysctls <Badge type="info" text="Optional" />

Kernel parameters set inside every database container, matching the `--sysctl` flag of `docker run`. Only namespaced sysctls can be set this way; the Docker daemon rejects the container outright for anything else.

Default: `{}`

### docker.timezone <Badge type="info" text="Optional" />

The timezone passed into database containers when an instance does not specify its own. Generated from `TZ`, then a nonempty first line of `/etc/timezone`, then the current local UTC offset. The example uses `UTC`; the generated value depends on the host.

### docker.userns_mode <Badge type="info" text="Optional" />

The user namespace mode for database containers, used to isolate container users from host users for enhanced security. Ignored when `docker.rootless.enabled` is `true`.

Default: `""`

### docker.cpu_period <Badge type="info" text="Optional" />

The CFS scheduling period (in microseconds) used for container CPU limits. A database's CPU limit is turned into a quota of `limit% × cpu_period`, so a shorter period hands out CPU time in smaller, more frequent slices, at the cost of more scheduler overhead. Values are clamped to the kernel's accepted range of `1000` - `1000000`.

Default: `100000`

### docker.cfs_burst.enabled <Badge type="info" text="Optional" />

Whether to grant containers CFS burst, letting a database bank unused CPU time within a period and spend it on a later spike instead of being throttled. Requires a kernel with CFS burst support (`cpu.max.burst` on cgroup v2, `cpu.cfs_burst_us` on v1); where it is unsupported, DB Agent leaves it alone and warns about it once. Databases without a CPU limit are unaffected, they are not throttled to begin with.

Default: `true`

### docker.cfs_burst.multiple <Badge type="info" text="Optional" />

The fraction of a database's CPU quota that may be banked as burst. `1.0` allows a full extra quota's worth of CPU time, so one more period at the database's own limit, `0.5` half of it, `0` disables bursting for the same effect as turning `enabled` off. The kernel refuses a burst larger than the quota, so values above `1.0` are clamped, and negative values are treated as `0`.

Default: `1.0`

### docker.registry_image_fetch_cache.enabled <Badge type="info" text="Optional" />

Whether to enable caching of image metadata (e.g., digests, tags) from Docker registries to reduce API calls and speed up repeated database container starts.

Default: `true`

### docker.registry_image_fetch_cache.duration <Badge type="info" text="Optional" />

The duration (in seconds) that cached image metadata is considered valid before it is refreshed with a new request to the Docker registry.

Default: `300`

### docker.registry_image_fetch_cache.background_refresh <Badge type="info" text="Optional" />

Whether a stale image is refreshed in the background instead of holding up the database boot. When enabled and the image already exists on the host, DB Agent starts the database from the local copy right away and pulls the newer image in a background task, so the update only takes effect on the next start. Images that are not on the host yet are still pulled before the database boots. With `registry_image_fetch_cache.enabled` set to `false` the background pull fires on every start instead of being rate-limited by `duration`.

Default: `false`

### docker.rootless.enabled <Badge type="info" text="Optional" />

Enables rootless container execution. When enabled, each database container is started with a `keep-id` user namespace mapping derived from that database's own image UID/GID, so it maps correctly to the unprivileged user running DB Agent. `chown` on the database's host data directories is still attempted, but a refusal from the rootless engine is absorbed instead of failing the start, the files are already owned by the mapped user in that case, and every later `chown` is skipped. See [Running DB Agent Rootless](./advanced/running-db-agent-rootless.md) for a full setup.

Default: `false`

### docker.log_config.type <Badge type="info" text="Optional" />

The Docker logging driver type used to capture and store database container output.

Default: `local`

### docker.log_config.config <Badge type="info" text="Optional" />

The configuration passed to the selected logging driver.

Default:

```yaml
config:
  compress: "false"
  max-file: "1"
  max-size: 5m
```

## API Configuration

### api.bind <Badge type="info" text="Optional" />

The address the management API binds to.

Default: `0.0.0.0:8090`

### api.tls <Badge type="info" text="Optional" />

TLS configuration for the management API itself. See [TLS Configuration](#tls-configuration).

### api.token <Badge type="tip" text="Required" />

The API token clients must present to authenticate against the management API. While it is empty, the API rejects every request. Must be kept secret. Set it with `sudo calagopus-db-agent configure --token <TOKEN>` rather than editing this by hand.

### api.disable_openapi_docs <Badge type="info" text="Optional" />

Controls the availability of the `/openapi.json` endpoint.

Default: `false`

### api.request_log_limit <Badge type="info" text="Optional" />

The number of HTTP requests the agent writes a log line for each second, which keeps a busy agent from drowning its own log. Once the budget for a second is spent the remaining requests are counted rather than logged, and the count is reported as a `suppressed N http request log lines (api.request_log_limit = 250)` line the next time a request gets through; if traffic stops, the summary waits until it resumes. The budget covers the whole process, not each route or client. Set to `0` to log every request.

Default: `250`

### api.disable_remote_import <Badge type="info" text="Optional" />

Whether to prevent databases from being imported directly from a remote database through a connection string. When set to `true`, the import endpoint rejects every request instead of dumping the source.

Default: `false`

### api.remote_import_blocked_cidrs <Badge type="info" text="Optional" />

A security list of CIDR ranges that remote imports may not connect to, preventing SSRF (Server-Side Request Forgery) attacks against databases reachable from the node. Every host in the connection string is checked, and hostnames are resolved and vetted before the dump runs, with the vetted address pinned so a second lookup cannot return a different one. A hostname that fails to resolve is rejected as well.

Default:

```yaml
remote_import_blocked_cidrs:
- 0.0.0.0/8
- 127.0.0.0/8
- 10.0.0.0/8
- 100.64.0.0/10
- 172.16.0.0/12
- 192.168.0.0/16
- 169.254.0.0/16
- 192.0.0.0/24
- 198.18.0.0/15
- 224.0.0.0/4
- 240.0.0.0/4
- "::"
- "::1"
- fe80::/10
- fc00::/7
- 2002::/16
- ff00::/8
```

### api.trusted_proxies <Badge type="info" text="Optional" />

A list of trusted CIDR ranges from proxy servers (like Cloudflare, NGINX, or a Load Balancer) that DB Agent uses to resolve the actual IP address of a client using the `X-Forwarded-For` or `X-Real-IP` header.

Default: `[]`

## Remote Management

These options control what the Panel is allowed to change on this node through the management API. They are written at the very end of the config file.

### ignore_config_updates <Badge type="info" text="Optional" />

When set to `true`, DB Agent will ignore configuration update requests sent to the management API.

Default: `false`

::: info Options the Panel can never change
Even with config updates enabled, a set of paths is stripped out of every patch the Panel sends, so they can only be changed by editing `config.yml` on the node itself:

- Paths: `socket_dir`, `data_dir`, `log_dir`
- Host access: `docker.socket`
- Listener and authentication: `api.bind`, `api.tls`, `api.token`, `api.trusted_proxies`
- Remote imports: `api.disable_remote_import`, `api.remote_import_blocked_cidrs`
- The flags themselves: `ignore_config_updates`, `ignore_upgrades`

The rest of the patch still applies, the forbidden keys are dropped silently rather than failing the whole update.
:::

### ignore_upgrades <Badge type="info" text="Optional" />

When set to `true`, DB Agent will ignore remote upgrade requests sent to the management API, reporting the upgrade as not applied instead of replacing its own binary. Upgrades are unsupported in containerized environments regardless of this option.

Default: `false`

## TLS Configuration

::: info
This section is a quick reference. [Securing DB Agent with SSL](./next-steps/ssl.md) covers the full setup, including getting a certificate, Docker installs, pointing the Panel at the agent and renewal.
:::

Every proxy (`postgres`, `mariadb`, `mongodb`, `redis`) as well as the management API (`api`) has its own independent `tls` block with the same four options:

### tls.enabled <Badge type="info" text="Optional" />

Whether TLS is enabled for this listener.

Default: `false`

### tls.ktls_enabled <Badge type="info" text="Optional" />

Whether to hand connections off to the kernel's TLS implementation (kTLS) once the handshake completes, so the kernel encrypts and decrypts records instead of userspace. This mainly helps with bulk transfers. Linux only, and it requires the `tls` kernel module; DB Agent probes for kernel support on boot, warns once and stays on userspace TLS if the kernel cannot do it, and falls back per connection when the negotiated cipher suite isn't kTLS compatible. Has no effect unless `enabled` is `true`.

Default: `false`

### tls.cert <Badge type="info" text="Optional" />

The absolute filesystem path to the SSL certificate file.

Default: `cert.pem`

### tls.key <Badge type="info" text="Optional" />

The absolute filesystem path to the SSL private key file corresponding to the certificate.

Default: `key.pem`

## Example Config

The following is an example of a standard generated `config.yml` for DB Agent with default values:

::: details Show the example config
```yaml
debug: false
socket_dir: /run/calagopus-db-agent
data_dir: /var/lib/calagopus-db-agent/data
log_dir: /var/log/calagopus-db-agent
disk_check_interval: 60
disk_check_concurrency: 5
boot_autostart_concurrency: 5
websocket_log_count: 150
tcp_congestion_control: bbr
postgres:
  enabled: true
  bind: 0.0.0.0:5432
  tls:
    enabled: false
    ktls_enabled: false
    cert: cert.pem
    key: key.pem
mariadb:
  enabled: true
  bind: 0.0.0.0:3306
  tls:
    enabled: false
    ktls_enabled: false
    cert: cert.pem
    key: key.pem
mongodb:
  enabled: true
  bind: 0.0.0.0:27017
  tls:
    enabled: false
    ktls_enabled: false
    cert: cert.pem
    key: key.pem
redis:
  enabled: true
  bind: 0.0.0.0:6379
  tls:
    enabled: false
    ktls_enabled: false
    cert: cert.pem
    key: key.pem
database:
  url: sqlite:///var/lib/calagopus-db-agent/data/database.db
  migrate: true
docker:
  socket: /var/run/docker.sock
  registries: {}
  tmpfs_size: 100
  shm_size: 0
  container_pid_limit: 512
  container_apparmor_profile: ""
  container_ulimits: []
  container_sysctls: {}
  timezone: UTC
  userns_mode: ""
  cpu_period: 100000
  cfs_burst:
    enabled: true
    multiple: 1.0
  registry_image_fetch_cache:
    enabled: true
    duration: 300
    background_refresh: false
  rootless:
    enabled: false
  log_config:
    type: local
    config:
      compress: "false"
      max-file: "1"
      max-size: 5m
api:
  bind: 0.0.0.0:8090
  tls:
    enabled: false
    ktls_enabled: false
    cert: cert.pem
    key: key.pem
  token: ""
  disable_openapi_docs: false
  request_log_limit: 250
  disable_remote_import: false
  remote_import_blocked_cidrs:
  - 0.0.0.0/8
  - 127.0.0.0/8
  - 10.0.0.0/8
  - 100.64.0.0/10
  - 172.16.0.0/12
  - 192.168.0.0/16
  - 169.254.0.0/16
  - 192.0.0.0/24
  - 198.18.0.0/15
  - 224.0.0.0/4
  - 240.0.0.0/4
  - "::"
  - "::1"
  - fe80::/10
  - fc00::/7
  - 2002::/16
  - ff00::/8
  trusted_proxies: []
ignore_config_updates: false
ignore_upgrades: false
```
:::
