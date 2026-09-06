import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import markdownit, { type MarkdownIt, type StateCore, type Token } from 'markdown-it';
import { type ReleaseCallout, type ReleaseNote, releaseNotes } from '../data/release-notes.ts';
import { fetchJson } from '../lib/fetch-retry.ts';

const API_BASE = 'https://calagopus.com/api/releases';
const SITE_URL = 'https://calagopus.com';

export interface ReleaseProject {
  key: string;
  title: string;
  repo: string;
  link: string;
  blurb: string;
}

export const RELEASE_PROJECTS: ReleaseProject[] = [
  {
    key: 'panel',
    title: 'Panel',
    repo: 'calagopus/panel',
    link: '/docs/releases/panel',
    blurb: 'The web interface and API that everything else talks to.',
  },
  {
    key: 'wings',
    title: 'Wings',
    repo: 'calagopus/wings',
    link: '/docs/releases/wings',
    blurb: 'The node daemon that runs game servers and their containers.',
  },
  {
    key: 'db-agent',
    title: 'DB Agent',
    repo: 'calagopus/db-agent',
    link: '/docs/releases/db-agent',
    blurb: 'The database host agent that provisions server databases.',
  },
];

interface ApiAsset {
  name: string;
  size: number;
  content_type: string;
  browser_download_url: string;
}

interface ApiRelease {
  tag: string;
  name: string;
  version: string;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  html_url: string;
  author: string;
  body: string;
  assets: ApiAsset[];
}

interface ApiProject {
  project: string;
  key: string;
  latest_version: string;
  latest_tag: string;
  count: number;
  total: number;
  updated_at: string;
  releases: ApiRelease[];
}

export interface ReleaseAsset {
  name: string;
  size: number;
  url: string;
}

export interface Release {
  version: string;
  tag: string;
  anchor: string;
  prerelease: boolean;
  publishedAt: string;
  htmlUrl: string;
  compareUrl?: string;
  html: string;
  hasNotes: boolean;
  assets: ReleaseAsset[];
}

export interface ProjectReleases extends ReleaseProject {
  latestVersion: string;
  latestTag: string;
  total: number;
  updatedAt: string;
  withNotes: number;
  releases: Release[];
}

export type ReleasesData = Record<string, ProjectReleases>;

const MENTION = /(?<![\w@/-])@([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)(\[bot\])?/gi;

function mentionTokens(state: StateCore, token: Token): Token[] {
  const parts: Token[] = [];
  let last = 0;

  for (const match of token.content.matchAll(MENTION)) {
    const [full, name, bot] = match;

    if (match.index > last) {
      const lead = new state.Token('text', '', 0);
      lead.content = token.content.slice(last, match.index);
      parts.push(lead);
    }

    const open = new state.Token('link_open', 'a', 1);
    open.attrSet('href', bot ? `https://github.com/apps/${name}` : `https://github.com/${name}`);

    const handle = new state.Token('code_inline', 'code', 0);
    handle.content = `${name}${bot ?? ''}`;

    parts.push(open, handle, new state.Token('link_close', 'a', -1));
    last = match.index + full.length;
  }

  if (parts.length === 0) return [token];

  if (last < token.content.length) {
    const tail = new state.Token('text', '', 0);
    tail.content = token.content.slice(last);
    parts.push(tail);
  }

  return parts;
}

function githubMentions(md: MarkdownIt): void {
  md.core.ruler.push('github_mentions', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline') continue;

      let depth = 0;
      const children: Token[] = [];

      for (const token of block.children ?? []) {
        if (token.type === 'link_open') depth++;
        else if (token.type === 'link_close') depth--;

        if (token.type === 'text' && depth === 0) children.push(...mentionTokens(state, token));
        else children.push(token);
      }

      block.children = children;
    }
  });
}

const md = markdownit({ html: false, linkify: true, breaks: false }).use(githubMentions);

const pending = new Map<string, Promise<ApiProject>>();

function fetchProject(key: string): Promise<ApiProject> {
  const cached = pending.get(key);
  if (cached) return cached;

  const request = fetchJson<ApiProject>(`${API_BASE}/${key}`, `releases for "${key}"`, 'CALAGOPUS_RELEASES_OFFLINE');
  pending.set(key, request);
  return request;
}

