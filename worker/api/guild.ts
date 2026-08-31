import { json, preflight } from '../http.ts';

const UPSTREAM = 'https://bot.calagopus.com/api/guild';

export async function handleGuild(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return preflight('GET, OPTIONS');
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const url = new URL(request.url);

  try {
    const upstream = await fetch(`${UPSTREAM}${url.search}`, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 60, cacheEverything: true },
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch {
    return json({ error: 'Upstream unavailable' }, 502);
  }
}
