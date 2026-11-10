---
title: Daemon Benchmarks
description: 'Benchmarks of the Calagopus daemon against Pterodactyl and Pelican Wings: archive compression, file operations, directory listings, SFTP transfers, throughput, latency, and CPU cost.'
---

<script setup>
import { computed, ref } from 'vue'
import BenchChart from '../../../.vitepress/components/BenchChart.vue'
import Alert from '../../../.vitepress/components/ui/Alert.vue'
import Badge from '../../../.vitepress/components/ui/Badge.vue'
import Card from '../../../.vitepress/components/ui/Card.vue'
import SegmentedControl from '../../../.vitepress/components/ui/SegmentedControl.vue'
import {
  daemonChartSystems,
  daemonCpuOptions,
  daemonIds,
  daemonPendingSystems,
  daemonScenarios,
  daemonVersions,
  daemons,
  loadScenarios,
  taskFamilies,
} from '../../../.vitepress/data/benchmarks/daemon-data.ts'

const ARCHIVE_HEADLINES = [
  'compress 1 GiB tree (tar.gz)',
  'compress 50k small files tree (tar.gz)',
  'decompress 1 GiB archive (zip)',
]

const archiveScenarios = ARCHIVE_HEADLINES
  .map((name) => daemonScenarios.find((s) => s.name === name))
  .filter(Boolean)

const selectedCpus = ref(daemonCpuOptions[daemonCpuOptions.length - 1])
const selectedSystem = ref(0)
const selectedArchive = ref(archiveScenarios[0]?.name)
const archiveStat = ref('median')
const selectedLoad = ref(loadScenarios[0]?.name)

const systemLabels = daemonChartSystems.map((s) => s.shortName)
const chartHeight = `${systemLabels.length * (daemonIds.length * 15 + 16) + 44}px`

const fmtK = (v) => v >= 10000 ? `${Math.floor(v / 1000)}k` : Math.round(v).toLocaleString('en-US')
const fmtMs = (v) => v == null ? '-' : v >= 10 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)
const fmtCpuMs = (v) => v == null ? '-' : v >= 10 ? v.toFixed(0) : v.toFixed(3)
const fmtInt = (v) => Math.round(v).toString()

const variantOf = (id, i) => daemons[id].systems[i]?.report.variants
  .find((v) => v.limit.cpus === selectedCpus.value)

const resultOf = (id, i, name) => variantOf(id, i)?.results.find((r) => r.scenario.name === name)

const seriesFor = (name, pick) => Object.fromEntries(daemonIds.map((id) => [
  id,
  daemonChartSystems.map((_, i) => {
    const r = resultOf(id, i, name)
    return r ? (pick(r) ?? null) : null
  }),
]))

const chart = (m, axis, format, label) => ({
  grid: { left: 8, right: 64, top: 8, bottom: 28, containLabel: true },
  yAxis: {
    type: 'category',
    data: systemLabels,
    inverse: true,
    axisTick: { show: false },
    axisLabel: { fontFamily: 'ui-monospace, monospace', fontSize: 11 },
  },
  xAxis: { type: 'value', name: axis },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : format(v) },
  series: daemonIds.map((id) => ({
    name: daemons[id].name,
    type: 'bar',
    data: m[id],
    color: daemons[id].color,
    barMaxWidth: 12,
    itemStyle: { borderRadius: [0, 3, 3, 0] },
    label: {
      show: true,
      position: 'right',
      distance: 6,
      fontSize: 10,
      fontFamily: 'ui-monospace, monospace',
      formatter: (p) => typeof p.value === 'number' ? label(p.value) : '',
    },
  })),
})

const archiveCharts = computed(() => archiveScenarios.map((s) => ({
  name: s.name,
  median: chart(seriesFor(s.name, (r) => r.stats?.median), 'ms', v => `${fmtMs(v)} ms`, fmtMs),
  rate: chart(seriesFor(s.name, (r) => r.mbPerSec), 'MiB/s', v => `${Math.round(v)} MiB/s`, fmtInt),
})))

const loadCharts = computed(() => loadScenarios.map((s) => ({
  name: s.name,
  rps: chart(seriesFor(s.name, (r) => r.throughput), 'req/s', v => `${Math.round(v).toLocaleString()} req/s`, fmtK),
  latMean: chart(seriesFor(s.name, (r) => r.latency?.mean), 'ms', v => `${v.toFixed(1)} ms`, fmtMs),
  cpuCost: chart(seriesFor(s.name, (r) => r.cpuMsPerRequest), 'cpu-ms', v => `${fmtCpuMs(v)} cpu-ms`, fmtCpuMs),
  peakMem: chart(seriesFor(s.name, (r) => r.resources?.heapMbMax), 'MiB', v => `${Math.round(v)} MiB`, fmtInt),
})))

