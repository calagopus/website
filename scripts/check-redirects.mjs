import { existsSync, readFileSync } from 'node:fs';
import { anchorsInTabs, movedAnchors } from '../.vitepress/data/moved-anchors.ts';
import { movedPages } from '../.vitepress/lib/redirects.ts';

const DIST = '.vitepress/dist';
const SITEMAP = 'https://calagopus.com/sitemap.xml';

function builtPage(route) {
  const path = route.replace(/\/$/, '');
  return [`${DIST}${path}.html`, `${DIST}${path}/index.html`].find((file) => existsSync(file)) ?? null;
}

function pageAnchors(file) {
  const html = readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const inTabs = new Set();
  const labels = new Set([...html.matchAll(/class="plugin-tabs--tab"[^>]*>([^<]*)</g)].map((match) => match[1]));

  for (const [, anchors] of html.matchAll(/\sdata-anchors="([^"]*)"/g)) {
    const decoded = anchors.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');
    for (const id of Object.keys(JSON.parse(decoded))) inTabs.add(id);
  }
  return { ids, inTabs, labels };
}

const errors = [];

for (const [from, to] of Object.entries(movedPages)) {
  const [route, anchor] = to.split('#');
  const target = builtPage(route);
  if (!target) errors.push(`${from}: redirects to ${route}, which isn't a page`);
  if (builtPage(from) || existsSync(`web${from}`)) errors.push(`${from}: is a redirect but still exists`);
  if (target && anchor && !pageAnchors(target).ids.has(anchor)) errors.push(`${from}: ${to} has no such anchor`);
}

for (const [page, anchors] of Object.entries(movedAnchors)) {
  const file = builtPage(page);
  if (!file) {
    errors.push(`${page}: has moved anchors but isn't a page`);
    continue;
  }
  const { ids, inTabs } = pageAnchors(file);
  for (const [from, to] of Object.entries(anchors)) {
    if (ids.has(from) || inTabs.has(from)) errors.push(`${page}#${from}: is moved but still exists`);
    if (!ids.has(to) && !inTabs.has(to)) errors.push(`${page}#${from}: ${to} doesn't exist`);
  }
}

for (const [page, tabs] of Object.entries(anchorsInTabs)) {
  const file = builtPage(page);
  if (!file) {
    errors.push(`${page}: has anchors in tabs but isn't a page`);
    continue;
  }
  const { ids, inTabs, labels } = pageAnchors(file);
  for (const [label, anchors] of Object.entries(tabs)) {
    if (!labels.has(label)) errors.push(`${page}: has no tab called ${label}`);
    for (const from of anchors) {
      if (ids.has(from) || inTabs.has(from)) errors.push(`${page}#${from}: is listed for a tab but still exists`);
    }
  }
}

// Every page on the live site has to stay a page or become a redirect.
let live = [];
try {
  const response = await fetch(SITEMAP, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const sitemap = await response.text();
  live = [...sitemap.matchAll(/<loc>https:\/\/calagopus\.com([^<]*)<\/loc>/g)].map((match) => match[1] || '/');
  if (live.length === 0) throw new Error('no URLs found');
} catch (error) {
  console.warn(`Skipping the live URL check, couldn't read ${SITEMAP}: ${error.message}`);
}

for (const route of live) {
  if (!builtPage(route) && !movedPages[route.replace(/\/$/, '')]) {
    errors.push(`${route}: is live but has no page or redirect, add it to .vitepress/lib/redirects.ts`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

console.log(`${Object.keys(movedPages).length} redirects and ${live.length} live URLs check out.`);
