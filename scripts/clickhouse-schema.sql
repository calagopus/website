CREATE TABLE IF NOT EXISTS telemetry_submissions
(
    `submission_id`             UUID,
    `received_at`               DateTime('UTC'),
    `day`                       Date MATERIALIZED toDate(received_at),
    `country`                   LowCardinality(String),

    `uuid`                      UUID,

    `panel_version`             LowCardinality(String),
    `panel_container_type`      LowCardinality(String),
    `panel_database_version`    LowCardinality(String),
    `panel_cache_version`       LowCardinality(String),
    `panel_architecture`        LowCardinality(String),
    `panel_kernel_version`      String CODEC(ZSTD(3)),

    `users_total`               UInt64,
    `users_languages`           Map(LowCardinality(String), UInt64),
    `backups_total`             UInt64,
    `backups_disks`             Map(LowCardinality(String), UInt64),
    `servers_total`             UInt64,

    `nodes.version`                     Array(LowCardinality(String)),
    `nodes.container_type`              Array(LowCardinality(String)),
    `nodes.architecture`                Array(LowCardinality(String)),
    `nodes.kernel_version`              Array(String),
    `nodes.memory_total_bytes`          Array(UInt64),
    `nodes.memory_free_bytes`           Array(UInt64),
    `nodes.memory_used_bytes`           Array(UInt64),
    `nodes.memory_used_bytes_process`   Array(UInt64),
    `nodes.servers_total`               Array(UInt64),
    `nodes.servers_online`              Array(UInt64),
    `nodes.servers_offline`             Array(UInt64),

    `database_agent_hosts.version`                   Array(LowCardinality(String)),
    `database_agent_hosts.container_type`            Array(LowCardinality(String)),
    `database_agent_hosts.architecture`              Array(LowCardinality(String)),
    `database_agent_hosts.kernel_version`            Array(String),
    `database_agent_hosts.memory_total_bytes`        Array(UInt64),
    `database_agent_hosts.memory_free_bytes`         Array(UInt64),
    `database_agent_hosts.memory_used_bytes`         Array(UInt64),
    `database_agent_hosts.memory_used_bytes_process` Array(UInt64),
    `database_agent_hosts.instances_total`           Array(UInt64),
    `database_agent_hosts.instances_online`          Array(UInt64),
    `database_agent_hosts.instances_offline`         Array(UInt64),

    `extensions.package_name`      Array(LowCardinality(String)),
    `extensions.name`              Array(String),
    `extensions.description`       Array(String),
    `extensions.version`           Array(LowCardinality(String)),
    `extensions.panel_version_req` Array(LowCardinality(String)),
    `extensions.authors`           Array(Array(String)),
    `extensions.has_license`       Array(UInt8),

    `node_count`               UInt32 MATERIALIZED length(`nodes.version`),
    `database_agent_host_count` UInt32 MATERIALIZED length(`database_agent_hosts.version`),
    `extension_count`          UInt32 MATERIALIZED length(`extensions.package_name`)
)
ENGINE = ReplacingMergeTree(received_at)
PARTITION BY toYYYYMM(day)
ORDER BY (day, uuid)
TTL day + INTERVAL 2 YEAR DELETE;
