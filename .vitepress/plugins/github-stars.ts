import { fetchJson } from '../lib/fetch-retry.ts';

const REPO = 'calagopus/panel';
const API_URL = `https://api.github.com/repos/${REPO}`;

interface ApiRepo {
  stargazers_count: number;
}

export interface GitHubStarsData {
  repo: string;
  link: string;
  stars: number | null;
}

export async function loadGitHubStars(): Promise<GitHubStarsData> {
  const link = `https://github.com/${REPO}`;
  if (process.env.CALAGOPUS_STARS_OFFLINE) return { repo: REPO, link, stars: null };

  const token = process.env.GITHUB_TOKEN;
  const api = await fetchJson<ApiRepo>(
    API_URL,
    `stars for "${REPO}"`,
    'CALAGOPUS_STARS_OFFLINE',
    token ? { authorization: `Bearer ${token}` } : {},
  );

  return { repo: REPO, link, stars: api.stargazers_count };
}
