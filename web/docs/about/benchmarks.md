<script setup>
import BenchChart from '../../../.vitepress/components/BenchChart.vue'

const C = '#14b8a6'
const P = '#d97706'

const servers = [
  '9900X · 4t · 4G',
  '9900X · 8t · 4G',
  '9900X · 16t · 4G',
  'EPYC 7443P · 4t · 4G',
  'EPYC 7443P · 8t · 4G',
  'EPYC 7443P · 16t · 4G',
  '2× E5-2680v2 · 4t · 4G',
  '2× E5-2680v2 · 8t · 4G',
  '2× E5-2680v2 · 16t · 4G',
  'Altra Q80-30 · 4t · 4G',
  'Altra Q80-30 · 8t · 4G',
  'Altra Q80-30 · 16t · 4G',
]

const indicator = (text) => ({
  type: 'text',
  right: 12,
  top: 8,
  style: {
    text,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10,
    fill: '#888',
    opacity: 0.7,
  },
})

const baseHorizontal = (direction, extra = {}) => ({
  grid: { left: 170, right: 30, top: 44, bottom: 40, ...extra.grid },
  legend: { top: 4, left: 8, icon: 'roundRect', itemWidth: 12, itemHeight: 12 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  graphic: [indicator(direction === 'up' ? '↑ higher is better' : '↓ lower is better')],
  yAxis: {
    type: 'category',
    data: servers,
    inverse: true,
    axisTick: { show: false },
    axisLabel: { fontFamily: 'ui-monospace, monospace', fontSize: 11 },
  },
  ...extra,
})

const calBar = (data) => ({
  name: 'Calagopus',
  type: 'bar',
  data,
  color: C,
  barMaxWidth: 16,
  itemStyle: { borderRadius: [0, 3, 3, 0] },
})

const ptlBar = (data) => ({
  name: 'Pterodactyl',
  type: 'bar',
  data,
  color: P,
  barMaxWidth: 16,
  itemStyle: { borderRadius: [0, 3, 3, 0] },
})

const memPeak = baseHorizontal('down', {
  xAxis: { type: 'value', name: 'MiB' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v} MiB` },
  series: [
    calBar([273, 260, 251, 261, 274, 284, 188, 188, 210, 279, 178, 171]),
    ptlBar([968, 1270, 1116, 750, 1100, 1023, 414, 470, 535, 705, 717, 760]),
  ],
})

const memIdle = baseHorizontal('down', {
  xAxis: { type: 'value', name: 'MiB' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v} MiB` },
  series: [
    calBar([150, 150, 150, 159, 159, 159, 150, 150, 150, 138, 138, 138]),
    ptlBar([300, 300, 300, 305, 305, 305, 216, 216, 216, 345, 345, 345]),
  ],
})

const rpsRoot = baseHorizontal('up', {
  xAxis: { type: 'value', name: 'req/s', axisLabel: { formatter: v => v >= 1000 ? `${v/1000}k` : v } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v.toLocaleString()} req/s` },
  series: [
    calBar([111272, 181350, 263828, 31226, 79993, 146558, 21607, 45191, 68425, 18411, 10310, 7795]),
    ptlBar([577, 799, 722, 485, 670, 605, 161, 318, 196, 336, 363, 384]),
  ],
})

const rpsApi = baseHorizontal('up', {
  xAxis: { type: 'value', name: 'req/s', axisLabel: { formatter: v => v >= 1000 ? `${v/1000}k` : v } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v.toLocaleString()} req/s` },
  series: [
    calBar([110005, 183122, 260129, 28784, 54853, 75518, 14403, 24801, 24091, 8112, 5402, 3788]),
    ptlBar([304, 730, 658, 240, 575, 518, 141, 258, 169, 282, 316, 346]),
  ],
})

const latAvgRoot = baseHorizontal('down', {
  xAxis: { type: 'value', name: 'ms' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v} ms` },
  series: [
    calBar([4.5, 2.8, 1.9, 16.0, 6.2, 3.4, 23.1, 11.1, 7.3, 27.1, 48.5, 64.1]),
    ptlBar([872, 627, 693, 1045, 750, 831, 3182, 1589, 2599, 1499, 1384, 1307]),
  ],
})

const latAvgApi = baseHorizontal('down', {
  xAxis: { type: 'value', name: 'ms' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v} ms` },
  series: [
    calBar([4.5, 2.7, 1.9, 17.4, 9.1, 6.6, 34.7, 20.2, 20.7, 61.6, 92.6, 132.1]),
    ptlBar([1664, 688, 763, 2110, 875, 972, 3628, 1963, 3028, 1789, 1591, 1449]),
  ],
})

