import { json, preflight } from '../http.ts';

const UPSTREAM = 'https://bot.calagopus.com/api/sponsors';

async function proxy(request: Request, upstream: string): Promise<Response> {
  if (request.method === 'OPTIONS') return preflight('GET, OPTIONS');
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const url = new URL(request.url);

  try {
    const response = await fetch(`${upstream}${url.search}`, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 60, cacheEverything: true },
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch {
    return json({ error: 'Upstream unavailable' }, 502);
  }
}

export async function handleSponsors(request: Request): Promise<Response> {
  return await proxy(request, UPSTREAM);
}

export async function handleSponsorSections(request: Request): Promise<Response> {
  return await proxy(request, `${UPSTREAM}/sections`);
}
