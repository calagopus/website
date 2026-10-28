---
title: Backup Configurations
description: Set up backup configurations that tell the Panel and Wings where server backups go, from local disk and S3 to restic, Proxmox Backup Server, Kopia, and filesystem snapshots.
---

# Setting up Backup Configurations

This guide explains how to set up backup configurations in your Calagopus Panel. Backup configurations tell the Panel (and Wings) where and how to store server backups - whether that's the local node disk, an S3 bucket, a restic repository, a Proxmox Backup Server, a Kopia repository, or a native filesystem snapshot.

A backup configuration is created once by an admin, then attached to one or more of: a **server**, a **node**, or a **location**. When a user creates a backup, the Panel walks that list from most-specific to least-specific to decide which configuration to use:

1. Does the **server** have a backup configuration assigned? If yes, use it.
2. Otherwise, does the server's **node** have one assigned? If yes, use it.
3. Otherwise, does the node's **location** have one assigned? If yes, use it.
4. Otherwise, the backup fails.

This layered approach means you can set a sensible default at the location level and override it per-node or per-server when you need to.

## Backup Disks

When you create a backup configuration, you pick a **backup disk** - the backend that actually stores the backup data. The Panel currently supports eight:

| Backup Disk | Stores to | Extra config required |
| --- | --- | --- |
| **Local** | The Wings node's local filesystem as a plain tarball | None |
| **DdupBak** | The Wings node's local filesystem, deduplicated via [ddup-bak](https://github.com/0x7d8/ddup-bak) | None |
| **Btrfs** | A Btrfs snapshot on the Wings node | None (host filesystem must be Btrfs) |
| **Zfs** | A ZFS snapshot on the Wings node | None (host filesystem must be ZFS) |
| **S3** | An S3 (or S3-compatible) bucket | S3 credentials and bucket details |
| **Restic** | A [restic](https://restic.net) repository (any backend restic supports) | Restic repository URL, password, and any backend-specific environment variables |
| **Proxmox Backup Server** | A [Proxmox Backup Server](https://www.proxmox.com/en/products/proxmox-backup-server/overview) datastore | PBS server URL, datastore, API token, and optionally a server fingerprint |
| **Kopia** | A [Kopia](https://kopia.io) repository, via a running Kopia repository server | Kopia server URL, username, repository password, and optionally a server fingerprint |

The four node-local options (**Local**, **DdupBak**, **Btrfs**, **Zfs**) don't require credentials on the Panel side. [`system.backup_directory`](../configuration.md#system-backup-directory) controls the backup storage directory, with a default of `{root_directory}/backups`: `/var/lib/calagopus-wings/backups` on a fresh Linux installation (migrated or custom configurations may use another path). ZFS snapshots remain attached to the server's dataset, with backup metadata stored in the backup directory.

The four remote options (**S3**, **Restic**, **Proxmox Backup Server**, and **Kopia**) need credentials, which you enter when creating the configuration. All secrets are encrypted at rest using the Panel's encryption key.

Like **Restic** and **DdupBak**, both **Proxmox Backup Server** and **Kopia** deduplicate at the chunk level. What sets them apart is that they deduplicate *incrementally against the previous snapshot of the same server*, so a backup only uploads the chunks that changed since last time. Proxmox Backup Server stores each backup as a `pxar` archive in a PBS datastore; Kopia stores a snapshot in a Kopia repository, reached through a [Kopia repository server](https://kopia.io/docs/repository-server/). Kopia requires the `kopia` binary to be installed on the Wings node; PBS talks to the server over its HTTP API and needs no extra binary.

**DdupBak** is **experimental** and stores deduplicated backups locally without a repository password or a separate initialization step. Fresh Wings configurations use Zstd compression; existing configurations keep their selected format. Set [`system.backups.ddup_bak.compression_format`](../configuration.md#system-backups-ddup-bak-compression-format) to `none`, `deflate`, `gzip`, `brotli`, or `zstd`. See [ddup-bak on GitHub](https://github.com/0x7d8/ddup-bak) for details on the format.

**Btrfs** and **Zfs** store backups as filesystem snapshots and require the corresponding [disk limiter](../disk-limiters/index.md) to be configured on the Wings node - that's what puts each server on its own subvolume or dataset in the first place, and snapshots only exist relative to that. See the [Btrfs](../disk-limiters/btrfs-subvolume.md) and [ZFS](../disk-limiters/zfs-dataset.md) disk limiter guides for the host-side setup. The same migration caveat applies: servers created before their node switched to `btrfs_subvolume` / `zfs_dataset` won't have backups that work until you transfer the server off the node and back.

## Browsing Backups from the Client UI

**DdupBak**, **Btrfs**, **Zfs**, **Restic**, **Proxmox Backup Server**, and **Kopia** backups all support the **browse** feature - users can open a backup in the client UI, navigate its file tree, and download individual files or directories without downloading the full backup first. This is especially useful for large backups where a user only needs to recover one file.

**Local** backups support browse too, but only when the archive format is one that supports random access: `zip` or `seven_zip`. With the default `tar_gz` (or any other `tar_*` variant), the whole archive has to be streamed to read anything out of it, so browse is disabled. To enable browse for local backups, set Wings' archive format accordingly - see [`system.backups.wings.archive_format`](../configuration.md#system-backups-wings-archive-format) in the Wings configuration reference.

**S3** backups do not support browse; they are stored as compressed tarballs and must be downloaded in full to extract.

## Creating a Backup Configuration

1. Go to **Admin → Backup Configurations → Create**.
2. Fill in the common fields:

| Field | Value |
| --- | --- |
| **Name** | A friendly label, e.g. `Hetzner S3` |
| **Description** | Optional free-form description |
| **Maintenance Enabled** | Leave off unless you want to temporarily prevent this configuration from being used (useful when rotating credentials or doing repository maintenance) |
| **Backup Disk** | One of the options from the table above |

3. Fill in the disk-specific fields (see [Disk-specific Settings](#disk-specific-settings) below for S3, Restic, Proxmox Backup Server and Kopia; the node-local disks have no extra fields).
4. Click **Save**.

Before you save, **Test** checks the configuration from a node of your choice. See [Testing a Configuration](#testing-a-configuration).

## Testing a Configuration

The create and edit forms have a **Test** button. Pick a node and click **Run Test**, and that node tries the values currently in the form the way a backup would, so you don't have to save first. The dialog then shows whether the node can use the configuration and how long the check took. If it fails, you also get the error Wings ran into.

| Disk | What the test does |
| --- | --- |
| **Local**, **Ddup-Bak** | Wings writes a small file to the node's backup directory, then deletes it. |
| **Btrfs** | Wings does the same write check and runs `btrfs filesystem df` on the backup and data directories. |
| **ZFS** | Wings does the same write check and runs `zfs list` on the data directory. |
| **S3** | The node uploads a small object under `.calagopus-test/` through a presigned URL, and the panel deletes it afterwards. |
| **Restic** | Wings runs `restic cat config` against the repository. This checks the password without taking a lock. |
| **Proxmox Backup Server** | Wings lists the datastore's backup groups with the API token, inside the namespace if one is set. |
| **Kopia** | Wings connects to the repository server with the username and password, using a throwaway client config. |

The test runs on one node. If the configuration is assigned to a location, test a node from each network your backups will come from. For Btrfs and ZFS it only checks the tools and the filesystem; whether each server sits on its own subvolume or dataset is checked when a backup runs. If the node has its own restic password file in its Wings config, backups use the node's repository instead of the configured one, and so does the test.

Testing needs the `backup-configurations.create` or `backup-configurations.update` admin permission. Nodes running a Wings version without the test endpoint answer with "node's wings version does not support backup tests".

## Removing Saved Provider Settings

Switching **Backup Disk** can leave the previous provider settings saved as additional configurations. On the edit form, use the **X** on an inactive provider section, confirm removal, then click **Save** to persist it. The active provider cannot be removed this way.

Keep old provider settings while backups still depend on them. Removing credentials does not migrate or delete those backups, and can prevent Wings from accessing them.

## Disk-specific Settings

Pick the disk you configured above:

::::tabs
=== S3

Use the **S3** disk for AWS S3, MinIO, Backblaze B2's S3-compatible endpoint, Cloudflare R2, Wasabi, Hetzner Object Storage, or any other S3-compatible provider.

| Field | Value |
| --- | --- |
| **Access Key** | The S3 access key ID |
| **Secret Key** | The S3 secret access key (encrypted at rest; appears blank on re-edit) |
| **Bucket** | The bucket name to store backups in |
| **Region** | The S3 region, e.g. `eu-central-1`, `us-east-1`, or whatever your provider specifies |
| **Endpoint** | The full S3 endpoint URL, e.g. `https://s3.eu-central-1.amazonaws.com` or `https://s3.infra.rjns.dev` |
| **Path Style** | Toggle on for providers that require path-style URLs (`endpoint/bucket/key`) instead of virtual-hosted (`bucket.endpoint/key`). MinIO and some self-hosted setups typically need this on; AWS and most managed providers do not. |
| **Part Size** | Multipart upload chunk size in bytes. `1073741824` (1 GB) is a good default for most S3 providers. Raise it for very large backups on fast links; the minimum S3 allows is 5 MB. |

::: info
If you're unsure whether your provider needs **Path Style**, try it off first. If uploads fail with DNS or certificate errors, turn it on.
:::

Wings tries a streaming upload for server-file S3 backups, then falls back to buffering if the Panel does not support it. Set [`system.backups.s3.streaming`](../configuration.md#system-backups-s3-streaming) to `false` on the node to skip that probe and buffer directly. This setting does not change the database-dump upload path.

=== Restic

Use the **Restic** disk when you want deduplicated, encrypted backups to any of restic's supported backends (S3, B2, Azure Blob Storage, Google Cloud Storage, SFTP, a REST server, local disk, etc.). See the [restic backend documentation](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html) for the full list and the repository URL format for each.

| Field | Value |
| --- | --- |
| **Repository** | The restic repository URL, e.g. `s3:https://s3.infra.rjns.dev/calagopus-restic`, `b2:bucketname:path/to/repo`, `sftp:user@host:/srv/restic-repo`. Must be at least 3 characters. |
| **Retry Lock Seconds** | How long restic should wait for a repository lock before giving up. `120` is a reasonable default. If a backup, a deletion, or a prune or stats run still fails on a lock, Wings 1.2.6 and newer run `restic unlock` once, which clears only locks restic considers stale (left behind by a crashed or killed process), and retry if that removed any. Locks held by a live process are never touched. |
| **Password** | The restic repository password. Stored as the `RESTIC_PASSWORD` environment variable and encrypted at rest. |
| **Environment Variables** | Any additional environment variables restic needs for your chosen backend. |

Environment variables are whatever the restic backend requires, within an allowlist that Wings 1.2.7 and newer apply. Wings passes a variable from the panel only if its name starts with `AWS_`, `B2_`, `AZURE_`, `GOOGLE_`, `OS_`, `ST_` or `RESTIC_`, or is `HTTP_PROXY`, `HTTPS_PROXY` or `NO_PROXY` (upper or lower case). Variables that would point restic at files or commands on the node are refused even with an allowed prefix: `RESTIC_PASSWORD_COMMAND`, `RESTIC_PASSWORD_FILE`, `RESTIC_REPOSITORY`, `RESTIC_REPOSITORY_FILE` and their `RESTIC_FROM_` counterparts, `RESTIC_CACHE_DIR`, `AWS_SHARED_CREDENTIALS_FILE`, `AWS_CONFIG_FILE`, `AWS_WEB_IDENTITY_TOKEN_FILE`, `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES`, `AZURE_CONFIG_DIR` and `AZURE_FEDERATED_TOKEN_FILE`. Wings drops any other variable, logs `ignoring disallowed key in panel restic environment` with its name, and runs restic without it. `PATH` is always ignored. Common examples:

| Backend | Required environment variables |
| --- | --- |
| S3, MinIO, R2, Wasabi, Hetzner | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| Backblaze B2 (native API) | `B2_ACCOUNT_ID`, `B2_ACCOUNT_KEY` |
| Azure Blob Storage | `AZURE_ACCOUNT_NAME`, `AZURE_ACCOUNT_KEY` (or `AZURE_ACCOUNT_SAS`) |
| Google Cloud Storage | `GOOGLE_ACCESS_TOKEN` (plus `GOOGLE_PROJECT_ID` if restic has to create the bucket). Restic notes these tokens usually expire after an hour, so they don't suit scheduled backups. A service account key file through `GOOGLE_APPLICATION_CREDENTIALS` is refused, see above. |

Refer to the [restic environment variables documentation](https://restic.readthedocs.io/en/stable/040_backup.html#environment-variables) for the complete list.

Deleting a backup runs `restic forget` for its snapshot, and that is all: the data the snapshot referenced stays in the repository until `restic prune` runs. **Prune Jobs** schedule that. Each job (up to 50 per configuration) has a **Cron Schedule** in six-field form (`second minute hour day month weekday`, e.g. `0 0 3 * * *` for 03:00 daily) and the **Nodes** it runs on. The panel checks every minute and asks each selected node to start the prune in the background; one node per repository is enough, since they all prune the same data.

::: warning Prune jobs before Panel 1.2.7 only dry-run
Panels before 1.2.7 started scheduled prunes with `--dry-run`, so restic only reported what it would remove and nothing was reclaimed. Since Wings 1.2.2 deleting a backup no longer prunes either, so a repository used with an older Panel may have grown; update the Panel, or prune it by hand as described under [Troubleshooting](#troubleshooting).
:::

All environment variable values are encrypted at rest. Secret-looking values (such as `AWS_SECRET_ACCESS_KEY`) are censored when you re-open the configuration - leave them blank to keep the stored value, or re-enter them to overwrite. Non-secret values (like `AWS_ACCESS_KEY_ID`) are shown as stored.

::: info
Example of a restic configuration pointing at an S3-compatible endpoint:
>
> - **Repository**: `s3:https://s3.infra.rjns.dev/calagopus-restic`
> - **Retry Lock Seconds**: `120`
> - **Password**: *(your repository password)*
> - **Environment Variables**:
>   - `AWS_ACCESS_KEY_ID`: your access key
>   - `AWS_SECRET_ACCESS_KEY`: your secret key
:::

=== Proxmox Backup Server

Use the **Proxmox Backup Server** disk to store backups in a [Proxmox Backup Server](https://pbs.proxmox.com/docs/) datastore. Each Calagopus backup becomes a PBS snapshot (backup type `host`, backup ID `<prefix>-<server-uuid>`), uploaded as a deduplicated `pxar` archive. Wings authenticates with a PBS [API token](https://pbs.proxmox.com/docs/user-management.html#api-tokens), created in the PBS web UI under **Configuration → Access Control → API Token**.

::: warning Grant permissions to both the user and the token
PBS tokens are created with **Privilege Separation** on by default. A token like that doesn't inherit its user's permissions, and its own permissions are capped by the user's: it can only do what **both** the user and the token are allowed to do. Giving the role to just one of them gets you `HTTP 403` errors from Wings.

Under **Configuration → Access Control → Permissions**, add the same permission twice, once with the user (`calagopus@pbs`) and once with the token (`calagopus@pbs!wings`):

- **Path**: `/datastore/<datastore>`, or `/datastore/<datastore>/<namespace>` if you use a namespace
- **Role**: `DatastorePowerUser`

`DatastoreBackup` alone is enough to create and restore backups but not to delete them, so deleting a backup in the Panel fails. `DatastorePowerUser` adds the prune privilege Wings needs to delete its own snapshots.

If you untick **Privilege Separation** when creating the token, it inherits the user's permissions instead, and only the user needs the permission entry.
:::

| Field | Value |
| --- | --- |
| **URL** | The PBS server URL, e.g. `https://pbs.example.com:8007` |
| **Datastore** | The name of the PBS datastore to store backups in |
| **Namespace** | Optional [namespace](https://pbs.proxmox.com/docs/storage.html#backup-namespaces) within the datastore. Leave blank to use the datastore root. |
| **Token ID** | The API token in the form `user@realm!token-name`, e.g. `calagopus@pbs!wings` |
| **Token Secret** | The secret shown when the token was created (encrypted at rest; appears blank on re-edit) |
| **Fingerprint** | Optional. The PBS server's TLS certificate SHA-256 fingerprint (64 hex characters; colons are optional). When set, PBS connections are pinned to this fingerprint. Leave blank to validate the certificate against the Wings node's system trust store instead - only do that if the PBS server presents a certificate from a CA the node already trusts (a self-signed certificate will fail). |
| **Backup ID Prefix** | Optional prefix for the PBS backup ID. Defaults to `calagopus`. Wings will only ever delete snapshots whose backup ID matches `<prefix>-<server-uuid>`, so this also acts as a safety boundary against touching unrelated snapshots in the datastore. |

::: info
You can read the fingerprint from the PBS web UI dashboard (**Show Fingerprint**) or with `proxmox-backup-manager cert info` on the PBS host. Either the colon-separated form (`AB:CD:...`) or the plain 64-character hex string works. PBS generates a self-signed certificate by default, so unless you replaced it with one from a trusted CA, you need the fingerprint.
:::

=== Kopia

Use the **Kopia** disk to store backups in a [Kopia](https://kopia.io) repository. Wings does not connect to the underlying storage directly - instead it talks to a running [Kopia repository server](https://kopia.io/docs/repository-server/) (`kopia server start`), which fronts the actual repository (S3, B2, filesystem, etc.). This means the `kopia` binary must be installed on each Wings node that uses this configuration; Wings shells out to it and keeps its per-repository state (config and cache) under the `.kopia` subdirectory of [`system.backup_directory`](../configuration.md#system-backup-directory).

Backups are created as Kopia snapshots tagged with the backup UUID, deduplicated against the repository.

| Field | Value |
| --- | --- |
| **URL** | The Kopia repository server URL, e.g. `https://kopia.example.com:51515` |
| **Username** | The Kopia server username in the form `user@host`, e.g. `wings@node1`. The part after `@` is used as the override hostname when connecting. |
| **Password** | The Kopia server password (encrypted at rest; appears blank on re-edit) |
| **Fingerprint** | Optional. The Kopia server's TLS certificate SHA-256 fingerprint (64 hex characters; colons are optional). When set, the connection is pinned to this fingerprint. Leave blank to validate the certificate against the Wings node's system trust store instead - only do that if the Kopia server presents a certificate from a CA the node already trusts (a self-signed certificate will fail). |
| **Tags** | Optional key/value tags (up to 50) applied to every snapshot created with this configuration, in addition to the automatic backup-UUID tag. Useful for grouping or policy targeting in Kopia. |

::: info
The username and password must correspond to a user that the Kopia repository server has been configured to accept (see [Kopia server access control](https://kopia.io/docs/repository-server/#server-access-control)). The fingerprint is the server's certificate fingerprint, which `kopia server start` prints on startup (and which you pass to clients as `--server-cert-fingerprint`). It is generated self-signed by default, so unless you started the server with a certificate from a trusted CA, you need the fingerprint.
:::
::::

## Assigning a Backup Configuration

A newly-created backup configuration is not in use until you assign it somewhere. You can assign it to a **location**, a **node**, or a **server** - or to several of them at once. The Panel picks the most-specific assignment at backup time (server → node → location).

### To a Location

1. Go to **Admin → Locations** and click the location.
2. Set the **Backup Configuration** field to the one you just created and save.

This acts as the default for every node (and every server on those nodes) in the location.

### To a Node

1. Go to **Admin → Nodes** and click the node.
2. Set the **Backup Configuration** field to the one you want and save.

A node-level assignment overrides whatever the location defines.

### To a Server

1. Go to **Admin → Servers** and click the server.
2. Set the **Backup Configuration** field and save.

A server-level assignment overrides both the node and the location.

::: info
A common setup is one restic repository per location (covering most servers) with per-node overrides for specialized hosts - e.g. a node that backs up to a Btrfs snapshot locally for faster restore, while the rest of the location goes to remote restic.
:::

## Maintenance Mode

Every backup configuration has a **Maintenance Enabled** toggle. Turn this on to prevent the configuration from being used without deleting it. This is useful when rotating credentials, doing restic repository maintenance (`restic prune`, `restic check`), or migrating to a new bucket.

While maintenance is enabled, any backup that would have used this configuration will fail. There is no automatic fallback to a less-specific configuration - turning on maintenance blocks that layer of the lookup entirely.

## Supported Backup Drivers FAQ

| Driver | Off-node storage | Deduplicates | Incremental (changed chunks only) | Browse support | Extra node software |
| --- | --- | --- | --- | --- | --- |
| **Local** | No | No | N/A | Only with `zip` or `seven_zip` format | None |
| **DdupBak** (experimental) | No | Yes | No | Yes | None |
| **Btrfs** | No | No (filesystem snapshot) | N/A | Yes | Btrfs [disk limiter](../disk-limiters/index.md) |
| **Zfs** | No | No (filesystem snapshot) | N/A | Yes | ZFS [disk limiter](../disk-limiters/index.md) |
| **S3** | Yes | No | N/A | No, full download only | None |
| **Restic** | Yes | Yes | No | Yes | `restic` binary |
| **Proxmox Backup Server** | Yes | Yes | Yes | Yes | None (reached over HTTP) |
| **Kopia** | Yes | Yes | Yes | Yes | `kopia` binary, plus a reachable [Kopia repository server](https://kopia.io/docs/repository-server/) |

The rest of this section adds detail the table above doesn't cover.

### Which backup drivers does Calagopus support?

Eight, listed in the table above. See the [Backup Disks](#backup-disks) table for what each one stores to.

### Which drivers store backups off the node?

The remote drivers need credentials, entered when creating the configuration; the node-local ones need none on the Panel side. A node-local backup is only as safe as the node, so pick a remote driver if you need off-host durability.

### Which drivers deduplicate?

**Restic** and **DdupBak** deduplicate within their repository. **Proxmox Backup Server** and **Kopia** go further and deduplicate incrementally against the previous snapshot of the same server, so a backup only transfers the chunks that changed. Btrfs and ZFS snapshots are space-efficient on the host, but that's a property of the filesystem, not the backup driver, so they aren't counted as deduplicating here.

### Which drivers let users browse a backup and restore individual files?

Everything in the table except **S3** supports [browse](#browsing-backups-from-the-client-ui); **Local** needs the `zip` or `seven_zip` archive format for it to work.

### Do any drivers need extra software or setup on the Wings node?

Yes, as listed in the **Extra node software** column above. **Proxmox Backup Server**, **S3**, **Local**, and **DdupBak** need nothing extra.

### Can I use different drivers for different servers?

Yes. A backup configuration is assigned at the **location**, **node**, or **server** level, and the Panel uses the most-specific assignment (server → node → location). See [Assigning a Backup Configuration](#assigning-a-backup-configuration). A common setup is a remote driver as the location-wide default with per-node or per-server overrides.

### How do I verify a new configuration works?

Click **Test** on the configuration's form and pick a node. [Testing a Configuration](#testing-a-configuration) lists what each disk checks. For the most complete check, run a small backup of a real server that uses the configuration.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| S3 backups fail with `failed to initiate multipart upload`, `417 Expectation Failed`, or `SignatureDoesNotMatch` | Three causes account for nearly all reports. The bucket name is in the **Endpoint** field as well as the **Bucket** field, which doubles it in the request path, so the endpoint should be the bare service URL. The clock on the Wings host or the panel host is off, which breaks request signing at a skew of a few seconds, so check `timedatectl` on both. Or the key doesn't have permission on the bucket. Endpoints with a path in them, such as `https://minio.example.com/s3`, aren't supported. Cloudflare R2 works through its S3 endpoint, not through a custom domain on the bucket. |
| Restic backups fail with `repository is already locked exclusively`, then succeed on retry | A backup ran while a deletion or prune held the repository's exclusive lock. Since Wings 1.2.7, operations on one repository are queued within each node: backups and stats runs share it, deletions and prunes wait until they are alone. Collisions are still possible between different nodes using the same repository, or with restic run by hand. Raise **Retry Lock Seconds** on the configuration so the backup waits instead of failing, and schedule prune jobs away from scheduled backups. A lock left behind by a crashed restic process is cleared automatically on Wings 1.2.6 and newer; on older versions run `restic unlock` against the repository. |
| Restic storage keeps growing even though old backups are deleted | Deleting a backup only forgets the snapshot. The data stays until `restic prune` runs. Add a [prune job](#disk-specific-settings) to the configuration; on Panels before 1.2.7 those only did a dry run. To reclaim the space right away, turn on **Maintenance Enabled** for the configuration, run `restic prune` against the repository (and `restic unlock` first if a stale lock is reported), then turn maintenance off. |
| Restoring a **Shared** restic, Kopia or Proxmox Backup Server backup onto a server on a different node fails with `internal server error`, because Wings answered `backup not found` | Panels before 1.2.8 only let the node that made a backup fetch its repository details, so cross-node restores of shared backups failed. Update the Panel. Reattaching the backup first is no workaround for Proxmox Backup Server, which looks the snapshot up by server. |
| Restic says the repository doesn't exist | The repository setting points at a directory inside the repository, or at a parent of it. It must be the repository root, the directory that contains `config` and `keys`. |
| A backup is stuck at "creating" or "deleting" with no way to remove it | Restart Wings. Anything still in progress is marked failed, and failed backups can be deleted. Proxmox Backup Server deletions that got stuck because of missing permissions clear themselves after a while. |
| Proxmox Backup Server fails with `PBS denied access (HTTP 403)` even though the token has a role on the datastore | With **Privilege Separation** on (the PBS default), a token can only do what both it and its user are allowed to do. Add the permission for the user as well as the token. See [the PBS settings](#disk-specific-settings). Deleting backups also needs `DatastorePowerUser` (or anything with `Datastore.Prune`), not just `DatastoreBackup`. |
| Backups disappeared after a server transfer or after deleting an old node | Backups belong to the node that made them. When transferring a server, select the backups in the transfer dialog, or they stay behind and are lost when that node is deleted. For remote drivers (S3, restic and Kopia), turn on **Shared** on the configuration so every node can see the same backups and a transferred server keeps them without copying anything. It's off by default, so an existing configuration almost certainly needs the change. |
| ZFS or Btrfs backups fail with `failed to parse dataset name`, `server volume ... is not its own ZFS dataset`, or `Failed to get ZFS dataset name ...` followed by whatever `zfs list` printed | Snapshot backups need the server to live on its own dataset or subvolume, which means `system.disk_limiter_mode` set to `zfs_dataset` or `btrfs_subvolume` and existing servers converted with `wings migrate-disk-limiter`. See [Disk Limiters](../disk-limiters/index.md). When Wings runs in a container, it also needs to see the pool: bind-mount the dataset at its real mountpoint and pass `/dev/zfs` through to the container, otherwise `zfs list` fails inside the container and its complaint is what ends up in the error. |
| Backups drag the server's TPS down | The first snapshot of a server is expensive whatever the driver, later ones are incremental. `system.backups.read_limit` and `system.backups.write_limit` throttle the local, S3, restic and Proxmox Backup Server drivers. Kopia, ddup-bak and the ZFS and Btrfs snapshot drivers ignore them. |
| Large backup downloads fail with a `524` from Cloudflare or a `504` from the proxy | Cloudflare's proxy caps request time and upload size. Serve the node's hostname with the orange cloud off, or download through a hostname that bypasses Cloudflare. See [Cloudflare](../../additional/reverse-proxies/panel.md#cloudflare). |
