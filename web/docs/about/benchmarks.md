---
title: Panel Benchmarks
description: 'Benchmarks of the Calagopus panel against Pterodactyl, Pelican, PufferPanel, FeatherPanel, and Hydrodactyl: throughput, latency, memory, and CPU on identical hardware.'
---

<script setup>
import { computed, ref } from 'vue'
import BenchChart from '../../../.vitepress/components/BenchChart.vue'
import Alert from '../../../.vitepress/components/ui/Alert.vue'
import Badge from '../../../.vitepress/components/ui/Badge.vue'
import Card from '../../../.vitepress/components/ui/Card.vue'
import SegmentedControl from '../../../.vitepress/components/ui/SegmentedControl.vue'
import {
  chartSystems,
  cpuOptions,
  panelIds,
  panelVersions,
  panels,
  pendingSystems,
  runDate,
  scenarios,
} from '../../../.vitepress/data/benchmarks/index.ts'

const CLEAN_SCENARIO = 'settings (unauth)'

const active = ref(new Set(panelIds))
const selectedCpus = ref(cpuOptions[cpuOptions.length - 1])
const selectedScenario = ref(CLEAN_SCENARIO)
const latencyStat = ref('mean')
const loadMemStat = ref('peak')

const toggle = (id) => {
  const next = new Set(active.value)
  if (next.has(id)) {
    if (next.size > 1) next.delete(id)
  } else {
    next.add(id)
  }
  active.value = next
}

const activeIds = computed(() => panelIds.filter((id) => active.value.has(id)))

const systemLabels = chartSystems.map((s) => s.shortName)

const fmtK = (v) => v >= 10000 ? `${Math.floor(v / 1000)}k` : Math.round(v).toLocaleString()
const fmtMs = (v) => v >= 10 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)
const fmtCpuMs = (v) => v == null ? '-' : v >= 10 ? v.toFixed(0) : v.toFixed(3)
const fmtMib = (v) => Math.round(v).toString()

const variantAt = (id, i) =>
  panels[id].systems[i].report.variants.find((v) => v.limit.cpus === selectedCpus.value)

const seriesFor = (pick) => Object.fromEntries(activeIds.value.map((id) => [
  id,
  chartSystems.map((_, i) => {
    const v = variantAt(id, i)
    return v ? pick(v) : null
  }),
]))

const baseHorizontal = (labels, extra = {}) => ({
  grid: { left: 8, right: 64, top: 8, bottom: 28, containLabel: true, ...extra.grid },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  yAxis: {
    type: 'category',
    data: labels,
    inverse: true,
    axisTick: { show: false },
    axisLabel: { fontFamily: 'ui-monospace, monospace', fontSize: 11 },
  },
  ...extra,
})

const bars = (m, ids, meta, fmt) => ids.map((id) => ({
  name: meta[id].name,
  type: 'bar',
  data: m[id],
  color: meta[id].color,
  barMaxWidth: 12,
  itemStyle: { borderRadius: [0, 3, 3, 0] },
  label: {
    show: true,
    position: 'right',
    distance: 6,
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
    formatter: (p) => typeof p.value === 'number' ? fmt(p.value) : '',
  },
}))

const panelBars = (m, fmt) => bars(m, activeIds.value, panels, fmt)

const memChart = (m) => baseHorizontal(systemLabels, {
  xAxis: { type: 'value', name: 'MiB' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${Math.round(v)} MiB` },
  series: panelBars(m, fmtMib),
})

const rpsChart = (m) => baseHorizontal(systemLabels, {
  xAxis: { type: 'value', name: 'req/s', axisLabel: { formatter: v => v >= 1000 ? `${v/1000}k` : v } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${Math.round(v).toLocaleString()} req/s` },
  series: panelBars(m, fmtK),
})

const latChart = (m) => baseHorizontal(systemLabels, {
  xAxis: { type: 'value', name: 'ms' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v.toFixed(1)} ms` },
  series: panelBars(m, fmtMs),
})

const cpuCostChart = (m) => baseHorizontal(systemLabels, {
  xAxis: { type: 'value', name: 'cpu-ms' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v < 10 ? v.toFixed(3) : v.toFixed(0)} cpu-ms` },
  series: panelBars(m, fmtCpuMs),
})

const cleanResult = (id, i) => variantAt(id, i)?.results.find((r) => r.scenario.name === CLEAN_SCENARIO)

const cleanSeries = (pick) => Object.fromEntries(activeIds.value.map((id) => [
  id,
  chartSystems.map((_, i) => pick(cleanResult(id, i)) ?? null),
]))

