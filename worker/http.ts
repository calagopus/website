const CACHE_SECONDS = 300;

export function wantsMarkdown(request: Request, pathname: string): boolean {
  if (pathname.endsWith('.md')) return true;
  return (request.headers.get('Accept') ?? '').includes('text/markdown');
}

export function preflight(methods: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      Vary: 'Accept',
    },
  });
}

export function markdown(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      Vary: 'Accept',
    },
  });
}

export function noStore(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

export function accepted(): Response {
  return new Response(null, {
    status: 202,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
