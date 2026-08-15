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

### docker.container_pid_limit
The maximum number of processes (PIDs) allowed to run simultaneously within a single database container.

Default value:
```yaml
container_pid_limit: 512
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

### docker.rootless.enabled
Enables rootless container execution. When enabled, each database container is started with a `keep-id` user namespace mapping derived from that database's own image UID/GID, so it maps correctly to the unprivileged user running DB Agent, and DB Agent skips `chown`-ing the database's host data directories (which would fail without root).

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

### ignore_upgrades
When set to `true`, DB Agent will ignore remote upgrade requests sent to the management API, reporting the upgrade as not applied instead of replacing its own binary. Upgrades are unsupported in containerized environments regardless of this option.

Default value:
```yaml
ignore_upgrades: false
```

::: info
This option used to live under `api.ignore_upgrades`. An existing config file is migrated automatically on startup, moving the value to the top level and logging a warning about it.
:::

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
Whether to hand connections off to the kernel's TLS implementation (kTLS) once the handshake completes, so the kernel encrypts and decrypts records instead of userspace. This mainly helps with bulk transfers. Linux only, and it requires the `tls` kernel module; DB Agent probes for kernel support on boot and silently falls back to userspace TLS if the kernel or the negotiated cipher suite doesn't support it. Has no effect unless `enabled` is `true`.

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
  container_pid_limit: 512
  timezone: UTC
  userns_mode: ''
  registry_image_fetch_cache:
    enabled: true
    duration: 300
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