function normalizeBody(body: string): { markdown: string; compareUrl?: string } {
  let compareUrl: string | undefined;
  let inFence = false;

  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const kept: string[] = [];

  for (const line of lines) {
    if (line.startsWith('```')) inFence = !inFence;

    if (!inFence) {
      const changelog = line.match(/^\s*\*\*Full Changelog\*\*:\s*(\S+)\s*$/);
      if (changelog) {
        compareUrl = changelog[1];
        continue;
      }

      const heading = line.match(/^(#{1,5}) (.+?):?\s*$/);
      if (heading) {
        kept.push(`#${heading[1]} ${heading[2]}`);
        continue;
      }
    }

    kept.push(line);
  }

  const markdown = kept.join('\n').replaceAll(`${SITE_URL}/`, '/').trim();
  return { markdown, compareUrl };
}

function renderCallout(callout: ReleaseCallout): string {
  const title = callout.title ?? callout.type.toUpperCase();
  return `<div class="${callout.type} custom-block"><p class="custom-block-title">${md.utils.escapeHtml(title)}</p>\n${md.render(callout.body)}</div>`;
}

function toRelease(release: ApiRelease, note: ReleaseNote = {}): Release {
  const { markdown, compareUrl } = normalizeBody(release.body);
  const changelog = markdown || note.body || '';

  return {
    version: release.version,
    tag: release.tag,
    anchor: `v${release.version.replace(/[^a-zA-Z0-9]+/g, '-')}`,
    prerelease: release.prerelease,
    publishedAt: release.published_at,
    htmlUrl: release.html_url,
    compareUrl,
    html: [...(note.callouts ?? []).map(renderCallout), changelog && md.render(changelog)].filter(Boolean).join('\n'),
    hasNotes: changelog.length > 0,
    assets: release.assets.map((asset) => ({
      name: asset.name,
      size: asset.size,
      url: asset.browser_download_url,
    })),
  };
}

function emptyProject(project: ReleaseProject): ProjectReleases {
  return { ...project, latestVersion: '', latestTag: '', total: 0, updatedAt: '', withNotes: 0, releases: [] };
}

async function loadProject(project: ReleaseProject): Promise<ProjectReleases> {
  const api = await fetchProject(project.key);
  const notes = releaseNotes[project.key] ?? {};
  const releases = api.releases.map((release) => toRelease(release, notes[release.version]));

  return {
    ...project,
    latestVersion: api.latest_version,
    latestTag: api.latest_tag,
    total: api.total,
    updatedAt: api.updated_at,
    withNotes: releases.filter((release) => release.hasNotes).length,
    releases,
  };
}

export async function loadReleases(): Promise<ReleasesData> {
  if (process.env.CALAGOPUS_RELEASES_OFFLINE) {
    return Object.fromEntries(RELEASE_PROJECTS.map((project) => [project.key, emptyProject(project)]));
  }

  const projects = await Promise.all(RELEASE_PROJECTS.map(loadProject));
  return Object.fromEntries(projects.map((project) => [project.key, project]));
}

function calloutMarkdown(callout: ReleaseCallout): string {
  return `::: ${callout.type}${callout.title ? ` ${callout.title}` : ''}\n${callout.body}\n:::`;
}

async function projectMarkdown(project: ReleaseProject): Promise<string> {
  const api = await fetchProject(project.key);
  const notes = releaseNotes[project.key] ?? {};
  const blocks: string[] = [];
  let undocumented = 0;

  for (const release of api.releases) {
    const note = notes[release.version] ?? {};
    const { markdown, compareUrl } = normalizeBody(release.body);
    const changelog = markdown || note.body || '';

    if (!changelog) {
      undocumented++;
      continue;
    }

    const links = [`[View release on GitHub](${release.html_url})`];
    if (compareUrl) links.push(`[Full changelog](${compareUrl})`);

    blocks.push(`## ${release.version}`, ...(note.callouts ?? []).map(calloutMarkdown), changelog, links.join(' · '));
  }

  if (undocumented > 0) {
    const subject = undocumented === 1 ? '1 older release carries' : `${undocumented} older releases carry`;
    blocks.push(`${subject} no release notes. They are listed at https://github.com/${project.repo}/releases.`);
  }

  return blocks.join('\n\n');
}

export async function expandReleaseMarkdown(outDir: string): Promise<void> {
  if (process.env.CALAGOPUS_RELEASES_OFFLINE) return;

  const rewrite = async (file: string, replacement: string) => {
    const source = await readFile(file, 'utf8');
    const expanded = source
      .replace(/^<script setup>[\s\S]*?<\/script>\n\n/m, '')
      .replace(/^<Release(?:List|Index)[^>]*\/>$/m, () => replacement);
    await writeFile(file, expanded);
  };

  await Promise.all(
    RELEASE_PROJECTS.map(async (project) =>
      rewrite(join(outDir, 'docs/releases', `${project.key}.md`), await projectMarkdown(project)),
    ),
  );

  const links = RELEASE_PROJECTS.map((project) => `- [${project.title} Releases](${project.link}) - ${project.blurb}`);
  await rewrite(join(outDir, 'docs/releases/index.md'), links.join('\n'));
}
