---
next: false
---

# Feature Reference

A high-level overview of what Calagopus offers, followed by a comparison with other panels.

## Highlights

- **Fast**: Both the node daemon and panel backend are written in Rust, designed to use as few resources as possible while delivering a responsive experience.
- **Secure**: Security is a first-class concern in the architecture, with hardening built in by default.
- **Easy to use**: The panel is designed to be approachable without requiring a background in server administration.
- **Open Source**: The code is on GitHub and contributions are welcome.
- **Cross-Platform**: The panel runs on essentially any operating system.
- **Extensible**: A built-in extension system lets you add custom backend logic, routes, UI elements, and more.
- **Scalable**: The architecture scales horizontally - add more backend instances, read replicas, and Wings nodes as load grows.
- **WebAuthn**: Users can authenticate with passkeys, biometrics, or hardware security keys.
- **Schedule Tasks**: Automate server management with time- and event-based scheduling.
- **Subuser Management**: Grant other users scoped access to a server without full admin rights.
- **File Manager**: Browse, upload, download, and edit server files directly from the panel, including archive and backup browsing.
- **API**: A comprehensive API covers everything the panel UI does. See the [API Reference](https://demo.calagopus.com/api) for details.

## Feature Comparison

| Feature | Calagopus | Pterodactyl | Pelican | AMP |
| --- | --- | --- | --- | --- |
| Free & Open Source | ✅ | ✅ | ✅ | ❌ |
| Native Extension System | ✅ | ❌ | ✅ | ❌ |
| Uncommon Game-specific Features | ❌ | ❌ | ❌ | ✅ |
| Live Console | ✅ | ✅ | ✅ | ✅ |
| File Manager | ✅ | ✅ | ✅ | ✅ |
| File Edit History | ✅ | ❌ | ❌ | ❌ |
| Backup Browsing Support | ✅ | ❌ | ❌ | ✅ |
| Archive Browsing Support | ✅ | ❌ | ❌ | ❌ |
| SFTP Support | ✅ | ✅ | ✅ | ✅ |
| SSH (Shell) Support | ✅ | ❌ | ❌ | ❌ |
| Schedule Tasks | ✅ | ✅ | ✅ | ✅ |
| Advanced Schedule Triggers | ✅ | ❌ | ❌ | ✅ |
| Database Management | ✅ | ✅ | ✅ | ✅ |
| Subuser Management | ✅ | ✅ | ✅ | ✅ |
| Backups | ✅ | ✅ | ✅ | ✅ |
| Advanced Backup Drivers | ✅ | ❌ | ❌ | ✅ |
| Extra Allocations | ✅ | ✅ | ✅ | ✅ |
| WebAuthn Authentication | ✅ | ❌ | ❌ | ✅ |
| OAuth Support | ✅ | ❌ | ✅ | ✅ |
| Asset Management | ✅ | ❌ | ❌ | ✅ |
| User Management | ✅ | ✅ | ✅ | ✅ |
| User Impersonation | ✅ | ❌ | ❌ | ❌ |
| Support for multiple Nodes | ✅ | ✅ | ✅ | ✅ |
| Egg Repository System | ✅ | ❌ | ❌ | ❌ |
| MySQL Server-Database Support | ✅ | ✅ | ✅ | ❌ |
| Postgres Server-Database Support | ✅ | ❌ | ❌ | ❌ |
| MongoDB Server-Database Support | ✅ | ❌ | ❌ | ❌ |
| Dynamic Backup Configuration System | ✅ | ❌ | ❌ | ❌ |
| Mount Management | ✅ | ✅ | ✅ | ✅ |
| Role Management | ✅ | ❌ | ✅ | ✅ |
| Admin Activity Log | ✅ | ❌ | ❌ | ✅ |

If anything in this table looks inaccurate, let us know on Discord or open an issue on GitHub.
