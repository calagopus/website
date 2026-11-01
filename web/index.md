---
layout: home
title: Calagopus - Open-Source Game Server Management Panel
titleTemplate: false
description: Calagopus is an open-source game server management panel built in Rust. Deploy, monitor, and manage Minecraft, Rust, and other game servers from one web interface.

hero:
  name: Calagopus
  text: Modern. Fast. Secure.
  tagline: An open-source game server management panel built in Rust, with up to 442x the API throughput of PHP-based panels.
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
import FeaturedSponsors from '../.vitepress/components/FeaturedSponsors.vue';
import Features from '../.vitepress/components/Features.vue';
import Stats from '../.vitepress/components/Stats.vue';
import Card from '../.vitepress/components/ui/Card.vue';
import CollapsibleSection from '../.vitepress/components/ui/CollapsibleSection.vue';
import { faqs } from '../.vitepress/data/faqs.ts';
import browserPreviewSrcset from './browser-preview.webp?w=480;760;1200;1520&as=srcset';
import mobilePreviewSrcset from './mobile-preview.webp?w=360;500;720;1000&as=srcset';
</script>

<Stats />

<div class="preview-container">
  <img
    :srcset="browserPreviewSrcset"
    sizes="(min-width: 768px) 65vw, 100vw"
    src="./browser-preview.webp"
    alt="Calagopus admin panel showing the server management dashboard with two Minecraft servers"
    class="browser-preview"
    loading="eager"
    fetchpriority="high"
    width="1200"
    height="900"
  />
  <img
    :srcset="mobilePreviewSrcset"
    sizes="(min-width: 768px) 35vw, min(100vw, 500px)"
    src="./mobile-preview.webp"
    alt="Calagopus mobile interface showing a live server console on iPhone"
    class="mobile-preview"
    loading="lazy"
    width="500"
    height="500"
  />
</div>

<Features />

<section class="switch-wrapper" aria-labelledby="switch-heading">
  <h2 id="switch-heading" class="section-heading">Switching from another panel?</h2>
  <p class="switch-intro">
    Calagopus manages anything that runs in a Linux Docker container, including Minecraft (Java and Bedrock),
    Rust, ARK, Valheim and FiveM. Pterodactyl eggs work unchanged, and the panel has a built-in importer.
    Compare it with the panel you run today:
  </p>
  <div class="switch-grid">
    <Card class="switch-card" padding="lg" href="/compare/calagopus-vs-pterodactyl">
      <strong>Calagopus vs Pterodactyl</strong>
      <span>Side-by-side comparison and a node-by-node migration path.</span>
    </Card>
    <Card class="switch-card" padding="lg" href="/compare/calagopus-vs-pelican">
      <strong>Calagopus vs Pelican</strong>
      <span>How the two Pterodactyl successors differ.</span>
    </Card>
    <Card class="switch-card" padding="lg" href="/compare/calagopus-vs-amp">
      <strong>Calagopus vs AMP</strong>
      <span>Open-source panel vs the licensed alternative.</span>
    </Card>
  </div>
  <p class="switch-more">
    <a href="/compare/">All Pterodactyl alternatives compared</a> ·
    <a href="/docs/additional/migrations/pterodactyl">Pterodactyl migration guide</a> ·
    <a href="/docs/additional/migrations/pelican">Pelican migration guide</a>
  </p>
</section>

<section class="faq-wrapper" aria-labelledby="faq-heading">
  <h2 id="faq-heading" class="section-heading">Frequently Asked Questions</h2>
  <div class="faq-list">
    <CollapsibleSection v-for="(faq, i) in faqs" :key="i" :title="faq.q" class="faq-item">
      <p class="faq-answer">{{ faq.a }}</p>
    </CollapsibleSection>
  </div>
  <p class="faq-more">
    <a href="/docs/about/what-is-calagopus">See more questions →</a>
  </p>
</section>

<FeaturedSponsors />

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

.switch-wrapper {
  padding: 48px 24px 0;
  margin: 0 auto;
  max-width: 1152px;
}

.switch-intro {
  margin: 0 auto;
  max-width: 800px;
  text-align: center;
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.switch-grid {
  display: grid;
  gap: 16px;
  margin: 32px auto 0;
  max-width: 1152px;
}

@media (min-width: 640px) {
  .switch-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.switch-card {
  gap: 6px;
}

.switch-card strong {
  font-size: 15px;
  color: var(--vp-c-brand-1);
}

.switch-card span {
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.switch-more {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}

.switch-more a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.switch-more a:hover {
  color: var(--vp-c-brand-2);
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
  margin: 0;
}

.faq-answer {
  margin: 0;
  font-size: var(--mantine-font-size-sm);
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
