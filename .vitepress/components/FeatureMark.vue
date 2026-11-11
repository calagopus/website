<script setup lang="ts">
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

defineProps<{ value: boolean }>();
</script>

<template>
  <span class="feature-mark" :class="value ? 'is-yes' : 'is-no'" role="img" :aria-label="value ? 'Yes' : 'No'">
    <FontAwesomeIcon :icon="value ? faCheck : faXmark" />
  </span>
</template>

<style scoped>
.is-yes {
  color: var(--mantine-color-green-filled);
}

.is-no {
  color: var(--mantine-color-dimmed);
}
</style>
