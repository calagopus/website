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
      'Calagopus is built with security in mind, utilizing best practices to minimize vulnerabilities and protect your game servers from potential threats. Servers run in isolated Docker containers, and the panel itself also follows best practices for secure web applications.',
    link: {
      href: '/docs/about/security',
      label: 'Learn more about security',
    },
  },
  {
    icon: faBolt,
    title: 'Performance',
    details:
      "With Rust's high performance and low-level control, Calagopus delivers fast and efficient game server management, with panel API throughput up to 447x that of PHP-based panels - making server administration smoother than ever. Our binaries are compiled to be as small and efficient as possible, and we use caching and other optimization techniques to ensure the best performance possible.",
    link: {
      href: '/docs/about/benchmarks',
      label: 'See the benchmarks',
    },
  },
  {
    icon: faPuzzlePiece,
    title: 'Modularity',
    details:
      'The Extension API uses Rust traits to let extensions add backend logic, custom routes, CLI commands, and database migrations - and go further than fixed plugin slots: extensions can intercept or replace built-in UI elements, inject fields into admin forms, and even install from the admin UI with live build logs on the all-in-one image.',
    link: {
      href: '/docs/panel/extensions/',
      label: 'Explore the Extension API',
    },
  },
  {
    icon: faGlobe,
    title: 'Open Source',
    details:
      'Calagopus is open source and available on GitHub, allowing the community to contribute to its development and improvement. We welcome contributions from developers of all skill levels and encourage collaboration to make Calagopus the best game server management solution available.',
    link: {
      href: '/docs/about/licenses',
      label: 'View the licenses',
    },
  },
  {
    icon: faDesktop,
    title: 'User-Friendly Interface',
    details:
      'A guided first-run wizard gets you from install to a running server, and day-to-day management includes real-time collaborative file editing, a disk usage treemap, revision diffs with one-click restore, and 14+ languages with automatic right-to-left support. An "Advanced Mode" toggle keeps expert options out of the way until you want them.',
    link: {
      href: '/docs/about/features',
      label: 'Browse the feature reference',
    },
  },
  {
    icon: faRocket,
    title: 'Easy Deployment',
    details:
      'Calagopus offers easy deployment options, including Docker and traditional installation methods, allowing users to quickly set up and start managing their game servers without hassle. Our documentation provides clear instructions for both methods, and our community is available to assist with any issues during deployment.',
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
