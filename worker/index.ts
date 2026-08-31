import { markdownCandidates } from '../.vitepress/lib/markdown-candidates.ts';
import { API_PREFIX, apiHandler } from './api/index.ts';
import { refreshReleases } from './api/releases.ts';
import { wantsMarkdown } from './http.ts';
import { imageAsset } from './images.ts';
import { mcpHandler } from './mcp/server.ts';

const MCP_ROUTE = '/mcp';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === MCP_ROUTE) return mcpHandler(env)(request, env, ctx);
    if (url.pathname.startsWith(API_PREFIX)) return apiHandler(request, env, ctx);

    if (request.method !== 'GET' && request.method !== 'HEAD') return env.ASSETS.fetch(request);

    const asset = await imageAsset(env, url.pathname);
    if (asset !== null) return Response.redirect(new URL(asset, url.origin).toString(), 302);

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

  async scheduled(_event, env) {
    await refreshReleases(env);
  },
} satisfies ExportedHandler<Env>;
