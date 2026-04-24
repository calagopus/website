import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import ogPlugin from 'vite-plugin-open-graph';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';

// https://vitepress.dev/reference/site-config
export default withMermaid({
  srcDir: 'web',
  cleanUrls: true,

  vite: {
    plugins: [
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
      ogPlugin({
        basic: {
          type: 'website',
          title: 'Calagopus',
          description: 'Game server management - reimagined.',
          image: 'https://calagopus.com/fulllogo.png',
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Calagopus',
          description: 'Game server management - reimagined.',
          image: 'https://calagopus.com/fulllogo.png',
          imageAlt: 'Calagopus Logo',
        },
      }),
    ],
  },

  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin);
    },
  },

  title: 'Calagopus',
  description: 'Game server management - reimagined.',
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
    [
      'meta',
      {
        name: 'darkreader-lock',
      },
    ],
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
              { text: 'Development Environment', link: '/docs/panel/extensions/dev-environment' },
              { text: 'Extension File Structure', link: '/docs/panel/extensions/file-structure' },
              { text: 'Getting your Extension ready', link: '/docs/panel/extensions/getting-your-extension-ready' },
              {
                text: 'Concepts',
                collapsed: true,
                items: [
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
            text: 'Migrating from Pterodactyl',
            link: '/docs/advanced/migrating-from-pterodactyl',
            collapsed: true,
            items: [
              { text: 'Standalone', link: '/docs/advanced/migrating/standalone' },
              { text: 'Dockerized', link: '/docs/advanced/migrating/dockerized' },
            ],
          },
          { text: 'Reverse Proxies', link: '/docs/advanced/reverse-proxies' },
          { text: 'Exposing Wings in a Homelab', link: '/docs/advanced/exposing-wings-in-a-homelab' },
          { text: 'Generating SSL Certificates', link: '/docs/advanced/generate-ssl' },
          {
            text: 'Setting up Database Hosts',
            link: '/docs/advanced/setting-up-database-hosts',
            collapsed: true,
            items: [
              { text: 'MySQL (MariaDB)', link: '/docs/advanced/setting-up-database-hosts/mysql' },
              { text: 'PostgreSQL', link: '/docs/advanced/setting-up-database-hosts/postgres' },
              { text: 'MongoDB', link: '/docs/advanced/setting-up-database-hosts/mongodb' },
            ],
          },
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
});
