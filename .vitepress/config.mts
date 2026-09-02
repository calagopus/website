import { fileURLToPath } from 'node:url';
import { imagetools } from 'vite-imagetools';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import { compareFaqs } from './data/compare-faqs.ts';
import { dbAgentConfigDoc } from './data/config/db-agent.ts';
import { wingsConfigDoc } from './data/config/wings.ts';
import { faqs } from './data/faqs.ts';
import { acceptMarkdownPlugin } from './plugins/accept-markdown.ts';
import { aiDocPlugin } from './plugins/ai-doc.ts';
import { writeConfigDocs } from './plugins/config-docs.ts';
import { generateLlmsArtifacts } from './plugins/llms.ts';
import { imageAssetsPlugin, imageMime, writeImageManifest } from './plugins/mcp-images.ts';
import { recordPage, writePageManifest } from './plugins/mcp-manifest.ts';
import { expandReleaseMarkdown } from './plugins/releases.ts';
import { expandSponsorsMarkdown } from './plugins/sponsors.ts';

const SITE_URL = 'https://calagopus.com';
const SRC_DIR = 'web';

// Config reference pages are generated from their definitions before VitePress
// reads the source tree, so the rendered page, the raw `.md` and the example
// config block can never drift apart.
await writeConfigDocs([wingsConfigDoc, dbAgentConfigDoc], SRC_DIR);

interface SidebarNode {
  text?: string;
  link?: string;
  items?: SidebarNode[];
}

interface BreadcrumbEntry {
  name: string;
  item?: string;
}

let breadcrumbMap: Map<string, BreadcrumbEntry[]> | null = null;

function buildBreadcrumbMap(sidebar: SidebarNode[]): Map<string, BreadcrumbEntry[]> {
  const map = new Map<string, BreadcrumbEntry[]>();
  const walk = (items: SidebarNode[], trail: BreadcrumbEntry[]) => {
    for (const node of items) {
      const entry: BreadcrumbEntry = {
        name: node.text ?? '',
        item: node.link ? `${SITE_URL}${node.link.replace(/\/$/, '')}` : undefined,
      };
      if (node.link) map.set(node.link.replace(/\/$/, ''), [...trail, entry]);
      if (node.items) walk(node.items, [...trail, entry]);
    }
  };
  walk(sidebar, [{ name: 'Documentation', item: `${SITE_URL}/docs` }]);
  return map;
}

