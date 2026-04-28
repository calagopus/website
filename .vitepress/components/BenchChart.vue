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
      ...(base.tooltip || {}),
      backgroundColor: bg,
      borderColor: grid,
      textStyle: { color: text, fontFamily: 'inherit' },
    },
    legend: base.legend ? { ...base.legend, textStyle: { color: text, fontFamily: 'inherit' } } : undefined,
    xAxis: applyAxisTheme(base.xAxis, text, muted, grid),
    yAxis: applyAxisTheme(base.yAxis, text, muted, grid),
  };
});

function applyAxisTheme(axis, text, muted, grid) {
  if (!axis) return axis;
  if (Array.isArray(axis)) return axis.map((a) => applyAxisTheme(a, text, muted, grid));
  return {
    ...axis,
    axisLabel: { color: muted, fontFamily: 'inherit', ...(axis.axisLabel || {}) },
    nameTextStyle: { color: muted, fontFamily: 'inherit', ...(axis.nameTextStyle || {}) },
    axisLine: { lineStyle: { color: grid }, ...(axis.axisLine || {}) },
    splitLine: { lineStyle: { color: grid, type: 'dashed' }, ...(axis.splitLine || {}) },
  };
}
</script>

<template>
  <div class="bench-chart" :style="{ height }">
    <v-chart :option="themedOption" autoresize />
  </div>
</template>

<style scoped>
.bench-chart {
  width: 100%;
  margin: 1rem 0;
}
</style>
