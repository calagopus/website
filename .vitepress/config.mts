import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import { aiDocPlugin } from './plugins/ai-doc.ts';

// https://vitepress.dev/reference/site-config
export default withMermaid({
  buildConcurrency: 128,
  srcDir: 'web',
  cleanUrls: true,
  metaChunk: true,

  vite: {
    plugins: [
      aiDocPlugin([
        {
          route: '/ai-doc/extensions.md',
          title: 'Extensions',
          sourceDir: 'docs/panel/extensions',
        },
      ]),
      ViteImageOptimizer({
        png: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        webp: {
          lossless: true,
        },
        svg: {
          multipass: true,
        },
      }),
    ],
    server: {
      allowedHosts: true,
    },
  },

  markdown: {
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
    ['meta', { property: 'og:title', content: 'Calagopus' }],
    ['meta', { property: 'og:description', content: 'Game server management - reimagined.' }],
    ['meta', { property: 'og:image', content: 'https://calagopus.com/fulllogo.png' }],
    ['meta', { property: 'og:url', content: 'https://calagopus.com' }],
    ['meta', { property: 'og:site_name', content: 'Calagopus' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Calagopus' }],
    ['meta', { name: 'twitter:description', content: 'Game server management - reimagined.' }],
    ['meta', { name: 'twitter:image', content: 'https://calagopus.com/fulllogo.png' }],
    ['meta', { name: 'twitter:image:alt', content: 'Calagopus Logo' }],
    [
      'meta',
      {
        name: 'darkreader-lock',
      },
    ],
    ['link', { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' }],
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
        '@type': 'SoftwareApplication',
        name: 'Calagopus',
        description: 'An open-source game server management panel built in Rust.',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Linux, Docker',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        url: 'https://calagopus.com',
        author: {
          '@type': 'Organization',
          name: 'Calagopus',
          url: 'https://github.com/calagopus',
        },
        license: 'https://github.com/calagopus/calagopus/blob/main/LICENSE',
        softwareVersion: '1.0.0',
      }),
    ],
  ],

  themeConfig: {
    logo: '/icon.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
      { text: 'Documentation', link: '/docs' },
    ],

    sidebar: [
      {
        text: 'About Calagopus',
        items: [
          { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
          { text: 'Feature Reference', link: '/docs/about/features' },
          { text: 'Benchmarks', link: '/docs/about/benchmarks' },
          { text: 'Architecture', link: '/docs/about/architecture' },
          { text: 'Branding', link: '/docs/about/branding' },
        ],
      },
      {
        text: 'Panel',
        items: [
          { text: 'Overview', link: '/docs/panel/overview' },
          { text: 'Environment', link: '/docs/panel/environment' },
          {
            text: 'Installation',
            link: '/docs/panel/installation',
            collapsed: true,
            items: [
              { text: 'Docker', link: '/docs/panel/installation/docker' },
              { text: 'Binary', link: '/docs/panel/installation/binary' },
              { text: 'Package Manager', link: '/docs/panel/installation/pkgmanager' },
            ],
          },
          { text: 'Updating', link: '/docs/panel/updating' },
          {
            text: 'Next Steps',
            link: '/docs/panel/next-steps',
            collapsed: true,
            items: [
              { text: 'Creating a New Node', link: '/docs/panel/next-steps/add-node' },
              { text: 'Adding egg repositories', link: '/docs/panel/next-steps/egg-repos' },
            ],
          },
          {
            text: 'Extensions',
            link: '/docs/panel/extensions',
            collapsed: true,
            items: [
              { text: 'Installing Extensions', link: '/docs/panel/extensions/installing-extensions' },
              { text: 'Uninstalling Extensions', link: '/docs/panel/extensions/uninstalling-extensions' },
              { text: 'Switching to the Heavy Image', link: '/docs/panel/extensions/switching-to-the-heavy-image' },
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
                  { text: 'Extending Models', link: '/docs/panel/extensions/concepts/extending-models' },
                  { text: 'Email Templates', link: '/docs/panel/extensions/concepts/email-templates' },
                  { text: 'File Storage', link: '/docs/panel/extensions/concepts/file-storage' },
                ],
              },
            ],
          },
        ],
      },
      {
        text: 'Wings',
        items: [
          { text: 'Overview', link: '/docs/wings/overview' },
          { text: 'Configuration', link: '/docs/wings/configuration' },
          {
            text: 'Installation',
            link: '/docs/wings/installation',
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
            link: '/docs/wings/next-steps',
            collapsed: true,
            items: [{ text: 'Setting up Allocations', link: '/docs/wings/next-steps/setting-up-allocations' }],
          },
          {
            text: 'Disk Limiters',
            link: '/docs/wings/disk-limiters',
            collapsed: true,
            items: [
              { text: 'Fusequota', link: '/docs/wings/disk-limiters/fusequota' },
              { text: 'Btrfs Subvolume', link: '/docs/wings/disk-limiters/btrfs-subvolume' },
              { text: 'ZFS Dataset', link: '/docs/wings/disk-limiters/zfs-dataset' },
              { text: 'XFS Project Quota', link: '/docs/wings/disk-limiters/xfs-quota' },
            ],
          },
        ],
      },

      {
        text: 'Advanced',
        items: [
          {
            text: 'Migrations',
            collapsed: true,
            items: [
              {
                text: 'From another Panel',
                collapsed: true,
                items: [
                  { text: 'Pterodactyl', link: '/docs/advanced/migrating/pterodactyl' },
                  { text: 'Pelican', link: '/docs/advanced/migrating/pelican' },
                ],
              },
              {
                text: 'To another Instance',
                collapsed: true,
                items: [
                  { text: 'Docker', link: '/docs/advanced/migrating/instances/docker' },
                  { text: 'Standalone', link: '/docs/advanced/migrating/instances/standalone' },
                ],
              },
            ],
          },
          {
            text: 'Database Hosts',
            link: '/docs/advanced/setting-up-database-hosts',
            collapsed: true,
            items: [
              { text: 'MySQL (MariaDB)', link: '/docs/advanced/setting-up-database-hosts/mysql' },
              { text: 'PostgreSQL', link: '/docs/advanced/setting-up-database-hosts/postgres' },
              { text: 'MongoDB', link: '/docs/advanced/setting-up-database-hosts/mongodb' },
            ],
          },
          { text: 'SSL Certificates', link: '/docs/advanced/generate-ssl' },
          { text: 'Reverse Proxies', link: '/docs/advanced/reverse-proxies' },
          { text: 'Backup Configurations', link: '/docs/advanced/setting-up-backup-configurations' },
          { text: 'Exposing Wings in a Homelab', link: '/docs/advanced/exposing-wings-in-a-homelab' },
          { text: 'Running Wings with Podman', link: '/docs/advanced/running-wings-with-podman' },
          {
            text: 'Setting up OAuth',
            link: '/docs/advanced/oauth',
            collapsed: true,
            items: [
              { text: 'GitHub', link: '/docs/advanced/oauth/github' },
              { text: 'Google', link: '/docs/advanced/oauth/google' },
              { text: 'Discord', link: '/docs/advanced/oauth/discord' },
              { text: 'Generic', link: '/docs/advanced/oauth/generic' },
            ],
          },
        ],
      },

      {
        text: 'Integrations',
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

    search: {
      provider: 'local',
    },
  },

  sitemap: {
    hostname: 'https://calagopus.com',
  },

  transformPageData(pageData) {
    const canonicalUrl = `https://calagopus.com/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '');

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(['link', { rel: 'canonical', href: canonicalUrl }]);
  },
});
