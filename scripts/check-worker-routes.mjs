import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = '.vitepress/dist';
const CONFIG = 'wrangler.json';

function matches(patterns, pathname) {
  const toRegExp = (pattern) =>
    new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

  for (const pattern of patterns) {
    if (pattern.startsWith('!') && toRegExp(pattern.slice(1)).test(pathname)) return false;
  }
  return patterns.some((pattern) => !pattern.startsWith('!') && toRegExp(pattern).test(pathname));
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return files.flat();
}

function servedAt(file) {
  const path = `/${relative(DIST, file).split('\\').join('/')}`;
  if (path.endsWith('.md')) return path;
  if (!path.endsWith('.html')) return null;
  if (path === '/404.html') return null;
  if (path.endsWith('/index.html')) return path.slice(0, -'index.html'.length);
  return path.slice(0, -'.html'.length);
}

const config = JSON.parse(await readFile(CONFIG, 'utf8'));
const patterns = config.assets?.run_worker_first;
if (!Array.isArray(patterns)) {
  console.error(`${CONFIG}: assets.run_worker_first must be an array of route patterns.`);
  process.exit(2);
}

const files = await walk(DIST);
const uncoveredPages = [];
const billedAssets = [];

for (const file of files) {
  const page = servedAt(file);
  const path = `/${relative(DIST, file).split('\\').join('/')}`;

  if (page === null) {
    if (matches(patterns, path)) billedAssets.push(path);
    continue;
  }
  if (!matches(patterns, page)) uncoveredPages.push(page);
}

for (const page of uncoveredPages) {
  console.error(`page not routed to the Worker (no Markdown negotiation): ${page}`);
}
for (const asset of billedAssets) {
  console.error(`static asset routed through the Worker (billed on every request): ${asset}`);
}

if (uncoveredPages.length === 0 && billedAssets.length === 0) {
  console.log(`run_worker_first covers every page and no static assets (${files.length} files checked).`);
  process.exit(0);
}

console.error(`\nUpdate assets.run_worker_first in ${CONFIG}.`);
process.exit(1);
