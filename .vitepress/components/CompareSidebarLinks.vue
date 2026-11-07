<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

const { page } = useData();

const visible = computed(() => page.value.relativePath.startsWith('compare/'));

const links = [
  { text: 'Panel Benchmarks', href: '/docs/about/benchmarks' },
  { text: 'Daemon Benchmarks', href: '/docs/about/daemon-benchmarks' },
  { text: 'Feature Reference', href: '/docs/about/features' },
  { text: 'Migration Guides', href: '/docs/additional/migrations/' },
];
</script>

<template>
  <div v-if="visible" class="compare-links">
    <p class="title">More</p>
    <a v-for="link in links" :key="link.href" class="link" :href="link.href">{{ link.text }}</a>
    <a class="cta" href="/docs/panel/installation/">Install Calagopus</a>
  </div>
</template>

<style scoped>
.compare-links {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

.title {
  margin-bottom: 2px;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.7142857;
  color: var(--vp-c-text-1);
}

.link {
  margin-inline: -10px;
  padding: 4px 10px;
  border-radius: var(--mantine-radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.7142857;
  color: var(--vp-c-text-1);
  transition: color 0.15s, background-color 0.15s;
}

.link:hover {
  color: var(--vp-c-text-1);
  background-color: var(--mantine-color-default-hover);
}

.cta {
  margin-top: 14px;
  padding: 7px 12px;
  border-radius: var(--mantine-radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  color: var(--mantine-color-white);
  background-color: var(--mantine-primary-color-filled);
  transition: background-color 0.15s;
}

.cta:hover {
  background-color: var(--mantine-primary-color-filled-hover);
}
</style>
