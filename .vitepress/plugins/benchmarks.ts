import type { SystemInfo } from '../data/benchmarks/systems.ts';
import {
  type DaemonId,
  daemonCpuOptions,
  daemonIds,
  daemonPendingSystems,
  daemons,
  daemonVersions,
  loadScenarios,
  taskFamilies,
} from '../data/benchmarks/daemon-data.ts';
import {
  chartSystems,
  cpuOptions,
  type LoadResult,
  type PanelId,
  panelIds,
  panels,
  panelVersions,
  pendingSystems,
  runDate,
  type ScenarioResult,
  scenarios,
  type TaskResult,
  type VariantReport,
} from '../data/benchmarks/index.ts';

export const BENCHMARKS_PAGE = 'docs/about/benchmarks.md';
export const DAEMON_BENCHMARKS_PAGE = 'docs/about/daemon-benchmarks.md';

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/;

const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const fmtRps = (value: number | null | undefined): string =>
  isNum(value) ? Math.round(value).toLocaleString('en-US') : '-';

const fmtMs = (value: number | null | undefined): string =>
  isNum(value) ? (value >= 10 ? Math.round(value).toString() : value.toFixed(1)) : '-';

const fmtInt = (value: number | null | undefined): string => (isNum(value) ? Math.round(value).toString() : '-');

const fmtCpuMs = (value: number | null | undefined): string =>
  isNum(value) ? (value >= 10 ? value.toFixed(0) : value.toFixed(3)) : '-';

const maxOf = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter(isNum);
  return nums.length > 0 ? Math.max(...nums) : null;
};

const minOf = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter(isNum);
  return nums.length > 0 ? Math.min(...nums) : null;
};

