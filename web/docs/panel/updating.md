# Updating the Panel

Please see the [Minimum Requirements](./overview.md#minimum-requirements) section in the Panel Overview documentation.

::::tabs
=== On Linux using Docker (Recommended)
Head to the Calagopus directory where the `compose.yml` file is located and run theses 2 commands:
```bash
docker compose pull
docker compose up -d
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
systemctl restart calagopus-panel
```
=== Binary
## Linux
For Linux, first stop Calagopus:
```bash
systemctl stop calagopus-panel
```
Then, run theses commands:
```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-linux" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel

calagopus-panel version
```
Finally, start it again:
```bash
systemctl start calagopus-panel
```

## MacOS
For MacOS, first stop Calagopus:
```bash
# todo
```
Then, run theses commands:
```bash
sudo curl -L "https://github.com/calagopus/panel/releases/latest/download/panel-rs-$(uname -m)-macos" -o /usr/local/bin/calagopus-panel
sudo chmod +x /usr/local/bin/calagopus-panel

calagopus-panel version
```
Finally, start it again:
```bash
# todo
```

## Windows
For Windows, first stop the service:
```powershell
nssm stop "Calagopus Panel"
```
Then, grab the latest executable by downloading it [here](https://github.com/calagopus/panel/releases/latest/download/panel-rs-x86_64-windows.exe), and add it to the same directory as the old `calagopus-panel.exe` executable.

It can be `C:\bin`, `C:\Tools` or anything. For this example, we will use `C:\bin`.
![Placing executable to C:\bin](./installation/images/bin.png)

Then, delete the old executable, and rename the executable to `calagopus-panel` so that you don't have to manually type out the file name:
![Renaming executable](./installation/images/rename.png)

Once that's done, start Calagopus again:
```powershell
nssm start "Calagopus Panel"
```
::::