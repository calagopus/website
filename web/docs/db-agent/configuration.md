---
title: DB Agent Configuration
description: Reference for every DB Agent configuration option in config.yml, with defaults, explanations, and a full example file.
---

<!-- Generated from .vitepress/data/config/db-agent.ts by .vitepress/plugins/config-docs.ts - do not edit by hand. -->

# Configuration

This page is a reference for all DB Agent configuration options. The configuration file is located at `/etc/calagopus-db-agent/config.yml` by default (override with `-c`/`--config`).

## Core Configuration

### debug
Enables debug mode for DB Agent. When enabled, detailed logs are printed for troubleshooting.

Default value:
```yaml
debug: false
```

### socket_dir
The directory where DB Agent creates the Unix sockets that get bind-mounted into each database container.

Default value:
```yaml
socket_dir: /run/calagopus-db-agent
```

### data_dir
The directory where DB Agent stores database data. This is bind-mounted into each database container and is where all database files are stored.

Default value:
```yaml
data_dir: /var/lib/calagopus-db-agent/data
```

### log_dir
The directory where DB Agent stores its logs.

Default value:
```yaml
log_dir: /var/log/calagopus-db-agent
```

### disk_check_interval
The interval (in seconds) at which DB Agent checks disk usage for its data directory.

Default value:
```yaml
disk_check_interval: 60
```

### disk_check_concurrency
The number of concurrent allowed disk scans DB Agent can perform. This limits the number of simultaneous disk usage checks to prevent excessive background resource consumption.

Default value:
```yaml
disk_check_concurrency: 5
```

### websocket_log_count
The number of log lines to send when a client connects to a database instance websocket. This provides the initial "backlog" of console history and also sizes the buffer of live log lines a slow client may fall behind by before it starts missing output.

Default value:
```yaml
websocket_log_count: 150
```

### tcp_congestion_control
The TCP congestion control algorithm applied to the listeners DB Agent owns: the management API and every enabled database proxy. Linux only, and the algorithm has to be available to the kernel - DB Agent looks it up in `/proc/sys/net/ipv4/tcp_available_congestion_control`, tries `modprobe tcp_<algorithm>` once if it is missing, and keeps the system default with a warning if it still is not there. Set to an empty string to leave congestion control alone entirely.

Default value:
```yaml
tcp_congestion_control: bbr
```

## Database Proxies

DB Agent runs a proxy for each supported database engine, routing incoming connections to the correct database container. Each proxy can be individually disabled and has its own bind address and optional TLS configuration.

### postgres.enabled
Whether the PostgreSQL proxy is enabled.

Default value:
```yaml
enabled: true
```

### postgres.bind
The address the PostgreSQL proxy listens on.

Default value:
```yaml
bind: 0.0.0.0:5432
```