const memMean = computed(() => memChart(cleanSeries((r) => r?.resources?.heapMbMean)))
const memPeak = computed(() => memChart(cleanSeries((r) => r?.resources?.heapMbMax)))
const idleMem = computed(() => memChart(Object.fromEntries(activeIds.value.map((id) => [
  id,
  chartSystems.map((_, i) => variantAt(id, i)?.idle?.heapMbMean ?? null),
]))))

const scenarioCharts = computed(() => scenarios.map((name) => {
  const result = (v) => v.results.find((r) => r.scenario.name === name)
  return {
    name,
    rps: rpsChart(seriesFor((v) => result(v)?.throughput ?? null)),
    latMean: latChart(seriesFor((v) => result(v)?.latency?.mean ?? null)),
    latP99: latChart(seriesFor((v) => result(v)?.latency?.p99 ?? null)),
    cpuCost: cpuCostChart(seriesFor((v) => result(v)?.cpuMsPerRequest ?? null)),
  }
}))

const envStats = (i) => activeIds.value.flatMap((id) => {
  const results = panels[id].systems[i].report.variants.flatMap((v) => v.results)
  const cpu = Math.max(...results.map((r) => r.resources?.cpuPercentMax ?? 0))
  const mem = Math.max(...results.map((r) => r.resources?.heapMbMax ?? 0))
  return cpu > 0 || mem > 0
    ? [{
        id,
        name: panels[id].name,
        color: panels[id].color,
        cpu: cpu > 0 ? `${Math.round(cpu)}%` : '-',
        mem: mem > 0 ? `${Math.round(mem)} MiB` : '-',
      }]
    : []
})

const headlineNow = computed(() => {
  const per = (pick, mode) => Object.fromEntries(panelIds.map((id) => {
    const vals = chartSystems.map((_, i) => pick(cleanResult(id, i))).filter((x) => typeof x === 'number')
    return [id, vals.length ? (mode === 'max' ? Math.max(...vals) : Math.min(...vals)) : NaN]
  }))
  return {
    peakRps: per((r) => r?.throughput, 'max'),
    bestAvgLatencyMs: per((r) => r?.latency?.mean, 'min'),
    peakMemMb: per((r) => r?.resources?.heapMbMax, 'max'),
  }
})

const statRows = (values, better, fmt) => activeIds.value
  .map((id) => ({ id, name: panels[id].name, color: panels[id].color, value: fmt(values[id]) }))
  .sort((a, b) => better === 'high' ? values[b.id] - values[a.id] : values[a.id] - values[b.id])

const statCards = computed(() => [
  {
    label: 'peak throughput',
    value: fmtK(headlineNow.value.peakRps.calagopus),
    unit: 'req/s',
    rows: statRows(headlineNow.value.peakRps, 'high', fmtK),
  },
  {
    label: 'avg response',
    value: fmtMs(headlineNow.value.bestAvgLatencyMs.calagopus),
    unit: 'ms',
    rows: statRows(headlineNow.value.bestAvgLatencyMs, 'low', (v) => `${fmtMs(v)} ms`),
  },
  {
    label: 'peak memory',
    value: Math.round(headlineNow.value.peakMemMb.calagopus).toString(),
    unit: 'MiB',
    note: 'worst case under load',
    rows: statRows(headlineNow.value.peakMemMb, 'low', (v) => `${Math.round(v)} MiB`),
  },
])

const chartHeight = computed(() => `${systemLabels.length * (activeIds.value.length * 15 + 16) + 44}px`)
</script>

# Panel benchmarks

Performance results for the Calagopus panel, measured against five other panels on identical hardware. Each chart compares every panel across every test configuration.

For the node agent that runs game servers, see [daemon benchmarks](./daemon-benchmarks.md).

<div class="toolbar">
  <div class="filter-chips" role="group" aria-label="Toggle panels shown in the charts">
    <Badge
      v-for="id in panelIds"
      :key="id"
      component="button"
      type="button"
      variant="dot"
      size="lg"
      :dot-color="panels[id].color"
      class="filter-chip"
      :class="{ inactive: !active.has(id) }"
      :aria-pressed="active.has(id)"
      @click="toggle(id)"
    >{{ panels[id].name }}</Badge>
  </div>
  <div class="toolbar-row">
    <p class="panel-hint toolbar-hint">Click a panel to show or hide it. Dots match the bar colours.</p>
    <div class="segmented">
      <span class="segmented-label">CPU limit</span>
      <SegmentedControl v-model="selectedCpus" :data="cpuOptions" size="xs" aria-label="CPU limit" />
    </div>
  </div>
