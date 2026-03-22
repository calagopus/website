import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
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
    [
      'meta',
      {
        property: 'og:title',
        content: 'Calagopus',
      },
    ],
    [
      'meta',
      {
        property: 'og:site_name',
        content: 'Calagopus',
      },
    ],
    [
      'meta',
      {
        property: 'og:url',
        content: 'https://calagopus.com',
      },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Game server management - reimagined.',
      },
    ],
    [
      'meta',
      {
        property: 'og:type',
        content: 'website',
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://calagopus.com/fulllogo.png',
      },
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
            items: [
              { text: 'Creating a New Node', link: '/docs/panel/next-steps/add-node' },
              { text: 'Adding egg repositories', link: '/docs/panel/next-steps/egg-repos' },
            ],
          },
          {
            text: 'Extensions',
            items: [
              { text: 'Installing Extensions', link: '/docs/panel/extensions/installing-extensions' },
              { text: 'Development Environment', link: '/docs/panel/extensions/dev-environment' },
              { text: 'Extension File Structure', link: '/docs/panel/extensions/file-structure' },
            ],
          },
        ],
      },
      {
        text: 'Wings',
        items: [
          { text: 'Overview', link: '/docs/wings/overview' },
          {
            text: 'Installation',
            link: '/docs/wings/installation',
            items: [
              { text: 'Binary', link: '/docs/wings/installation/binary' },
              { text: 'Package Manager', link: '/docs/wings/installation/pkgmanager' },
            ],
          },
          { text: 'Updating', link: '/docs/wings/updating' },
          {
            text: 'Disk Limiters',
            link: '/docs/wings/disk-limiters',
            items: [{ text: 'Fusequota', link: '/docs/wings/disk-limiters/fusequota' }],
          },
        ],
      },
      {
        text: 'Advanced',
        items: [
          {
            text: 'Migrating from Pterodactyl',
            link: '/docs/advanced/migrating-from-pterodactyl',
            items: [
              { text: 'Standalone', link: '/docs/advanced/migrating/standalone' },
              { text: 'Dockerized', link: '/docs/advanced/migrating/dockerized' },
            ],
          },
          { text: 'Reverse Proxies', link: '/docs/advanced/reverse-proxies' },
          {
            text: 'Setting up OAuth',
            link: '/docs/advanced/oauth',
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