// https://vitepress.dev/reference/site-config
export default withMermaid({
  buildConcurrency: 128,
  srcDir: SRC_DIR,
  cleanUrls: true,

  vite: {
    plugins: [
      acceptMarkdownPlugin(),
      aiDocPlugin([
        {
          route: '/ai-doc/extensions.md',
          title: 'Extensions',
          sourceDir: 'docs/panel/extensions',
        },
      ]),
      imagetools({
        defaultDirectives: async (url, metadata) => {
          const ext = url.pathname.split('.').pop()?.toLowerCase() ?? '';
          const params = new URLSearchParams();
          if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return params;
          if (ext !== 'webp') params.set('format', 'webp');
          if (!url.searchParams.has('w') && ((await metadata()).width ?? 0) > 1600) {
            params.set('w', '1600');
          }
          return params;
        },
      }),
      imageAssetsPlugin(),
      ViteImageOptimizer({
        exclude: /\.webp$/i,
        png: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        svg: {
          multipass: true,
        },
      }),
    ],
    build: {
      assetsInlineLimit: (filePath) => (imageMime(filePath) === undefined ? undefined : false),
    },
    server: {
      allowedHosts: true,
    },
    resolve: {
      alias: [
        {
          find: /^.*\/VPDocFooterLastUpdated\.vue$/,
          replacement: fileURLToPath(new URL('./components/LastUpdated.vue', import.meta.url)),
        },
        {
          find: /^.*\/VPNavBarSocialLinks\.vue$/,
          replacement: fileURLToPath(new URL('./components/NavBarSocialLinks.vue', import.meta.url)),
        },
      ],
    },
  },

  markdown: {
    image: { lazyLoad: true },
    config(md) {
      md.use(tabsMarkdownPlugin);

      const defaultCodeInline = md.renderer.rules.code_inline!;
      md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
        tokens[idx].attrSet('v-pre', '');
        return defaultCodeInline(tokens, idx, options, env, self);
      };
    },
  },

  lang: 'en-US',
  lastUpdated: true,
  title: 'Calagopus',
  description:
    'Calagopus is a modern, open-source game server management panel built in Rust. Deploy, monitor, and manage Minecraft, Hytale, and other game servers with industry-leading performance.',
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://calagopus.com/fulllogo.png' }],
    ['meta', { property: 'og:site_name', content: 'Calagopus' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://calagopus.com/fulllogo.png' }],
    ['meta', { name: 'twitter:image:alt', content: 'Calagopus Logo' }],
    [
      'meta',
      {
        name: 'darkreader-lock',
      },
    ],
    ['link', { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' }],
    ['link', { rel: 'alternate', type: 'text/markdown', href: '/llms.txt' }],
    [
      'script',
      {
        async: '',
        src: 'https://cat.rjns.dev/js/pa-UGDhLytrpOd8s1bLYPQQt.js',
      },
    ],
    [
      'script',
      {},
      `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}}; plausible.init()`,
    ],
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: 'Calagopus',
            url: SITE_URL,
            logo: `${SITE_URL}/fulllogo.png`,
            sameAs: ['https://github.com/calagopus', 'https://discord.gg/uSM8tvTxBV'],
          },
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: 'Calagopus',
            url: SITE_URL,
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
          {
            '@type': 'SoftwareApplication',
            '@id': `${SITE_URL}/#software`,
            name: 'Calagopus',
            description: 'An open-source game server management panel built in Rust.',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Linux',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            url: SITE_URL,
            image: `${SITE_URL}/fulllogo.png`,
            author: { '@id': `${SITE_URL}/#organization` },
            publisher: { '@id': `${SITE_URL}/#organization` },
            license: 'https://github.com/calagopus/panel/blob/main/LICENSE',
            downloadUrl: 'https://github.com/calagopus/panel/releases/latest',
            softwareHelp: `${SITE_URL}/docs`,
          },
        ],
      }),
    ],
  ],

  themeConfig: {
    logo: '/icon.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
      {
        text: 'Compare',
        items: [
          { text: 'Pterodactyl Alternatives Compared', link: '/compare/' },
          { text: 'Calagopus vs Pterodactyl', link: '/compare/calagopus-vs-pterodactyl' },
          { text: 'Calagopus vs Pelican', link: '/compare/calagopus-vs-pelican' },
          { text: 'Calagopus vs AMP', link: '/compare/calagopus-vs-amp' },
          { text: 'Pterodactyl vs Pelican', link: '/compare/pterodactyl-vs-pelican' },
          { text: 'Benchmarks', link: '/docs/about/benchmarks' },
          { text: 'Feature Reference', link: '/docs/about/features' },
        ],
      },
      { text: 'Releases', link: '/docs/releases/' },
      { text: 'Documentation', link: '/docs' },
    ],

    sidebar: [
      {
        text: 'About Calagopus',
        items: [
          { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
          { text: 'Feature Reference', link: '/docs/about/features' },
          { text: 'Benchmarks', link: '/docs/about/benchmarks' },
          { text: 'Security', link: '/docs/about/security' },
          { text: 'Sponsors', link: '/docs/about/sponsors' },
          { text: 'Documentation MCP Server', link: '/docs/about/mcp-server' },
          {
            text: 'Principles',
            collapsed: true,
            items: [
              { text: 'Architecture', link: '/docs/about/architecture' },
              { text: 'Branding', link: '/docs/about/branding' },
              { text: 'Translations', link: '/docs/about/translations' },
              { text: 'Licenses', link: '/docs/about/licenses' },
            ],
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
                  { text: 'Databases', link: '/docs/panel/features/server/databases' },
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
              { text: 'Docker', link: '/docs/panel/installation/docker' },
              { text: 'Binary', link: '/docs/panel/installation/binary' },
              { text: 'Package Manager', link: '/docs/panel/installation/pkgmanager' },
              { text: 'TrueNAS SCALE', link: '/docs/panel/installation/truenas' },
              { text: 'Unraid', link: '/docs/panel/installation/unraid' },
            ],
          },
          { text: 'Updating', link: '/docs/panel/updating' },
          {
            text: 'Next Steps',
            link: '/docs/panel/next-steps/',
            collapsed: true,
            items: [{ text: 'Adding egg repositories', link: '/docs/panel/next-steps/egg-repos' }],
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
                  { text: 'Forms', link: '/docs/panel/extensions/concepts/forms' },
                  { text: 'Toasts', link: '/docs/panel/extensions/concepts/toasts' },
                  { text: 'Extending Models', link: '/docs/panel/extensions/concepts/extending-models' },
                  { text: 'Email Templates', link: '/docs/panel/extensions/concepts/email-templates' },
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
        ],
      },

      {
        text: 'Integrations',
        link: '/docs/integrations/',
        items: [
          { text: 'VS Code', link: '/docs/integrations/vscode' },
          { text: 'Paymenter', link: '/docs/integrations/paymenter' },
          { text: 'WHMCS', link: '/docs/integrations/whmcs' },
          { text: 'Blesta', link: '/docs/integrations/blesta' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/calagopus' },
      { icon: 'discord', link: 'https://discord.gg/uSM8tvTxBV' },
    ],

    footer: {
      message:
        '<a href="https://github.com/calagopus" target="_blank" rel="noreferrer">GitHub</a> · <a href="https://discord.gg/uSM8tvTxBV" target="_blank" rel="noreferrer">Discord</a> · <a href="mailto:contact@calagopus.com">contact@calagopus.com</a> · <a href="/llms.txt">llms.txt</a>',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/calagopus/website/edit/main/web/:path',
      text: 'Edit this page on GitHub',
    },
  },

  sitemap: {
    hostname: 'https://calagopus.com',
  },

  async buildEnd(siteConfig) {
    await generateLlmsArtifacts(siteConfig, SITE_URL);
    await expandReleaseMarkdown(siteConfig.outDir);
    await expandSponsorsMarkdown(siteConfig.outDir);
    await writePageManifest(siteConfig.outDir, SITE_URL);
    await writeImageManifest(siteConfig.outDir);
  },

  transformPageData(pageData, { siteConfig }) {
    const urlPath = `/${pageData.relativePath}`.replace(/index\.md$/, '').replace(/\.md$/, '');
    const canonicalUrl = `${SITE_URL}${urlPath}`;

    recordPage({
      name: urlPath === '/' ? '/' : urlPath.replace(/\/$/, ''),
      relativePath: pageData.relativePath,
      title: pageData.title ?? '',
      description: pageData.description ?? '',
      lastUpdated: pageData.lastUpdated,
    });

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(['link', { rel: 'canonical', href: canonicalUrl }]);

    pageData.frontmatter.head.push(
      ['meta', { property: 'og:title', content: pageData.title || siteConfig.site.title }],
      ['meta', { property: 'og:description', content: pageData.description || siteConfig.site.description }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
    );

    if (pageData.lastUpdated) {
      const modified = new Date(pageData.lastUpdated).toISOString();
      pageData.frontmatter.head.push(['meta', { property: 'article:modified_time', content: modified }]);

      if (pageData.relativePath.startsWith('docs/')) {
        pageData.frontmatter.head.push([
          'script',
          { type: 'application/ld+json' },
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            '@id': `${canonicalUrl}#article`,
            headline: pageData.title,
            description: pageData.description || undefined,
            url: canonicalUrl,
            dateModified: modified,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            author: { '@id': `${SITE_URL}/#organization` },
            publisher: { '@id': `${SITE_URL}/#organization` },
          }),
        ]);
      }
    }

    const pageFaqs = compareFaqs[pageData.relativePath];
    if (pageFaqs) {
      pageData.frontmatter.head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: pageFaqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
          })),
        }),
      ]);
    }

    if (pageData.relativePath === 'docs/index.md') {
      pageData.frontmatter.head.push([
        'link',
        { rel: 'preload', as: 'image', href: '/fulllogo.svg', fetchpriority: 'high' },
      ]);
    }

    if (pageData.relativePath.startsWith('compare/')) {
      const trail = [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare/` },
      ];
      if (pageData.relativePath !== 'compare/index.md') {
        trail.push({ '@type': 'ListItem', position: 3, name: pageData.title, item: canonicalUrl });
      }
      pageData.frontmatter.head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail }),
      ]);
    }

    if (pageData.relativePath === 'index.md') {
      pageData.frontmatter.head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }),
      ]);
    }

    const sidebar = siteConfig.site.themeConfig?.sidebar;
    if (Array.isArray(sidebar)) {
      breadcrumbMap ??= buildBreadcrumbMap(sidebar as SidebarNode[]);
      const trail = breadcrumbMap.get(urlPath.replace(/\/$/, ''));
      const linked = trail?.filter((entry) => entry.item);
      if (linked && linked.length > 1) {
        pageData.frontmatter.head.push([
          'script',
          { type: 'application/ld+json' },
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: linked.map((entry, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: entry.name,
              item: entry.item,
            })),
          }),
        ]);
      }
    }
  },
});
