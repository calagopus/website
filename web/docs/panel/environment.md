---
title: Environment
description: Reference for every environment variable the Calagopus Panel is configured through, in a .env file or the system environment.
---

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

## REDIS_KEY_PREFIX

A prefix for every key the Panel writes to Redis, so several Panels can share one Redis/Valkey instance without reading each other's cache, rate limits or locks. Works with both `REDIS_MODE` values. The Panel adds the `::` separator itself, so `REDIS_KEY_PREFIX=panel1` stores keys like `panel1::ratelimit::...`. Unset by default, which keeps keys unprefixed.

```plaintext
REDIS_KEY_PREFIX=panel1
```

All instances in a clustered setup must use the same prefix. Changing the prefix on an existing install leaves the old keys in Redis until they expire. They only hold cached data, rate limit counters and locks, so nothing is lost.

## SENTRY_URL

Sentry DSN for error tracking. Leave unset to disable.

```plaintext
https://<public_key>@sentry.io/<project_id>
```

## SENTRY_TRACING_SAMPLE_RATE

The fraction of requests traced for Sentry performance monitoring, from `0.0` (none) to `1.0` (all). Lower this on busy instances to stay within your Sentry quota. Error reporting is unaffected. Has no effect when `SENTRY_URL` is unset, and the Panel refuses to start if the value is not a number in that range.

Default:
```plaintext
SENTRY_TRACING_SAMPLE_RATE=1.0
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

## APP_REQUEST_LOG_LIMIT

The number of HTTP requests the Panel writes a log line for each second, so a traffic spike cannot bury everything else in the log. Once the budget for a second is spent the remaining requests are counted rather than logged, and the count is reported as a `suppressed N http request log lines (APP_REQUEST_LOG_LIMIT = 250)` line the next time a request gets through - if traffic stops, the summary waits until it resumes. The budget covers the whole process, not each route or client. Set to `0` to log every request. A value that is not a number stops the Panel from starting.

Default:
```plaintext
APP_REQUEST_LOG_LIMIT=250
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

## APP_DISABLE_EXTENSION_MANAGEMENT

When enabled, the Panel no longer lets admins install, remove or rebuild extensions from the web interface in the heavy image, and the extensions page hides the management controls. Installed extensions keep running and can still be turned on or off. The `panel-rs extensions` CLI inside the container still works, so use this if extension changes should only happen through shell access. The regular images never offer web management, so the variable does nothing there.

Default:
```plaintext
APP_DISABLE_EXTENSION_MANAGEMENT=false
```

## APP_USE_DECRYPTION_CACHE

When enabled, decrypted secrets are kept in the Panel process memory for 30 seconds so repeated reads skip the decryption step. They are never written to Redis. Improves performance but means decrypted values stay in memory longer - evaluate against your threat model before enabling.

Default:
```plaintext
APP_USE_DECRYPTION_CACHE=false
```

## APP_USE_INTERNAL_CACHE

Whether the Panel uses an in-memory cache for frequently accessed data with short TTLs. Reduces Redis load and can significantly improve response times. Consider memory usage on resource-constrained systems.

Default:
```plaintext
APP_USE_INTERNAL_CACHE=true
```

## APP_TRUSTED_PROXIES

Comma-separated list of trusted proxy IP addresses or CIDR ranges. Required when running behind a reverse proxy or load balancer to ensure correct client IP addresses are used for logging and rate limiting.

```plaintext
APP_TRUSTED_PROXIES=192.168.178.0/24,10.0.0.0/8
```

## APP_BLOCKED_CIDRS

Comma-separated list of IP ranges the Panel refuses to connect to when it fetches a URL someone supplied through the UI, such as importing an egg from a URL, discovering an OpenID provider, or syncing an egg repository over git. Hostnames are resolved first and every resulting address is checked, so a name pointing at an internal address is rejected too. This keeps an administrator from using the Panel as a proxy to reach services on its own network.

The default blocks the unspecified and loopback addresses, the private ranges, carrier-grade NAT, link-local, IETF-reserved and benchmarking ranges, multicast, 6to4 and the remaining reserved space:

```plaintext
APP_BLOCKED_CIDRS=0.0.0.0/8,127.0.0.0/8,10.0.0.0/8,100.64.0.0/10,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16,192.0.0.0/24,198.18.0.0/15,224.0.0.0/4,240.0.0.0/4,::/128,::1/128,fe80::/10,fc00::/7,2002::/16,ff00::/8
```

Set your own list if you host an internal egg repository or egg mirror that the Panel has to reach, remove only the range it lives in, rather than the whole list. Setting the variable to an empty value disables the protection entirely and lets the Panel connect anywhere.

## APP_LOG_DIRECTORY

Directory where the Panel writes log files. Unset by default (logs are not persisted to disk). Set it to a directory writable by the Panel process to enable log files.

## APP_ENCRYPTION_KEY

The encryption key used to protect sensitive data such as tokens. Must be set - the Panel will not start without it. Keep this value secret and do not lose it; rotating it requires re-encrypting all stored secrets.

## SERVER_NAME

A label for this Panel instance, used for identification in multi-panel setups and Sentry error tracking. When set, it is also shown to users in the footer as "Connected to {name}", which is handy for identifying which backend instance you are talking to. Unset by default.

## AIO_BASE_WINGS_CONFIGURATION

Only used by the all-in-one distribution. Path to a base Wings configuration file (YAML) that the Panel uses as a starting point for the bundled Wings instance. The Panel merges in the generated node UUID and tokens on top of this base. If unset, a minimal configuration is generated in the system temp directory.

## Other Settings

All other Panel settings are configured through the Admin UI after installation and are shared across all instances using the same database.