import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const MANIFEST_ROUTE = '/_mcp/pages.json';
const DESCRIPTION_MAX = 220;

export interface ManifestSection {
  anchor: string;
  text: string;
  level: number;
}

export interface ManifestPage {
  name: string;
  title: string;
  description: string;
  last_updated: string | null;
  bytes: number;
  sections?: ManifestSection[];
}

export interface PageManifest {
  generated_at: string;
  site: string;
  count: number;
  pages: ManifestPage[];
}

interface Collected {
  name: string;
  relativePath: string;
  title: string;
  description: string;
  lastUpdated: number | undefined;
}

const collected = new Map<string, Collected>();

export function recordPage(page: Collected): void {
  collected.set(page.relativePath, page);
}

function firstParagraph(source: string): string {
  for (const block of source.split(/\n\s*\n/)) {
    const text = block.trim();
    if (text === '') continue;
    if (/^(#|!\[|:::|<|\||>|-{3,}|\d+\.\s|[-*+]\s|```)/.test(text)) continue;

    const flat = text
      .replace(/\n/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*([^*]*)\*\*/g, '$1')
      .replace(/(?<!\w)[*_]([^*_]+)[*_](?!\w)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (flat === '') continue;
    if (flat.length <= DESCRIPTION_MAX) return flat;

    const cut = flat.slice(0, DESCRIPTION_MAX);
    const boundary = cut.lastIndexOf(' ');
    return `${(boundary > 0 ? cut.slice(0, boundary) : cut).replace(/[,;:.]$/, '')}...`;
  }

  return '';
}

function markdownHeadings(source: string): { text: string; level: number }[] {
  const headings: { text: string; level: number }[] = [];
  let fence: string | null = null;

  for (const line of source.split('\n')) {
    const fenceMark = line.match(/^\s*(```+|~~~+)/);
    if (fenceMark) {
      if (fence === null) fence = fenceMark[1][0];
      else if (fenceMark[1][0] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) headings.push({ level: heading[1].length, text: heading[2].replace(/\s*\{#[^}]*\}$/, '').trim() });
  }

  return headings;
}

function headingKey(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[`*_]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function htmlHeadings(html: string): { anchor: string; key: string }[] {
  return [...html.matchAll(/<h([1-6])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)].map((match) => ({
    anchor: match[2],
    key: headingKey(match[3]),
  }));
}

async function sectionsFor(
  outDir: string,
  relativePath: string,
  markdown: string,
): Promise<ManifestSection[] | undefined> {
  const headings = markdownHeadings(markdown);
  if (headings.length === 0) return undefined;

  let rendered: { anchor: string; key: string }[];
  try {
    rendered = htmlHeadings(await readFile(join(outDir, relativePath.replace(/\.md$/, '.html')), 'utf8'));
  } catch {
    return undefined;
  }

  const sections: ManifestSection[] = [];
  let cursor = 0;

  for (const heading of headings) {
    const key = headingKey(heading.text);
    const found = rendered.findIndex((candidate, index) => index >= cursor && candidate.key === key);
    if (found === -1) continue;

    cursor = found + 1;
    sections.push({ anchor: rendered[found].anchor, text: heading.text, level: heading.level });
  }

  return sections.length > 0 ? sections : undefined;
}

export async function writePageManifest(outDir: string, siteUrl: string): Promise<void> {
  const pages = await Promise.all(
    [...collected.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (page): Promise<ManifestPage> => {
        const markdown = await readFile(join(outDir, page.relativePath), 'utf8');
        const sections = await sectionsFor(outDir, page.relativePath, markdown);

        return {
          name: page.name,
          title: page.title,
          description: page.description || firstParagraph(markdown),
          last_updated: page.lastUpdated ? new Date(page.lastUpdated).toISOString() : null,
          bytes: Buffer.byteLength(markdown, 'utf8'),
          ...(sections ? { sections } : {}),
        };
      }),
  );

  const manifest: PageManifest = {
    generated_at: new Date().toISOString(),
    site: siteUrl,
    count: pages.length,
    pages,
  };

  const dest = join(outDir, MANIFEST_ROUTE.replace(/^\//, ''));
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, JSON.stringify(manifest));
}
