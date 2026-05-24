import { readdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';
import type { PluginOption } from 'vite';

export interface AiDocBundle {
  route: string;
  title?: string;
  sourceDir: string;
  recursive?: boolean;
  include?: (relativePath: string) => boolean;
  renderFile?: (file: { relativePath: string; content: string }) => string;
  separator?: string;
  header?: string;
}

export interface AiDocPluginOptions {
  bundles: AiDocBundle[];
  indexRoute?: string | false;
}

interface ResolvedBundle extends Required<Omit<AiDocBundle, 'header' | 'title'>> {
  title: string;
  header: string;
  emitPath: string;
}

function defaultTitle(route: string): string {
  const base = route.split('/').pop() ?? route;
  return base.replace(/\.md$/, '');
}

function resolveBundle(bundle: AiDocBundle, root: string): ResolvedBundle {
  return {
    route: bundle.route,
    title: bundle.title ?? defaultTitle(bundle.route),
    sourceDir: isAbsolute(bundle.sourceDir) ? bundle.sourceDir : join(root, bundle.sourceDir),
    recursive: bundle.recursive ?? true,
    include: bundle.include ?? ((p) => p.endsWith('.md')),
    renderFile: bundle.renderFile ?? (({ relativePath, content }) => `<!-- ${relativePath} -->\n\n${content.trim()}\n`),
    separator: bundle.separator ?? '\n\n---\n\n',
    header: bundle.header ?? '',
    emitPath: bundle.route.replace(/^\/+/, ''),
  };
}

async function walk(dir: string, recursive: boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) files.push(...(await walk(full, recursive)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files.sort();
}

async function listIncludedFiles(bundle: ResolvedBundle): Promise<string[]> {
  const all = await walk(bundle.sourceDir, bundle.recursive);
  return all.map((f) => relative(bundle.sourceDir, f)).filter((rel) => bundle.include(rel));
}

async function buildBundle(bundle: ResolvedBundle): Promise<string> {
  const rels = await listIncludedFiles(bundle);
  const parts: string[] = [];
  for (const rel of rels) {
    const content = await readFile(join(bundle.sourceDir, rel), 'utf8');
    parts.push(bundle.renderFile({ relativePath: rel, content }));
  }
  return (bundle.header ? `${bundle.header}\n\n` : '') + parts.join(bundle.separator);
}

async function buildIndex(bundles: ResolvedBundle[]): Promise<string> {
  const sections: string[] = [];
  for (const bundle of bundles) {
    const rels = await listIncludedFiles(bundle);
    const list = rels.map((rel) => `- ${rel}`).join('\n');
    sections.push(
      `# ${bundle.title}\nFiles included in this bundle:\n${list}\n\n## To see this file bundle, fetch \`${bundle.route}\``,
    );
  }
  return `${sections.join('\n\n')}\n`;
}

interface MiddlewareServer {
  middlewares: {
    use(
      route: string,
      handler: (
        req: unknown,
        res: { setHeader(k: string, v: string): void; end(b: string): void },
        next: (err?: Error) => void,
      ) => void,
    ): void;
  };
}

function serveMarkdown(server: MiddlewareServer, route: string, build: () => Promise<string>): void {
  server.middlewares.use(route, async (_req, res, next) => {
    try {
      const body = await build();
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.end(body);
    } catch (err) {
      next(err as Error);
    }
  });
}

export function aiDocPlugin(options: AiDocPluginOptions | AiDocBundle[]): PluginOption {
  const opts: AiDocPluginOptions = Array.isArray(options) ? { bundles: options } : options;
  const indexRoute = opts.indexRoute === undefined ? '/ai-doc/index.md' : opts.indexRoute;
  let resolved: ResolvedBundle[] = [];

  return {
    name: 'ai-doc',

    configResolved(config) {
      resolved = opts.bundles.map((b) => resolveBundle(b, config.root));
    },

    configureServer(server) {
      for (const bundle of resolved) {
        serveMarkdown(server, bundle.route, () => buildBundle(bundle));
      }
      if (indexRoute) {
        serveMarkdown(server, indexRoute, () => buildIndex(resolved));
      }
    },

    async generateBundle() {
      for (const bundle of resolved) {
        this.emitFile({
          type: 'asset',
          fileName: bundle.emitPath,
          source: await buildBundle(bundle),
        });
      }
      if (indexRoute) {
        this.emitFile({
          type: 'asset',
          fileName: indexRoute.replace(/^\/+/, ''),
          source: await buildIndex(resolved),
        });
      }
    },
  };
}
