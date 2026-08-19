import { markdownCandidates } from '../../.vitepress/lib/markdown-candidates.ts';

const MANIFEST_ROUTE = '/_mcp/pages.json';
const ORIGIN = 'https://assets.local';

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

interface PageManifest {
  generated_at: string;
  site: string;
  count: number;
  pages: ManifestPage[];
}

export interface PageRef {
  name: string;
  anchor: string | null;
}

let cached: PageManifest | undefined;

export async function loadManifest(env: Env): Promise<PageManifest> {
  if (cached) return cached;

  const response = await env.ASSETS.fetch(new URL(MANIFEST_ROUTE, ORIGIN));
  if (!response.ok) throw new Error(`page manifest missing at ${MANIFEST_ROUTE} (HTTP ${response.status})`);

  cached = (await response.json()) as PageManifest;
  return cached;
}

export function parsePageRef(value: string): PageRef {
  let url: URL;
  try {
    url = new URL(value.trim(), ORIGIN);
  } catch {
    return { name: '/', anchor: null };
  }

  const path = url.pathname
    .toLowerCase()
    .replace(/\.(md|html)$/, '')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '');

  return { name: path === '' ? '/' : path, anchor: url.hash ? url.hash.slice(1).toLowerCase() : null };
}

export async function readPage(env: Env, name: string): Promise<string | null> {
  for (const candidate of markdownCandidates(name)) {
    const response = await env.ASSETS.fetch(new URL(candidate, ORIGIN));
    if (response.ok) return await response.text();
  }
  return null;
}

function isFenceToggle(line: string): string | null {
  return line.match(/^\s*(```+|~~~+)/)?.[1][0] ?? null;
}

export function extractSection(markdown: string, section: ManifestSection): string | null {
  const lines = markdown.split('\n');
  const heading = `${'#'.repeat(section.level)} ${section.text}`;

  let fence: string | null = null;
  let start = -1;

  for (let index = 0; index < lines.length; index++) {
    const toggle = isFenceToggle(lines[index]);
    if (toggle) {
      fence = fence === null ? toggle : fence === toggle ? null : fence;
      continue;
    }
    if (fence !== null) continue;

    if (start === -1) {
      if (lines[index].replace(/\s*\{#[^}]*\}\s*$/, '').trimEnd() === heading) start = index;
      continue;
    }

    const next = lines[index].match(/^(#{1,6})\s/);
    if (next && next[1].length <= section.level) return lines.slice(start, index).join('\n').trim();
  }

  return start === -1 ? null : lines.slice(start).join('\n').trim();
}
