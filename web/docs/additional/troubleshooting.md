---
title: Troubleshooting
description: Fixes for the problems people bring to Calagopus support most often. Where the logs are, why the panel won't start, why a node shows as unreachable, why Wings won't boot, why installs fail, and what to check first.
---

# Troubleshooting

This page collects the problems that come up again and again in support, with the fix that worked each time. It covers things that don't belong to a single guide: the panel not starting, the panel and Wings not talking to each other, Wings refusing to boot, and servers that won't install. Problems tied to one feature live on that feature's page:

- [Reverse proxies](./reverse-proxies.md#troubleshooting), including "connection lost" banners, `413` errors, and wrong client IPs
- [Exposing Wings in a homelab](../wings/advanced/exposing-wings-in-a-homelab.md#troubleshooting)
- [SSL certificates](./ssl-certificates.md#troubleshooting)
- [Backups](../wings/advanced/backup-configurations.md#troubleshooting)
- [Extensions](../panel/extensions/installing-extensions.md#troubleshooting)
- [Migrating from Pterodactyl](./migrations/pterodactyl.md#troubleshooting-the-import) and [from Pelican](./migrations/pelican.md#troubleshooting)
- [Wings in Docker](../wings/installation/docker.md#troubleshooting)

If you end up asking for help on [Discord](https://discord.gg/uSM8tvTxBV), bring the logs and a diagnostics link. Both are described in the next section.

## Finding the Logs

Most problems are diagnosed in under a minute once the right log is in front of someone. Which log depends on how you installed things.

**Panel in Docker.** Run `docker compose logs web` from the directory that holds `compose.yml`. If the command answers `no configuration file provided: not found`, you are in the wrong directory. On the AIO image the bundled Wings writes to the same log, with each line prefixed by `[wings]`.

**Panel as a binary or package.** Run `journalctl -xeu calagopus-panel`. If `APP_LOG_DIRECTORY` is set, the files are in that directory too.

**Wings in Docker.** Run `docker compose logs wings` from the Wings compose directory.

**Wings as a binary or package.** Run `journalctl -u wings --no-pager`. The log files live in `/var/log/calagopus-wings` unless you changed `system.log_directory`.

**Wings from inside the panel.** Open **Admin → Nodes → (your node) → Logs**. This works as long as the panel can reach the node at all.

**Diagnostics reports.** Both binaries can collect their configuration, versions and recent logs into a single report and offer to upload it to pastes.dev. You get to review the output before anything is sent.

```bash
# Panel (Docker)
docker compose exec web calagopus-panel diagnostics

# Panel (binary)
calagopus-panel diagnostics

# Wings
wings diagnostics
```

**A server install failed but the panel shows no log.** If the install container never started, there is nothing for the panel to show. The reason is in the Wings log.

**Wings answers with a plain "Internal Server Error" page.** Wings always returns JSON, even for errors. A blank or HTML error means something in between answered instead, usually a reverse proxy or a wrong port. Check the proxy's log and the port in the node URL.

## Versions and Clocks

Two things break panel-to-Wings communication in confusing ways, and they are worth ruling out before anything else.

**The panel and Wings are on different versions.** The two are released together and a newer Wings needs a newer panel, and the other way round. Symptoms include every server showing a spinner on the dashboard while the console page works, a `missing field` error when opening the Files tab, and all nodes losing their connection at once after Wings auto-updated. Check **Admin → Nodes → (your node) → Overview** for the Wings version and compare it with the panel version shown in the admin area, then update whichever is behind. Don't mix `:nightly` on one side with a stable release on the other, and don't run nightly in production unless you update both sides at the same time.

**The clocks on the panel host and the Wings host disagree.** Requests between the panel and Wings are signed with a short-lived token, and backup uploads to S3 are signed the same way. A skew of twenty seconds is enough. It shows up as `JWT validation error from wings: invalid token: token has invalid issued at time`, as `417 Expectation Failed` on S3 backups, as a console that refuses to connect while the file manager works, as two-factor codes being rejected, or as people being logged out and rate limited for no reason. Run `timedatectl` on both hosts. `System clock synchronized: yes` is what you want, and the UTC time should match to the second. The time zone doesn't matter, only the instant. Enable time sync with `timedatectl set-ntp true`, then restart both the panel and Wings so they pick up the corrected clock.

## The Panel Won't Start

**`APP_ENCRYPTION_KEY is required: NotPresent`.** The panel can't see its environment. In Docker that means the variable is missing from `compose.yml`. For a binary install the `.env` file isn't where the panel looks, see [Environment Configuration](../panel/environment.md). The same panic appears when you run a one-off command against the image outside the compose stack, such as `docker run --entrypoint calagopus-panel ... version`. Pass the variable explicitly in that case: `-e APP_ENCRYPTION_KEY=x` is enough for `version`.

**A panic in `cache.rs` or `database.rs` mentioning `failed to lookup address information`, `ConfigParseError` or `Name or service not known`.** `REDIS_URL` or `DATABASE_URL` is malformed. When the compose comment says to change the hostname, change only the hostname part and keep the `redis://` and `postgres://` schemes intact. The hostname must match the compose service name, `cache` and `db` in the stock files. A Redis instance that doesn't resolve at all was also fixed once by switching to the Valkey image the compose file ships with.

**`error while checking ntp time: failed to resolve pool.ntp.org` in the log.** The container has no working DNS. This line by itself is harmless, the time check runs in the background and only logs, but it is the first sign of the DNS problem that makes the Redis or Postgres connection panic. The current compose files give the `web` service its own resolvers. If yours predates that, add them:

```yaml
services:
  web:
    dns:
      - 1.1.1.1
      - 8.8.8.8
      - 9.9.9.9
```

Then run `docker compose up -d`.

**`Redis(RedisError { kind: WrongPass ...` or `password authentication failed for user "calagopus"`.** The password the panel was given doesn't match the one the database or cache actually has. On TrueNAS this is usually a password with special characters that the app form doesn't escape the same way the containers do, or a failed first deploy that left the containers with the earlier password. Use a password made of letters and digits, or reset the stored one inside the database container to the value in your app configuration:

```bash
docker exec -it ix-calagopus-postgres-1 psql -U calagopus
\password
```

**Postgres restarts forever with `PANIC: replication checkpoint has wrong magic 0`.** The host was shut down uncleanly and a small checkpoint file in the Postgres data directory is corrupt. Stop the stack, delete `pg_logical/replorigin_checkpoint` inside the compose directory's `postgres` folder (the one the `db` service mounts, not the host's own Postgres in `/var/lib/postgresql`), then start again. Postgres recovers and logs `database system is ready to accept connections`.

**The panel shows an error page or a white screen, and the logs mention the database.** Check `df -h` before anything else. A full disk stops the panel from talking to Postgres. Free space, then `docker compose restart`. On the heavy image, `docker image prune -a` usually recovers a lot.

**Every refresh sends you back to the setup wizard, and "Get started" does nothing.** The setup step stored in the database is stuck. Mark it finished with the CLI and restart the panel. The admin account and everything else you created stays.

```bash
# Docker
docker compose exec web calagopus-panel oobe finish

# Binary
calagopus-panel oobe finish
```

If you would rather do it in SQL, delete both spellings of the key, since different panel versions wrote it under each:

```bash
docker compose exec db psql -U panel panel -c "delete from settings where key in ('oobe_step', '::oobe_step');"
```

If the wizard appears on an install that previously had data, the data directory is gone. Run `ls -lh postgres` in the compose directory. An empty folder means the volume or mount point was removed, and there is nothing to recover without a backup.

**Locked out by the captcha.** A wrong Turnstile or reCAPTCHA key blocks the login page itself. Disable the captcha in the database, log in, then enter the keys again under **Admin → Settings → Captcha**:

```bash
docker compose exec db psql -U panel panel -c "delete from settings where key = '::captcha_provider';"
```

**Lost the admin password, or need another admin.** The CLI manages users without the web interface. Prefix the commands with `docker compose exec web` on Docker.

```bash
calagopus-panel users reset-password
calagopus-panel users create
calagopus-panel users disable-2fa
calagopus-panel users verify-email
```

**The panel loads in a private window but not in your normal browser.** Stale state from an earlier install on the same address. Clear the site data for the panel's origin.

**The panel is unreachable after a host reboot until you restart the stack.** The reverse proxy points at the container's Docker IP, and that address changes on reboot. Point the proxy at `127.0.0.1:8000` instead.

**An update left the panel in a broken state.** `docker compose restart` doesn't recreate containers. Use `docker compose down` followed by `docker compose up -d`. On the heavy image, see [Extensions](../panel/extensions/installing-extensions.md#troubleshooting) if the version shown is still the old one.

**Reaching the panel from a URL other than the configured one shows a warning.** The URL under **Admin → Settings → Application** decides whether cookies are marked secure. Accessing an `https://` panel over `http://` breaks login. Fix the address you use, or change the setting to match it. Remove any trailing slash from that URL, it causes odd errors of its own.

## The Panel Can't Reach the Node

Almost every "node unreachable" report is a URL problem on the node's **General** tab. Work through the list in order.

**The URL has no port.** Wings listens on `api.port`, `8080` by default. A URL without a port means `443` for `https://` and `80` for `http://`, which nothing answers on. Add the port unless a reverse proxy on `443` sits in front of Wings. The form warns about this and offers to add `:8080` for you.

**The URL points at the panel, at `localhost`, or at `0.0.0.0`.** The URL must be the address of Wings as seen from the panel host. `0.0.0.0` is never a valid address to connect to, and neither is `localhost` when the panel runs in a container, because `localhost` inside a container is the container itself. Use the node's real IP, or its LAN IP when both run on the same machine. The same rule applies to `remote:` in the Wings config, which must be the panel's address as seen from the node.

**The scheme doesn't match Wings.** Use `https://` only when `api.ssl.enabled` is `true` in the Wings config, and `http://` otherwise. Wings logs which one it started at boot. A browser error of `SSL_ERROR_RX_RECORD_TOO_LONG` means you are speaking HTTPS to a plain HTTP port.

**"Backend to Wings" passes but "Frontend to Wings" fails, the console spins forever, or the browser console shows `The operation is insecure` or `Mixed Content`.** The panel is served over HTTPS and the node over HTTP. Browsers refuse to open an insecure WebSocket from a secure page. Either give Wings a certificate ([SSL configuration](../wings/configuration.md#ssl-configuration)), put it behind a [reverse proxy](./reverse-proxies.md#putting-wings-behind-a-reverse-proxy), or enable [Wings proxy mode](../wings/advanced/exposing-wings-in-a-homelab.md). If the panel URL under **Admin → Settings → Application** still starts with `http://` after you switched to HTTPS, the frontend builds `ws://` addresses and hits the same block. After changing the scheme, update both the URL and the Public URL on the node.

**URL and Public URL differ.** Unless you have a reason for them to differ, make them identical. A common mistake is a port on one and not the other, which leaves every server with a grey spinner on the dashboard while the individual server pages work. With Wings proxy mode, clear the Public URL or use the globe button next to it, not the panel's own address.

**Servers show "Unknown", and the panel log has `Connection refused` or `Temporary failure in name resolution` for `/api/servers/utilization`.** The panel container can't resolve the node's hostname, which happens on Ubuntu when the panel and Wings share a host and `/etc/hosts` maps the hostname to `127.0.1.1`. The current compose files give the `web` service its own DNS servers to avoid this. Add the `dns:` block shown under [The Panel Won't Start](#the-panel-won-t-start) if yours lacks it, or use the host's IP in the node URL.

**Panel and Wings in separate compose stacks on one host can't reach each other.** Each stack has its own network, so `localhost` and the service names don't cross over. Use the host's IP in both the node URL and `remote:`. `host.docker.internal` works on some hosts and not others, so prefer the IP.

**`wings api status code 401 Unauthorized: invalid authorization token`.** The `token_id` and `token` in the Wings config don't match what the panel has for the node. This happens after **Reset Token** on the node, and occasionally after editing the compose file and recreating Wings. Copy the values from **Admin → Nodes → (your node) → Configuration** into `config.yml` and restart Wings, not the panel.

**"Frontend to Wings" fails with `Network Error` while the backend check passes, or uploads fail for one user but not another.** The browser is reaching the panel through an origin Wings doesn't allow. By default Wings only accepts requests from the address in `remote:`. Add the exact origin, scheme and port included, to `allowed_origins` in the Wings config and restart Wings. This also covers a panel reached through Tailscale, a LAN address, or a dev server port.

**Wings log shows `retry attempt N failed ... missing field` or a `FATAL` line mentioning `github.com/pterodactyl/wings`.** The `remote:` URL points at the old panel, or the old Pterodactyl Wings is still what systemd starts. Set `remote:` to the Calagopus panel, and see [Updating Wings](../wings/updating.md) if the binary itself is the old one.

**Two nodes with the same URL.** Every Wings instance needs its own URL, and a node belongs to exactly one panel. A second panel cannot reuse a node registered to the first.

**On the AIO image the bundled node's address is wrong.** The AIO node has no editable Wings URL. The panel rewrites it to `http://localhost:64332` on every start, and the address browsers use is derived from the panel URL under **Admin → Settings → Application**, as `<panel url>/wings-proxy/<node uuid>`. Change that setting and give the settings cache a minute to refresh. The AIO node's token can't be reset, and the node can't be deleted while you run an `-aio` image (`The AIO node cannot be deleted`). To leave AIO mode, switch the image tag to the non-AIO equivalent, run `docker compose down`, remove `./build/binaries` if you were on `heavy-aio`, and `docker compose up -d`. After that the node can be deleted. Remove the `2022:2022` port mapping the bundled Wings used from the panel's compose file, or it collides with a standalone Wings on the same host.

## Wings Won't Start

**`failed to start http server (address already in use)` or `failed to start ssh server (0.0.0.0:2022 already in use)`.** Something else holds the port. Usually it is another copy of Wings: the old Pterodactyl Wings still enabled in systemd, a foreground `wings` you started for testing, or the bundled AIO Wings whose ports the panel's compose file still publishes. Find it with `ss -tlnp | grep 8080` and stop it.

**`wings.service: Start request repeated too quickly`, and the unit describes itself as "Pterodactyl Wings Daemon".** A stale unit file from an earlier install. `wings service-install` refuses to overwrite an existing one and prints `service file already exists`, so pass `--override`:

```bash
wings service-install --override
systemctl daemon-reload
systemctl restart wings
```

Running `sudo wings` in a terminal as a workaround keeps Wings alive only until the session ends. The service runs as root too. What must not be root is `system.username` in the Wings config, which Wings refuses outright when it resolves to UID or GID 0.

**`failed to load config from ...: No such file or directory`, or `... Is a directory (os error 21)`.** Either the config file was never written, or, when the compose file bind-mounts a single file rather than a directory, the file didn't exist on the host when the container first started and Docker created a directory at that path. Stop the container, delete whatever Docker created, write the real file with the configuration from the panel, and start again. The stock Wings compose files mount a directory and only hit the first case. The file-mount case is what happens to the panel's `wings-config.yml` on the AIO images and to the DB Agent's `config.yml`.

**`failed to load SSL certificate and key ... No such file or directory`.** Wings runs in a container and the certificate directory isn't mounted into it. Add the mount and recreate the container:

```yaml
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

**`the docker network overlaps with another network. automatically incrementing ...`.** This warning is normal. Wings picks the next free range and carries on. It becomes a problem only when it ends in `failed to create docker network after N attempts` or `invalid JSON: ParseAddr("172.x.0.1/32")`. Then pick a range nothing else uses and set it in the Wings config, changing all three values together:

```yaml
docker:
  network:
    interface: 172.66.0.1
    interfaces:
      v4:
        subnet: 172.66.0.0/16
        gateway: 172.66.0.1
```

**`network calagopus_nw not found` when a server starts, on a node migrated from Pterodactyl.** `docker.network.name` and `docker.network.mode` must be the same. A migrated config keeps `name: pterodactyl_nw` but picks up the new default `mode: calagopus_nw`. Set both to the network that actually exists. Wings from 1.1.3 on warns about this at boot and names the value to set.

**`Cannot read IPv6 setup for bridge ... disable_ipv6: no such file or directory`.** IPv6 is disabled at the kernel level on the host, and Docker can't create a bridge with IPv6 on it. Turn IPv6 off for the Wings network by setting [`docker.network.interfaces.v6.enabled`](../wings/configuration.md#docker-network-interfaces-v6-enabled) to `false` in the Wings config, then restart Wings:

```yaml
docker:
  network:
    interfaces:
      v6:
        enabled: false
```

Wings refuses to create the network if v4 and v6 are both disabled, so leave v4 on.

**`system.data_directory '...' is not covered by any mount of the wings container`.** Wings inspects its own container at boot and maps the directories from its config to their paths on the host, so the host side of a volume can live anywhere. What it can't do is reach a directory that isn't mounted at all. Each of `system.data_directory`, `system.tmp_directory`, `system.vmount_directory`, and `system.passwd.directory` when that feature is on, has to sit inside one of the container's volumes. Add a volume that covers the one named in the error, for example `/srv/wings-data:/var/lib/calagopus-wings/volumes`, and recreate the container. `bind source path does not exist` on a server install is the older form of the same problem, from Wings before 1.1.0, which handed config paths to Docker unchanged. Update Wings.

**`failed to load config ... Permission denied (os error 13)`.** The config or data directory is owned by a different user than the one Wings runs as, often because `docker compose up` was run as a normal user once and as root another time. Run compose consistently, or fix the ownership.

**Wings reports the old version after an update.** For binary installs, replacing the file isn't enough if the service was never restarted, or if you replaced a different binary than the one systemd runs. Check `systemctl cat wings` for the path, then `systemctl restart wings`. **Admin → Nodes → (your node) → Overview** shows what is actually running.

**Podman and rootless Docker.** Wings works under Podman with some care, see [Running Wings with Podman](../wings/advanced/running-wings-with-podman.md). Two host-level issues came up more than once: a missing memory cgroup controller (`cat /sys/fs/cgroup/cgroup.controllers` doesn't list `memory`), which needs `cgroup_enable=memory` on the kernel command line, notably on Raspberry Pi, and SELinux relabel flags on volume mounts, which must be the lowercase `:z`, not `:Z`, under rootless Podman. Under a rootless engine Wings also refuses to build server firewalls, so a server with firewall rules won't start and the log says so. Set `docker.firewall.backend` to `disabled` to run those servers unprotected, or use a rootful engine. The [private network](../wings/advanced/private-network.md) feature isn't supported on rootless engines either.

## Servers Won't Install or Start

**The install log is full of `Temporary failure resolving`, `Could not resolve host`, `Unable to locate package jq`, and ends with `Unable to access jarfile server.jar`.** Containers on this node can't resolve DNS. The panel still reports "Installation has completed successfully", because Wings judges an install by the status file the script writes, not by the container's exit code, and eggs imported from Pterodactyl never write one. Set the resolvers in the Wings config under `docker.network.dns`, either in `config.yml` or through **Admin → Nodes → (your node) → Configuration**, then restart Wings and reinstall the server. Some hosting providers block public resolvers, in which case use the ones from the host's `/etc/resolv.conf`. If pulling the image itself fails with `lookup ghcr.io on [::1]:53`, the Docker daemon has no DNS either. Add it to `/etc/docker/daemon.json` and restart Docker:

```json
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
```

**Servers fail to start with `network calagopus_nw not found` right after running `docker system prune -a`.** The prune removed the Docker network Wings created, and Wings only creates it at startup. Restart Wings. Use `docker image prune -a` for routine cleanup, which leaves networks alone. Pruned images are pulled again on demand since Wings 1.1.0.

**`failed to bind host port <ip>:<port>: cannot assign requested address`.** The allocation's IP isn't assigned to any interface on the host, so Docker can't bind it. This is normal on Oracle Cloud and other providers that give the VM a private address and route the public IP to it, and with IPv6 addresses that were never added to an interface. Change the allocation to `0.0.0.0`, or to an address from `ip addr`, under **Admin → Nodes → (your node) → Allocations**.

**The server runs and the console works, but nobody can connect.** In order of likelihood: the allocation uses `127.0.0.1`, which is reachable only from the node itself; the host firewall doesn't allow the port, and secondary ports such as a Steam query port are easy to forget; or the router isn't forwarding it. Wings proxy mode doesn't help here, it only carries panel traffic, never game traffic.

**A port in the config file resets every time the server starts.** The egg writes the server's primary allocation into that file on boot. Set the allocation you want as **Primary** on the server's Network page.

**Every old server exits with code `128` after you restored or copied the data directory, while new servers work.** The copy lost the ownership Wings expects. Fix it recursively on the node, using the user from `system.username` and the data directory from your config:

```bash
chown -R calagopus:calagopus /var/lib/calagopus-wings/volumes
```

Nodes migrated from Pterodactyl keep the `pterodactyl` user and `/var/lib/pterodactyl/volumes`.

**`UnsupportedClassVersionError` or `Unsupported class file major version NN` on a Minecraft server.** The Java version doesn't match the game version. Class file version 65 is Java 21, 61 is Java 17, 69 is Java 25. Pick the matching Docker image on the server's Startup page, or add the version you need to the egg's image list.

**`./run.sh: Permission denied`.** Uploaded scripts lose their execute bit. Right-click the file in the file manager, open the permissions dialog, and add execute.

**`<VARIABLE>: is required and cannot be empty` when creating a server.** A required egg variable wasn't filled in. Scroll down on the create form.

**The create form won't accept input in most fields.** No egg is installed yet. Sync an egg repository under **Admin → Egg Repositories** and install the eggs you need, see [Adding egg repositories](../panel/next-steps/egg-repos.md).

**`self-assigning allocations is not enabled for this server`.** Users may only add their own allocations when an [egg configuration](../panel/features/admin/egg-configurations.md) enables **User Self Assign** for that egg. Custom startup commands are gated the same way, which is why a custom command may silently revert to the egg's default.

**A server is stuck "Starting" or refuses to start after being unsuspended.** Wings keeps its own view of the server state. Restart Wings so it resyncs with the panel.

**An egg from the Pterodactyl community repository fails in odd ways.** Many of those eggs are unmaintained. Prefer the eggs shipped in Calagopus's own repositories, or the [pelican-eggs](https://github.com/pelican-eggs) versions, before debugging a two-year-old install script.

**A large download restarts several times and finally fails with an auth error in Chrome.** Chrome's Safe Browsing rescans big files and restarts the download, and the one-time download token expires before it finishes. Turn off Enhanced or Standard Protection for the download, or use another browser or `curl`.

## Database Hosts and the DB Agent

**The create-database dialog says `No hosts found` even though a host is registered and its connection test passes.** Registering a host is only half of it. The host needs **Deployment Enabled** on, and it must be attached to the server's node or to that node's location from the node's or location's **Database Hosts** tab. See [Making the Database Host Show Up for Users](./database-hosts/mysql.md#making-the-database-host-show-up-for-users).

**`Access denied for user 'calagopus'@'%' to database '...'` on MySQL or MariaDB.** The panel user needs `ALL PRIVILEGES ON *.*` with `GRANT OPTION`, not just access to one schema, because it creates a database and a user per game server. Run the statements from the [MySQL guide](./database-hosts/mysql.md#creating-the-panel-user) rather than clicking through a GUI.

**`must be able to SET ROLE "..."` on PostgreSQL.** Postgres won't let a non-superuser act as the roles it creates. Make the panel user a `SUPERUSER` as the [PostgreSQL guide](./database-hosts/postgres.md#creating-the-panel-user) does.

**The connection test times out.** The database only listens on `127.0.0.1`. Bind it to `0.0.0.0` and allow the user from the panel's address, see [Configuring Remote Access](./database-hosts/mysql.md#configuring-remote-access). A host imported from Pterodactyl often still says `127.0.0.1`, which points at the panel container itself once the panel runs in Docker. Change it to the database host's real address.

**"Backend to DB Agent: The panel could not reach the host".** The agent's management API binds to `0.0.0.0:8090` by default. Older panel versions suggested `8080` in the form, so check the port against `api.bind` in the agent's `config.yml`, not the `bind` under `postgres`, `mariadb`, `mongodb` or `redis`, which are the database proxies. As with Wings, `localhost` in the URL means the panel container, not the host.

**The agent host is attached and healthy but the host list in the create dialog stays empty.** Three things must all be true: a [template](../db-agent/templates.md) for the database type has been imported, the agent host is attached to the server's node or location, and the host's **Memory** and **Disk** budget still has room for the new instance. Raising the budget fixed the last report. Instances are created from the server's Databases page, not from the admin host page.

**The database list doesn't update after adding one.** Refresh the page.

## OAuth and Integrations

**`unable to extract email from Object {...}` or `unable to extract identifier from Object {...}` on login.** The provider didn't return the claim the provider configuration reads. Discord only returns `email` when the `email` scope is granted, and not always then. Edit the field paths on the provider to match what the provider actually sends. First and last name are optional since 1.2.0 and no longer fail a login when the provider omits them. Older panels rejected a Google account with no last name.

**Role mappings don't apply.** Mappings run when an account is linked. On panels older than 1.1.1 they didn't run on later logins, so the user had to unlink and relink. Since 1.1.1 they apply on every login.

**Paymenter reports `invalid authorization header` or `you do not have permission to perform this action: locations.read`.** The API key field needs the full key, which is only shown once when it is created, not the prefix shown in the list. The key also needs the `locations.read` permission alongside the server permissions. After updating the Paymenter extension, run `php artisan queue:restart` in Paymenter, otherwise the queue worker keeps the old code and fails with `Call to undefined method`.

**Paymenter OAuth login fails for users migrated from Pterodactyl.** Paymenter links a customer's panel account the first time it creates a server for them. Users whose servers were migrated never went through that step, so the provider rejects them until they are linked. Recent versions of the module can link existing users from its admin area. See [Paymenter](../integrations/paymenter.md#optional-oauth-account-linking) for how linking works.

**WHMCS custom field values are ignored.** Remove the quotes around the values in WHMCS.

## SFTP

**The client connects, then drops or times out after a few seconds.** The client offered several SSH keys before falling back to a password. Wings drops the connection once the client exceeds `system.sftp.limits.authentication_pubkey_attempts`. Add your key on the [SSH Keys](../panel/features/dashboard/ssh-keys.md) page, or tell the client to use password authentication or a specific key.

**A subuser can't log in over SFTP with their panel password.** They need the SFTP permission on that server.

**SFTP shows the old hostname after you changed the panel URL.** The SFTP address is the node's **SFTP Host** field, not the panel URL. Update it on the node.

**Transfers are slow or capped at a couple of files at once.** FileZilla defaults to two concurrent transfers, and the panel's one-click connect doesn't get along with Cyberduck. WinSCP on Windows and the SFTP support built into Dolphin on Linux work better. The server side limits are under [SFTP Configuration](../wings/configuration.md#sftp-configuration).

**Logged in to the node as root and can't find the files.** Server files live under `system.data`, which is `/var/lib/calagopus-wings/volumes/<server uuid>` by default and `/var/lib/pterodactyl/volumes` on nodes migrated from Pterodactyl.
