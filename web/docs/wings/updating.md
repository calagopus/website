# Updating Wings

Please see the [Minimum Requirements](./overview.md#minimum-requirements) section in the Wings Overview documentation.

::::tabs
=== On Linux Bare-Metal (Binary)
First, stop the service by running this command:
```bash
systemctl stop wings
```

Then, download and install the new version of the Wings binary:
```bash
curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings
```

To test that the installation was successful, you can run:
```bash
wings version
```

And finally, start Wings back again:
```bash
systemctl start wings
```
=== On Linux with APT/RPM
Depending of your package manager, run theses commands:
```bash
# APT
apt update
apt upgrade -y

# RPM
dnf check-update
dnf upgrade -y
```
Then, restart the service:
```bash
systemctl restart wings
```