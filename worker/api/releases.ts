import { captureException } from '@sentry/cloudflare';
import { json, markdown, preflight } from '../http.ts';

const RELEASES_PER_PAGE = 100;
const MAX_RELEASE_PAGES = 5;
const VERSIONS_KEY = 'versions';
const EMPTY_RELEASES_VERSION = '1.0.0';

interface Project {
  repo: string;
  key: string;
}

const PROJECTS: Project[] = [
  { repo: 'panel', key: 'panel' },
  { repo: 'wings', key: 'wings' },
  { repo: 'fusequota', key: 'fusequota' },
  { repo: 'db-agent', key: 'db_agent' },
];

interface GitHubAsset {
  name: string;
  size: number;
  content_type: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name?: string;
  name?: string;
  draft?: boolean;
  prerelease?: boolean;
  created_at?: string;
  published_at?: string;
  html_url?: string;
  author?: { login: string } | null;
  body?: string;
  assets?: GitHubAsset[];
}

interface ReleaseAsset {
  name: string;
  size: number;
  content_type: string;
  browser_download_url: string;
}

interface Release {
  tag: string | null;
  name: string;
  version: string | null;
  prerelease: boolean;
  created_at: string | null;
  published_at: string | null;
  html_url: string | null;
  author: string | null;
  body: string;
  assets: ReleaseAsset[];
}

interface ReleaseDoc {
  project: string;
  key: string;
  updated_at: string;
  latest_version: string;
  latest_tag: string | null;
  count: number;
  releases: Release[];
}

type Versions = Record<string, string>;

const releasesKey = (repo: string) => `releases::${repo}`;

function githubHeaders(env: Env): HeadersInit {
  const headers: Record<string, string> = {
    'User-Agent': 'Cloudflare-Worker-Version-Fetcher',
    Accept: 'application/vnd.github.v3+json',
  };

  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

  return headers;
}

function parseReleaseVersion(release: GitHubRelease): string | null {
  const title = release.name || release.tag_name || '';
  return title.split(':')[0].trim() || null;
}

function normalizeRelease(release: GitHubRelease): Release {
  return {
    tag: release.tag_name || null,
    name: release.name || release.tag_name || '',
    version: parseReleaseVersion(release),
    prerelease: !!release.prerelease,
    created_at: release.created_at || null,
    published_at: release.published_at || null,
    html_url: release.html_url || null,
    author: release.author ? release.author.login : null,
    body: typeof release.body === 'string' ? release.body : '',
    assets: Array.isArray(release.assets)
      ? release.assets.map((asset) => ({
          name: asset.name,
          size: asset.size,
          content_type: asset.content_type,
          browser_download_url: asset.browser_download_url,
        }))
      : [],
  };
}

async function fetchProjectReleases(repo: string, env: Env): Promise<Release[] | null> {
  const headers = githubHeaders(env);
  const maxPages = env.GITHUB_TOKEN ? MAX_RELEASE_PAGES : 1;
  const releases: Release[] = [];

  try {
    for (let page = 1; page <= maxPages; page++) {
      const response = await fetch(
        `https://api.github.com/repos/calagopus/${repo}/releases?per_page=${RELEASES_PER_PAGE}&page=${page}`,
        { headers },
      );

      if (response.status === 404 && page === 1) return [];
      if (!response.ok) return null;

      const data = (await response.json()) as GitHubRelease[];
      if (!Array.isArray(data)) return null;

      releases.push(...data.filter((release) => !release.draft).map(normalizeRelease));

      if (data.length < RELEASES_PER_PAGE) break;
    }

    return releases;
  } catch (error) {
    captureException(error);
    return null;
  }
}

function latestRelease(releases: Release[]): Release | null {
  return releases.find((release) => !release.prerelease) ?? releases[0] ?? null;
}