</div>

<div class="headline-stats">
  <Card v-for="card in statCards" :key="card.label" class="stat">
    <div class="stat-label">{{ card.label }} · {{ selectedCpus }}c</div>
    <div class="stat-value">{{ card.value }} <span>{{ card.unit }}</span></div>
    <div v-if="card.note" class="stat-note">{{ card.note }}</div>
    <div class="stat-sub">
      <div
        v-for="row in card.rows"
        :key="row.id"
        class="stat-row"
        :class="{ self: row.id === 'calagopus' }"
      >
        <i :style="{ background: row.color }"></i>
        <span class="stat-row-value">{{ row.value }}</span>
        <span class="stat-row-name">{{ row.name }}</span>
      </div>
    </div>
  </Card>
</div>
<p class="panel-hint">Headline figures come from <code>settings (unauth)</code>, the one scenario every panel answers with real <code>200</code>s. The authenticated scenarios are dominated by each panel's own rate limiting, so they are not comparable as throughput. <a href="#test-setup">How this was measured</a></p>

<Alert v-if="pendingSystems.length" title="Re-run in progress" class="pending-note">
  {{ pendingSystems.map((s) => s.name).join(', ') }}
  {{ pendingSystems.length === 1 ? 'has' : 'have' }} not been re-measured on this run yet and
  {{ pendingSystems.length === 1 ? 'is' : 'are' }} not charted below.
</Alert>

## Throughput

<Card class="chart-card">
  <div class="chart-cap">
    <span>Requests per second</span>
    <SegmentedControl v-model="selectedScenario" :data="scenarios" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">↑ Higher is better - more requests served per second.</p>
  <Alert v-if="selectedScenario !== CLEAN_SCENARIO" color="yellow" class="scenario-warn">Not a like-for-like comparison. Panels keep their default rate limiting, so most of them answer this scenario with <code>429</code>s or errors instead of real responses.</Alert>
  <BenchChart v-for="s in scenarioCharts" :key="`rps-${s.name}`" :option="s.rps" :height="chartHeight" :active="s.name === selectedScenario" />
</Card>

## Latency

<Card class="chart-card">
  <div class="chart-cap">
    <SegmentedControl v-model="latencyStat" :data="[{ value: 'mean', label: 'average' }, 'p99']" size="xs" aria-label="Latency statistic" />
    <SegmentedControl v-model="selectedScenario" :data="scenarios" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">↓ Lower is better - {{ latencyStat === 'mean' ? 'faster average response' : 'faster worst-case (p99) response' }}.</p>
  <Alert v-if="selectedScenario !== CLEAN_SCENARIO" color="yellow" class="scenario-warn">Not a like-for-like comparison. Panels keep their default rate limiting, so most of them answer this scenario with <code>429</code>s or errors instead of real responses.</Alert>
  <template v-for="s in scenarioCharts" :key="`lat-${s.name}`">
    <BenchChart :option="s.latMean" :height="chartHeight" :active="s.name === selectedScenario && latencyStat === 'mean'" />
    <BenchChart :option="s.latP99" :height="chartHeight" :active="s.name === selectedScenario && latencyStat === 'p99'" />
  </template>
</Card>

## CPU cost per request

<Card class="chart-card">
  <div class="chart-cap">
    <span>CPU time per response</span>
    <SegmentedControl v-model="selectedScenario" :data="scenarios" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">↓ Lower is better - less CPU burned per response, with the idle floor removed.</p>
  <Alert v-if="selectedScenario !== CLEAN_SCENARIO" color="yellow" class="scenario-warn">Not a like-for-like comparison. Panels keep their default rate limiting, so most of them answer this scenario with <code>429</code>s or errors instead of real responses.</Alert>
  <BenchChart v-for="s in scenarioCharts" :key="`cpu-${s.name}`" :option="s.cpuCost" :height="chartHeight" :active="s.name === selectedScenario" />
</Card>

::: tip Reading the CPU charts
On `settings (unauth)`, Calagopus spends 0.03 to 0.16 ms per request. Pterodactyl, Pelican and Hydrodactyl spend 7 to 153 ms, two to three orders of magnitude more, and FeatherPanel, the cheapest PHP panel, spends 0.26 to 3 ms. PufferPanel, the other compiled panel, is in the same class as Calagopus and slightly cheaper on all but three configurations.

