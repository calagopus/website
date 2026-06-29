# Environment

The Panel is configured through environment variables, either in a `.env` file in the installation directory or directly in the system environment. This page documents every variable.

## REDIS_MODE

How the Panel connects to the Redis/Valkey cache.

- `redis` - Single instance. Also requires `REDIS_URL`.
- `sentinel` - Redis Sentinel cluster for high availability. Also requires `REDIS_SENTINEL_CLUSTER` and `REDIS_SENTINELS`.

Default:
```plaintext
REDIS_MODE=redis
```

## REDIS_URL

Connection URL for a single Redis/Valkey instance when `REDIS_MODE=redis`.

```plaintext
redis://[:password@]host:port/db_number
```

If unset, the Panel will not connect to Redis and all caching falls back to in-memory (see `APP_USE_INTERNAL_CACHE`). Not recommended for production due to rate-limiting limitations.

## REDIS_SENTINEL_CLUSTER

The name of the Redis Sentinel cluster when `REDIS_MODE=sentinel`. Used to identify the master node.

## REDIS_SENTINELS

Comma-separated list of Sentinel nodes when `REDIS_MODE=sentinel`. Each node in `host:port` format:

```plaintext
sentinel1.example.com:26379,sentinel2.example.com:26379,sentinel3.example.com:26379
```

## SENTRY_URL

Sentry DSN for error tracking. Leave unset to disable.

```plaintext
https://<public_key>@sentry.io/<project_id>
```

## DATABASE_MIGRATE

Whether the Panel runs database migrations on startup. In a clustered environment with multiple backend instances, set this to `true` on exactly one instance and `false` on the rest to avoid migration conflicts.

Default:
```plaintext
DATABASE_MIGRATE=false
```

## DATABASE_URL

PostgreSQL connection URL.

```plaintext
postgresql://username:password@host:port/database_name
```

The provided credentials must have permission to create tables and run migrations.

## DATABASE_URL_PRIMARY

Used in read-replica setups. When set, the Panel uses this URL for writes and `DATABASE_URL` for reads. If unset, all operations use `DATABASE_URL`.

```plaintext
postgresql://username:password@host:port/database_name
```

## BIND

The IP address the Panel binds to for incoming HTTP requests. Can also be a path to a Unix socket.

Default:
```plaintext
BIND=0.0.0.0
```

## PORT

The port the Panel listens on.

Default:
```plaintext
PORT=8000
```

## APP_PRIMARY

Designates this instance as the primary in a clustered environment. The primary instance is responsible for background jobs. Set to `false` on all secondary instances.

Default:
```plaintext
APP_PRIMARY=true
```

## APP_DEBUG

Enables debug mode with more detailed error messages and logging. Set to `false` in production to avoid exposing sensitive information.

Default:
```plaintext
APP_DEBUG=false
```

## APP_ENABLE_WINGS_PROXY

When enabled, the Panel proxies traffic between users and Wings. This simplifies homelab setups but routes all Wings traffic through the panel, which can be a bottleneck in high-traffic environments. Typically leave this `false` in production.

Default:
```plaintext
APP_ENABLE_WINGS_PROXY=false
```

## APP_DISABLE_FRONTEND

When enabled, the Panel stops serving the bundled frontend assets and only exposes the API. Useful when the frontend is hosted separately (e.g. on a CDN or a dedicated web server). Non-API requests will return a 404.

Default:
```plaintext
APP_DISABLE_FRONTEND=false
```

## APP_USE_DECRYPTION_CACHE

When enabled, decrypted secrets are temporarily stored in Redis for faster access. Improves performance but means decrypted values are present in cache - evaluate against your threat model before enabling.

Default:
```plaintext
APP_USE_DECRYPTION_CACHE=false
```

## APP_USE_INTERNAL_CACHE

Whether the Panel uses an in-memory cache for frequently accessed data with short TTLs. Reduces Redis load and can significantly improve response times. Memory usage implications should be considered on resource-constrained systems.

Default:
```plaintext
APP_USE_INTERNAL_CACHE=true
```

## APP_TRUSTED_PROXIES

Comma-separated list of trusted proxy IP addresses or CIDR ranges. Required when running behind a reverse proxy or load balancer to ensure correct client IP addresses are used for logging and rate limiting.

```plaintext
APP_TRUSTED_PROXIES=192.168.178.0/24,10.0.0.0/8
```

## APP_LOG_DIRECTORY

Directory where the Panel writes log files. Unset by default (logs are not persisted to disk). Set to a directory the Panel process has write access to in order to enable log files.

## APP_ENCRYPTION_KEY

The encryption key used to protect sensitive data such as tokens. Must be set - the Panel will not start without it. Keep this value secret and do not lose it; rotating it requires re-encrypting all stored secrets.

## SERVER_NAME

A label for this Panel instance, used for identification in multi-panel setups and Sentry error tracking. Unset by default.

## Other Settings

All other Panel settings are configured through the Admin UI after installation and are shared across all instances using the same database.