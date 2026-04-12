
::: warning
⚠️ **PAGE UNDER CONSTRUCTION** ⚠️

This section is currently being drafted. Some configuration options and troubleshooting steps may be missing or incomplete.
:::

# Configuration
This page covers all the configuration options for the Calagopus Wings Daemon, including how to set up and manage these configurations. It also includes troubleshooting tips for common configuration issues.

## SSL Configuration
The Wings configuration file is located at `/etc/pterodactyl/config.yml`. To enable SSL for your node, you will need to modify the api section, specifically lines `10`, `11`, and `12`.

::: info
This guide assumes you have already generated your certificates using Certbot. Replacing `<domain>` with your actual node domain will point Wings to the correct Let's Encrypt directory.
:::

### Enabling SSL
By default, the SSL setting is disabled. To secure your Wings communication, change `enabled: false` to `true` and provide the paths to your certificate files.

If you are using Let's Encrypt, your configuration block should be updated to look like this:
```bash
api:
  host: 0.0.0.0
  port: 8080
  ssl:
    enabled: true
    cert: /etc/letsencrypt/live/<domain>/fullchain.pem
    key: /etc/letsencrypt/live/<domain>/privkey.pem
```

### Applying Changes
After saving your changes to `config.yml`, you must restart the Wings service for the new SSL configuration to take effect:
```bash
sudo systemctl restart wings
```

