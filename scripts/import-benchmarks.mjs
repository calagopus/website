import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const DATA = '.vitepress/data/benchmarks';
const KINDS = { panel: 'panels', daemon: 'daemons' };

const TARGETS = {
  'panel:calagopus': { name: 'Calagopus', icon: '/icon.svg', color: '#14b8a6' },
  'panel:pterodactyl': { name: 'Pterodactyl', icon: '/vendor/pterodactyl.svg', color: '#d97706' },
  'panel:pelican': { name: 'Pelican', icon: '/vendor/pelican.png', color: '#6366f1' },
  'panel:pufferpanel': { name: 'PufferPanel', icon: '/vendor/pufferpanel.png', color: '#e11d48' },
  'panel:featherpanel': { name: 'FeatherPanel', icon: '/vendor/featherpanel.png', color: '#a855f7' },
  'panel:hydrodactyl': { name: 'Hydrodactyl', icon: '/vendor/hydrodactyl.svg', color: '#52a9ff' },
  'daemon:calagopus': { name: 'Calagopus Wings', icon: '/icon.svg', color: '#14b8a6' },
  'daemon:pterodactyl': { name: 'Pterodactyl Wings', icon: '/vendor/pterodactyl.svg', color: '#d97706' },
  'daemon:pelican': { name: 'Pelican Wings', icon: '/vendor/pelican.png', color: '#6366f1' },
};

const EXPECTED = { panel: 6, daemon: 3 };

const round = (value) => (Number.isFinite(value) ? Math.round(value * 1000) / 1000 : value);

function trim(value) {
  if (typeof value === 'number') return round(value);
  if (Array.isArray(value)) return value.map(trim);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'runsMs' && key !== 'failures')
        .map(([key, item]) => [key, trim(item)]),
    );
  }
  return value;
}

const ident = (id) => id.replace(/[^a-z0-9]+(.)?/gi, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(\d)/, '_$1');

function literal(value, indent = 2) {
  const pad = ' '.repeat(indent);
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((v) => `${pad}  ${literal(v, indent + 2)}`).join(',\n')},\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
    return `{\n${entries.map(([k, v]) => `${pad}  ${key(k)}: ${literal(v, indent + 2)}`).join(',\n')},\n${pad}}`;
  }
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return String(value);
}

async function readSystems() {
  const source = await readFile(join(DATA, 'systems.ts'), 'utf8');
  return [...source.matchAll(/^\s*id: '([^']+)',$/gm)].map((m) => m[1]);
}

async function writeTarget(kind, target, system, report) {
  const dir = join(DATA, KINDS[kind], target);
  await mkdir(dir, { recursive: true });
  const body = literal({ system, report: trim(report) });
  await writeFile(
    join(dir, `${system}.ts`),
    `import type { SystemBenchmark } from '../../types.ts';\n\nexport default ${body} satisfies SystemBenchmark;\n`,
  );
}

async function writeIndex(kind, target, order) {
  const dir = join(DATA, KINDS[kind], target);
  const present = (await readdir(dir)).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => f.slice(0, -3));
  const ordered = order.filter((id) => present.includes(id));
  const meta = TARGETS[`${kind}:${target}`];

  const imports = ordered.map((id) => `import ${ident(id)} from './${id}.ts';`).join('\n');
  await writeFile(
    join(dir, 'index.ts'),
    `import type { TargetBenchmarks } from '../../types.ts';\n${imports}\n\n` +
      `export default {\n  name: '${meta.name}',\n  kind: '${kind}',\n  icon: '${meta.icon}',\n` +
      `  color: '${meta.color}',\n  systems: [${ordered.map(ident).join(', ')}],\n} satisfies TargetBenchmarks;\n`,
  );
}

async function writeRoot(kind, targets) {
  const dir = join(DATA, KINDS[kind]);
  const imports = targets.map((t) => `import ${ident(t)} from './${t}/index.ts';`).join('\n');
  await writeFile(
    join(dir, 'index.ts'),
    `${imports}\n\nexport const ${KINDS[kind]} = { ${targets.map((t) => (ident(t) === t ? t : `${t}: ${ident(t)}`)).join(', ')} } as const;\n\n` +
      `export type ${kind === 'panel' ? 'PanelId' : 'DaemonId'} = keyof typeof ${KINDS[kind]};\n` +
      `export const ${kind}Ids = Object.keys(${KINDS[kind]}) as ${kind === 'panel' ? 'PanelId' : 'DaemonId'}[];\n`,
  );
}

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/import-benchmarks.mjs <dir> [--system <id>]');
  process.exit(2);
}
const flag = process.argv.indexOf('--system');
const system = flag > 0 ? process.argv[flag + 1] : basename(dir);

const known = await readSystems();
if (!known.includes(system)) {
  console.error(`unknown system '${system}'; systems.ts knows: ${known.join(', ')}`);
  process.exit(2);
}

const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
const reports = [];
for (const file of files) {
  const report = JSON.parse(await readFile(join(dir, file), 'utf8'));
  const [kind, target] = report.target.split(':');
  if (!KINDS[kind]) throw new Error(`${file}: unknown target kind '${kind}'`);
  if (!TARGETS[report.target]) throw new Error(`${file}: no presentation metadata for '${report.target}'`);
  reports.push({ kind, target, report });
}

if (reports.length === 0) {
  console.error(`${dir}: no reports found`);
  process.exit(1);
}

for (const [kind, count] of Object.entries(EXPECTED)) {
  const got = reports.filter((r) => r.kind === kind).length;
  if (got !== 0 && got !== count) {
    console.error(`${dir}: expected ${count} ${kind} reports, found ${got} - refusing a partial import`);
    process.exit(1);
  }
}

const dates = [...new Set(reports.map((r) => r.report.startedAt.slice(0, 10)))];
if (dates.length !== 1) {
  console.error(`${dir}: reports span multiple dates (${dates.join(', ')}) - not one run`);
  process.exit(1);
}

for (const { kind, target, report } of reports) await writeTarget(kind, target, system, report);
for (const { kind, target } of reports) await writeIndex(kind, target, known);
for (const kind of Object.keys(KINDS)) {
  const targets = [...new Set(reports.filter((r) => r.kind === kind).map((r) => r.target))].sort();
  if (targets.length > 0) await writeRoot(kind, targets);
}

await run('npx', ['biome', 'check', '--write', DATA], { maxBuffer: 64 * 1024 * 1024 }).catch((e) => {
  console.error(e.stdout || e.message);
  process.exit(1);
});

console.log(`imported ${system}: ${reports.map((r) => r.report.target).join(', ')} (${dates[0]})`);
