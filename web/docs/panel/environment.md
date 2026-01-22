# Environment

Each Calagopus Panel installation requires an Environment to run in. An Environment is a set of configurations and resources that define how the Panel operates. This includes settings for database connections and simiar.

The Panel uses environment variables to configure its runtime behavior. These variables can be set in a `.env` file located in the root directory of the Panel installation or can be defined directly in the system environment.

## REDIS_MODE

The `REDIS_MODE` variable defines how the Panel connects to the Redis cache. It can be set to one of the following values:

- `redis`: Connect to a single Redis instance. This also requires setting `REDIS_URL`.
- `sentinel`: Connect to a Redis Sentinel cluster for high availability. This requires setting `REDIS_SENTINEL_CLUSTER` and `REDIS_SENTINELS`.

## REDIS_URL

The `REDIS_URL` variable specifies the connection URL for a single Redis instance when `REDIS_MODE` is set to `redis`. The URL should be in the format:

```plaintext
redis://[:password@]host:port/db_number
```

## REDIS_SENTINEL_CLUSTER

The `REDIS_SENTINEL_CLUSTER` variable specifies the name of the Redis Sentinel cluster when `REDIS_MODE` is set to `sentinel`. This is used to identify the master node in the Sentinel setup.

## REDIS_SENTINELS

The `REDIS_SENTINELS` variable is a comma-separated list of Sentinel nodes that the Panel will connect to when `REDIS_MODE` is set to `sentinel`. Each node should be in the format `host:port`. For example:

```plaintext
sentinel1.example.com:26379,sentinel2.example.com:26379,sentinel3.example.com:26379
```

## SENTRY_URL

The `SENTRY_URL` variable is used to configure error tracking for the Panel using Sentry. If you have a Sentry project set up, you can provide the DSN (Data Source Name) here to enable error reporting. The URL should be in the format:

```plaintext
https://<public_key>@sentry.io/<project_id>
```

If you do not wish to use Sentry, you can leave this variable unset or set it to an empty string.

## DATABASE_MIGRATE

The `DATABASE_MIGRATE` variable determines whether the Panel should automatically run database migrations on startup. In a clustered environment with multiple backend instances, it is recommended to set this variable to `false` on all instances except one to avoid migration conflicts. Set it to `true` only on the instance responsible for handling migrations.

Default value:

```plaintext
DATABASE_MIGRATE=true
```

## DATABASE_URL

The `DATABASE_URL` variable specifies the connection URL for the PostgreSQL database used by the Panel. The URL should be in the format:

```plaintext
postgresql://username:password@host:port/database_name
```

Ensure that the database is accessible from the Panel and that the provided credentials have the necessary permissions to create tables and perform migrations.

## DATABASE_URL_PRIMARY

The `DATABASE_URL_PRIMARY` variable is used in scenarios where read and write operations are separated, such as when using read replicas. This variable should point to the primary database instance that handles write operations. The format is the same as `DATABASE_URL`:

```plaintext
postgresql://username:password@host:port/database_name
```

When set, the Panel will use `DATABASE_URL_PRIMARY` for write operations and `DATABASE_URL` for read operations. If not set, all operations will use `DATABASE_URL`.

## BIND

The `BIND` variable specifies the IP address that the Panel will bind to for incoming HTTP requests.

Default value:

```plaintext
BIND=0.0.0.0
```

## PORT

The `PORT` variable defines the port number on which the Panel will listen for incoming HTTP requests. Ensure that this port is open and not blocked by any firewall rules.

Default value:

```plaintext
PORT=8000
```

## APP_PRIMARY

The `APP_PRIMARY` variable is used to designate whether the current Panel instance is the primary instance in a clustered environment. The primary instance is responsible for handling certain tasks such as running background jobs.

Default value:

```plaintext
APP_PRIMARY=true
```

## APP_DEBUG

The `APP_DEBUG` variable enables or disables debug mode for the Panel. When set to `true`, the Panel will provide more detailed error messages and logging information, which can be useful for development and troubleshooting. In a production environment, it is recommended to set this variable to `false` to avoid exposing sensitive information or filling logs with excessive details.

Default value:

```plaintext
APP_DEBUG=false
```

## APP_USE_DECRYPTION_CACHE

The `APP_USE_DECRYPTION_CACHE` variable determines whether the Panel should use a decryption cache for improving performance when handling encrypted data. Enabling this cache can reduce the overhead of decrypting data multiple times, especially in high-traffic scenarios. In a production environment, this will mean that decrypted data is temporarily stored in redis for faster access which can be considered a security risk depending on your threat model.

Default value:

```plaintext
APP_USE_DECRYPTION_CACHE=false
```

## APP_USE_INTERNAL_CACHE

The `APP_USE_INTERNAL_CACHE` variable specifies whether the Panel should utilize an internal caching mechanism to store frequently accessed data with low ttl in memory. Enabling this cache can significantly improve performance by reducing the need to repeatedly fetch data from the redis cache. However, it is important to consider the memory usage implications, especially in environments with limited resources.

Default value:

```plaintext
APP_USE_INTERNAL_CACHE=true
```

## APP_LOG_DIRECTORY

The `APP_LOG_DIRECTORY` variable defines the directory path where the Panel will store its log files. This is unset by default, which means logs will not be stored by the panel. If you wish to enable logging, set this variable to a valid directory path where the Panel has write permissions.

## APP_ENCRYPTION_KEY

The `APP_ENCRYPTION_KEY` variable is used to specify the encryption key for securing sensitive data within the Panel. This key is crucial for encrypting and decrypting data like tokens. Ensure that this key is kept secret and secure. This variable must be set for the Panel to function correctly.

## SERVER_NAME

The `SERVER_NAME` variable is used to define the server name for this Panel instance. This is primarily used for identification purposes in multi-panel setups, especially when combined with Sentry for error tracking. Setting a unique server name can help differentiate logs and errors originating from different Panel instances. By default, this variable is unset.

## Other Settings

All other Calagopus Panel settings can be found in the Admin Panel after installation and will be shared across all instances using the same database.