export async function refreshReleases(env: Env): Promise<void> {
  const results = await Promise.all(PROJECTS.map((project) => fetchProjectReleases(project.repo, env)));
  const existing = ((await env.VERSION_CACHE.get(VERSIONS_KEY, 'json')) as Versions | null) ?? {};

  const versions: Versions = {};
  const writes: Promise<void>[] = [];

  for (const [index, project] of PROJECTS.entries()) {
    const releases = results[index];

    if (releases === null) {
      versions[project.key] = existing[project.key] || 'unknown';
      continue;
    }

    const latest = latestRelease(releases);

    let version = latest ? latest.version : null;
    if (!version && releases.length === 0) version = EMPTY_RELEASES_VERSION;

    versions[project.key] = version || existing[project.key] || 'unknown';

    const doc: ReleaseDoc = {
      project: project.repo,
      key: project.key,
      updated_at: new Date().toISOString(),
      latest_version: versions[project.key],
      latest_tag: latest ? latest.tag : null,
      count: releases.length,
      releases,
    };

    writes.push(env.VERSION_CACHE.put(releasesKey(project.repo), JSON.stringify(doc)));
  }

  writes.push(env.VERSION_CACHE.put(VERSIONS_KEY, JSON.stringify(versions)));

  await Promise.all(writes);
}

export async function handleLatest(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return preflight('GET, OPTIONS');
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const versions = (await env.VERSION_CACHE.get(VERSIONS_KEY, 'json')) as Versions | null;

  if (!versions) return json({ error: 'Version data not yet available' }, 503);

  return json({ versions });
}

function releaseToMarkdown(release: Release): string {
  const heading = release.name || release.tag || 'unknown';
  const date = release.published_at ? release.published_at.slice(0, 10) : 'unreleased';
  return `## ${heading}\n\n_${date}_\n\n${release.body || '_No release notes._'}\n`;
}

export const RELEASES_PATTERN = /^\/api\/releases(?:\/([^/]+))?(?:\/([^/]+))?\/?$/;

export async function handleReleases(
  request: Request,
  env: Env,
  match: RegExpMatchArray,
  asMarkdown: boolean,
): Promise<Response> {
  if (request.method === 'OPTIONS') return preflight('GET, OPTIONS');
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const url = new URL(request.url);
  const projectName = match[1] ? decodeURIComponent(match[1]) : null;
  const selector = match[2] ? decodeURIComponent(match[2]) : null;

  if (!projectName) {
    const docs = (await Promise.all(
      PROJECTS.map((project) => env.VERSION_CACHE.get(releasesKey(project.repo), 'json')),
    )) as (ReleaseDoc | null)[];

    return json({
      projects: PROJECTS.map((project, index) => ({
        project: project.repo,
        key: project.key,
        latest_version: docs[index] ? docs[index].latest_version : null,
        latest_tag: docs[index] ? docs[index].latest_tag : null,
        count: docs[index] ? docs[index].count : 0,
        updated_at: docs[index] ? docs[index].updated_at : null,
        endpoint: `/api/releases/${project.repo}`,
      })),
    });
  }

  const project = PROJECTS.find((entry) => entry.repo === projectName || entry.key === projectName);

  if (!project) {
    return json({ error: 'Unknown project', projects: PROJECTS.map((entry) => entry.repo) }, 404);
  }

  const doc = (await env.VERSION_CACHE.get(releasesKey(project.repo), 'json')) as ReleaseDoc | null;

  if (!doc) return json({ error: 'Release data not yet available' }, 503);

  const includePrereleases = url.searchParams.get('prereleases') !== 'false';
  const filtered = includePrereleases ? doc.releases : doc.releases.filter((release) => !release.prerelease);

  if (selector) {
    const wanted = selector.toLowerCase();
    const release =
      wanted === 'latest'
        ? latestRelease(doc.releases)
        : (doc.releases.find((entry) => (entry.tag ?? '').toLowerCase() === wanted) ??
          doc.releases.find((entry) => (entry.version ?? '').toLowerCase() === wanted) ??
          null);

    if (!release) return json({ error: 'Release not found', project: project.repo, selector }, 404);

    if (asMarkdown) return markdown(release.body || '');

    return json({ project: project.repo, updated_at: doc.updated_at, release });
  }

  const limit = Number.parseInt(url.searchParams.get('limit') || '', 10);
  const releases = Number.isFinite(limit) && limit > 0 ? filtered.slice(0, limit) : filtered;

  if (asMarkdown) {
    const body = releases.length > 0 ? releases.map(releaseToMarkdown).join('\n---\n\n') : '_No releases._\n';
    return markdown(`# ${project.repo}\n\n${body}`);
  }

  return json({
    project: project.repo,
    key: project.key,
    updated_at: doc.updated_at,
    latest_version: doc.latest_version,
    latest_tag: doc.latest_tag,
    count: releases.length,
    total: doc.count,
    releases,
  });
}
