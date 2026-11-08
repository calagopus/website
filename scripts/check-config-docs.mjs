import { readFile } from 'node:fs/promises';
import { dbAgentConfigDoc } from '../.vitepress/data/config/db-agent.ts';
import { wingsConfigDoc } from '../.vitepress/data/config/wings.ts';
import { configDocPaths } from '../.vitepress/plugins/config-docs.ts';

const DOCS = { wings: wingsConfigDoc, 'db-agent': dbAgentConfigDoc };

function yamlPaths(source) {
  const paths = new Set();
  const stack = [];

  for (const line of source.split('\n')) {
    // `- key:` opens a map inside a sequence, which sits at its parent key's indentation
    const match = line.match(/^(\s*)(- )?([\w\-.]+):(?:\s|$)/);
    if (!match) continue;

    const depth = (match[1].length + (match[2] ? 2 : 0)) / 2;
    stack.length = depth;
    stack.push(match[3]);
    paths.add(stack.join('.'));
  }

  return paths;
}

const args = process.argv.slice(2);
const targets = [];
for (let i = 0; i < args.length; i += 2) {
  const name = args[i].replace(/^--/, '');
  if (!DOCS[name] || !args[i + 1]) {
    console.error(`usage: node scripts/check-config-docs.mjs [${Object.keys(DOCS).join('|')}] <path to config.yml>`);
    process.exit(2);
  }
  targets.push([name, args[i + 1]]);
}

if (targets.length === 0) {
  console.error(`usage: node scripts/check-config-docs.mjs [${Object.keys(DOCS).join('|')}] <path to config.yml>`);
  process.exit(2);
}

let drifted = false;

for (const [name, path] of targets) {
  const actual = yamlPaths(await readFile(path, 'utf8'));
  const documented = configDocPaths(DOCS[name]);

  const missing = [...actual].filter((key) => !documented.has(key));
  const stale = [...documented].filter((key) => !actual.has(key));

  console.log(`\n${name} (${path})`);
  for (const key of missing) console.log(`  undocumented: ${key}`);
  for (const key of stale) console.log(`  not in config: ${key}`);
  if (missing.length === 0 && stale.length === 0) console.log('  up to date');

  drifted ||= missing.length > 0 || stale.length > 0;
}

process.exit(drifted ? 1 : 0);
