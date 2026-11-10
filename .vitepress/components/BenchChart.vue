<script setup>
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';
import CollapsibleSection from './ui/CollapsibleSection.vue';

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
]);

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '320px' },
  categoryLabel: { type: String, default: 'System' },
  active: { type: Boolean, default: true },
});

const isDark = ref(false);
let observer = null;

onMounted(() => {
  const update = () => {
    isDark.value = document.documentElement.classList.contains('dark');
  };
  update();
  observer = new MutationObserver(update);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

const themedOption = computed(() => {
  const base = props.option;
  const text = isDark.value ? '#d4d4d4' : '#2a2a2a';
  const muted = isDark.value ? '#8a8a8a' : '#6a6a6a';
  const grid = isDark.value ? '#2a2a2a' : '#e8e6e1';
  const bg = isDark.value ? 'rgba(20,20,20,0.95)' : 'rgba(255,253,250,0.98)';

  return {
    ...base,
    backgroundColor: 'transparent',
    textStyle: { color: text, fontFamily: 'inherit' },
    tooltip: {
      ...base.tooltip,
      backgroundColor: bg,
      borderColor: grid,
      textStyle: { color: text, fontFamily: 'inherit' },
    },
    legend: base.legend ? { ...base.legend, textStyle: { color: text, fontFamily: 'inherit' } } : undefined,
    xAxis: applyAxisTheme(base.xAxis, muted, grid),
    yAxis: applyAxisTheme(base.yAxis, muted, grid),
    series: (base.series ?? []).map((s) => (s.label ? { ...s, label: { color: muted, ...s.label } } : s)),
  };
});

function applyAxisTheme(axis, muted, grid) {
  if (!axis) return axis;
  if (Array.isArray(axis)) return axis.map((a) => applyAxisTheme(a, muted, grid));
  return {
    ...axis,
    axisLabel: { color: muted, fontFamily: 'inherit', hideOverlap: true, ...axis.axisLabel },
    nameTextStyle: { color: muted, fontFamily: 'inherit', ...axis.nameTextStyle },
    axisLine: { lineStyle: { color: grid }, ...axis.axisLine },
    splitLine: { lineStyle: { color: grid, type: 'dashed' }, ...axis.splitLine },
  };
}

// The chart itself only exists after client-side ECharts rendering, so this
// table is the server-rendered (crawlable, screen-reader-accessible) copy of
// the same data.
const dataTable = computed(() => {
  const base = props.option;
  const yAxis = Array.isArray(base.yAxis) ? base.yAxis[0] : base.yAxis;
  const xAxis = Array.isArray(base.xAxis) ? base.xAxis[0] : base.xAxis;

  const horizontal = Array.isArray(yAxis?.data);
  const categories = (horizontal ? yAxis?.data : xAxis?.data) ?? [];
  const series = (base.series ?? []).filter((s) => Array.isArray(s.data));
  if (!categories.length || !series.length) return null;
  return { categories, series, unit: (horizontal ? xAxis?.name : yAxis?.name) ?? '' };
});

// cpu-ms values are fractions of a millisecond, so a flat toFixed(1) collapses every compiled
// target to "0.0" in the table search engines and LLM consumers actually read.
const fmtCell = (v) => {
  if (typeof v !== 'number') return 'no data';
  if (Number.isInteger(v)) return v.toLocaleString('en-US');
  return Math.abs(v) < 1 ? v.toPrecision(3) : v.toFixed(1);
};
</script>

<template>
  <div v-if="active" class="bench-chart" :style="{ height }">
    <v-chart :option="themedOption" :update-options="{ notMerge: true }" autoresize />
  </div>
  <CollapsibleSection v-if="dataTable" v-show="active" title="View this chart's data as a table" class="bench-data">
    <div class="m-table" data-flush>
      <table>
        <thead>
          <tr>
            <th scope="col">{{ categoryLabel }}</th>
            <th v-for="s in dataTable.series" :key="s.name" scope="col">
              {{ s.name }}<template v-if="dataTable.unit"> ({{ dataTable.unit }})</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cat, i) in dataTable.categories" :key="cat">
            <th scope="row">{{ cat }}</th>
            <td v-for="s in dataTable.series" :key="s.name">{{ fmtCell(s.data[i]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CollapsibleSection>
</template>

<style scoped>
.bench-chart {
  width: 100%;
  margin: 1rem 0;
}

.bench-data {
  margin: 0 0 0.6rem;
}

.bench-data th,
.bench-data td {
  text-align: right;
  font-feature-settings: 'tnum';
  white-space: nowrap;
}

.bench-data th[scope='row'],
.bench-data thead th:first-child {
  text-align: left;
  color: var(--vp-c-text-1);
}
</style>