This matters most when the panel shares a box with game servers. A game server runs under a hard CPU quota and a tick deadline, so time taken from it is lost rather than delayed. A PHP panel under load takes enough to notice. The [daemon](./daemon-benchmarks.md) always runs next to the game servers, so the same argument applies to it more strongly.
:::

## Memory

<Card class="chart-card">
  <div class="chart-cap"><span>Resting (idle)</span></div>
  <p class="chart-sub">↓ Lower is better - footprint with no traffic, sampled before the run.</p>
  <BenchChart :option="idleMem" :height="chartHeight" />
</Card>

<Card class="chart-card">
  <div class="chart-cap">
    <span>While serving load</span>
    <SegmentedControl v-model="loadMemStat" :data="['peak', 'mean']" size="xs" aria-label="Memory statistic" />
  </div>
  <p class="chart-sub">↓ Lower is better - {{ loadMemStat === 'peak' ? 'worst-case footprint' : 'average footprint across the run' }} on <code>settings (unauth)</code>.</p>
  <BenchChart :option="memPeak" :height="chartHeight" :active="loadMemStat === 'peak'" />
  <BenchChart :option="memMean" :height="chartHeight" :active="loadMemStat === 'mean'" />
</Card>

::: tip Reading the memory charts
The gap between the idle and peak charts is what a panel costs above its resting footprint. Calagopus stays within about 10 MiB of idle, and PufferPanel starts smaller and ends up in the same range. The PHP panels grow: on the Ryzen at eight CPUs, Pelican rests at 178 MiB and reaches 328 MiB under load.
:::

## Test setup

::: info Methodology
Every panel runs from its official `:latest` Docker image (as of {{ runDate }}) with no configuration beyond initial setup, driven by our open-source [benchmarking suite](https://github.com/calagopus/benchmarking). Each one is swept across CPU limits of 1, 2, 4 and 8 CPUs while its container's CPU and memory are sampled. Each scenario holds 384 concurrent connections for 10 seconds after a 1-second warmup (the suite defaults to 32; this run passed `-c 384`) against three endpoints: public settings, account details and the server list. Panels keep their default rate limiting, so the two authenticated endpoints mostly return `429`s and their throughput measures how fast a panel refuses. The load generator requests uncompressed responses, so a panel that compresses by default is not charged for it. This is a saturation test of each panel's fixed cost per request, so the ratios between panels compare overhead, not how many users a panel can serve.

Only the panel's own container is limited and measured. Databases and caches run unlimited and unmeasured, so work a panel pushes into them is free here.

Memory is `anon + shmem`, excluding page cache and slab. `cpu-ms` is CPU time per request with the idle floor subtracted. Unlike CPU percent, it keeps meaning something once a panel hits its quota, and lower is better.
:::

### Panels tested

<div class="panel-strip">
  <Card v-for="id in panelIds" :key="id" padding="xs" class="panel-chip">
    <span class="chip-dot" :style="{ background: panels[id].color }"></span>
    <img :src="panels[id].icon" :alt="''" height="16" />
    <span class="chip-name">{{ panels[id].name }}</span>
    <code v-if="panelVersions[id]" class="chip-version">{{ panelVersions[id] }}</code>
  </Card>
</div>

### Test environments

<div class="env-table">
  <details v-for="(sys, i) in chartSystems" :key="sys.id" class="env-item">
    <summary class="env-line">
      <span class="env-name">{{ sys.name }}</span>
      <span class="env-spec">{{ sys.cpu }} · {{ sys.ram }}</span>
    </summary>
    <div class="env-detail">
      <div class="env-stat-row env-stat-head">
        <i></i>
        <span>panel</span>
        <span>peak cpu</span>
        <span>peak mem</span>
      </div>
      <div v-for="row in envStats(i)" :key="row.id" class="env-stat-row">
        <i :style="{ background: row.color }"></i>
        <span class="env-stat-name">{{ row.name }}</span>
        <span class="env-stat-val">{{ row.cpu }}</span>
        <span class="env-stat-val">{{ row.mem }}</span>
      </div>
    </div>
  </details>
</div>
<p class="panel-hint">Expand a system for each panel's peaks, the highest values observed across all CPU configs and scenarios on that system.</p>

## Data

::: info Where the numbers come from
Every figure here comes from the suite's JSON reports (`pnpm run bench <target> --json`), checked into the [site repository](https://github.com/calagopus/website/tree/main/.vitepress/data/benchmarks/panels) as one typed file per panel and system, with each scenario's load profile, sampled CPU and memory, and the suite's notes. The import script rounds to three decimals and drops per-run timings and failure strings. The reports record each panel's self-reported version, but not the suite commit or image digests.
:::

<div class="data-grid">
  <div v-for="id in panelIds" :key="id" class="data-col">
    <p class="caveat-head">{{ panels[id].name }}</p>
    <a
      v-for="sys in chartSystems"
      :key="sys.id"
      class="data-link"
      :href="`https://github.com/calagopus/website/blob/main/.vitepress/data/benchmarks/panels/${id}/${sys.id}.ts`"
      target="_blank"
      rel="noopener"
    >{{ sys.name }}</a>
  </div>
</div>

## Detailed comparisons

Raw numbers are only part of the picture. For feature-by-feature breakdowns against specific panels, see [Calagopus vs Pterodactyl](/compare/calagopus-vs-pterodactyl), [Calagopus vs Pelican](/compare/calagopus-vs-pelican), and [Calagopus vs AMP](/compare/calagopus-vs-amp). For file-manager and archive performance, see [daemon benchmarks](./daemon-benchmarks.md).

<style scoped src="../../../.vitepress/theme/benchmarks.css"></style>

<style scoped>
.scenario-warn {
  margin: 0.4rem 0;
  padding: var(--mantine-spacing-xs) var(--mantine-spacing-sm);
}

.headline-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.9rem;
  margin: 1.2rem 0 1rem;
}

