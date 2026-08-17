export interface FeatureRow {
  name: string;
  calagopus: boolean;
  pterodactyl: boolean | null;
  pelican: boolean | null;
  amp: boolean | null;
}

export interface FeatureBullet {
  name: string;
  description: string;
}

export interface FeatureCategory {
  id: string;
  title: string;
  description?: string;
  rows?: FeatureRow[];
  bullets?: FeatureBullet[];
}

export const featureCategories: FeatureCategory[] = [
  {
    id: 'core',
    title: 'Core & Extensibility',
    rows: [
      { name: 'Free & Open Source', calagopus: true, pterodactyl: true, pelican: true, amp: false },
      { name: 'Native Extension System', calagopus: true, pterodactyl: false, pelican: true, amp: true },
      {
        name: 'First-Party UI Component Interception API',
        calagopus: true,
        pterodactyl: false,
        pelican: false,
        amp: null,
      },
      { name: 'Multi-Repository Git-Backed Egg Sync', calagopus: true, pterodactyl: false, pelican: false, amp: null },
    ],
    bullets: [
      {
        name: 'Extensions Can Intercept or Replace Built-in UI Elements',
        description:
          "Extensions register hooks that intercept props, intercept rendering, or fully replace any of the panel's shared UI elements - not just append to fixed plugin slots.",
      },
      {
        name: 'Extension-Injectable Form Fields',
        description:
          'Extensions can inject or transform fields into dozens of built-in admin forms (roles, nodes, backups, servers, OAuth providers, and more) via a shared form engine.',
      },
      {
        name: 'Extension Dashboard Widgets & Navigation',
        description:
          'Extensions can add cards to the admin overview, sidebar entries, context-menu items, and low-level hooks into the console terminal and the file editor.',
      },
      {
        name: 'Extension Theming API',
        description:
          'Extensions can contribute theme overrides that merge with the base panel theme, and one extension can supply a CSS-variable resolver.',
      },
      {
        name: 'Inter-Extension Call API',
        description:
          'Extensions can expose and invoke named calls on each other for interop without hard dependencies.',
      },
      {
        name: 'Extension Background Tasks, Shutdown Hooks & CLI Commands',
        description:
          'Extensions can register long-running background tasks, graceful-shutdown handlers, custom CLI subcommands, and their own permission nodes.',
      },
      {
        name: 'In-Panel Extension Install with Live Build Logs',
        description:
          'Install an extension by uploading a package from the admin UI - the panel rebuilds itself and streams the build output live, with a license-acceptance step when required. Available on the official all-in-one (heavy) container image.',
      },
      {
        name: 'Extension Update Tracking',
        description:
          'The panel checks installed extensions for updates and surfaces changelogs alongside panel and node updates.',
      },
    ],
  },
  {
    id: 'console',
    title: 'Console & Real-Time Management',
    rows: [{ name: 'Live Console', calagopus: true, pterodactyl: true, pelican: true, amp: true }],
    bullets: [
      {
        name: 'Command Snippet Autocomplete',
        description: 'Type a shortcut in the console input to autocomplete a saved command snippet.',
      },
      {
        name: 'Command History with Resend',
        description:
          'Browse past console commands - including ones run by other users or by schedules - and resend or copy them with one click.',
      },
      {
        name: 'Live Docker Image Pull Progress',
        description:
          'Per-layer image pull and extraction progress renders as live progress bars in the console whenever the container image is pulled - not just a wall of status text.',
      },
      {
        name: 'Server Power & Stats Commands over SSH',
        description:
          'The SSH shell used for console access also accepts commands to start, stop, restart, or check resource stats, for users with the matching permissions.',
      },
    ],
  },
  {
    id: 'files',
    title: 'File Management',
    rows: [
      { name: 'File Manager', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'File Edit History', calagopus: true, pterodactyl: false, pelican: false, amp: null },
      {
        name: 'Real-Time Collaborative File Editing',
        calagopus: true,
        pterodactyl: false,
        pelican: false,
        amp: null,
      },
      { name: 'Backup Browsing Support', calagopus: true, pterodactyl: false, pelican: false, amp: true },
      { name: 'Archive Browsing Support', calagopus: true, pterodactyl: false, pelican: false, amp: null },
    ],
    bullets: [
      {
        name: 'Revision Diff Viewer',
        description:
          'View a side-by-side diff of any file revision against the current version or another revision, and restore directly from the diff.',
      },
      {
        name: 'Cross-Server File Copy',
        description:
          'Copy files or directories directly to a different server, with a remote directory browser, without a manual download/upload round trip.',
      },
      {
        name: 'Advanced File Search',
        description:
          'Search by filename or file content with glob include/exclude filters, size ranges, and case sensitivity.',
      },
      {
        name: 'File Checksum Calculator',
        description: 'Compute MD5, CRC32, and SHA-family checksums for a file directly from the file manager.',
      },
      {
        name: 'GUI Permissions Editor',
        description:
          'Visual owner/group/other read-write-execute editor with octal and symbolic display and recursive apply.',
      },
      {
        name: 'Disk Usage Treemap',
        description: 'A visual treemap of the largest directories on a server, with click-to-navigate.',
      },
      {
        name: 'Mass Rename Tool',
        description:
          'Bulk rename with find/replace (plain or regex), prefix/suffix, case transforms, and auto-numbering, with a live preview and undo.',
      },
      { name: 'Directory Upload', description: 'Upload an entire local folder tree, not just individual files.' },
      {
        name: 'Native Filesystem Disk Quotas',
        description:
          'Disk limits are backed by real filesystem quota mechanisms - Btrfs subvolumes, ZFS datasets, XFS project quotas, or a FUSE quota layer - rather than periodic recursive size scans.',
      },
      {
        name: 'Broad Archive Format Support',
        description:
          'Extract zip, tar (gzip, xz, lzip, bzip2, lz4, zstd), 7z, and read-only RAR archives, and browse zip and 7z archives in place without extracting them first.',
      },
      {
        name: 'Full SFTP Protocol Extensions',
        description:
          'Server-side copy, hard links, POSIX rename, fsync, quota-aware free-space reporting, and remote checksum verification for fully-featured SFTP clients.',
      },
    ],
  },
  {
    id: 'databases',
    title: 'Databases',
    rows: [
      { name: 'Database Management', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'MySQL Server-Database Support', calagopus: true, pterodactyl: true, pelican: true, amp: null },
      { name: 'PostgreSQL Server-Database Support', calagopus: true, pterodactyl: false, pelican: false, amp: null },
      { name: 'MongoDB Server-Database Support', calagopus: true, pterodactyl: false, pelican: false, amp: null },
      { name: 'Redis Server-Database Support', calagopus: true, pterodactyl: false, pelican: false, amp: false },
      {
        name: 'Containerized Database Provisioning ("Database Agent")',
        calagopus: true,
        pterodactyl: false,
        pelican: false,
        amp: null,
      },
    ],
    bullets: [
      {
        name: 'Dedicated Database Instance Controls',
        description:
          'Start, stop, and restart a provisioned database instance independently of the game server, with its own live CPU/memory graphs and log viewer.',
      },
      {
        name: 'Database Instance User & Database Sub-Management',
        description: 'Create and manage multiple logical databases and users within one provisioned database instance.',
      },
      {
        name: 'One-Click Database Engine Updates',
        description:
          'An "update available" badge lets you apply an engine version update to a provisioned database instance with one click.',
      },
      {
        name: 'Database Recreate with Confirm-by-Name',
        description: 'Safely wipe and recreate a database, requiring the name to be re-typed to confirm.',
      },
      {
        name: 'Database Password Rotation',
        description: "Rotate a database's credentials with one click, with the JDBC connection string shown alongside.",
      },
      {
        name: 'Database Import & Export',
        description:
          'Download a full dump of a provisioned database instance, or of a single database inside it, straight from the panel - SQL for MariaDB and PostgreSQL, archive for MongoDB, RDB for Redis. Importing works the same way.',
      },
    ],
  },
  {
    id: 'backups',
    title: 'Backups',
    rows: [
      { name: 'Backups', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'Advanced Backup Drivers', calagopus: true, pterodactyl: false, pelican: false, amp: null },
      { name: 'Dynamic Backup Configuration System', calagopus: true, pterodactyl: false, pelican: true, amp: null },
    ],
    bullets: [
      {
        name: 'Eight Backup Drivers Including Proxmox Backup Server',
        description:
          'Local tarballs, ddup-bak deduplicated local storage, Btrfs and ZFS snapshots, S3-compatible object storage, Restic, Kopia, and a dedicated Proxmox Backup Server integration.',
      },
      {
        name: 'Scheduled Restic Prune Jobs',
        description:
          'Schedule recurring Restic repository prune jobs per backup configuration, on a cron, targeting selected nodes - configured from the panel instead of a cron entry on every node.',
      },
      {
        name: 'Backup Groups',
        description: 'Organize backups into named, collapsible groups instead of one long chronological list.',
      },
      {
        name: 'Backup-to-Archive Export',
        description: 'Convert an existing backup into a downloadable archive, placed directly into the file manager.',
      },
      {
        name: 'Selective Restore Options',
        description:
          'Restore can optionally truncate the target directory first, and separately choose whether to reapply the startup command, image, and variables captured at backup time.',
      },
      {
        name: 'Node-Level Backup Management',
        description:
          'Admins can browse every backup stored on a node - including ones whose server was deleted - and reattach, restore, or export them.',
      },
      {
        name: 'Location, Node & Server-Scoped Backup Configurations',
        description:
          'Backup configurations resolve per server through its node and location, with separate shared and maintenance-mode flags.',
      },
    ],
  },
  {
    id: 'scheduling',
    title: 'Scheduling & Automation',
    rows: [
      { name: 'Schedule Tasks', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'Advanced Schedule Triggers', calagopus: true, pterodactyl: false, pelican: false, amp: true },
    ],
    bullets: [
      {
        name: 'Conditional Workflow Steps',
        description:
          'Schedule steps can branch on nested AND/OR/NOT conditions over server state, uptime, resource usage, file existence, or variables - not just a linear task list.',
      },
      {
        name: 'Eight Trigger Types',
        description:
          "Beyond cron: power actions, server state changes, crashes, backup status, resource-usage thresholds sustained over time, matched console lines, and chaining off another schedule's success or failure.",
      },
      {
        name: 'Regex Extraction Into Variables',
        description:
          'A schedule step can run a regex over any string or captured variable - including console lines captured by a wait step or console trigger - and store the match groups into reusable schedule variables.',
      },
      {
        name: 'Wait-for-Console-Line / Wait-for-State Steps',
        description:
          'Pause a schedule until specific console output appears or the server reaches a target power state, with a timeout.',
      },
      {
        name: 'Dedicated Crash-Detection Trigger',
        description:
          'A schedule trigger type fires specifically when the server crashes, separate from generic state-change triggers.',
      },
      {
        name: 'Human-Readable Cron Builder',
        description:
          'A simplified frequency picker generates cron expressions under the hood and describes the schedule in plain language.',
      },
      {
        name: 'Schedule Import/Export',
        description:
          'Export an entire schedule - including every trigger, condition, and workflow step - as a portable config and import it on another server.',
      },
    ],
  },
  {
    id: 'networking',
    title: 'Networking',
    rows: [
      { name: 'Extra Allocations', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'SFTP Support', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'SSH (Shell) Support', calagopus: true, pterodactyl: false, pelican: false, amp: false },
    ],
    bullets: [
      {
        name: 'Built-in Port Tunneling',
        description:
          "Wings can proxy a TCP or UDP connection to a container's internal, unpublished port over an authenticated WebSocket - a building block for extensions that avoids opening extra ports on the host.",
      },
      {
        name: 'Per-Egg Allocation Policy',
        description:
          'A reusable policy per group of eggs controls whether users may assign their own allocations, how ports are picked, and whether a primary allocation is required and protected from deletion.',
      },
      {
        name: 'Automatic Port-Usage Detection',
        description:
          'When assigning a port the panel asks the node which ports are actually in use and skips them - and refuses to assign rather than guess if the node is unreachable.',
      },
    ],
  },
  {
    id: 'subusers-roles',
    title: 'Subusers & Roles',
    rows: [
      { name: 'Subuser Management', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'Role Management', calagopus: true, pterodactyl: false, pelican: true, amp: null },
    ],
    bullets: [
      {
        name: 'Per-Subuser File Access Restrictions',
        description:
          "Restrict a subuser's file manager visibility to a list of ignored paths or patterns, independent of their other permissions.",
      },
      {
        name: 'Per-Role Two-Factor Enforcement',
        description:
          'A role can require its members to set up TOTP two-factor authentication before they can use the panel, overriding the global 2FA policy.',
      },
    ],
  },
  {
    id: 'auth-security',
    title: 'Authentication & Security',
    rows: [
      { name: 'WebAuthn Authentication', calagopus: true, pterodactyl: false, pelican: true, amp: true },
      { name: 'OAuth Support', calagopus: true, pterodactyl: false, pelican: true, amp: true },
      {
        name: 'OAuth Claim-Based Auto Role/Subuser Provisioning',
        calagopus: true,
        pterodactyl: false,
        pelican: false,
        amp: null,
      },
    ],
    bullets: [
      {
        name: 'Two-Factor Authentication (TOTP)',
        description: 'App-based TOTP two-factor authentication with recovery codes, independent of WebAuthn.',
      },
      {
        name: 'Multi-Provider CAPTCHA Support',
        description:
          'hCaptcha, reCAPTCHA (v2 and v3), Cloudflare Turnstile, and Friendly Captcha are all supported and switchable in settings.',
      },
      {
        name: 'Fully Custom OAuth2 Provider Configuration',
        description:
          'Wire up any OAuth2 provider with raw auth/token/info URLs, custom scopes, and JSON-path field mapping - not limited to a fixed provider list.',
      },
      {
        name: 'Session Management',
        description:
          'View all active login sessions with IP, device, and last-used time, and revoke any of them individually.',
      },
      {
        name: 'Scoped, Expiring API Keys',
        description:
          'Personal API keys with independently selectable permission scopes, an IP allowlist, and an optional expiration date.',
      },
      {
        name: 'SSH Key Import from Git Providers',
        description: 'Import SSH public keys directly by username from GitHub, GitLab, or Launchpad.',
      },
      {
        name: 'Flexible Mandatory 2FA',
        description:
          'Admins can mandate two-factor authentication panel-wide, for admins only, or per role - users are locked out of everything except their own 2FA setup page until they enroll.',
      },
      {
        name: 'Account Freeze',
        description:
          'Freeze an account so its owner can no longer change their own password, email, name, avatar, or 2FA settings, without suspending or deleting it. Full suspension is a separate, independent toggle.',
      },
    ],
  },
  {
    id: 'account-onboarding',
    title: 'Account & Onboarding',
    bullets: [
      {
        name: 'Guided First-Run Setup Wizard',
        description:
          'A first-boot wizard walks through admin account creation, app configuration, egg-repository bootstrap, and creating the first location, node, and server.',
      },
      {
        name: 'Personal Activity Log',
        description:
          'Every user has a self-service activity feed showing their own actions, IP, timestamp, and whether it came from the web UI or the API.',
      },
      {
        name: 'Customizable Keyboard Shortcuts',
        description:
          'Rebind, disable, or reset any panel keyboard shortcut, and export or import a whole shortcut profile as text.',
      },
      { name: 'Avatar Upload with Cropping', description: 'Upload and crop a custom avatar directly in the browser.' },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    rows: [
      { name: 'User Management', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'User Impersonation', calagopus: true, pterodactyl: false, pelican: false, amp: null },
      { name: 'Admin-Action Audit Log', calagopus: true, pterodactyl: false, pelican: false, amp: null },
      { name: 'Asset Management', calagopus: true, pterodactyl: false, pelican: false, amp: null },
    ],
    bullets: [
      {
        name: 'Three-Tier Activity Logging',
        description:
          'Independent audit trails for admin actions, per-server activity (including events reported by the node daemon), and per-account activity.',
      },
      {
        name: 'Scoped, Scheduled Announcements',
        description:
          'In-panel announcements with a scheduled start/end date, auto-dismiss, and scoping to specific locations, nodes, backup configurations, or eggs.',
      },
      {
        name: 'System Health & Diagnostics Dashboard',
        description:
          'A dashboard tracking database migration status, fleet-wide node clock-desync detection, and a live debug-mode toggle.',
      },
      {
        name: 'Centralized Update Tracking',
        description:
          'One dashboard tracks outdated versions across the panel, Wings nodes, database agent hosts, and installed extensions, with extension changelogs and panel/extension install history.',
      },
      {
        name: 'Backup Success/Failure Analytics',
        description: 'Per-backup-configuration stats broken out by today, this week, this month, and all time.',
      },
      {
        name: 'Pluggable Asset Storage Backend',
        description: 'Panel-managed assets can be stored on the local filesystem or in S3-compatible object storage.',
      },
      {
        name: 'Custom Email Templates',
        description:
          'Every transactional email is a live-editable template with a variable reference sidebar, its own enable/disable toggle, and reset-to-default, plus a choice of SMTP, sendmail, or file mail drivers.',
      },
      {
        name: 'Per-Endpoint API Rate Limits',
        description:
          'Rate limits (hit count and time window) are configurable individually per API endpoint group, such as login, registration, backup creation, or SFTP auth.',
      },
      {
        name: 'Configurable Activity-Log Retention',
        description: 'Separate retention windows (days and/or max count) for admin, user, and server activity logs.',
      },
      {
        name: 'External ID Lookup',
        description: 'Look up a server or user directly by an external ID from a billing or automation integration.',
      },
      {
        name: 'Egg Configurations',
        description:
          'A reusable policy layer per group of eggs controlling automatic port allocation rules, self-service allocation, dedicated-IP requirements, custom startup commands, and the default order of server dashboard tabs.',
      },
    ],
  },
  {
    id: 'nodes-infrastructure',
    title: 'Nodes & Infrastructure',
    rows: [
      { name: 'Support for multiple Nodes', calagopus: true, pterodactyl: true, pelican: true, amp: true },
      { name: 'Mount Management', calagopus: true, pterodactyl: true, pelican: true, amp: null },
    ],
    bullets: [
      {
        name: 'Live Node-to-Node Server Migration',
        description:
          'Bulk-transfer servers between nodes with a selectable allocation strategy, optional backup transfer, and a live per-server progress table.',
      },
      {
        name: 'Live Node Resource Monitoring',
        description:
          'Real-time CPU, memory, disk I/O, and network charts per node over a websocket, with auto-reconnect.',
      },
      {
        name: 'Remote Daemon Log Viewer',
        description: "Browse, download, and live-tail a node's Wings log files directly from the panel.",
      },
      {
        name: 'Bulk Fleet Config Push',
        description: 'Apply a configuration change to many selected nodes or database agent hosts at once.',
      },
      {
        name: 'Remote Wings Upgrade Endpoint',
        description:
          'Wings can be told to upgrade itself: it downloads the new binary, verifies its SHA-256 checksum, swaps the executable, and restarts automatically.',
      },
      {
        name: 'Automatic Crash Recovery',
        description:
          'Wings detects unexpected container exits, distinguishes out-of-memory kills from other crashes, and auto-restarts with a cooldown to prevent restart loops.',
      },
      {
        name: 'Self-Service Mount Attach/Detach',
        description: 'Users can attach or detach admin-provisioned mounts to their own server on demand.',
      },
    ],
  },
  {
    id: 'ui-ux',
    title: 'UI/UX & Internationalization',
    bullets: [
      {
        name: 'Available in 14+ Languages',
        description:
          'The panel ships with 14 languages, with right-to-left text direction applied automatically and locale-aware number formatting, pluralization, and date formatting.',
      },
      {
        name: 'Per-Field Localized Content',
        description:
          'Content like announcements can have a separate title and body maintained per language directly in the admin UI.',
      },
      {
        name: 'Customizable Server Navigation',
        description:
          'Reorder server dashboard tabs, add custom dividers and external links, either globally or per egg configuration for different game types.',
      },
      {
        name: 'Progressive Disclosure "Advanced Mode"',
        description: 'A global toggle hides or shows advanced fields across admin forms.',
      },
      {
        name: 'Live Ignore-Pattern Preview',
        description:
          "A directory browser live-renders gitignore-style exclusion patterns against the real file tree when you create a backup or restrict a subuser's file access.",
      },
      {
        name: 'Animated Theme Switch',
        description: 'Light/dark mode toggling uses an animated transition instead of an abrupt style swap.',
      },
    ],
  },
];
