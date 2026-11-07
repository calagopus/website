import type { DefaultTheme } from 'vitepress';

export const compareSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Compare',
    items: [
      { text: 'Overview', link: '/compare/', docFooterText: 'Pterodactyl Alternatives Compared' },
      {
        text: 'Calagopus vs',
        items: [
          { text: 'Pterodactyl', link: '/compare/calagopus-vs-pterodactyl', docFooterText: 'Calagopus vs Pterodactyl' },
          { text: 'Pelican', link: '/compare/calagopus-vs-pelican', docFooterText: 'Calagopus vs Pelican' },
          { text: 'AMP', link: '/compare/calagopus-vs-amp', docFooterText: 'Calagopus vs AMP' },
        ],
      },
      { text: 'Pterodactyl vs Pelican', link: '/compare/pterodactyl-vs-pelican' },
    ],
  },
];

export const docsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'About Calagopus',
    items: [
      { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
      { text: 'Feature Reference', link: '/docs/about/features' },
      {
        text: 'Benchmarks',
        collapsed: true,
        items: [
          { text: 'Panel', link: '/docs/about/benchmarks' },
          { text: 'Daemon', link: '/docs/about/daemon-benchmarks' },
        ],
      },
      { text: 'Sponsors', link: '/docs/about/sponsors' },
      {
        text: 'Principles',
        collapsed: true,
        items: [
          { text: 'Architecture', link: '/docs/about/architecture' },
          { text: 'Security', link: '/docs/about/security' },
          { text: 'Telemetry', link: '/docs/about/telemetry' },
          { text: 'Branding', link: '/docs/about/branding' },
          { text: 'Translations', link: '/docs/about/translations' },
          { text: 'Licenses', link: '/docs/about/licenses' },
        ],
      },
      {
        text: 'Blog',
        link: '/blog/',
        collapsed: true,
        items: [{ text: 'Calagopus 1.2.0 released', link: '/blog/release-1.2.0' }],
      },
    ],
  },

  {
    text: 'Releases',
    link: '/docs/releases/',
    items: [
      { text: 'Panel', link: '/docs/releases/panel' },
      { text: 'Wings', link: '/docs/releases/wings' },
      { text: 'DB Agent', link: '/docs/releases/db-agent' },
    ],
  },

  {
    text: 'Panel',
    link: '/docs/panel/',
    items: [
      { text: 'Overview', link: '/docs/panel/overview' },
      { text: 'Environment', link: '/docs/panel/environment' },
      {
        text: 'Features',
        link: '/docs/panel/features/',
        collapsed: true,
        items: [
          {
            text: 'Authentication',
            link: '/docs/panel/features/auth/',
            collapsed: true,
            items: [
              { text: 'Login', link: '/docs/panel/features/auth/login' },
              { text: 'Register', link: '/docs/panel/features/auth/register' },
              { text: 'Password Reset', link: '/docs/panel/features/auth/password-reset' },
            ],
          },
          {
            text: 'Dashboard',
            link: '/docs/panel/features/dashboard/',
            collapsed: true,
            items: [
              { text: 'Servers', link: '/docs/panel/features/dashboard/servers' },
              { text: 'Account', link: '/docs/panel/features/dashboard/account' },
              { text: 'Security Keys', link: '/docs/panel/features/dashboard/security-keys' },
              {
                text: 'API Keys',
                link: '/docs/panel/features/dashboard/api-keys',
                collapsed: true,
                items: [{ text: 'Permissions Reference', link: '/docs/panel/features/dashboard/permissions' }],
              },
              { text: 'SSH Keys', link: '/docs/panel/features/dashboard/ssh-keys' },
              { text: 'Command Snippets', link: '/docs/panel/features/dashboard/command-snippets' },
              { text: 'OAuth Links', link: '/docs/panel/features/dashboard/oauth-links' },
              { text: 'Sessions', link: '/docs/panel/features/dashboard/sessions' },
              { text: 'Keyboard Shortcuts', link: '/docs/panel/features/dashboard/keyboard-shortcuts' },
              { text: 'Activity', link: '/docs/panel/features/dashboard/activity' },
            ],
          },
          {
            text: 'Server',
            link: '/docs/panel/features/server/',
            collapsed: true,
            items: [
              { text: 'Console', link: '/docs/panel/features/server/console' },
              { text: 'Files', link: '/docs/panel/features/server/files' },
              {
                text: 'Databases',
                link: '/docs/panel/features/server/databases/',
                collapsed: true,
                items: [
                  { text: 'Classic', link: '/docs/panel/features/server/databases/classic' },
                  { text: 'Managed', link: '/docs/panel/features/server/databases/managed' },
                ],
              },
              { text: 'Schedules', link: '/docs/panel/features/server/schedules' },
              { text: 'Subusers', link: '/docs/panel/features/server/subusers' },
              { text: 'Backups', link: '/docs/panel/features/server/backups' },
              {
                text: 'Network',
                link: '/docs/panel/features/server/network/',
                collapsed: true,
                items: [
                  { text: 'Allocations', link: '/docs/panel/features/server/network/allocations' },
                  { text: 'Firewall', link: '/docs/panel/features/server/network/firewall' },
                  { text: 'Connections', link: '/docs/panel/features/server/network/connections' },
                ],
              },
              { text: 'Startup', link: '/docs/panel/features/server/startup' },
              { text: 'Mounts', link: '/docs/panel/features/server/mounts' },
              { text: 'Devices', link: '/docs/panel/features/server/devices' },
              { text: 'Settings', link: '/docs/panel/features/server/settings' },
              { text: 'Activity', link: '/docs/panel/features/server/activity' },
            ],
          },
          {
            text: 'Admin',
            link: '/docs/panel/features/admin/',
            collapsed: true,
            items: [
              {
                text: 'System',
                collapsed: true,
                items: [
                  { text: 'Settings', link: '/docs/panel/features/admin/settings' },
                  { text: 'Announcements', link: '/docs/panel/features/admin/announcements' },
                  { text: 'Assets', link: '/docs/panel/features/admin/assets' },
                  { text: 'Extensions', link: '/docs/panel/features/admin/extensions' },
                ],
              },
              {
                text: 'Infrastructure',
                collapsed: true,
                items: [
                  { text: 'Locations', link: '/docs/panel/features/admin/locations' },
                  { text: 'Nodes', link: '/docs/panel/features/admin/nodes' },
                  { text: 'Servers', link: '/docs/panel/features/admin/servers' },
                ],
              },
              {
                text: 'Users & Access',
                collapsed: true,
                items: [
                  { text: 'Users', link: '/docs/panel/features/admin/users' },
                  { text: 'Roles', link: '/docs/panel/features/admin/roles' },
                  { text: 'OAuth Providers', link: '/docs/panel/features/admin/oauth-providers' },
                  { text: 'Activity', link: '/docs/panel/features/admin/activity' },
                ],
              },
              {
                text: 'Nests & Eggs',
                collapsed: true,
                items: [
                  { text: 'Nests', link: '/docs/panel/features/admin/nests' },
                  { text: 'Egg Library', link: '/docs/panel/features/admin/egg-library' },
                  { text: 'Egg Configurations', link: '/docs/panel/features/admin/egg-configurations' },
                  { text: 'Egg Repositories', link: '/docs/panel/features/admin/egg-repositories' },
                ],
              },
              {
                text: 'Databases',
                collapsed: true,
                items: [
                  { text: 'Database Hosts', link: '/docs/panel/features/admin/database-hosts' },
                  { text: 'Database Agent Hosts', link: '/docs/panel/features/admin/database-agent-hosts' },
                  { text: 'Database Agent Templates', link: '/docs/panel/features/admin/database-agent-templates' },
                ],
              },
              {
                text: 'Storage',
                collapsed: true,
                items: [
                  { text: 'Mounts', link: '/docs/panel/features/admin/mounts' },
                  { text: 'Devices', link: '/docs/panel/features/admin/devices' },
                  { text: 'Backup Configurations', link: '/docs/panel/features/admin/backup-configurations' },
                  { text: 'System Backup Policies', link: '/docs/panel/features/admin/system-backup-policies' },
                ],
              },
            ],
          },
        ],
      },
      {
        text: 'Installation',
        link: '/docs/panel/installation/',
        collapsed: true,
        items: [
          { text: 'Your first VPS', link: '/docs/panel/installation/first-vps' },
          { text: 'Docker', link: '/docs/panel/installation/docker' },
          { text: 'Binary', link: '/docs/panel/installation/binary' },
          { text: 'Package Manager', link: '/docs/panel/installation/pkgmanager' },
          {
            text: 'External Methods',
            link: '/docs/panel/installation/external-methods/',
            collapsed: true,
            items: [
              { text: 'TrueNAS SCALE', link: '/docs/panel/installation/external-methods/truenas' },
              { text: 'Unraid', link: '/docs/panel/installation/external-methods/unraid' },
              { text: 'umbrelOS', link: '/docs/panel/installation/external-methods/umbrelos' },
              { text: 'Runtipi', link: '/docs/panel/installation/external-methods/runtipi' },
              { text: 'ZimaOS', link: '/docs/panel/installation/external-methods/zimaos' },
              { text: 'Proxmox VE', link: '/docs/panel/installation/external-methods/proxmox' },
              { text: 'Hostinger', link: '/docs/panel/installation/external-methods/hostinger' },
            ],
          },
        ],
      },
      { text: 'Updating', link: '/docs/panel/updating' },
      {
        text: 'Next Steps',
        link: '/docs/panel/next-steps/',
        collapsed: true,
        items: [
          { text: 'Adding egg repositories', link: '/docs/panel/next-steps/egg-repos' },
          { text: 'Setting up a Reverse Proxy', link: '/docs/panel/next-steps/reverse-proxy' },
        ],
      },
      {
        text: 'Extensions',
        link: '/docs/panel/extensions/',
        collapsed: true,
        items: [
          { text: 'Installing Extensions', link: '/docs/panel/extensions/installing-extensions' },
          { text: 'Uninstalling Extensions', link: '/docs/panel/extensions/uninstalling-extensions' },
          { text: 'Disabling Extensions', link: '/docs/panel/extensions/disabling-extensions' },
          { text: 'Switching to the Heavy Image', link: '/docs/panel/extensions/switching-to-the-heavy-image' },
          { text: 'Patching and Adding Translations', link: '/docs/panel/extensions/patching-translations' },
          { text: 'Development Environment', link: '/docs/panel/extensions/dev-environment' },
          { text: 'Extension File Structure', link: '/docs/panel/extensions/file-structure' },
          { text: 'Getting your Extension ready', link: '/docs/panel/extensions/getting-your-extension-ready' },
          {
            text: 'Concepts',
            collapsed: true,
            items: [
              { text: 'Theming', link: '/docs/panel/extensions/concepts/theming' },
              { text: 'File Overrides', link: '/docs/panel/extensions/concepts/file-overrides' },
              { text: 'Events', link: '/docs/panel/extensions/concepts/events' },
              { text: 'Settings', link: '/docs/panel/extensions/concepts/settings' },
              { text: 'User Settings', link: '/docs/panel/extensions/concepts/user-settings' },
              { text: 'Routing', link: '/docs/panel/extensions/concepts/routing' },
              { text: 'Permissions', link: '/docs/panel/extensions/concepts/permissions' },
              { text: 'CLI Commands', link: '/docs/panel/extensions/concepts/cli-commands' },
              {
                text: 'Background Tasks and Shutdown Handlers',
                link: '/docs/panel/extensions/concepts/background-tasks-and-shutdown-handlers',
              },
              {
                text: 'Update Checks and Extension Calls',
                link: '/docs/panel/extensions/concepts/update-checks-and-extension-calls',
              },
              { text: 'Frontend API Calls', link: '/docs/panel/extensions/concepts/frontend-api' },
              { text: 'Activity Logging', link: '/docs/panel/extensions/concepts/activity-logging' },
              { text: 'Translations', link: '/docs/panel/extensions/concepts/translations' },
              { text: 'Mounting UI', link: '/docs/panel/extensions/concepts/mounting-ui' },
              { text: 'Quick Actions', link: '/docs/panel/extensions/concepts/quick-actions' },
              { text: 'File Manager', link: '/docs/panel/extensions/concepts/file-manager' },
              { text: 'Forms', link: '/docs/panel/extensions/concepts/forms' },
              { text: 'Toasts', link: '/docs/panel/extensions/concepts/toasts' },
              { text: 'Frontend Events', link: '/docs/panel/extensions/concepts/frontend-events' },
              { text: 'Extending Models', link: '/docs/panel/extensions/concepts/extending-models' },
              { text: 'Email Templates', link: '/docs/panel/extensions/concepts/email-templates' },
              { text: 'Index HTML Variables', link: '/docs/panel/extensions/concepts/index-html-variables' },
              { text: 'Speaking Game Protocols', link: '/docs/panel/extensions/concepts/speaking-game-protocols' },
              { text: 'File Storage', link: '/docs/panel/extensions/concepts/file-storage' },
            ],
          },
        ],
      },
    ],
  },
  {
    text: 'Wings',
    link: '/docs/wings/',
    items: [
      { text: 'Overview', link: '/docs/wings/overview' },
      { text: 'Configuration', link: '/docs/wings/configuration' },
      {
        text: 'Installation',
        link: '/docs/wings/installation/',
        collapsed: true,
        items: [
          { text: 'Docker', link: '/docs/wings/installation/docker' },
          { text: 'Binary', link: '/docs/wings/installation/binary' },
          { text: 'Package Manager', link: '/docs/wings/installation/pkgmanager' },
        ],
      },
      { text: 'Updating', link: '/docs/wings/updating' },
      {
        text: 'Next Steps',
        link: '/docs/wings/next-steps/',
        collapsed: true,
        items: [
          { text: 'Configuring a New Node', link: '/docs/wings/next-steps/configure-node' },
          { text: 'Setting up Allocations', link: '/docs/wings/next-steps/setting-up-allocations' },
          { text: 'Setting up SSL', link: '/docs/wings/next-steps/ssl' },
          { text: 'Setting up a Reverse Proxy', link: '/docs/wings/next-steps/reverse-proxy' },
        ],
      },
      {
        text: 'Disk Limiters',
        link: '/docs/wings/disk-limiters/',
        collapsed: true,
        items: [
          { text: 'Fusequota', link: '/docs/wings/disk-limiters/fusequota' },
          { text: 'BTRFS subvolume', link: '/docs/wings/disk-limiters/btrfs-subvolume' },
          { text: 'ZFS Dataset', link: '/docs/wings/disk-limiters/zfs-dataset' },
          { text: 'XFS Quota', link: '/docs/wings/disk-limiters/xfs-quota' },
        ],
      },
      {
        text: 'Advanced',
        link: '/docs/wings/advanced/',
        collapsed: true,
        items: [
          { text: 'Backup Configurations', link: '/docs/wings/advanced/backup-configurations' },
          { text: 'Exposing Wings in a Homelab', link: '/docs/wings/advanced/exposing-wings-in-a-homelab' },
          { text: 'The Private Network', link: '/docs/wings/advanced/private-network' },
          { text: 'Running Wings with Podman', link: '/docs/wings/advanced/running-wings-with-podman' },
        ],
      },
    ],
  },
  {
    text: 'DB Agent',
    link: '/docs/db-agent/',
    items: [
      { text: 'Overview', link: '/docs/db-agent/overview' },
      { text: 'Configuration', link: '/docs/db-agent/configuration' },
      { text: 'Templates', link: '/docs/db-agent/templates' },
      {
        text: 'Installation',
        link: '/docs/db-agent/installation/',
        collapsed: true,
        items: [
          { text: 'Docker', link: '/docs/db-agent/installation/docker' },
          { text: 'Binary', link: '/docs/db-agent/installation/binary' },
          { text: 'Package Manager', link: '/docs/db-agent/installation/pkgmanager' },
        ],
      },
      { text: 'Updating', link: '/docs/db-agent/updating' },
      {
        text: 'Next Steps',
        link: '/docs/db-agent/next-steps/',
        collapsed: true,
        items: [
          { text: 'Setting up SSL', link: '/docs/db-agent/next-steps/ssl' },
          { text: 'Setting up a Reverse Proxy', link: '/docs/db-agent/next-steps/reverse-proxy' },
        ],
      },
      {
        text: 'Advanced',
        link: '/docs/db-agent/advanced/',
        collapsed: true,
        items: [{ text: 'Running DB Agent Rootless', link: '/docs/db-agent/advanced/running-db-agent-rootless' }],
      },
    ],
  },
  {
    text: 'Additional',
    link: '/docs/additional/',
    items: [
      {
        text: 'Migrations',
        link: '/docs/additional/migrations/',
        collapsed: true,
        items: [
          {
            text: 'From another Panel',
            collapsed: true,
            items: [
              { text: 'Pterodactyl', link: '/docs/additional/migrations/pterodactyl' },
              { text: 'Pelican', link: '/docs/additional/migrations/pelican' },
              { text: 'Wings Nodes', link: '/docs/additional/migrations/wings' },
            ],
          },
          {
            text: 'To another Instance',
            collapsed: true,
            items: [
              { text: 'Docker', link: '/docs/additional/migrations/calagopus/docker' },
              { text: 'Standalone', link: '/docs/additional/migrations/calagopus/standalone' },
            ],
          },
        ],
      },
      {
        text: 'Database Hosts',
        link: '/docs/additional/database-hosts/',
        collapsed: true,
        items: [
          { text: 'MySQL (MariaDB)', link: '/docs/additional/database-hosts/mysql' },
          { text: 'PostgreSQL', link: '/docs/additional/database-hosts/postgres' },
          { text: 'MongoDB', link: '/docs/additional/database-hosts/mongodb' },
        ],
      },
      { text: 'SSL Certificates', link: '/docs/additional/ssl-certificates' },
      { text: 'Reverse Proxies', link: '/docs/additional/reverse-proxies' },
      {
        text: 'Setting up OAuth',
        link: '/docs/additional/setting-up-oauth/',
        collapsed: true,
        items: [
          { text: 'GitHub', link: '/docs/additional/setting-up-oauth/github' },
          { text: 'Google', link: '/docs/additional/setting-up-oauth/google' },
          { text: 'Discord', link: '/docs/additional/setting-up-oauth/discord' },
          { text: 'Generic', link: '/docs/additional/setting-up-oauth/generic' },
        ],
      },
      { text: 'Troubleshooting', link: '/docs/additional/troubleshooting' },
    ],
  },

  {
    text: 'Integrations',
    link: '/docs/integrations/',
    items: [
      { text: 'VS Code', link: '/docs/integrations/vscode' },
      { text: 'Docs MCP', link: '/docs/integrations/docs-mcp' },
      { text: 'Paymenter', link: '/docs/integrations/paymenter' },
      { text: 'WHMCS', link: '/docs/integrations/whmcs' },
      { text: 'Blesta', link: '/docs/integrations/blesta' },
      { text: 'FOSSBilling', link: '/docs/integrations/fossbilling' },
    ],
  },
];

export const sidebar: DefaultTheme.SidebarMulti = {
  '/compare/': compareSidebar,
  '/': docsSidebar,
};