.stat {
  min-width: 0;
  padding: 0.9rem 1.1rem;
}

.stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(90deg, #14b8a6, #2dd4bf);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-feature-settings: 'tnum';
}

.stat-value span {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-left: 0.15rem;
}

.stat-note {
  margin-top: 0.15rem;
  font-size: 0.68rem;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
}
.stat-sub {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.5rem;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  line-height: 1.4;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.stat-row i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-row-value {
  font-feature-settings: 'tnum';
  min-width: 3.6em;
  color: var(--vp-c-text-2);
}

.stat-row-name {
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-row.self .stat-row-value,
.stat-row.self .stat-row-name {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.env-table {
  margin: 1.2rem 0 0.4rem;
  border: 1px solid var(--mantine-color-default-border);
  border-radius: var(--mantine-radius-md);
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 0.82rem;
}

/* Reset the VitePress .vp-doc details/summary theme styling. */
.env-item {
  interpolate-size: allow-keywords;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: var(--mantine-color-default);
}

.env-item::details-content {
  block-size: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    block-size 200ms ease,
    opacity 200ms ease,
    content-visibility 200ms allow-discrete;
}

.env-item[open]::details-content {
  block-size: auto;
  opacity: 1;
}

.env-item + .env-item {
  border-top: 1px solid var(--mantine-color-gray-3);
}

.dark .env-item + .env-item {
  border-top-color: var(--mantine-color-dark-4);
}

.env-line {
  display: grid;
  grid-template-columns: minmax(150px, auto) 1fr auto;
  align-items: center;
  gap: 0.4rem 1rem;
  margin: 0;
  padding: 0.55rem 0.9rem;
  font-weight: 400;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.env-line::-webkit-details-marker {
  display: none;
}

.env-line::after {
  content: '';
  justify-self: end;
  width: 0.75em;
  height: 0.75em;
  background-color: var(--mantine-color-gray-6);
  mask: var(--collapsible-chevron) center / contain no-repeat;
  transform: rotate(-90deg);
  transition: transform 150ms ease;
}

.env-item[open] .env-line::after {
  transform: rotate(0deg);
}

.env-line:hover .env-name {
  color: var(--vp-c-brand-1);
}

.env-name {
  font-weight: 700;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  transition: color 0.2s;
}

.env-spec {
  color: var(--vp-c-text-2);
  font-size: 0.76rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.env-detail {
  padding: 0.2rem 0.9rem 0.7rem;
}

.env-stat-row {
  display: grid;
  grid-template-columns: 10px 1fr 5.5rem 6.5rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.15rem 0;
  font-size: 0.76rem;
  color: var(--vp-c-text-2);
}

.env-stat-row i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.env-stat-head {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 0.3rem;
  margin-bottom: 0.2rem;
}

.env-stat-head span:nth-child(n + 3) {
  text-align: right;
}

.env-stat-name {
  color: var(--vp-c-text-1);
}

.env-stat-val {
  text-align: right;
  font-feature-settings: 'tnum';
}

@media (max-width: 640px) {
  .env-line {
    grid-template-columns: 1fr auto;
  }
  .env-spec {
    grid-column: 1 / -1;
  }
}
</style>
