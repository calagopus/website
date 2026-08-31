import { wantsMarkdown } from '../http.ts';
import { handleGuild } from './guild.ts';
import { handleLatest, handleReleases, RELEASES_PATTERN } from './releases.ts';
import { handleSponsors } from './sponsors.ts';
import { handleTelemetry } from './telemetry.ts';

export const API_PREFIX = '/api/';

export async function apiHandler(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.endsWith('.md') ? url.pathname.slice(0, -3) : url.pathname;

  if (pathname === '/api/latest' || pathname === '/api/latest/') return handleLatest(request, env);
  if (pathname === '/api/guild' || pathname === '/api/guild/') return handleGuild(request);
  if (pathname === '/api/sponsors' || pathname === '/api/sponsors/') return handleSponsors(request);
  if (pathname === '/api/telemetry' || pathname === '/api/telemetry/') return handleTelemetry(request, env, ctx);

  const releases = pathname.match(RELEASES_PATTERN);
  if (releases) return handleReleases(request, env, releases, wantsMarkdown(request, url.pathname));

  return new Response('Not Found', { status: 404 });
}
