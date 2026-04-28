---
layout: home
title: Calagopus - Open-Source Game Server Management Panel
titleTemplate: false
description: Calagopus is a modern, open-source game server management panel built in Rust. Deploy, monitor, and manage Minecraft, Rust, and other game servers with industry-leading performance.

hero:
  name: Calagopus
  text: Modern. Fast. Secure.
  tagline: An open-source game server management panel built in Rust - with throughput up to 32,800% faster than the alternatives.
  actions:
    - theme: brand
      text: Get Started
      link: /docs
    - theme: alt
      text: Live Demo
      link: https://demo.calagopus.com
    - theme: alt
      text: Discord
      link: https://discord.gg/uSM8tvTxBV
---

<script setup lang="ts">
import Features from '../.vitepress/components/Features.vue';
import Stats from '../.vitepress/components/Stats.vue';
import { useHead } from '@vueuse/head';

const faqs = [
  {
    q: 'How is Calagopus different from Pterodactyl?',
    a: 'Calagopus is built in Rust and React, where Pterodactyl uses PHP and Vue. This delivers throughput improvements of over 32,800% along with Rust\'s memory-safety guarantees. We provide a migration guide for existing Pterodactyl users.',
  },
  {
    q: 'What games does Calagopus support?',
    a: 'Calagopus uses an egg system to support arbitrary games. Anything that runs in a Linux Docker container can be managed, including Minecraft (Java and Bedrock), Rust, ARK, Valheim, FiveM, and many more.',
  },
  {
    q: 'Is Calagopus free to use?',
    a: 'Yes. Calagopus is free for both personal and commercial use, with no feature gating. Core components are MIT-licensed.',
  },
  {
    q: 'Can I migrate from Pterodactyl or Pelican?',
    a: 'Yes. Calagopus provides migration tooling and documentation for both Pterodactyl and Pelican.',
  },
  {
    q: 'Does Calagopus have an Extension API?',
    a: 'Yes. The Extension API uses Rust traits for type safety and performance. Extensions can add backend logic, custom routes, UI elements, database migrations, and more.',
  },
  {
    q: 'Can I run Calagopus on a Raspberry Pi?',
    a: 'Yes. Calagopus supports ARM64 and the Docker Compose setup works on a Raspberry Pi out of the box.',
  },
];

useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      }),
    },
  ],
});
</script>

<Stats />

<div class="preview-container">
  <img
    src="./browser-preview.webp"
    alt="Calagopus admin panel showing the server management dashboard with two Minecraft servers"
    class="browser-preview"
    loading="lazy"
    width="1200"
    height="750"
  />
  <img
    src="./mobile-preview.webp"
    alt="Calagopus mobile interface showing a live server console on iPhone"
    class="mobile-preview"
    loading="lazy"
    width="500"
    height="900"
  />
</div>

<Features />

<section class="faq-wrapper" aria-labelledby="faq-heading">
  <h2 id="faq-heading" class="section-heading">Frequently Asked Questions</h2>
  <div class="faq-list">
    <details v-for="(faq, i) in faqs" :key="i" class="faq-item">
      <summary class="faq-question">{{ faq.q }}</summary>
      <p class="faq-answer">{{ faq.a }}</p>
    </details>
  </div>
  <p class="faq-more">
    <a href="/docs/about/what-is-calagopus">See more questions →</a>
  </p>
</section>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  margin: 48px 0;
}

.browser-preview,
.mobile-preview {
  border-radius: 12px;
  height: auto;
}

.mobile-preview {
  width: 100%;
  max-width: 500px;
}

@media (min-width: 768px) {
  .preview-container {
    flex-direction: row;
    align-items: center;
  }

  .browser-preview {
    width: 65%;
  }

  .mobile-preview {
    width: 35%;
  }
}

.faq-wrapper {
  padding: 48px 24px;
  margin: 0 auto;
  max-width: 800px;
}

.section-heading {
  margin: 0 0 32px;
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  text-align: center;
  border: none;
  padding: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-bg-soft);
  transition: border-color 0.25s;
  overflow: hidden;
}

.faq-item:hover,
.faq-item[open] {
  border-color: var(--vp-c-brand-1);
}

.faq-question {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  cursor: pointer;
  list-style: none;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-question::-webkit-details-marker {
  display: none;
}

.faq-question::after {
  content: '+';
  font-size: 20px;
  color: var(--vp-c-text-2);
  transition: transform 0.2s ease;
  font-weight: 400;
}

.faq-item[open] .faq-question::after {
  transform: rotate(45deg);
}

.faq-answer {
  padding: 0 20px 16px;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.faq-more {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
}

.faq-more a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.faq-more a:hover {
  color: var(--vp-c-brand-2);
}
</style>
