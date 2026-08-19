import { markdownCandidates } from '../.vitepress/lib/markdown-candidates.ts';
import { mcpHandler } from './mcp/server.ts';

const MCP_ROUTE = '/mcp';

function wantsMarkdown(request: Request, pathname: string): boolean {
  if (pathname.endsWith('.md')) return true;
  return (request.headers.get('Accept') ?? '').includes('text/markdown');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === MCP_ROUTE) return mcpHandler(env)(request, env, ctx);

    if (request.method !== 'GET' && request.method !== 'HEAD') return env.ASSETS.fetch(request);
    if (!wantsMarkdown(request, url.pathname)) return env.ASSETS.fetch(request);

    for (const candidate of markdownCandidates(url.pathname)) {
      const response = await env.ASSETS.fetch(new Request(new URL(candidate, url.origin), request));
      if (response.status === 404) continue;

      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/markdown; charset=utf-8');
      headers.append('Vary', 'Accept');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