const idleMem = computed(() => chart(
  Object.fromEntries(daemonIds.map((id) => [
    id,
    daemonChartSystems.map((_, i) => variantOf(id, i)?.idle?.heapMbMean ?? null),
  ])),
  'MiB',
  v => `${Math.round(v)} MiB`,
  fmtInt,
))

const taskTables = computed(() => taskFamilies.map((family) => ({
  label: family.label,
  rows: family.scenarios.map((s) => ({
    name: s.name,
    cells: daemonIds.map((id) => {
      if (s.missingFrom.includes(id)) return { id, unsupported: true, text: 'not supported' }
      const r = resultOf(id, selectedSystem.value, s.name)
      if (!r || r.kind !== 'task') return { id, text: '-' }
      if (!r.stats) return { id, unsupported: true, text: 'failed', sub: [`${r.failed} of ${r.failed + r.ok} runs failed`] }
      const rate = s.hasBytes && typeof r.mbPerSec === 'number' ? `${Math.round(r.mbPerSec)} MiB/s` : null
      return {
        id,
        text: `${fmtMs(r.stats?.median)} ms`,
        sub: [rate, `${fmtCpuMs(r.cpuMsPerRun)} cpu-ms`, `${Math.round(r.resources?.heapMbMax ?? 0)} MiB`]
          .filter(Boolean),
      }
    }),
  })),
})))

const gaps = daemonScenarios
  .filter((s) => s.missingFrom.length > 0)
  .map((s) => ({ name: s.name, who: s.missingFrom.map((id) => daemons[id].name).join(', ') }))

</script>

# Daemon benchmarks

Performance results for the Calagopus daemon, measured against Pterodactyl Wings and Pelican Wings on identical hardware. The daemon is the node agent that runs game servers: it serves the file manager and SFTP, streams archives, and reports system state. These numbers measure the daemon's own work, not how the game servers it manages perform; the daemon affects those servers only through the CPU and memory it takes from the same node.

For the web panel and its API, see [panel benchmarks](./benchmarks.md).

<div class="toolbar">
  <div class="toolbar-row">
    <div class="filter-chips">
      <Badge v-for="id in daemonIds" :key="id" variant="dot" size="lg" :dot-color="daemons[id].color">{{ daemons[id].name }}</Badge>
    </div>
    <div class="segmented">
      <span class="segmented-label">CPU limit</span>
      <SegmentedControl v-model="selectedCpus" :data="daemonCpuOptions" size="xs" aria-label="CPU limit" />
    </div>
  </div>
</div>
<p class="panel-hint lead-hint">Archive and file work comes first, since those are the operations users wait on. Dots match the bar colours. <a href="#test-setup">How this was measured</a></p>

<Alert v-if="daemonPendingSystems.length" title="Re-run in progress" class="pending-note">
  {{ daemonPendingSystems.map((s) => s.name).join(', ') }}
  {{ daemonPendingSystems.length === 1 ? 'has' : 'have' }} not been re-measured on this run yet and
  {{ daemonPendingSystems.length === 1 ? 'is' : 'are' }} not charted below.
</Alert>

## Archive performance

<Card class="chart-card">
  <div class="chart-cap">
    <SegmentedControl v-model="archiveStat" :data="[{ value: 'median', label: 'wall clock' }, { value: 'rate', label: 'throughput' }]" size="xs" aria-label="Archive statistic" />
    <SegmentedControl v-model="selectedArchive" :data="archiveScenarios.map((s) => s.name)" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">{{ archiveStat === 'median' ? '↓ Lower is better - median wall clock for one run.' : '↑ Higher is better - bytes processed per second.' }}</p>
  <template v-for="s in archiveCharts" :key="`arc-${s.name}`">
    <BenchChart :option="s.median" :height="chartHeight" :active="s.name === selectedArchive && archiveStat === 'median'" />
    <BenchChart :option="s.rate" :height="chartHeight" :active="s.name === selectedArchive && archiveStat === 'rate'" />
  </template>
</Card>

::: tip Where the archive difference comes from
Mostly the deflate implementation: Calagopus uses zlib-ng and splits the work across a small thread pool (`api.file_compression_threads`), where both Wings builds run pgzip on one thread.
:::

