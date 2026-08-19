import { readFile } from 'node:fs/promises';
import { join, sep } from 'node:path';
import type { PluginOption } from 'vite';
import { markdownCandidates } from '../lib/markdown-candidates.ts';

interface MiddlewareRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

type MiddlewareResponse = { setHeader(k: string, v: string): void; end(b: string): void };

function wantsMarkdown(req: MiddlewareRequest, pathname: string): boolean {
  if (pathname.endsWith('.md')) return true;
  const accept = req.headers.accept;
  const value = Array.isArray(accept) ? accept.join(',') : accept;
  return !!value && value.includes('text/markdown');
}

function resolveWithinRoot(root: string, relativePath: string): string | null {
  const resolved = join(root, relativePath);
  if (resolved !== root && !resolved.startsWith(root + sep)) return null;
  return resolved;
}

async function readFirstExisting(paths: string[]): Promise<string | null> {
  for (const path of paths) {
    try {
      return await readFile(path, 'utf8');
    } catch {
      // try the next candidate
    }
  }
  return null;
}

export function acceptMarkdownPlugin(): PluginOption {
  let root = '';

  return {
    name: 'accept-markdown',

    configResolved(config) {
      root = config.root;
    },

    configureServer(server) {
      server.middlewares.use(async (req: MiddlewareRequest, res: MiddlewareResponse, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        let pathname: string;
        try {
          pathname = decodeURIComponent((req.url ?? '/').split('?')[0].split('#')[0]);
        } catch {
          return next();
        }
        if (!wantsMarkdown(req, pathname)) return next();

        const candidates = markdownCandidates(pathname)
          .map((rel) => resolveWithinRoot(root, rel))
          .filter((p): p is string => p !== null);
        if (candidates.length === 0) return next();

        const body = await readFirstExisting(candidates);
        if (body === null) return next();

        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.end(body);
      });
    },
  };
}
