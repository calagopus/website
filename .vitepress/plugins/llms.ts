import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SiteConfig } from 'vitepress';
import { featureCategories } from '../data/features.ts';

interface SidebarNode {
  text?: string;
  link?: string;
  items?: SidebarNode[];
}

const mdUrl = (siteUrl: string, link: string): string =>
  link.endsWith('/') ? `${siteUrl}${link}index.md` : `${siteUrl}${link}.md`;

function sectionLinks(node: SidebarNode, siteUrl: string): string[] {
  const lines: string[] = [];
  const walk = (n: SidebarNode) => {
    if (n.link && n.text) lines.push(`- [${n.text}](${mdUrl(siteUrl, n.link)})`);
    n.items?.forEach(walk);
  };
  walk(node);
  return lines;
}

async function pageTitle(file: string, fallback: string): Promise<string> {
  const source = await readFile(file, 'utf8');
  return source.match(/^---[\s\S]*?^title:\s*(.+?)\s*$[\s\S]*?^---/m)?.[1] ?? fallback;
}

const featureMark = (value: boolean | null): string => (value === true ? 'Yes' : value === false ? 'No' : '-');

function featureTableMarkdown(id: string): string {
  const category = featureCategories.find((c) => c.id === id);
  if (!category) return '';
  const parts: string[] = [];
  if (category.description) parts.push(category.description);
  if (category.rows?.length) {
    parts.push(
      [
        '| Feature | Calagopus | Pterodactyl | Pelican | AMP |',
        '| --- | --- | --- | --- | --- |',
        ...category.rows.map(
          (r) =>
            `| ${r.name} | ${featureMark(r.calagopus)} | ${featureMark(r.pterodactyl)} | ${featureMark(r.pelican)} | ${featureMark(r.amp)} |`,
        ),
      ].join('\n'),
    );
    if (category.rows.some((r) => r.pterodactyl === null || r.pelican === null || r.amp === null)) {
      parts.push('- = not independently verified for that product');
    }
  }
  if (category.bullets?.length) {
    parts.push(
      ['Also included in Calagopus:', ...category.bullets.map((b) => `- **${b.name}** - ${b.description}`)].join('\n'),
    );
  }
  return parts.join('\n\n');
}

export function pageUrlPath(page: string): string {
  return `/${page}`.replace(/index\.md$/, '').replace(/\.md$/, '');
}

function absoluteLinks(markdown: string, page: string): string {
  const base = new URL(pageUrlPath(page), 'https://site.invalid');

  return markdown.replace(/\]\(([^)\s]+)\)/g, (whole, target: string) => {
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('/') || target.startsWith('#')) return whole;

    try {
      const url = new URL(target, base);
      const path = url.pathname.replace(/\.md$/, '').replace(/\/index$/, '');
      return `](${path === '' ? '/' : path}${url.hash})`;
    } catch {
      return whole;
    }
  });
}

function cleanMarkdownExport(source: string, page: string): string {
  const body = source
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, '')
    .replace(/<script setup(?:\s[^>]*)?>[\s\S]*?<\/script>\s*/g, '')
    .replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>\s*/g, '')
    .replace(/<FeatureTable\s+id="([^"]+)"\s*\/>/g, (_, id) => featureTableMarkdown(id));

  return absoluteLinks(body, page);
}

export async function generateLlmsArtifacts(siteConfig: SiteConfig, siteUrl: string): Promise<void> {
  const { outDir, srcDir, pages, site } = siteConfig;

  for (const page of pages) {
    const dest = join(outDir, page);
    await mkdir(dirname(dest), { recursive: true });
    const source = await readFile(join(srcDir, page), 'utf8');
    await writeFile(dest, cleanMarkdownExport(source, page));
  }

  const sections: string[] = [];

  const sidebar = (site.themeConfig?.sidebar ?? []) as SidebarNode[];
  for (const group of sidebar) {
    const links = sectionLinks(group, siteUrl);
    if (group.text && links.length > 0) sections.push(`## ${group.text}\n\n${links.join('\n')}`);
  }

  const comparePages = pages.filter((p) => p.startsWith('compare/')).sort();
  if (comparePages.length > 0) {
    const links = await Promise.all(
      comparePages.map(async (page) => {
        const slug = page.replace(/\.md$/, '');
        const title = await pageTitle(join(srcDir, page), slug);
        return `- [${title}](${siteUrl}/${page})`;
      }),
    );
    sections.push(`## Comparisons\n\n${links.join('\n')}`);
  }

  const content = `# Calagopus

> ${site.description}

Calagopus is free for personal and commercial use (MIT-licensed core), supports any game that runs in a Linux Docker container, and provides migration tooling for Pterodactyl and Pelican. Source code: https://github.com/calagopus

Every page below links to its raw Markdown version. Appending \`.md\` to any page URL returns that page as Markdown, as does requesting it with an \`Accept: text/markdown\` header; the rendered HTML lives at the same URL without the \`.md\` suffix.

- [Homepage](${siteUrl}/index.md)

${sections.join('\n\n')}

## Optional

- [Extension development bundle (all extension docs, single file)](${siteUrl}/ai-doc/extensions.md)
`;

  await writeFile(join(outDir, 'llms.txt'), content);
}
