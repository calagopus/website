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
| **Proxmox Backup Server** | A [Proxmox Backup Server](https://www.proxmox.com/en/products/proxmox-backup-server) datastore | PBS server URL, datastore, API token, and server fingerprint |
| **Kopia** | A [Kopia](https://kopia.io) repository, via a running Kopia repository server | Kopia server URL, username, repository password, and server fingerprint |

The four node-local options (**Local**, **DdupBak**, **Btrfs**, **Zfs**) don't require any credentials on the Panel side - the Wings node writes directly to its own disk, at the path configured by [`system.backup_directory`](../configuration.md#system-backup-directory) (defaults to `/var/lib/pterodactyl/backups`). The four remote options (**S3**, **Restic**, **Proxmox Backup Server**, and **Kopia**) need credentials, which you enter when creating the configuration. All secrets are encrypted at rest using the Panel's encryption key.

Like **Restic** and **DdupBak**, both **Proxmox Backup Server** and **Kopia** deduplicate at the chunk level. What sets them apart is that they deduplicate *incrementally against the previous snapshot of the same server*, so a backup only uploads the chunks that changed since last time. Proxmox Backup Server stores each backup as a `pxar` archive in a PBS datastore; Kopia stores a snapshot in a Kopia repository, reached through a [Kopia repository server](https://kopia.io/docs/repository-server/). Kopia requires the `kopia` binary to be installed on the Wings node; PBS talks to the server over its HTTP API and needs no extra binary.

**DdupBak** is currently **experimental**, but it's the fastest deduplicating backend available - faster than restic both when creating and restoring backups - while keeping the operational setup as simple as a local tarball (no repository, no password, nothing to initialize). If you want deduplication and are comfortable with the experimental status, it's worth trying. See [ddup-bak on GitHub](https://github.com/0x7d8/ddup-bak) for details on the format.

**Btrfs** and **Zfs** store backups as filesystem snapshots and require the corresponding [disk limiter](../disk-limiters.md) to be configured on the Wings node - that's what puts each server on its own subvolume or dataset in the first place, and snapshots only exist relative to that. See the [Btrfs](../disk-limiters/btrfs-subvolume.md) and [ZFS](../disk-limiters/zfs-dataset.md) disk limiter guides for the host-side setup. The same migration caveat applies: servers created before their node switched to `btrfs_subvolume` / `zfs_dataset` won't have backups that work until you transfer the server off the node and back.

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

1. Fill in the disk-specific fields (see [S3](#s3-settings), [Restic](#restic-settings), [Proxmox Backup Server](#proxmox-backup-server-settings), or [Kopia](#kopia-settings) below; the node-local disks have no extra fields).
2. Click **Save**.

There is no "test connection" button. To verify a new configuration works, create a small test backup of a real server that's assigned to it.

## S3 Settings

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

::: tip
If you're unsure whether your provider needs **Path Style**, try it off first. If uploads fail with DNS or certificate errors, turn it on.
:::

## Restic Settings

Use the **Restic** disk when you want deduplicated, encrypted backups to any of restic's supported backends (S3, B2, Azure Blob Storage, Google Cloud Storage, SFTP, a REST server, local disk, etc.). See the [restic backend documentation](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html) for the full list and the repository URL format for each.

| Field | Value |
| --- | --- |
| **Repository** | The restic repository URL, e.g. `s3:https://s3.infra.rjns.dev/calagopus-restic`, `b2:bucketname:path/to/repo`, `sftp:user@host:/srv/restic-repo`. Must be at least 3 characters. |
| **Retry Lock Seconds** | How long restic should wait for a repository lock before giving up. `120` is a reasonable default. |
| **Password** | The restic repository password. Stored as the `RESTIC_PASSWORD` environment variable and encrypted at rest. |
| **Environment Variables** | Any additional environment variables restic needs for your chosen backend. |

Environment variables are whatever the restic backend requires - there is no fixed allowlist. Common examples:

| Backend | Required environment variables |
| --- | --- |
| S3, MinIO, R2, Wasabi, Hetzner | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| Backblaze B2 (native API) | `B2_ACCOUNT_ID`, `B2_ACCOUNT_KEY` |
| Azure Blob Storage | `AZURE_ACCOUNT_NAME`, `AZURE_ACCOUNT_KEY` (or `AZURE_ACCOUNT_SAS`) |
| Google Cloud Storage | `GOOGLE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` |

Refer to the [restic environment variables documentation](https://restic.readthedocs.io/en/stable/040_backup.html#environment-variables) for the complete list.

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

## Proxmox Backup Server Settings

Use the **Proxmox Backup Server** disk to store backups in a [Proxmox Backup Server](https://pbs.proxmox.com/docs/) datastore. Each Calagopus backup becomes a PBS snapshot (backup type `host`, backup ID `<prefix>-<server-uuid>`), uploaded as a deduplicated `pxar` archive. Wings authenticates with a PBS [API token](https://pbs.proxmox.com/docs/user-management.html#api-tokens) - create one in the PBS web UI under **Configuration → Access Control → API Token** and grant it permission on the target datastore (e.g. `DatastoreBackup`, plus `DatastoreReader` if you want restores and browsing).

| Field | Value |
| --- | --- |
| **URL** | The PBS server URL, e.g. `https://pbs.example.com:8007` |
| **Datastore** | The name of the PBS datastore to store backups in |
| **Namespace** | Optional [namespace](https://pbs.proxmox.com/docs/storage.html#backup-namespaces) within the datastore. Leave blank to use the datastore root. |
| **Token ID** | The API token in the form `user@realm!token-name`, e.g. `calagopus@pbs!wings` |
| **Token Secret** | The secret shown when the token was created (encrypted at rest; appears blank on re-edit) |
| **Fingerprint** | The PBS server's TLS certificate SHA-256 fingerprint (64 hex characters; colons are optional). Required - PBS connections are pinned to this fingerprint. |
| **Backup ID Prefix** | Optional prefix for the PBS backup ID. Defaults to `calagopus`. Wings will only ever delete snapshots whose backup ID matches `<prefix>-<server-uuid>`, so this also acts as a safety boundary against touching unrelated snapshots in the datastore. |

::: tip
You can read the fingerprint from the PBS web UI dashboard (**Show Fingerprint**) or with `proxmox-backup-manager cert info` on the PBS host. Either the colon-separated form (`AB:CD:...`) or the plain 64-character hex string works.
:::

## Kopia Settings

Use the **Kopia** disk to store backups in a [Kopia](https://kopia.io) repository. Wings does not connect to the underlying storage directly - instead it talks to a running [Kopia repository server](https://kopia.io/docs/repository-server/) (`kopia server start`), which fronts the actual repository (S3, B2, filesystem, etc.). This means the `kopia` binary must be installed on each Wings node that uses this configuration; Wings shells out to it and keeps its per-repository state (config and cache) under the `.kopia` subdirectory of [`system.backup_directory`](../configuration.md#system-backup-directory).

Backups are created as Kopia snapshots tagged with the backup UUID, deduplicated against the repository.

| Field | Value |
| --- | --- |
| **URL** | The Kopia repository server URL, e.g. `https://kopia.example.com:51515` |
| **Username** | The Kopia server username in the form `user@host`, e.g. `wings@node1`. The part after `@` is used as the override hostname when connecting. |
| **Password** | The Kopia server password (encrypted at rest; appears blank on re-edit) |
| **Fingerprint** | The Kopia server's TLS certificate SHA-256 fingerprint (64 hex characters; colons are optional). Required - the connection is pinned to this fingerprint. |
| **Tags** | Optional key/value tags (up to 50) applied to every snapshot created with this configuration, in addition to the automatic backup-UUID tag. Useful for grouping or policy targeting in Kopia. |

::: info
The username and password must correspond to a user that the Kopia repository server has been configured to accept (see [Kopia server access control](https://kopia.io/docs/repository-server/#server-access-control)). The fingerprint is the server's certificate fingerprint, which `kopia server start` prints on startup (and which you pass to clients as `--server-cert-fingerprint`).
:::

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

::: tip
A common setup is one restic repository per location (covering most servers) with per-node overrides for specialized hosts - e.g. a node that backs up to a Btrfs snapshot locally for faster restore, while the rest of the location goes to remote restic.
:::

## Maintenance Mode

Every backup configuration has a **Maintenance Enabled** toggle. Turn this on to prevent the configuration from being used without deleting it. This is useful when rotating credentials, doing restic repository maintenance (`restic prune`, `restic check`), or migrating to a new bucket.

While maintenance is enabled, any backup that would have used this configuration will fail. There is no automatic fallback to a less-specific configuration - turning on maintenance blocks that layer of the lookup entirely.

## Supported Backup Drivers FAQ

### Which backup drivers does Calagopus support?

Eight: **Local**, **DdupBak**, **Btrfs**, **Zfs**, **S3**, **Restic**, **Proxmox Backup Server**, and **Kopia**. See the [Backup Disks](#backup-disks) table for what each one stores to.

### Which drivers store backups off the node?

**S3**, **Restic**, **Proxmox Backup Server**, and **Kopia** write to remote storage and need credentials. The other four (**Local**, **DdupBak**, **Btrfs**, **Zfs**) write to the Wings node's own disk and need no Panel-side credentials. A node-local backup is only as safe as the node - if you need off-host durability, pick one of the remote drivers.

### Which drivers deduplicate?

**DdupBak**, **Restic**, **Proxmox Backup Server**, and **Kopia**. **Restic** and **DdupBak** deduplicate within their repository, while **Proxmox Backup Server** and **Kopia** additionally upload incrementally against the previous snapshot of the same server, so a backup only transfers the chunks that changed. **Local**, **Btrfs**, **Zfs**, and **S3** do not deduplicate (Btrfs/Zfs snapshots are space-efficient on the host, but that's a property of the filesystem, not the backup driver).

### Which drivers let users browse a backup and restore individual files?

**DdupBak**, **Btrfs**, **Zfs**, **Restic**, **Proxmox Backup Server**, and **Kopia** all support [browse](#browsing-backups-from-the-client-ui). **Local** supports it only with the `zip` or `seven_zip` archive format. **S3** does not support browse - those backups must be downloaded in full.

### Do any drivers need extra software or setup on the Wings node?

Yes:

- **Restic** requires the `restic` binary on the node.
- **Kopia** requires the `kopia` binary on the node, plus a reachable [Kopia repository server](https://kopia.io/docs/repository-server/).
- **Btrfs** and **Zfs** require the host filesystem to be Btrfs/ZFS and the matching [disk limiter](../disk-limiters.md) to be configured.
- **Proxmox Backup Server**, **S3**, **Local**, and **DdupBak** need no extra binaries on the node (PBS and S3 are reached over HTTP).

### Can I use different drivers for different servers?

Yes. A backup configuration is assigned at the **location**, **node**, or **server** level, and the Panel uses the most-specific assignment (server → node → location). See [Assigning a Backup Configuration](#assigning-a-backup-configuration). A common setup is a remote driver as the location-wide default with per-node or per-server overrides.

### How do I verify a new configuration works?

There is no "test connection" button. Create a small test backup of a real server that the configuration is assigned to - if it succeeds, the credentials and connectivity are good.
