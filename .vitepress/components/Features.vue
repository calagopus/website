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

const features = [
  {
    icon: faLock,
    title: 'Security',
    details:
      "Calagopus is built with security in mind, utilizing Rust's safety features to minimize vulnerabilities and protect your game servers from potential threats. Servers run in isolated Docker Containers, and the panel itself is designed to follow best practices for secure web applications.",
  },
  {
    icon: faBolt,
    title: 'Performance',
    details:
      "With Rust's high performance and low-level control, Calagopus delivers fast and efficient game server management, ensuring smooth gameplay and responsive server administration. Our binaries are compiled to be as small and efficient as possible, and we utilize caching and other optimization techniques to ensure the best performance possible.",
  },
  {
    icon: faPuzzlePiece,
    title: 'Modularity',
    details:
      'Calagopus is designed to be modular and extensible, allowing developers to create custom extensions to enhance its functionality. The Extension API uses Rust Traits to allow for maximum flexibility and performance, and we provide comprehensive documentation and support to help developers get started with creating their own extensions.',
    link: '/docs/panel/extensions/dev-environment',
  },
  {
    icon: faGlobe,
    title: 'Open Source',
    details:
      'Calagopus is open source and available on GitHub, allowing the community to contribute to its development and improvement. We welcome contributions from developers of all skill levels and encourage collaboration to make Calagopus the best game server management solution available.',
  },
  {
    icon: faDesktop,
    title: 'User-Friendly Interface',
    details:
      'Calagopus provides an intuitive and user-friendly interface for managing game servers, making it easy for both beginners and experienced users to deploy, monitor, and maintain their game servers with ease. Our interface is designed to be simple and straightforward, while still providing powerful features and functionality for advanced users.',
  },
  {
    icon: faRocket,
    title: 'Easy Deployment',
    details:
      'Calagopus offers easy deployment options, including Docker and traditional installation methods, allowing users to quickly set up and start managing their game servers without hassle. Our documentation provides clear instructions for both methods, and our Community is available to assist with any issues that may arise during deployment.',
    link: '/docs/panel/installation/docker',
  },
];
</script>

<template>
  <div class="custom-features-wrapper">
    <div class="custom-features-grid">
      <div v-for="feature in features" :key="feature.title" class="feature-card">
        <div class="icon-box">
          <FontAwesomeIcon :icon="feature.icon" class="fa-icon" />
        </div>
        <h2 class="title">{{ feature.title }}</h2>
        <p class="details">
          {{ feature.details }}
          <a v-if="feature.link" :href="feature.link" class="link">
            <FontAwesomeIcon :icon="faCircleInfo" class="fa-icon" />
            Learn more
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-features-wrapper {
  padding: 0 24px;
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
  display: block;
  padding: 24px;
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
  height: 100%;
}

.feature-card:hover {
  border-color: var(--vp-c-brand-1);
}

.icon-box {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: var(--vp-c-default-soft);
  width: 48px;
  height: 48px;
}

.fa-icon {
  font-size: 24px;
  color: var(--vp-c-brand-1);
  transition: transform 0.25s ease;
}

.feature-card:hover .fa-icon {
  transform: scale(1.1);
}

.title {
  margin: 0;
  line-height: 24px;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.details {
  margin: 0;
  padding-top: 8px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.link {
  display: inline-block;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;

  .fa-icon {
    font-size: 12px;
  }
}

.link:hover {
  color: var(--vp-c-brand-2);

  .fa-icon {
    color: var(--vp-c-brand-2);
  }
}
</style>
