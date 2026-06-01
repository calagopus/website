# Updating Wings

::: tip No downtime required
Game server containers run independently of the Wings daemon. You can update Wings without stopping your servers - they will continue running as normal.
:::

::::tabs
=== Docker (Recommended)
Pull the latest image and restart the stack:
```bash
docker compose pull
docker compose up -d
```
=== APT / RPM / APK
Run the package manager upgrade, then restart the service:
```bash
# APT
apt update
apt upgrade -y

# RPM
dnf check-update
dnf upgrade -y

# APK
apk update
apk upgrade
```
```bash
systemctl restart wings
```
=== Binary
Stop the service, replace the binary, then start it again:
```bash
systemctl stop wings
```
```bash
curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings
```

Verify the new version:
```bash
wings version
```
```bash
systemctl start wings
```
::::
