---
layout: home

hero:
  name: Calagopus
  text: Modern. Fast. Secure.
  tagline: Game server management - reimagined.
  actions:
    - theme: brand
      text: Documentation
      link: /docs
    - theme: alt
      text: Discord
      link: https://discord.gg/uSM8tvTxBV
---

<script setup lang="ts">
import Features from '../.vitepress/components/Features.vue';
</script>

<div class="preview-container">
  <img src="./browser-preview.webp" alt="Browser Preview" class="browser-preview" />
  <img src="./mobile-preview.webp" alt="Mobile Preview" class="mobile-preview" />
</div>

<style>
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
</style>

<Features />
