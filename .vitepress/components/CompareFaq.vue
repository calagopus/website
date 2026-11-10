<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';
import { compareFaqs } from '../data/compare-faqs.ts';

const { page } = useData();

const faqs = computed(() => compareFaqs[page.value.relativePath] ?? []);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
</script>

<template>
  <template v-if="faqs.length">
    <h2 id="frequently-asked-questions" tabindex="-1">
      Frequently Asked Questions
      <a class="header-anchor" href="#frequently-asked-questions" aria-label='Permalink to "Frequently Asked Questions"'
        >&#8203;</a
      >
    </h2>
    <template v-for="f in faqs" :key="f.q">
      <h3 :id="slugify(f.q)" tabindex="-1">
        {{ f.q }}
        <a class="header-anchor" :href="`#${slugify(f.q)}`" :aria-label="`Permalink to &quot;${f.q}&quot;`">&#8203;</a>
      </h3>
      <!-- biome-ignore lint: answers are trusted site-authored HTML -->
      <p v-html="f.a"></p>
    </template>
  </template>
</template>
