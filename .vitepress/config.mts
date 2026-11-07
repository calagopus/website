import { fileURLToPath } from 'node:url';
import { imagetools } from 'vite-imagetools';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import { compareFaqs } from './data/compare-faqs.ts';
import { dbAgentConfigDoc } from './data/config/db-agent.ts';
import { wingsConfigDoc } from './data/config/wings.ts';
import { faqs } from './data/faqs.ts';
import { docsSidebar, sidebar } from './data/sidebar.ts';
import { acceptMarkdownPlugin } from './plugins/accept-markdown.ts';
import { aiDocPlugin } from './plugins/ai-doc.ts';
import { anchorsPlugin } from './plugins/anchors.ts';
import { writeConfigDocs } from './plugins/config-docs.ts';
import { generateLlmsArtifacts } from './plugins/llms.ts';
import { imageAssetsPlugin, imageMime, writeImageManifest } from './plugins/mcp-images.ts';
import { recordPage, writePageManifest } from './plugins/mcp-manifest.ts';
import { movedPagesPlugin } from './plugins/moved-pages.ts';
import { expandReleaseMarkdown } from './plugins/releases.ts';
import { expandFeaturedSponsorsMarkdown } from './plugins/sponsor-sections.ts';
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
      movedPagesPlugin(),
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
    optimizeDeps: {
      include: [
        'mermaid',
        '@unhead/vue/client',
        'vitepress-plugin-tabs/client',
        '@fortawesome/vue-fontawesome',
        '@fortawesome/free-solid-svg-icons',
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'vue-echarts',
      ],
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
          find: /^.*\/VPNavSocialLinks\.vue$/,
          replacement: fileURLToPath(new URL('./components/NavSocialLinks.vue', import.meta.url)),
        },
      ],
    },
  },

  markdown: {
    image: { lazyLoad: true },
    config(md) {
      md.use(tabsMarkdownPlugin);
      md.use(anchorsPlugin);

      md.renderer.rules.table_open = () => '<div class="m-table"><table>\n';
      md.renderer.rules.table_close = () => '</table></div>\n';

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
    'Calagopus is an open-source game server management panel built in Rust. Deploy, monitor, and manage Minecraft, Hytale, and other game servers from one web interface.',
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
    externalLinkIcon: true,

    nav: [
      { text: 'Home', link: '/' },
      { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
      {
        text: 'Compare',
        items: [
          {
            text: 'Comparisons',
            items: [
              { text: 'Overview', link: '/compare/' },
              { text: 'Calagopus vs Pterodactyl', link: '/compare/calagopus-vs-pterodactyl' },
              { text: 'Calagopus vs Pelican', link: '/compare/calagopus-vs-pelican' },
              { text: 'Calagopus vs AMP', link: '/compare/calagopus-vs-amp' },
              { text: 'Pterodactyl vs Pelican', link: '/compare/pterodactyl-vs-pelican' },
            ],
          },
          {
            text: 'Reference',
            items: [
              { text: 'Panel Benchmarks', link: '/docs/about/benchmarks' },
              { text: 'Daemon Benchmarks', link: '/docs/about/daemon-benchmarks' },
              { text: 'Feature Reference', link: '/docs/about/features' },
            ],
          },
        ],
      },
      { text: 'Releases', link: '/docs/releases/' },
      { text: 'Blog', link: '/blog/' },
      { text: 'Documentation', link: '/docs' },
    ],

    sidebar,

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
    await expandFeaturedSponsorsMarkdown(siteConfig.outDir);
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

      if (pageData.relativePath.startsWith('blog/') && pageData.frontmatter.date) {
        pageData.frontmatter.head.push([
          'script',
          { type: 'application/ld+json' },
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            '@id': `${canonicalUrl}#article`,
            headline: pageData.title,
            description: pageData.description || undefined,
            url: canonicalUrl,
            datePublished: new Date(pageData.frontmatter.date).toISOString(),
            dateModified: modified,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            author: { '@id': `${SITE_URL}/#organization` },
            publisher: { '@id': `${SITE_URL}/#organization` },
          }),
        ]);
      }

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

    breadcrumbMap ??= buildBreadcrumbMap(docsSidebar as SidebarNode[]);
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
  },
});
