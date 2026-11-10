<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';
import { compareFaqs } from '../data/compare-faqs.ts';

const { page } = useData();

const faqs = computed(() => compareFaqs[page.value.relativePath] ?? []);
</script>

<template>
  <template v-if="faqs.length">
    <h2 id="frequently-asked-questions" tabindex="-1">
      Frequently Asked Questions
      <a class="header-anchor" href="#frequently-asked-questions" aria-label='Permalink to "Frequently Asked Questions"'
        >&#8203;</a
      >
    </h2>
    <details v-for="f in faqs" :key="f.q" class="details custom-block">
      <summary>{{ f.q }}</summary>
      <!-- eslint-disable-next-line vue/no-v-html -- answers are trusted site-authored HTML -->
      <p v-html="f.a"></p>
    </details>
  </template>
</template>
