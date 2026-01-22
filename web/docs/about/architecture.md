---
next: false
---

# Architecture

## Database

The Calagopus Panel uses a relational database to store all of its persistent data. Any PostgreSQL-compatible database should work, but in most deployments we recommend using plain PostgreSQL for the best experience. The database is responsible for storing user accounts, server configurations, settings, and other essential data required for the panel to function.

## Cache

To improve performance and reduce database load, the Calagopus Panel utilizes 2 caching layers:

1. **In-Memory Cache**: A local in-memory cache is used for frequently accessed data with very short ttl (e.g., session data, db object cache). This is specific to each backend and can be disabled.
2. **Redis Cache**: A Redis-like distributed cache is used for data that needs to be shared across multiple backend instances or has a longer ttl (e.g., login-related data, rate limiting). This cache is forced and cannot be disabled, even with a single backend instance. While not required, enabling persistent storage is beneficial for retaining rate limiting data across redis restarts, though not strictly necessary.

The Panel will also cache decrypted secrets in both caching layers when enabled, while this improves performance it does come with security trade-offs, so make sure to choose the right option for your use case.

## Wings Daemon

The Wings Daemon is a lightweight agent that runs on remote servers to manage game server instances. It communicates with the Calagopus Panel via an API, allowing the panel to control and monitor game servers remotely. Each Wings Daemon can manage multiple game servers, and multiple Wings Daemons can be connected to a single panel.

[More about Wings ›](../wings/overview.md)

## Basic Architecture

The Calagopus Panel is built using a modular architecture that allows for easy scalability and maintainability. It consists of 3 main components:

```mermaid
graph TD
  classDef storage fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
  classDef logic fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
  classDef front fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;

  %% Nodes
  A[Panel]:::front
  B{{Rust Backend}}:::logic
  C[(PostgreSQL-Like DB)]:::storage
  D[(Redis-Like Cache)]:::storage

  %% Connections
  A --> B
  B <--> C
  B <--> D
```

Once Wings and some Game servers are introduced, the architecture expands as follows:

```mermaid
graph TD
  classDef storage fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
  classDef logic fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
  classDef front fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
  classDef server fill:#e0f2f1,stroke:#00695c,stroke-width:2px;

  %% Core System Subgraph
  subgraph Core [Control Plane]
    direction TB
    Panel[Panel]:::front
    Backend{{Rust Backend}}:::logic
    DB[(PostgreSQL-Like DB)]:::storage
    Cache[(Redis-Like Cache)]:::storage

    Panel --> Backend
    Backend <--> DB
    Backend <--> Cache
  end

  %% Remote Node Subgraph
  subgraph Node1 [Wings Node]
    direction TB
    Wings{{Wings Daemon 1}}:::logic
    GS1[Game Server 1]:::server
    GS2[Game Server 2]:::server

    Wings --> GS1 & GS2
  end

  %% Cross-System Connections
  Backend -->|Wings API| Wings
  Wings -.->|Status Updates| Panel
```

This means that the Panel communicates with multiple Wings daemons, each managing its own set of game servers. The architecture is designed to handle a large number of game servers efficiently while maintaining performance and reliability. But the Wings Daemons also equire a route back to the panel for tasks such as authentication and status updates.

## Scalability

The architecture of Calagopus is designed to be highly scalable. As the number of game servers increases, additional Wings daemons can be deployed to distribute the load. Each Wings daemon operates independently, allowing for horizontal scaling. The panel backend can also be scaled horizontally by replacing the database and cache with managed services or clustering solutions. (e.g. [YugabyteDB](https://www.yugabyte.com/) for the database and a [Redis Sentinel Cluster](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/) for the cache).

Something worth noting is that the backend can use different database urls for reading and writing, allowing for read replicas to be used to offload read traffic from the primary database in a simpler setup. It's also important to delegate one backend to be the "primary", in this case that only means its responsible for running background jobs like cleanup, so it's recommended to have it close to the primary database for performance reasons.

### Read-Offloading Architecture Example

Here is an example of a more complex panel architecture with multiple backend instances using a load balancer and a database cluster with read replicas:

```mermaid
graph TD
  classDef database fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
  classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
  classDef lb fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;

  %% Load Balancer
  LB[Panel Load Balancer]:::lb

  %% Germany Cluster
  subgraph DE [Germany Region]
    direction TB
    PanelDE[Panel]:::service
    CacheDE[(Cache)]:::database
    PrimaryDB[(Primary Database)]:::database

    subgraph BackendDE [Backend Cluster]
      RB1[Primary Rust Backend 1]:::service
      RB2[Rust Backend 2]:::service
    end
  end

  %% Singapore Cluster
  subgraph SG [Singapore Region]
    direction TB
    PanelSG[Panel]:::service
    CacheSG[(Cache)]:::database
    ReplicaDBSG[(Read Replica DB)]:::database

    subgraph BackendSG [Backend Cluster]
      RB3[Rust Backend 3]:::service
      RB4[Rust Backend 4]:::service
    end
  end

  %% USA Cluster
  subgraph US [USA Region]
    direction TB
    PanelUS[Panel]:::service
    CacheUS[(Cache)]:::database
    ReplicaDBUS[(Read Replica DB)]:::database

    subgraph BackendUS [Backend Cluster]
      RB5[Rust Backend 5]:::service
      RB6[Rust Backend 6]:::service
    end
  end

  %% Global Connections
  LB --> PanelDE
  LB --> PanelSG
  LB --> PanelUS

  %% Germany Internal Wiring
  PanelDE --> RB1 & RB2
  RB1 & RB2 <--> CacheDE
  RB1 & RB2 <-->|Read & Write| PrimaryDB

  %% Singapore Internal Wiring
  PanelSG --> RB3 & RB4
  RB3 & RB4 <--> CacheSG
  RB3 & RB4 <-->|Read Only| ReplicaDBSG

  %% USA Internal Wiring
  PanelUS --> RB5 & RB6
  RB5 & RB6 <--> CacheUS
  RB5 & RB6 <-->|Read Only| ReplicaDBUS

  %% Cross-Region Wiring
  RB3 & RB4 -->|Write Only| PrimaryDB
  PrimaryDB -.->|Replication| ReplicaDBSG
  RB5 & RB6 -->|Write Only| PrimaryDB
  PrimaryDB -.->|Replication| ReplicaDBUS
```

In this architecture, we have 3 regions: Germany, Singapore, and the USA. Each region has its own panel instance, cache, and backend cluster. The Germany region contains the primary database since it is essentially in the middle of the other two, while the Singapore and USA regions have read replicas. The load balancer distributes incoming requests to the appropriate panel instance based on factors such as geographic location or server load.

In a real-world scenario, having more than 2 backends per region is not needed as the backend is already multi-threaded and can handle many requests simultaneously. The reason why 2 is a good number is that one can be used for maintenance or updates while the other continues to serve requests, though this can be avoided by having sticky sessions at the load balancer level.

**Important Note**: Within the same region, the backends should share the same redis cache to avoid login issues and session inconsistencies.

Once you introduce Wings daemons and game servers into this architecture, each panel instance will communicate with the Wings daemons that need to be, directly, no passive connections are made unless an extension or feature requires it.
