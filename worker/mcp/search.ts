import { loadManifest, parsePageRef } from './pages.ts';

const SNIPPET_MAX = 400;
export const WEAK_SCORE = 0.5;

export interface SearchHit {
  name: string;
  title: string;
  snippet: string;
  score: number;
  weak: boolean;
  bytes: number;
}

function snippet(text: string, query: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= SNIPPET_MAX) return flat;

  const haystack = flat.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9._-]+/)
    .filter((term) => term.length > 2)
    .sort((a, b) => b.length - a.length);

  const hit = terms.map((term) => haystack.indexOf(term)).find((index) => index !== -1) ?? -1;
  const start = hit === -1 ? 0 : Math.max(0, hit - Math.floor(SNIPPET_MAX / 3));
  const end = Math.min(flat.length, start + SNIPPET_MAX);

  const head = start > 0 ? flat.slice(start).replace(/^\S*\s/, '...') : flat.slice(start);
  const body = head.slice(0, SNIPPET_MAX);
  return end < flat.length ? `${body.replace(/\s\S*$/, '')}...` : body;
}

export async function queryPages(
  env: Env,
  query: string,
  limit: number,
): Promise<{ total: number; results: SearchHit[] }> {
  const instance = env.AI_SEARCH.get(env.AI_SEARCH_INSTANCE);

  const response = await instance.search({
    query,
    ai_search_options: {
      retrieval: {
        max_num_results: Math.min(50, limit * 3),
      },
    },
  });

  const manifest = await loadManifest(env);
  const pages = new Map(manifest.pages.map((page) => [page.name, page]));
  const best = new Map<string, SearchHit>();

  for (const chunk of response.chunks) {
    const { name } = parsePageRef(chunk.item.key);
    const existing = best.get(name);
    if (existing && existing.score >= chunk.score) continue;

    best.set(name, {
      name,
      title: pages.get(name)?.title ?? '',
      snippet: snippet(chunk.text, query),
      score: Number(chunk.score.toFixed(4)),
      weak: chunk.score < WEAK_SCORE,
      bytes: pages.get(name)?.bytes ?? 0,
    });
  }

  const ranked = [...best.values()].sort((a, b) => b.score - a.score);
  return { total: ranked.length, results: ranked.slice(0, limit) };
}