### postgres.tls
TLS configuration for the PostgreSQL proxy. See [TLS Configuration](#tls-configuration).

### mariadb.enabled
Whether the MariaDB/MySQL proxy is enabled.

Default value:
```yaml
enabled: true
```

### mariadb.bind
The address the MariaDB/MySQL proxy listens on.

Default value:
```yaml
bind: 0.0.0.0:3306
```

### mariadb.tls
TLS configuration for the MariaDB/MySQL proxy. See [TLS Configuration](#tls-configuration).

### mongodb.enabled
Whether the MongoDB proxy is enabled.

Default value:
```yaml
enabled: true
```

### mongodb.bind
The address the MongoDB proxy listens on.

Default value:
```yaml
bind: 0.0.0.0:27017
```

### mongodb.tls
TLS configuration for the MongoDB proxy. See [TLS Configuration](#tls-configuration).

### redis.enabled
Whether the Redis proxy is enabled.

Default value:
```yaml
enabled: true
```

### redis.bind
The address the Redis proxy listens on.

Default value:
```yaml
bind: 0.0.0.0:6379
```

### redis.tls
TLS configuration for the Redis proxy. See [TLS Configuration](#tls-configuration).

## Database Configuration

DB Agent stores its own state (registered database instances, users, and their metadata) in a local SQLite database, separate from the databases it provisions.

### database.url
The connection URL for DB Agent's internal SQLite state database.

Default value:
```yaml
url: sqlite:///var/lib/calagopus-db-agent/data/database.db
```

### database.migrate
Whether DB Agent should automatically run pending migrations against its internal state database on startup.

Default value:
```yaml
migrate: true
```

## Docker Configuration

### docker.socket
The path to the Docker daemon socket or HTTP address. Point this at a Podman socket to use Podman instead of Docker.

Default value:
```yaml
socket: /var/run/docker.sock
```

### docker.registries
The Docker registry authentication configurations used for pulling private images, keyed by registry hostname.

Default value:
```yaml
registries: {}
```

### docker.tmpfs_size
The size (in `MiB`) of the `/tmp` directory mounted as a tmpfs in database containers.

Default value:
```yaml
tmpfs_size: 100
```

### docker.shm_size
The size (in `MiB`) of `/dev/shm` inside database containers. `0` leaves Docker's own default (64 MiB) in place. Raise it for engines that lean on shared memory, PostgreSQL puts the dynamic shared memory segments its parallel query workers use there and the 64 MiB default is a common source of `could not resize shared memory segment` errors.

Default value:
```yaml
shm_size: 0
```

### docker.container_pid_limit
The maximum number of processes (PIDs) allowed to run simultaneously within a single database container.

Default value:
```yaml
container_pid_limit: 512
```

### docker.container_apparmor_profile
The name of an AppArmor profile to confine database containers with, passed to Docker as `apparmor=<profile>`. The profile must already be loaded on the host. Leaving this empty lets Docker apply its own `docker-default` profile.

Default value:
```yaml
container_apparmor_profile: ''
```

### docker.container_ulimits
Per-container resource limits, applied to every database container DB Agent creates. Each entry is a `name`, a `soft` limit and a `hard` limit, matching the `--ulimit` flag of `docker run` (`-1` means unlimited). An empty list leaves the daemon defaults in place. A `nofile` hard limit larger than what the host lets DB Agent raise its own limit to is clamped down to that ceiling (and the soft limit with it), with a warning logged once.

Default value:
```yaml
container_ulimits: []
```

::: info
Each entry is a map, so a raised file descriptor limit looks like this:

```yaml
container_ulimits:
- name: nofile
  soft: 65535
  hard: 65535
```
:::

### docker.container_sysctls
Kernel parameters set inside every database container, matching the `--sysctl` flag of `docker run`. Only namespaced sysctls can be set this way; the Docker daemon rejects the container outright for anything else.

Default value:
```yaml
container_sysctls: {}
```

### docker.timezone
The default timezone passed into database containers when a database doesn't specify its own.

Default value:
```yaml
timezone: UTC
```

### docker.userns_mode
The user namespace mode for database containers, used to isolate container users from host users for enhanced security. Ignored when `docker.rootless.enabled` is `true`.

Default value:
```yaml
userns_mode: ''
```

### docker.cpu_period
The CFS scheduling period (in microseconds) used for container CPU limits. A database's CPU limit is turned into a quota of `limit% × cpu_period`, so a shorter period hands out CPU time in smaller, more frequent slices, at the cost of more scheduler overhead. Values are clamped to the kernel's accepted range of `1000` - `1000000`.

Default value:
```yaml
cpu_period: 100000
```

### docker.cfs_burst.enabled
Whether to grant containers CFS burst, letting a database bank unused CPU time within a period and spend it on a later spike instead of being throttled. Requires a kernel with CFS burst support (`cpu.max.burst` on cgroup v2, `cpu.cfs_burst_us` on v1); where it is unsupported, DB Agent leaves it alone and warns about it once. Databases without a CPU limit are unaffected, they are not throttled to begin with.

Default value:
```yaml
enabled: true
```

### docker.cfs_burst.multiple
The fraction of a database's CPU quota that may be banked as burst. `1.0` allows a full extra quota's worth of CPU time, so one more period at the database's own limit, `0.5` half of it, `0` disables bursting for the same effect as turning `enabled` off. The kernel refuses a burst larger than the quota, so values above `1.0` are clamped, and negative values are treated as `0`.

Default value:
```yaml
multiple: 1.0
```

### docker.registry_image_fetch_cache.enabled
Whether to enable caching of image metadata (e.g., digests, tags) from Docker registries to reduce API calls and speed up repeated database container starts.

Default value:
```yaml
enabled: true
```

### docker.registry_image_fetch_cache.duration
The duration (in seconds) that cached image metadata is considered valid before it is refreshed with a new request to the Docker registry.

Default value:
```yaml
duration: 300
```

### docker.registry_image_fetch_cache.background_refresh
Whether a stale image is refreshed in the background instead of holding up the database boot. When enabled and the image already exists on the host, DB Agent starts the database from the local copy right away and pulls the newer image in a background task, so the update only takes effect on the next start. Images that are not on the host yet are still pulled before the database boots. With `registry_image_fetch_cache.enabled` set to `false` the background pull fires on every start instead of being rate-limited by `duration`.

Default value:
```yaml
background_refresh: false
```

### docker.rootless.enabled
Enables rootless container execution. When enabled, each database container is started with a `keep-id` user namespace mapping derived from that database's own image UID/GID, so it maps correctly to the unprivileged user running DB Agent. `chown` on the database's host data directories is still attempted, but a refusal from the rootless engine is absorbed instead of failing the start, the files are already owned by the mapped user in that case, and every later `chown` is skipped.

Default value:
```yaml
enabled: false
```

### docker.log_config.type
The Docker logging driver type used to capture and store database container output.

Default value:
```yaml
type: local
```

### docker.log_config.config
The configuration passed to the selected logging driver.

Default value:
```yaml
config:
  compress: 'false'
  max-file: '1'
  max-size: 5m
```

## API Configuration

### api.bind
The address the management API binds to.

Default value:
```yaml
bind: 0.0.0.0:8090
```

### api.tls
TLS configuration for the management API itself. See [TLS Configuration](#tls-configuration).

### api.token
The API token clients must present to authenticate against the management API. Must be kept secret. Set it with `calagopus-db-agent configure --token <TOKEN>` rather than editing this by hand.

Default value:
```yaml
token: ''
```

### api.disable_openapi_docs
Controls the availability of the `/openapi.json` endpoint.

Default value:
```yaml
disable_openapi_docs: false
```

### api.disable_remote_import
Whether to prevent databases from being imported directly from a remote database through a connection string. When disabled, the import endpoint rejects every request instead of dumping the source.

Default value:
```yaml
disable_remote_import: false
```

### api.remote_import_blocked_cidrs
A security list of CIDR ranges that remote imports may not connect to, preventing SSRF (Server-Side Request Forgery) attacks against databases reachable from the node. Every host in the connection string is checked, and hostnames are resolved and vetted before the dump runs, with the vetted address pinned so a second lookup cannot return a different one. A hostname that fails to resolve is rejected as well.

Default value:
```yaml
remote_import_blocked_cidrs:
- 0.0.0.0/8
- 127.0.0.0/8
- 10.0.0.0/8
- 100.64.0.0/10
- 172.16.0.0/12
- 192.168.0.0/16
- 169.254.0.0/16
- ::1
- fe80::/10
- fc00::/7
```

### api.trusted_proxies
A list of trusted CIDR ranges from proxy servers (like Cloudflare, NGINX, or a Load Balancer) that DB Agent uses to resolve the actual IP address of a client using the `X-Forwarded-For` or `X-Real-IP` header.

Default value:
```yaml
trusted_proxies: []
```

## Remote Management

These options control what the Panel is allowed to change on this node through the management API. They are written at the very end of the config file.

### ignore_config_updates
When set to `true`, DB Agent will ignore configuration update requests sent to the management API.

Default value:
```yaml
ignore_config_updates: false
```

::: info Options the Panel can never change
Even with config updates enabled, a set of paths is stripped out of every patch the Panel sends, so they can only be changed by editing `config.yml` on the node itself:

- Paths: `socket_dir`, `data_dir`, `log_dir`
- Host access: `docker.socket`
- Listener and authentication: `api.bind`, `api.tls`, `api.token`, `api.trusted_proxies`
- Remote imports: `api.disable_remote_import`, `api.remote_import_blocked_cidrs`
- The flags themselves: `ignore_config_updates`, `ignore_upgrades`

The rest of the patch still applies, the forbidden keys are dropped silently rather than failing the whole update.
:::

### ignore_upgrades
When set to `true`, DB Agent will ignore remote upgrade requests sent to the management API, reporting the upgrade as not applied instead of replacing its own binary. Upgrades are unsupported in containerized environments regardless of this option.

Default value:
```yaml
ignore_upgrades: false
```

## TLS Configuration

::: info
This section assumes you've already generated a certificate. See [Generating SSL Certificates](../additional/ssl-certificates.md) if you haven't.
:::

Every proxy (`postgres`, `mariadb`, `mongodb`, `redis`) as well as the management API (`api`) has its own independent `tls` block with the same four options:

### tls.enabled
Whether TLS is enabled for this listener.

Default value:
```yaml
enabled: false
```

### tls.ktls_enabled
Whether to hand connections off to the kernel's TLS implementation (kTLS) once the handshake completes, so the kernel encrypts and decrypts records instead of userspace. This mainly helps with bulk transfers. Linux only, and it requires the `tls` kernel module; DB Agent probes for kernel support on boot, warns once and stays on userspace TLS if the kernel cannot do it, and falls back per connection when the negotiated cipher suite isn't kTLS compatible. Has no effect unless `enabled` is `true`.

Default value:
```yaml
ktls_enabled: false
```

### tls.cert
The absolute filesystem path to the SSL certificate file.

Default value:
```yaml
cert: cert.pem
```

### tls.key
The absolute filesystem path to the SSL private key file corresponding to the certificate.

Default value:
```yaml
key: key.pem
```

## Example Config

The following is an example of a standard generated `config.yml` for DB Agent with default values:

```yaml
debug: false
socket_dir: /run/calagopus-db-agent
data_dir: /var/lib/calagopus-db-agent/data
log_dir: /var/log/calagopus-db-agent
disk_check_interval: 60
disk_check_concurrency: 5
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
  container_apparmor_profile: ''
  container_ulimits: []
  container_sysctls: {}
  timezone: UTC
  userns_mode: ''
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
      compress: 'false'
      max-file: '1'
      max-size: 5m
api:
  bind: 0.0.0.0:8090
  tls:
    enabled: false
    ktls_enabled: false
    cert: cert.pem
    key: key.pem
  token: ''
  disable_openapi_docs: false
  disable_remote_import: false
  remote_import_blocked_cidrs:
  - 0.0.0.0/8
  - 127.0.0.0/8
  - 10.0.0.0/8
  - 100.64.0.0/10
  - 172.16.0.0/12
  - 192.168.0.0/16
  - 169.254.0.0/16
  - ::1
  - fe80::/10
  - fc00::/7
  trusted_proxies: []
ignore_config_updates: false
ignore_upgrades: false
```
