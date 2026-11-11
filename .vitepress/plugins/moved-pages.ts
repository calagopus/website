import type { PluginOption } from 'vite';
import { movedPageLocation } from '../lib/redirects.ts';

export function movedPagesPlugin(): PluginOption {
  return {
    name: 'moved-pages',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        const { pathname, search } = new URL(req.url ?? '/', 'http://localhost');
        const moved = movedPageLocation(pathname, search);
        if (moved === null) return next();

        res.statusCode = 301;
        res.setHeader('Location', moved);
        res.end();
      });
    },
  };
}