## File operations

<div class="table-controls">
  <p class="panel-hint">Every task scenario, timed one at a time. Median wall clock, with transfer rate, CPU cost per run and peak memory underneath.</p>
  <SegmentedControl v-model="selectedSystem" :data="daemonChartSystems.map((sys, i) => ({ value: i, label: sys.shortName }))" size="xs" aria-label="System" />
</div>

<div class="task-family" v-for="family in taskTables" :key="family.label">
  <p class="caveat-head">{{ family.label }}</p>
  <div class="m-table">
    <table class="task-table">
      <thead>
        <tr>
          <th scope="col">Scenario</th>
          <th v-for="id in daemonIds" :key="id" scope="col">{{ daemons[id].name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in family.rows" :key="row.name">
          <th scope="row"><code>{{ row.name }}</code></th>
          <td v-for="cell in row.cells" :key="cell.id" :class="{ unsupported: cell.unsupported }">
            <span class="task-main">{{ cell.text }}</span>
            <span v-if="cell.sub" class="task-sub"><span v-for="part in cell.sub" :key="part" class="task-part">{{ part }}</span></span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

## Memory

<Card class="chart-card">
  <div class="chart-cap"><span>Resting (idle)</span></div>
  <p class="chart-sub">↓ Lower is better - footprint with no traffic, sampled before the run.</p>
  <BenchChart :option="idleMem" :height="chartHeight" />
</Card>

<Card class="chart-card">
  <div class="chart-cap">
    <span>Peak while serving</span>
    <SegmentedControl v-model="selectedLoad" :data="loadScenarios.map((s) => s.name)" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">↓ Lower is better - peak footprint while serving this scenario.</p>
  <BenchChart v-for="s in loadCharts" :key="`mem-${s.name}`" :option="s.peakMem" :height="chartHeight" :active="s.name === selectedLoad" />
</Card>

## Request scenarios

::: tip Why this matters on shared hosting
The daemon competes with your game servers for the same CPU. A game server that misses its CPU time drops ticks instead of slowing down gradually, so how cheaply the daemon handles each operation matters more than its peak throughput.
:::

### Throughput

<Card class="chart-card">
  <div class="chart-cap">
    <span>Requests per second</span>
    <SegmentedControl v-model="selectedLoad" :data="loadScenarios.map((s) => s.name)" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">↑ Higher is better - more requests served per second.</p>
  <BenchChart v-for="s in loadCharts" :key="`rps-${s.name}`" :option="s.rps" :height="chartHeight" :active="s.name === selectedLoad" />
</Card>

### Average latency

<Card class="chart-card">
  <div class="chart-cap">
    <span>Mean response time</span>
    <SegmentedControl v-model="selectedLoad" :data="loadScenarios.map((s) => s.name)" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">↓ Lower is better - faster average response.</p>
  <BenchChart v-for="s in loadCharts" :key="`lat-${s.name}`" :option="s.latMean" :height="chartHeight" :active="s.name === selectedLoad" />
</Card>

### CPU cost per request

<Card class="chart-card">
  <div class="chart-cap">
    <span>CPU time per response</span>
    <SegmentedControl v-model="selectedLoad" :data="loadScenarios.map((s) => s.name)" size="xs" aria-label="Scenario" />
  </div>
  <p class="chart-sub">↓ Lower is better - less CPU burned per response, with the idle floor removed.</p>
  <BenchChart v-for="s in loadCharts" :key="`cpu-${s.name}`" :option="s.cpuCost" :height="chartHeight" :active="s.name === selectedLoad" />
</Card>

## Test setup

::: info Methodology
All three daemons run from their official `:latest` Docker images with no configuration beyond initial setup, driven by our open-source [benchmarking suite](https://github.com/calagopus/benchmarking) at CPU limits of 1, 2, 4 and 8 CPUs.

**Request scenarios** hold 384 concurrent connections for 10 seconds after a 1-second warmup and report throughput and latency from a single run. The suite defaults to 32 connections (8 for the 8 MiB download) and this run passed `-c 384`, so its README figures differ from these. **Task scenarios** are timed one at a time, 5 times (10 for directory listings and SFTP logins) after a warmup run, and report the median. The gap between a cell's fastest and slowest run is typically 9% of its median and above 17% for a quarter of the cells, so treat task gaps under about 20% as ties.

**Files live on a tmpfs.** Each daemon's data and temp directories are RAM-backed, and fixtures are copied in before each task outside the timed window, so writes never reach a disk and fsync costs nothing. File tasks therefore measure the daemon rather than the drive: archive and listing tasks compare codecs and serialisation, not disk reads. On an HDD, a network volume or a cold cache, storage would dominate and the gaps would shrink.

**SFTP scenarios** use the OpenSSH `sftp` client in batch mode with `aes128-gcm@openssh.com` and an ed25519 key. Transfers and listings share one multiplexed connection, so they exclude the handshake; `sftp login` opens a fresh connection each run, which includes the daemon's key check against the suite's mock panel API.

Memory is anonymous memory (`anon`), excluding page cache and slab. Shared memory is left out because on a tmpfs it is just the file pages the daemon wrote. `cpu-ms` is CPU time per request or task run with the idle floor subtracted, and lower is better.
:::

### Daemons tested

<div class="panel-strip wide">
  <Card v-for="id in daemonIds" :key="id" padding="xs" class="panel-chip">
    <span class="chip-dot" :style="{ background: daemons[id].color }"></span>
    <img :src="daemons[id].icon" :alt="''" height="16" />
    <span class="chip-name">{{ daemons[id].name }}</span>
    <code v-if="daemonVersions[id]" class="chip-version">{{ daemonVersions[id] }}</code>
  </Card>
</div>

<Card v-if="gaps.length" class="caveats">
  <p class="caveat-head">Capability gaps</p>
  <p class="caveat">Where a daemon cannot perform a scenario the suite skips it rather than recording a zero, so these are missing features, not missing measurements.</p>
  <p v-for="gap in gaps" :key="gap.name" class="caveat">
    <code>{{ gap.name }}</code> is not supported by {{ gap.who }}
  </p>
</Card>

## Data

::: info Where the numbers come from
Every figure here comes from the suite's JSON reports (`pnpm run bench <target> --json`), checked into the [site repository](https://github.com/calagopus/website/tree/main/.vitepress/data/benchmarks/daemons) as one typed file per daemon and system, with each scenario's load profile, sampled CPU and memory, and the suite's notes. The import script rounds to three decimals and drops per-run timings and failure strings. The reports record each daemon's self-reported version, but not the suite commit or image digests.
:::

<div class="data-grid">
  <div v-for="id in daemonIds" :key="id" class="data-col">
    <p class="caveat-head">{{ daemons[id].name }}</p>
    <a
      v-for="sys in daemonChartSystems"
      :key="sys.id"
      class="data-link"
      :href="`https://github.com/calagopus/website/blob/main/.vitepress/data/benchmarks/daemons/${id}/${sys.id}.ts`"
      target="_blank"
      rel="noopener"
    >{{ sys.name }}</a>
  </div>
</div>

<style scoped src="../../../.vitepress/theme/benchmarks.css"></style>

<style scoped>
.toolbar-row {
  flex-wrap: wrap;
  margin-top: 0;
}

.lead-hint {
  margin-top: 0.8rem;
}

.panel-strip.wide {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

@media (max-width: 640px) {
  .filter-chips {
    display: flex;
  }
  .toolbar-row {
    justify-content: space-between;
  }
}

.task-family {
  margin: 1.4rem 0;
}

.task-table th,
.task-table td {
  text-align: right;
  white-space: nowrap;
  font-feature-settings: 'tnum';
}

.task-table th[scope='row'] {
  text-align: left;
  font-weight: 400;
  white-space: normal;
  min-width: 9rem;
}

.task-table th[scope='row'] code {
  font-size: 0.75rem;
}

.task-table thead th {
  text-align: right;
  color: var(--vp-c-text-1);
}

.task-table thead th:first-child {
  text-align: left;
}

.task-main {
  display: block;
  color: var(--vp-c-text-1);
}

.task-sub {
  display: block;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  white-space: normal;
}

.task-part {
  display: block;
  white-space: nowrap;
}

.task-table td.unsupported .task-main {
  color: var(--vp-c-text-3);
  font-style: italic;
}

@media (max-width: 720px) {
  .task-table {
    font-size: 0.72rem;
  }
  .task-table th,
  .task-table td {
    padding: 0.35rem 0.45rem;
  }
  .task-table th[scope='row'] {
    white-space: normal;
    min-width: 8.5rem;
  }
  .task-table th[scope='row'] code {
    white-space: normal;
    word-break: break-word;
  }
}
</style>