function table(header: string[], rows: string[][]): string {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

const withVersion = (name: string, version: string | null): string => (version ? `${name} ${version}` : name);

// ---------------------------------------------------------------- panels

const panelLabel = (id: PanelId): string => panels[id].name;

const panelVariant = (id: PanelId, systemIndex: number, cpus: number): VariantReport | undefined =>
  panels[id].systems[systemIndex]?.report.variants.find((variant) => variant.limit.cpus === cpus);

const loadResults = (variant: VariantReport | undefined): LoadResult[] =>
  (variant?.results ?? []).filter((result): result is LoadResult => result.kind === 'load');

const panelResult = (variant: VariantReport | undefined, scenario: string): LoadResult | undefined =>
  loadResults(variant).find((result) => result.scenario.name === scenario);

type LoadPick = (result: LoadResult) => number | null | undefined;

const systemValues = (id: PanelId, systemIndex: number, pick: LoadPick): number[] =>
  (panels[id].systems[systemIndex]?.report.variants ?? [])
    .flatMap((variant) => loadResults(variant).map(pick))
    .filter(isNum);

/**
 * The only scenario every panel answers with real `200`s. Authenticated throughput is dominated by
 * each panel's own rate limiting, so aggregating across all scenarios would compare 429 rejection
 * rates and rank the panels by how fast they say no.
 */
const CLEAN_SCENARIO = 'settings (unauth)';

const cleanResults = (id: PanelId): LoadResult[] =>
  panels[id].systems.flatMap((bench) =>
    bench.report.variants.flatMap((variant) =>
      loadResults(variant).filter((result) => result.scenario.name === CLEAN_SCENARIO),
    ),
  );

const panelHeader = ['System', ...panelIds.map(panelLabel)];

const bySystem = (cell: (id: PanelId, systemIndex: number) => string): string[][] =>
  chartSystems.map((system, index) => [system.name, ...panelIds.map((id) => cell(id, index))]);

function environmentsTable(): string {
  return table(
    ['System', 'CPU', 'Memory'],
    chartSystems.map((system) => [system.name, system.cpu, system.ram]),
  );
}

function headlineTable(): string {
  return table(
    ['Panel', 'Peak throughput (req/s)', 'Best mean latency (ms)', 'Worst-case peak memory (MiB)'],
    panelIds.map((id) => {
      const clean = cleanResults(id);
      return [
        withVersion(panelLabel(id), panelVersions[id]),
        fmtRps(maxOf(clean.map((result) => result.throughput))),
        fmtMs(minOf(clean.map((result) => result.latency?.mean))),
        fmtInt(maxOf(clean.map((result) => result.resources?.heapMbMax))),
      ];
    }),
  );
}

function resourcePeaksTable(): string {
  return table(
    panelHeader,
    bySystem((id, systemIndex) => {
      const cpu = maxOf(systemValues(id, systemIndex, (result) => result.resources?.cpuPercentMax));
      const mem = maxOf(systemValues(id, systemIndex, (result) => result.resources?.heapMbMax));
      return isNum(cpu) || isNum(mem) ? `${fmtInt(cpu)}% / ${fmtInt(mem)} MiB` : '-';
    }),
  );
}

function scenarioTables(label: string, cell: (id: PanelId, systemIndex: number, scenario: string) => string): string {
  const blocks = [`### ${label}`];
  for (const scenario of scenarios) {
    blocks.push(
      `**${scenario}**`,
      table(
        panelHeader,
        bySystem((id, systemIndex) => cell(id, systemIndex, scenario)),
      ),
    );
  }
  return blocks.join('\n\n');
}

function cpuSection(cpus: number): string {
  const heading = `## ${cpus} ${cpus === 1 ? 'CPU' : 'CPUs'}`;

  const throughput = scenarioTables('Throughput (req/s, higher is better)', (id, systemIndex, scenario) =>
    fmtRps(panelResult(panelVariant(id, systemIndex, cpus), scenario)?.throughput),
  );

  const latency = scenarioTables('Latency (ms, mean / p99, lower is better)', (id, systemIndex, scenario) => {
    const stats = panelResult(panelVariant(id, systemIndex, cpus), scenario)?.latency;
    return isNum(stats?.mean) || isNum(stats?.p99) ? `${fmtMs(stats?.mean)} / ${fmtMs(stats?.p99)}` : '-';
  });

  const cpuCost = scenarioTables('CPU cost (ms of CPU per request, lower is better)', (id, systemIndex, scenario) =>
    fmtCpuMs(panelResult(panelVariant(id, systemIndex, cpus), scenario)?.cpuMsPerRequest),
  );

  const memory = [
    `### Memory (MiB, idle / mean / peak on \`${CLEAN_SCENARIO}\`, lower is better)`,
    table(
      panelHeader,
      bySystem((id, systemIndex) => {
        const variant = panelVariant(id, systemIndex, cpus);
        const result = panelResult(variant, CLEAN_SCENARIO);
        const idle = variant?.idle?.heapMbMean;
        const mean = result?.resources?.heapMbMean;
        const peak = result?.resources?.heapMbMax;
        return isNum(idle) || isNum(mean) || isNum(peak) ? `${fmtInt(idle)} / ${fmtInt(mean)} / ${fmtInt(peak)}` : '-';
      }),
    ),
  ].join('\n\n');

  return [heading, throughput, latency, cpuCost, memory].join('\n\n');
}

function pendingNote(pending: SystemInfo[]): string {
  if (pending.length === 0) return '';
  return `A re-run of this suite is still in progress for ${pending
    .map((system) => system.name)
    .join(', ')}; ${pending.length === 1 ? 'that system is' : 'those systems are'} not included below.`;
}

function panelsMarkdown(): string {
  return [
    '## Panels compared',
    `${panelIds.map((id) => withVersion(panelLabel(id), panelVersions[id])).join(', ')}. Every figure below comes ` +
      `from the benchmarking suite's JSON reports checked into this site; the run is dated ${runDate}. Each panel ` +
      `is swept across container CPU quotas of ${cpuOptions.join(', ')} CPUs, and every scenario is run against ` +
      `all ${chartSystems.length} test systems below.`,
    pendingNote(pendingSystems),
    '## Test environments',
    environmentsTable(),
    '## Headline results',
    `Best value for each panel on \`${CLEAN_SCENARIO}\` across every test system and CPU limit. The ` +
      'authenticated scenarios are excluded here: every panel rate-limits them, so their throughput ' +
      'measures rejection rather than work.',
    headlineTable(),
    '## Observed resource peaks',
    'Highest CPU and memory use seen for each panel on each system, across all CPU limits and scenarios (`peak cpu` / `peak mem`).',
    resourcePeaksTable(),
    ...cpuOptions.map(cpuSection),
  ]
    .filter(Boolean)
    .join('\n\n');
}

// --------------------------------------------------------------- daemons

const daemonLabel = (id: DaemonId): string => daemons[id].name;
const daemonHeader = ['System', ...daemonIds.map(daemonLabel)];

const daemonVariant = (id: DaemonId, systemIndex: number, cpus: number): VariantReport | undefined =>
  daemons[id].systems[systemIndex]?.report.variants.find((variant) => variant.limit.cpus === cpus);

const daemonResult = (id: DaemonId, systemIndex: number, cpus: number, name: string): ScenarioResult | undefined =>
  daemonVariant(id, systemIndex, cpus)?.results.find((result) => result.scenario.name === name);

const daemonSystems = () =>
  chartSystems.filter((system) => daemons.calagopus.systems.some((b) => b.system === system.id));

const byDaemonSystem = (cell: (id: DaemonId, systemIndex: number) => string): string[][] =>
  daemonSystems().map((system, index) => [system.name, ...daemonIds.map((id) => cell(id, index))]);

/** A target that cannot perform a scenario gets a reason, not a dash: the suite skipped it deliberately. */
const unsupportedCell = (missingFrom: string[], id: DaemonId): string | null =>
  missingFrom.includes(id) ? 'n/a (cannot create this format)' : null;

function daemonLoadSection(cpus: number): string {
  const blocks: string[] = [];
  for (const scenario of loadScenarios) {
    const cell = (pick: (result: LoadResult) => string) => (id: DaemonId, systemIndex: number) => {
      const missing = unsupportedCell(scenario.missingFrom, id);
      if (missing) return missing;
      const result = daemonResult(id, systemIndex, cpus, scenario.name);
      return result && result.kind === 'load' ? pick(result) : '-';
    };
    blocks.push(
      `**${scenario.name}**`,
      table(
        daemonHeader,
        byDaemonSystem(
          cell(
            (result) =>
              `${fmtRps(result.throughput)} req/s · ${fmtMs(result.latency?.mean)} ms · ` +
              `${fmtCpuMs(result.cpuMsPerRequest)} cpu-ms · ${fmtInt(result.resources?.heapMbMax)} MiB`,
          ),
        ),
      ),
    );
  }
  return ['### Request scenarios (throughput · mean latency · CPU per request · peak memory)', ...blocks].join('\n\n');
}

function daemonTaskSection(cpus: number): string {
  const blocks: string[] = [];
  for (const family of taskFamilies) {
    blocks.push(`**${family.label}**`);
    for (const scenario of family.scenarios) {
      const cell = (id: DaemonId, systemIndex: number) => {
        const missing = unsupportedCell(scenario.missingFrom, id);
        if (missing) return missing;
        const result = daemonResult(id, systemIndex, cpus, scenario.name);
        if (!result || result.kind !== 'task') return '-';
        const task = result as TaskResult;
        if (!task.stats) return `failed (${task.failed} of ${task.failed + task.ok} runs)`;
        const rate = scenario.hasBytes && isNum(task.mbPerSec) ? ` · ${fmtInt(task.mbPerSec)} MiB/s` : '';
        return `${fmtMs(task.stats?.median)} ms${rate} · ${fmtCpuMs(task.cpuMsPerRun)} cpu-ms · ${fmtInt(task.resources?.heapMbMax)} MiB`;
      };
      blocks.push(`*${scenario.name}*`, table(daemonHeader, byDaemonSystem(cell)));
    }
  }
  return ['### Task scenarios (median wall clock · throughput · CPU per run · peak memory)', ...blocks].join('\n\n');
}

function daemonIdleTable(cpus: number): string {
  return [
    '### Resting memory (MiB, idle, lower is better)',
    table(
      daemonHeader,
      byDaemonSystem((id, systemIndex) => fmtInt(daemonVariant(id, systemIndex, cpus)?.idle?.heapMbMean)),
    ),
  ].join('\n\n');
}

function daemonCpuSection(cpus: number): string {
  return [
    `## ${cpus} ${cpus === 1 ? 'CPU' : 'CPUs'}`,
    daemonIdleTable(cpus),
    daemonTaskSection(cpus),
    daemonLoadSection(cpus),
  ].join('\n\n');
}

function daemonsMarkdown(): string {
  const gaps = loadScenarios
    .concat(taskFamilies.flatMap((family) => family.scenarios))
    .filter((scenario) => scenario.missingFrom.length > 0)
    .map(
      (scenario) =>
        `\`${scenario.name}\` is absent for ${scenario.missingFrom.map((id) => daemonLabel(id as DaemonId)).join(', ')}`,
    );

  return [
    '## Daemons compared',
    `${daemonIds.map((id) => withVersion(daemonLabel(id), daemonVersions[id])).join(', ')}. The daemon is the ` +
      'node agent that runs game servers: it serves the file manager and SFTP, streams archives, and reports system state. ' +
      'Scenarios are a mix of saturating request load and timed one-at-a-time tasks.',
    gaps.length > 0
      ? `Where a daemon cannot perform a scenario the suite skips it rather than recording a zero: ${gaps.join('; ')}.`
      : '',
    pendingNote(daemonPendingSystems),
    ...daemonCpuOptions.map(daemonCpuSection),
  ]
    .filter(Boolean)
    .join('\n\n');
}

// --------------------------------------------------------------- assembly

interface ExpandOptions {
  keepFrontmatter?: boolean;
}

/** Pulls the prose VitePress would render from a page, dropping its Vue machinery. */
function pageParts(source: string, options: ExpandOptions, heading: string, fallbackIntro: string) {
  const frontmatter = options.keepFrontmatter ? (source.match(FRONTMATTER_RE)?.[0] ?? '') : '';
  const body = source
    .replace(FRONTMATTER_RE, '')
    .replace(/<script setup(?:\s[^>]*)?>[\s\S]*?<\/script>\s*/g, '')
    .replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>\s*/g, '');

  const intro =
    body.match(new RegExp(`^#\\s+${heading}\\s*\r?\n+([\\s\\S]*?)\r?\n+<`, 'm'))?.[1]?.trim() ?? fallbackIntro;

  // Every ::: container in document order, not just Methodology: warning callouts and the
  // "how to read this" blocks carry caveats the tables below cannot express on their own.
  const callouts = [...body.matchAll(/^:::\s*(?:info|tip|warning|danger)\b[\s\S]*?\r?\n:::/gm)]
    .map((match) => match[0].replace(/\{\{\s*runDate\s*\}\}/g, runDate))
    .join('\n\n');

  return { frontmatter, body, intro, callouts };
}

