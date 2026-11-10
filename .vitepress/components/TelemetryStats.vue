<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { formatCount } from '../lib/format.ts';
import BenchChart from './BenchChart.vue';
import Card from './ui/Card.vue';
import SegmentedControl from './ui/SegmentedControl.vue';

interface DayPoint {
  day: string;
  instances: number;
  servers: number;
  users: number;
  backups: number;
  nodes: number;
}

interface Stats {
  status: string;
  generated_at: string;
  window_hours: number;
  instances: number;
  totals: Record<string, number>;
}

interface History {
  status: string;
  range: string;
  daily: DayPoint[];
}

const API = 'https://calagopus.com/api/telemetry';

const RANGES = [
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: '1y', label: '1 year' },
  { id: 'all', label: 'All' },
];

const METRICS = [
  { id: 'instances', label: 'Panels reporting', unit: 'panels' },
  { id: 'servers', label: 'Game servers', unit: 'servers' },
  { id: 'nodes', label: 'Nodes', unit: 'nodes' },
  { id: 'backups', label: 'Backups', unit: 'backups' },
  { id: 'users', label: 'Users', unit: 'users' },
] as const;

const LINE_LIGHT = '#14b8a6';
const LINE_DARK = '#0d9488';

const stats = ref<Stats | null>(null);
const history = ref<History | null>(null);
const failed = ref(false);
const range = ref('90d');
const metric = ref<(typeof METRICS)[number]['id']>('instances');
const isDark = ref(false);

let observer: MutationObserver | null = null;

const line = computed(() => (isDark.value ? LINE_DARK : LINE_LIGHT));
const enough = computed(() => stats.value?.status === 'ok');
const activeMetric = computed(() => METRICS.find((entry) => entry.id === metric.value) ?? METRICS[0]);

async function loadHistory(): Promise<void> {
  const response = await fetch(`${API}/history?range=${range.value}`, { headers: { accept: 'application/json' } })
    .then((result) => (result.ok ? result.json() : null))
    .catch(() => null);

  if (response) history.value = response as History;
}

async function selectRange(id: string): Promise<void> {
  range.value = id;
  await loadHistory();
}

onMounted(async () => {
  const update = () => {
    isDark.value = document.documentElement.classList.contains('dark');
  };
  update();
  observer = new MutationObserver(update);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  const snapshot = await fetch(`${API}/stats`, { headers: { accept: 'application/json' } })
    .then((result) => (result.ok ? result.json() : null))
    .catch(() => null);

  if (!snapshot) {
    failed.value = true;
    return;
  }

  stats.value = snapshot as Stats;
  if (snapshot.status === 'ok') await loadHistory();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

const generated = computed(() => {
  if (!stats.value) return '';
  return new Date(stats.value.generated_at).toISOString().replace('T', ' ').slice(0, 16);
});

const tiles = computed(() => {
  const current = stats.value;
  if (!current) return [];

  const memory = current.totals.node_memory_bytes / 1024 ** 4;

  return [
    { value: formatCount(current.instances), label: `panels reporting in the last ${current.window_hours} hours` },
    { value: formatCount(current.totals.servers), label: 'game servers under management' },
    { value: formatCount(current.totals.nodes), label: 'nodes attached to those panels' },
    { value: `${memory.toFixed(memory >= 10 ? 0 : 1)} TiB`, label: 'memory across those nodes' },
  ];
});

const historyOption = computed(() => {
  const points = history.value?.daily ?? [];
  const chosen = activeMetric.value;

  return {
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      valueFormatter: (value: number) => `${formatCount(value)} ${chosen.unit}`,
    },
    xAxis: {
      type: 'category',
      data: points.map((point) => point.day),
      boundaryGap: false,
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: chosen.unit,
      axisLabel: { formatter: (value: number) => formatCount(value) },
    },
    series: [
      {
        name: chosen.label,
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 8,
        lineStyle: { width: 2, color: line.value },
        itemStyle: { color: line.value },
        areaStyle: { color: line.value, opacity: isDark.value ? 0.16 : 0.1 },
        data: points.map((point) => point[chosen.id]),
      },
    ],
  };
});
</script>

<template>
  <div class="telemetry">
    <div v-if="failed" class="warning custom-block">
      <p class="custom-block-title">Statistics unavailable</p>
      <p>The telemetry API could not be reached. Try again later.</p>
    </div>

    <div v-else-if="stats && !enough" class="tip custom-block">
      <p class="custom-block-title">Not enough data yet</p>
      <p>
        Too few panels are reporting to publish a total without singling anyone out. This page fills in once enough of
        them do.
      </p>
    </div>

    <p v-else-if="!stats" class="loading">Loading statistics…</p>

    <template v-else>
      <div class="tiles">
        <Card v-for="tile in tiles" :key="tile.label">
          <div class="tile-value">{{ tile.value }}</div>
          <div class="tile-label">{{ tile.label }}</div>
        </Card>
      </div>

      <p class="generated">
        Aggregated {{ generated }} UTC · counts are rounded · every figure covers only panels with telemetry left on.
      </p>

      <div class="filters">
        <SegmentedControl
          v-model="metric"
          :data="METRICS.map((entry) => ({ value: entry.id, label: entry.label }))"
          aria-label="Metric"
        />
        <SegmentedControl
          :model-value="range"
          :data="RANGES.map((entry) => ({ value: entry.id, label: entry.label }))"
          aria-label="Time range"
          @update:model-value="selectRange"
        />
      </div>

      <p class="chart-title">{{ activeMetric.label }}, daily</p>
      <BenchChart :option="historyOption" height="320px" />
    </template>
  </div>
</template>

<style scoped>
.telemetry {
  margin-top: 24px;
}

.loading {
  color: var(--vp-c-text-3);
}

.tiles {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .tiles {
    grid-template-columns: repeat(4, 1fr);
  }
}

.tile-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--vp-c-brand-1);
}

.tile-label {
  margin-top: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.generated {
  margin-top: 12px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 24px 0 16px;
}

.chart-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
</style>
