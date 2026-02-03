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
          { text: 'Architecture', link: '/docs/about/architecture' }
        ]
      },
      {
        text: 'Panel',
        items: [
          { text: 'Overview', link: '/docs/panel/overview' },
          { text: 'Environment', link: '/docs/panel/environment' },
          { text: 'Installation', link: '/docs/panel/installation' },
        ]
      },
      {
        text: 'Wings',
        items: [
          { text: 'Overview', link: '/docs/wings/overview' },
          { text: 'Installation', link: '/docs/wings/installation' },
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
