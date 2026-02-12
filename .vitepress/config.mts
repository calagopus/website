import { withMermaid } from "vitepress-plugin-mermaid";
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

// https://vitepress.dev/reference/site-config
export default withMermaid({
  srcDir: "web",
  cleanUrls: true,

  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin)
    },
  },

  title: "Calagopus",
  description: "Game server management - made simple",
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
      { text: 'Documentation', link: '/docs' }
    ],

    sidebar: [
      {
        text: 'About Calagopus',
        items: [
          { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
          { text: 'Features', link: '/docs/about/features' },
          { text: 'Benchmarks', link: '/docs/about/benchmarks' },
          { text: 'Architecture', link: '/docs/about/architecture' }
        ]
      },
      {
        text: 'Panel',
        items: [
          { text: 'Overview', link: '/docs/panel/overview' },
          { text: 'Environment', link: '/docs/panel/environment' },
          { text: 'Installation',
            link: '/docs/panel/installation',
            items: [
              { text: 'Docker', link: '/docs/panel/installation/docker' },
              { text: 'Package Manager', link: '/docs/panel/installation/pkgmanager' },
            ]
          },
          {
            text: 'Extensions',
            items: [
              { text: 'Development Environment', link: '/docs/panel/extensions/dev-environment' },
            ]
          }
        ]
      },
      {
        text: 'Wings',
        items: [
          { text: 'Overview', link: '/docs/wings/overview' },
          { text: 'Installation',
            link: '/docs/wings/installation',
            items: [
              { text: 'Binary', link: '/docs/wings/installation/binary' },
              { text: 'Package Manager', link: '/docs/wings/installation/pkgmanager' },
            ]
          },
        ]
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Migrating from Pterodactyl', link: '/docs/advanced/migrating-from-pterodactyl' },
          { text: 'Reverse Proxies', link: '/docs/advanced/reverse-proxies' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/calagopus' },
      { icon: 'discord', link: 'https://discord.gg/uSM8tvTxBV' },
    ],

    search: {
      provider: 'local'
    }
  },
})