/**
 * Replace the interactive body of `benchmarks.md` with static data tables built from the same typed
 * reports the charts read. This is what the Markdown/LLM copy of the page serves, so anything the
 * charts convey through UI affordances - caveats, capability gaps, pending systems - has to be
 * spelled out here too.
 */
export function expandBenchmarksMarkdown(source: string, options: ExpandOptions = {}): string {
  const { frontmatter, body, intro, callouts } = pageParts(
    source,
    options,
    'Panel benchmarks',
    'Performance results for the Calagopus panel, measured against five other panels on identical hardware.',
  );

  const detailedComparisons = body.match(/^##\s+Detailed comparisons\b[\s\S]*/m)?.[0]?.trim() ?? '';

  return `${[`${frontmatter}# Panel benchmarks`, intro, callouts, panelsMarkdown(), detailedComparisons]
    .filter(Boolean)
    .join('\n\n')}\n`;
}

/** The daemon counterpart; same contract, different dataset. */
export function expandDaemonBenchmarksMarkdown(source: string, options: ExpandOptions = {}): string {
  const { frontmatter, intro, callouts } = pageParts(
    source,
    options,
    'Daemon benchmarks',
    'Performance results for the Calagopus daemon, measured against Pterodactyl Wings and Pelican Wings on identical hardware.',
  );

  return `${[`${frontmatter}# Daemon benchmarks`, intro, callouts, daemonsMarkdown()].filter(Boolean).join('\n\n')}\n`;
}

/** Pages whose Vue body is replaced by generated tables. Both Markdown consumers look up here. */
export const MARKDOWN_EXPANDERS: Record<string, (source: string, options?: ExpandOptions) => string> = {
  [BENCHMARKS_PAGE]: expandBenchmarksMarkdown,
  [DAEMON_BENCHMARKS_PAGE]: expandDaemonBenchmarksMarkdown,
};
