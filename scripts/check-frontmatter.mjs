import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { sidebar } from '../.vitepress/data/sidebar.ts';

const SRC_DIR = 'web';
const SKIPPED_DIRS = new Set(['public', 'snippets']);
const SIDEBAR = '.vitepress/data/sidebar.ts';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : walk(path);
      return entry.name.endsWith('.md') ? [path] : [];
    }),
  );
  return files.flat();
}

const linksOf = (item) => [...(item.link ? [item.link] : []), ...(item.items ?? []).flatMap(linksOf)];

function parseFrontmatter(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fields = {};
  for (const line of block?.[1].split(/\r?\n/) ?? []) {
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (field) fields[field[1]] = field[2];
  }
  return fields;
}

function routeOf(file) {
  const path = `/${relative(SRC_DIR, file).split('\\').join('/')}`.slice(0, -'.md'.length);
  return path.endsWith('/index') ? path.slice(0, -'index'.length) : path;
}

// Each top-level group is a category, whichever sidebar it belongs to.
const groups = Object.values(sidebar)
  .flat()
  .map((group) => ({ name: group.text, links: linksOf(group).filter((link) => link.startsWith('/')) }));

const pages = new Map();
for (const file of await walk(SRC_DIR)) {
  pages.set(routeOf(file), { file, frontmatter: parseFrontmatter(await readFile(file, 'utf8')) });
}

const problems = [];
const inSidebar = new Set();

for (const group of groups) {
  group.links.forEach((link, i) => {
    if (pages.has(`${link}/`)) {
      problems.push(`${SIDEBAR}: sidebar link ${link} points at a folder index, so it must end with a /`);
      return;
    }
    const page = pages.get(link);
    if (!page) {
      problems.push(`${SIDEBAR}: sidebar link ${link} has no page`);
      return;
    }
    inSidebar.add(link);

    const { prev, next } = page.frontmatter;
    const first = i === 0;
    const last = i === group.links.length - 1;
    if (first && prev !== 'false') problems.push(`${page.file}: first page in "${group.name}", needs prev: false`);
    if (last && next !== 'false') problems.push(`${page.file}: last page in "${group.name}", needs next: false`);
    if (!first && prev === 'false') problems.push(`${page.file}: not first in "${group.name}", remove prev: false`);
    if (!last && next === 'false') problems.push(`${page.file}: not last in "${group.name}", remove next: false`);
  });
}

for (const [route, { file, frontmatter }] of pages) {
  const { prev, next, description, layout } = frontmatter;
  if (!description) problems.push(`${file}: needs a description`);
  if (prev === 'true') problems.push(`${file}: prev: true does nothing, remove it`);
  if (next === 'true') problems.push(`${file}: next: true does nothing, remove it`);
  if (!inSidebar.has(route) && layout !== 'home' && (prev !== 'false' || next !== 'false')) {
    problems.push(`${file}: not in the sidebar, needs prev: false and next: false`);
  }
}

if (problems.length === 0) {
  console.log(`Frontmatter matches the sidebar (${pages.size} pages, ${groups.length} categories checked).`);
  process.exit(0);
}

for (const problem of problems) console.error(problem);
console.error('\nSee "Frontmatter" in contributing.md.');
process.exit(1);
