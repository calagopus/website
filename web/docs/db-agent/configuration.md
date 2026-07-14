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

### ignore_config_updates
When set to `true`, DB Agent will ignore configuration update requests sent to the management API.

Default value:
```yaml
ignore_config_updates: false
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
url: sqlite://./data/database.db
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
  max-size: 5m
  max-file: '1'
  compress: 'false'
```

## API Configuration

### api.bind
The address the management API binds to.

Default value:
```yaml
bind: 0.0.0.0:8090
```

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

### api.ignore_upgrades
When set to `true`, DB Agent will ignore remote upgrade requests sent to the management API.

Default value:
```yaml
ignore_upgrades: false
```

### api.tls
TLS configuration for the management API itself. See [TLS Configuration](#tls-configuration).

### api.trusted_proxies
A list of trusted CIDR ranges from proxy servers (like Cloudflare, NGINX, or a Load Balancer) that DB Agent uses to resolve the actual IP address of a client using the `X-Forwarded-For` or `X-Real-IP` header.

Default value:
```yaml
trusted_proxies: []
```

## TLS Configuration

::: info
This section assumes you've already generated a certificate. See [Generating SSL Certificates](../additional/ssl-certificates.md) if you haven't.
:::

Every proxy (`postgres`, `mariadb`, `mongodb`, `redis`) as well as the management API (`api`) has its own independent `tls` block with the same three options:

### tls.enabled
Whether TLS is enabled for this listener.

Default value:
```yaml
enabled: false
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
ignore_config_updates: false
disk_check_interval: 60
disk_check_concurrency: 5
postgres:
  enabled: true
  bind: 0.0.0.0:5432
  tls:
    enabled: false
    cert: cert.pem
    key: key.pem
mariadb:
  enabled: true
  bind: 0.0.0.0:3306
  tls:
    enabled: false
    cert: cert.pem
    key: key.pem
mongodb:
  enabled: true
  bind: 0.0.0.0:27017
  tls:
    enabled: false
    cert: cert.pem
    key: key.pem
redis:
  enabled: true
  bind: 0.0.0.0:6379
  tls:
    enabled: false
    cert: cert.pem
    key: key.pem
database:
  url: sqlite://./data/database.db
  migrate: true
docker:
  socket: /var/run/docker.sock
  registries: {}
  tmpfs_size: 100
  container_pid_limit: 512
  timezone: UTC
  userns_mode: ''
  rootless:
    enabled: false
  log_config:
    type: local
    config:
      max-size: 5m
      max-file: '1'
      compress: 'false'
api:
  bind: 0.0.0.0:8090
  token: ''
  disable_openapi_docs: false
  ignore_upgrades: false
  tls:
    enabled: false
    cert: cert.pem
    key: key.pem
  trusted_proxies: []
```