const latP99Root = baseHorizontal('down', {
  xAxis: { type: 'value', name: 'ms' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v} ms` },
  series: [
    calBar([12.0, 7.8, 5.7, 41.3, 16.9, 8.7, 58.8, 31.5, 15.6, 62.5, 139.8, 194.8]),
    ptlBar([1135, 854, 1105, 1360, 1025, 1019, 3432, 1836, 2985, 1965, 2177, 2051]),
  ],
})

const latP99Api = baseHorizontal('down', {
  xAxis: { type: 'value', name: 'ms' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v} ms` },
  series: [
    calBar([12.2, 7.8, 5.8, 33.6, 19.0, 11.8, 64.0, 59.0, 67.5, 95.1, 175.9, 230.5]),
    ptlBar([2648, 935, 1052, 3360, 1190, 1337, 3920, 2204, 3449, 2347, 2440, 2256]),
  ],
})

const chartHeight = (servers.length * 36 + 100) + 'px'
</script>

# Benchmarks

Performance results for Calagopus, measured against Pterodactyl on identical hardware. Each chart compares both panels across every test configuration.

<div class="headline-stats">
  <div class="stat">
    <div class="stat-label">peak throughput</div>
    <div class="stat-value">263k <span>req/s</span></div>
    <div class="stat-sub">
      <div>Calagopus</div>
      <div><s>799</s> Pterodactyl</div>
    </div>
  </div>
  <div class="stat">
    <div class="stat-label">avg response</div>
    <div class="stat-value">1.9 <span>ms</span></div>
    <div class="stat-sub">
      <div>Calagopus</div>
      <div><s>627 ms</s> Pterodactyl</div>
    </div>
  </div>
  <div class="stat">
    <div class="stat-label">idle memory</div>
    <div class="stat-value">138 <span>MiB</span></div>
    <div class="stat-sub">
      <div>Calagopus</div>
      <div><s>216 MiB</s> Pterodactyl</div>
    </div>
  </div>
</div>

