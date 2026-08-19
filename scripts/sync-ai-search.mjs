import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { markdownCandidates } from '../.vitepress/lib/markdown-candidates.ts';

const DIST = '.vitepress/dist';
const MANIFEST = join(DIST, '_mcp/pages.json');
const API = 'https://api.cloudflare.com/client/v4';
const PER_PAGE = 50;
const FORCE = process.argv.includes('--force');

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !token) {
  console.error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_SEARCH_TOKEN must be set.');
  process.exit(2);
}

const { vars } = JSON.parse(await readFile('wrangler.json', 'utf8'));
const instance = vars.AI_SEARCH_INSTANCE;
const base = `${API}/accounts/${accountId}/ai-search/instances/${instance}`;

async function call(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function listItems() {
  const items = new Map();

  for (let page = 1; ; page++) {
    const { ok, status, body } = await call(`${base}/items?source=builtin&per_page=${PER_PAGE}&page=${page}`);
    if (!ok) throw new Error(`could not list items: HTTP ${status} ${JSON.stringify(body)}`);

    const batch = body.result ?? [];
    for (const item of batch) items.set(item.key, item);

    const total = body.result_info?.total_count;
    const done = total === undefined ? batch.length < PER_PAGE : items.size >= total;
    if (done || batch.length === 0) return items;
  }
}

function uploadBody(key, content, hash) {
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/markdown' }), key);
  form.append('metadata', JSON.stringify({ hash }));
  return form;
}

async function upload(key, content, hash) {
  const first = await call(`${base}/items`, { method: 'POST', body: uploadBody(key, content, hash) });
  if (first.ok) return;

  if (first.status === 409) {
    const found = await call(`${base}/items?source=builtin&key=${encodeURIComponent(key)}`);
    for (const item of found.body?.result ?? []) await remove(item);

    const retry = await call(`${base}/items`, { method: 'POST', body: uploadBody(key, content, hash) });
    if (retry.ok) return;
    throw new Error(`could not replace ${key}: HTTP ${retry.status} ${JSON.stringify(retry.body)}`);
  }

  throw new Error(`could not upload ${key}: HTTP ${first.status} ${JSON.stringify(first.body)}`);
}

async function remove(item) {
  const { ok, status, body } = await call(`${base}/items/${item.id}`, { method: 'DELETE' });
  if (!ok) throw new Error(`could not delete ${item.key}: HTTP ${status} ${JSON.stringify(body)}`);
}

function itemKey(name) {
  return name === '/' ? 'index.md' : `${name.replace(/^\//, '')}.md`;
}

async function readSource(name) {
  for (const candidate of markdownCandidates(name)) {
    try {
      return await readFile(join(DIST, candidate.replace(/^\//, '')), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`no Markdown in ${DIST} for page "${name}" (tried ${markdownCandidates(name).join(', ')})`);
}

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const existing = await listItems();

const wanted = new Map();
for (const page of manifest.pages) {
  const content = await readSource(page.name);
  wanted.set(itemKey(page.name), { content, hash: createHash('sha256').update(content).digest('hex') });
}

let uploaded = 0;
let skipped = 0;
let deleted = 0;

for (const [key, { content, hash }] of wanted) {
  const item = existing.get(key);
  if (!FORCE && item?.metadata?.hash === hash) {
    skipped++;
    continue;
  }
  if (item) await remove(item);
  await upload(key, content, hash);
  uploaded++;
}

for (const [key, item] of existing) {
  if (wanted.has(key)) continue;
  await remove(item);
  deleted++;
}

console.log(`AI Search "${instance}": ${uploaded} uploaded, ${skipped} unchanged, ${deleted} removed.`);

if (!FORCE && existing.size > 0 && skipped === 0 && uploaded > 0) {
  console.warn('warning: no page was seen as unchanged - upload metadata is not being returned by the list endpoint.');
}
