<script setup lang="ts">
import {
  faBolt,
  faCircleInfo,
  faDesktop,
  faGlobe,
  faLock,
  faPuzzlePiece,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Card from './ui/Card.vue';
import ThemeIcon from './ui/ThemeIcon.vue';

const features = [
  {
    icon: faLock,
    title: 'Security',
    details:
      "Every game server runs in its own Docker container. Wings keeps file operations inside each server's directory even though it runs as root, and the panel rate-limits logins and API requests. The security page lists each defense and the risks that remain.",
    link: {
      href: '/docs/about/security',
      label: 'Learn more about security',
    },
  },
  {
    icon: faBolt,
    title: 'Performance',
    details:
      'The panel and Wings are written in Rust. On the same hardware, the panel answers up to 442x as many API requests per second as PHP-based panels. The benchmark pages explain how that was measured and list the numbers for each system.',
    link: {
      href: '/docs/about/benchmarks',
      label: 'See the benchmarks',
    },
  },
  {
    icon: faPuzzlePiece,
    title: 'Modularity',
    details:
      'Extensions are written against a Rust trait API and can add backend logic, routes, CLI commands and database migrations. They are not limited to fixed plugin slots: they can intercept or replace built-in UI elements and add fields to admin forms. On the All-in-One image they install from the admin area with a live build log.',
    link: {
      href: '/docs/panel/extensions/',
      label: 'Explore the Extension API',
    },
  },
  {
    icon: faGlobe,
    title: 'Open Source',
    details:
      'The source code is on GitHub and the core components are MIT-licensed. Bug reports, pull requests and translations are welcome. The licenses page lists which repositories use a different license.',
    link: {
      href: '/docs/about/licenses',
      label: 'View the licenses',
    },
  },
  {
    icon: faDesktop,
    title: 'User-Friendly Interface',
    details:
      'A first-run wizard takes you from install to a running server. Day to day you get collaborative file editing, a disk usage treemap, file history with one-click restore, and 14+ languages with right-to-left support. Expert options stay hidden until you turn on Advanced Mode.',
    link: {
      href: '/docs/about/features',
      label: 'Browse the feature reference',
    },
  },
  {
    icon: faRocket,
    title: 'Easy Deployment',
    details:
      'Install with Docker, from the APT, RPM, APK or AUR packages, or as a single binary. The All-in-One Docker image runs the panel and Wings together, and TrueNAS, Unraid, umbrelOS, Runtipi and Hostinger have their own guides.',
    link: {
      href: '/docs/panel/installation/docker',
      label: 'Read the Docker install guide',
    },
  },
];
</script>

<template>
  <section
    class="custom-features-wrapper"
    aria-labelledby="features-heading"
  >
    <h2 id="features-heading" class="section-heading">Why Calagopus?</h2>
    <div class="custom-features-grid">
      <Card
        v-for="feature in features"
        :key="feature.title"
        component="article"
        class="feature-card"
        padding="lg"
      >
        <ThemeIcon size="xl" variant="light" class="feature-icon" aria-hidden="true">
          <FontAwesomeIcon :icon="feature.icon" class="fa-icon" />
        </ThemeIcon>
        <h3 class="title">{{ feature.title }}</h3>
        <p class="details">{{ feature.details }}</p>
        <a
          v-if="feature.link"
          :href="feature.link.href"
          class="link"
        >
          <FontAwesomeIcon :icon="faCircleInfo" class="fa-icon" aria-hidden="true" />
          {{ feature.link.label }}
        </a>
      </Card>
    </div>
  </section>
</template>

<style scoped>
.custom-features-wrapper {
  padding: 0 24px;
}

.section-heading {
  margin: 0 auto 32px;
  max-width: 1152px;
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  text-align: center;
  border: none;
  padding: 0;
}

.custom-features-grid {
  display: grid;
  gap: 24px;
  margin: 0 auto;
  max-width: 1152px;
}

@media (min-width: 640px) {
  .custom-features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .custom-features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feature-card {
  height: 100%;
}

.feature-icon {
  margin-bottom: var(--mantine-spacing-md);
}

.fa-icon {
  font-size: 20px;
  transition: transform 0.25s ease;
}

.feature-card:hover .fa-icon {
  transform: scale(1.1);
}

.title {
  margin: 0;
  line-height: var(--mantine-h5-line-height);
  font-size: var(--mantine-h5-font-size);
  font-weight: 600;
  color: var(--vp-c-text-1);
  border: none;
  padding: 0;
}

.details {
  margin: 0;
  padding-top: var(--mantine-spacing-xs);
  line-height: var(--mantine-line-height-sm);
  font-size: var(--mantine-font-size-sm);
  color: var(--vp-c-text-2);
  flex-grow: 1;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.link .fa-icon {
  font-size: 12px;
}

.link:hover {
  color: var(--vp-c-brand-2);
}

.link:hover .fa-icon {
  color: var(--vp-c-brand-2);
}
</style>