::: tip Methodology
Tests use Calagopus `1.0.4` and Pterodactyl `1.12.2`, both running from their official Docker images with no additional configuration beyond initial setup. Each test ran [`oha`](https://github.com/hatoo/oha) with 500 concurrent connections for 60 seconds, from a separate machine on the same LAN over a 10 Gbps link. Two endpoints were targeted: the panel root (`/`) and an authenticated API endpoint (`/api/client/permissions`). Both panels used default rate limiting; the high `[429]` counts on the API endpoint are expected.

Configurations are labeled `<CPU> · <threads>t · <RAM>G`. Memory figures come from Proxmox LXC container stats (the Docker container runs inside the LXC).
:::

## Test environments

<div class="env-grid">
  <div class="env">
    <div class="env-name">Ryzen 9 9900X</div>
    <div class="env-row"><span>CPU</span><span>AMD Ryzen 9 9900X</span></div>
    <div class="env-row"><span>RAM</span><span>DDR5-6000</span></div>
    <div class="env-row"><span>Storage</span><span>RAID 1 NVMe</span></div>
    <div class="env-row"><span>Kernel</span><span>Linux 6.17.4-2-pve</span></div>
    <div class="cpu-stats">
      <span>c7s idle</span><span>0.05%</span>
      <span>c7s peak</span><span>78&ndash;90%</span>
      <span>ptero peak</span><span>56&ndash;97%</span>
    </div>
  </div>
  <div class="env">
    <div class="env-name">EPYC 7443P</div>
    <div class="env-row"><span>CPU</span><span>AMD EPYC 7443P</span></div>
    <div class="env-row"><span>RAM</span><span>DDR4-2666</span></div>
    <div class="env-row"><span>Storage</span><span>RAID 1 NVMe</span></div>
    <div class="env-row"><span>Kernel</span><span>Linux 6.17.4-2-pve</span></div>
    <div class="cpu-stats">
      <span>c7s idle</span><span>0.06%</span>
      <span>c7s peak</span><span>91&ndash;99%</span>
      <span>ptero peak</span><span>57&ndash;98%</span>
    </div>
  </div>
  <div class="env">
    <div class="env-name">2× Xeon E5-2680 v2</div>
    <div class="env-row"><span>CPU</span><span>2× Intel Xeon E5-2680 v2</span></div>
    <div class="env-row"><span>RAM</span><span>DDR3-1600</span></div>
    <div class="env-row"><span>Storage</span><span>RAID 1 SATA SSD</span></div>
    <div class="env-row"><span>Kernel</span><span>Linux 6.17.13-2-pve</span></div>
    <div class="cpu-stats">
      <span>c7s idle</span><span>0.12%</span>
      <span>c7s peak</span><span>85&ndash;99%</span>
      <span>ptero peak</span><span>60&ndash;100%</span>
    </div>
  </div>
  <div class="env">
    <div class="env-name">Ampere Altra Q80-30</div>
    <div class="env-row"><span>CPU</span><span>Ampere Altra Q80-30</span></div>
    <div class="env-row"><span>RAM</span><span>DDR4-2133</span></div>
    <div class="env-row"><span>Storage</span><span>RAID 1 NVMe</span></div>
    <div class="env-row"><span>Kernel</span><span>Linux 6.12.63-rt-arm64</span></div>
    <div class="cpu-stats">
      <span>c7s idle</span><span>0.08%</span>
      <span>c7s peak</span><span>17&ndash;93%</span>
      <span>ptero peak</span><span>52&ndash;99%</span>
    </div>
  </div>
</div>

## Memory usage

<div class="chart-pair">
  <div class="chart-col">
    <div class="chart-cap">Idle</div>
    <BenchChart :option="memIdle" :height="chartHeight" />
  </div>
  <div class="chart-col">
    <div class="chart-cap">Peak under load</div>
    <BenchChart :option="memPeak" :height="chartHeight" />
  </div>
</div>

Calagopus idles around 140-160 MiB regardless of host. Under load it rarely exceeds 300 MiB, while Pterodactyl peaks above 1 GiB on the 9900X.

## Throughput

<div class="chart-cap">Endpoint: <code>/</code></div>
<BenchChart :option="rpsRoot" :height="chartHeight" />

<div class="chart-cap">Endpoint: <code>/api/client/permissions</code></div>
<BenchChart :option="rpsApi" :height="chartHeight" />

## Average latency

<div class="chart-cap">Endpoint: <code>/</code></div>
<BenchChart :option="latAvgRoot" :height="chartHeight" />

<div class="chart-cap">Endpoint: <code>/api/client/permissions</code></div>
<BenchChart :option="latAvgApi" :height="chartHeight" />

## p99 latency

<div class="chart-cap">Endpoint: <code>/</code></div>
<BenchChart :option="latP99Root" :height="chartHeight" />

<div class="chart-cap">Endpoint: <code>/api/client/permissions</code></div>
<BenchChart :option="latP99Api" :height="chartHeight" />

<style scoped>
.headline-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0 2.5rem;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--vp-c-brand-1, #14b8a6) 4%, transparent),
    transparent 60%);
}
.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  margin-bottom: 0.4rem;
}
.stat-value {
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1;
  color: #14b8a6;
  font-feature-settings: 'tnum';
}
.stat-value span {
  font-size: 1rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-left: 0.2rem;
}
.stat-sub {
  margin-top: 0.5rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  line-height: 1.5;
}
.stat-sub s {
  color: var(--vp-c-text-3);
  text-decoration-color: var(--vp-c-text-3);
}

.env-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 2rem;
}
.env {
  padding: 1rem 1.2rem;
  border-left: 3px solid #14b8a6;
  background: var(--vp-c-bg-soft);
  border-radius: 0 6px 6px 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
}
.env-name {
  font-weight: 700;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}
.env-row {
  display: flex;
  gap: 0.6rem;
  padding: 0.15rem 0;
}
.env-row > span:first-child {
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  min-width: 4rem;
  flex-shrink: 0;
}
.env-row > span:last-child {
  color: var(--vp-c-text-1);
}
.cpu-stats {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.1rem 0.8rem;
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 0.7rem;
}
.cpu-stats > span:nth-child(odd) {
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.cpu-stats > span:nth-child(even) {
  color: var(--vp-c-text-2);
  text-align: right;
}

.chart-cap {
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  margin: 1.4rem 0 0.2rem;
}
.chart-cap code {
  text-transform: none;
  letter-spacing: 0;
}
.chart-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 1rem;
  margin: 0.5rem 0;
}
.chart-col .chart-cap {
  margin-top: 0.6rem;
}

.raw-output {
  margin: 0.6rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.5rem 1rem;
}
.raw-output > summary {
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  padding: 0.4rem 0;
  user-select: none;
  font-family: var(--vp-font-family-mono);
}
.raw-output > summary:hover {
  color: var(--vp-c-brand-1);
}
.raw-output[open] > summary {
  margin-bottom: 0.5rem;
  border-bottom: 1px dashed var(--vp-c-divider);
}
</style>
