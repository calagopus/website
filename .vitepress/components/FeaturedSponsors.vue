<script setup lang="ts">
import { computed, ref } from 'vue';
import { data as featured, type SponsorSection } from '../data/sponsor-sections.data.mts';

// A tier only ever hands out the fields it pays for, and the bot refuses a submission that is
// missing them, so what a sponsor has decides the row they get.
const large = computed(() => featured.sections.filter((section) => section.logoUrl));
const small = computed(() => featured.sections.filter((section) => !section.logoUrl && section.description));
const names = computed(() => featured.sections.filter((section) => !section.logoUrl && !section.description));

const failedLogos = ref<string[]>([]);

const hasLogo = (section: SponsorSection): boolean => !!section.logoUrl && !failedLogos.value.includes(section.id);

const markLogoFailed = (section: SponsorSection): void => {
  failedLogos.value.push(section.id);
};
</script>

<template>
  <section v-if="featured.sections.length" class="featured-wrapper" aria-labelledby="featured-heading">
    <h2 id="featured-heading" class="section-heading">Featured sponsors</h2>
    <p class="featured-intro">These sponsors fund Calagopus development through a featured placement.</p>

    <div class="featured-groups">
      <div v-if="large.length || small.length" class="featured-rows">
        <component
          :is="section.link ? 'a' : 'div'"
          v-for="section in large"
          :key="section.id"
          class="featured-card featured-card-large"
          :href="section.link ?? undefined"
          :target="section.link ? '_blank' : undefined"
          :rel="section.link ? 'sponsored noopener noreferrer' : undefined"
        >
          <img
            v-if="hasLogo(section)"
            :src="section.logoUrl ?? undefined"
            :alt="section.name"
            class="featured-logo"
            width="220"
            height="64"
            loading="lazy"
            @error="markLogoFailed(section)"
          />
          <span class="featured-text">
            <strong>{{ section.name }}</strong>
            <span v-if="section.description">{{ section.description }}</span>
          </span>
        </component>

        <component
          :is="section.link ? 'a' : 'div'"
          v-for="section in small"
          :key="section.id"
          class="featured-card featured-card-small"
          :href="section.link ?? undefined"
          :target="section.link ? '_blank' : undefined"
          :rel="section.link ? 'sponsored noopener noreferrer' : undefined"
        >
          <span class="featured-text">
            <strong>{{ section.name }}</strong>
            <span v-if="section.description">{{ section.description }}</span>
          </span>
        </component>
      </div>

      <div v-if="names.length" class="featured-pairs">
        <component
          :is="section.link ? 'a' : 'div'"
          v-for="section in names"
          :key="section.id"
          class="featured-card featured-card-small"
          :href="section.link ?? undefined"
          :target="section.link ? '_blank' : undefined"
          :rel="section.link ? 'sponsored noopener noreferrer' : undefined"
        >
          <span class="featured-text">
            <strong>{{ section.name }}</strong>
          </span>
        </component>
      </div>
    </div>

    <p class="featured-more">
      <a href="/docs/about/sponsors">See everyone who sponsors Calagopus →</a>
    </p>
  </section>
</template>

<style scoped>
.featured-wrapper {
  padding: 48px 24px 0;
  margin: 0 auto;
  max-width: 1152px;
}

.section-heading {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  text-align: center;
  border: none;
  padding: 0;
}

.featured-intro {
  margin: 0 auto;
  max-width: 800px;
  text-align: center;
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.featured-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 32px auto 0;
}

.featured-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.featured-pairs {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
}

.featured-card {
  display: flex;
  align-items: center;
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-bg-soft);
  transition: border-color 0.25s;
  text-decoration: none;
}

a.featured-card:hover {
  border-color: var(--vp-c-brand-1);
}

.featured-card-large {
  gap: 28px;
  padding: 24px 28px;
}

.featured-card-small {
  gap: 12px;
  padding: 12px 20px;
}

/* Logos arrive at whatever aspect ratio the sponsor uploaded, so the box is the constraint. */
.featured-logo {
  width: auto;
  height: 64px;
  max-width: 220px;
  flex: none;
  object-fit: contain;
}

.featured-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.featured-card-small .featured-text {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
}

.featured-card strong {
  color: var(--vp-c-brand-1);
}

.featured-card-large strong {
  font-size: 18px;
}

.featured-card-small strong {
  font-size: 15px;
}

.featured-text span {
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.featured-card-large .featured-text span {
  font-size: 14px;
}

.featured-card-small .featured-text span {
  font-size: 13px;
}

.featured-more {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}

.featured-more a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.featured-more a:hover {
  color: var(--vp-c-brand-2);
}

@media (max-width: 640px) {
  .featured-card-large {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    text-align: center;
  }

  .featured-card-large .featured-text {
    align-items: center;
  }

  .featured-card-small .featured-text {
    flex-direction: column;
    align-items: flex-start;
  }

  .featured-pairs {
    grid-template-columns: 1fr;
  }
}
</style>
