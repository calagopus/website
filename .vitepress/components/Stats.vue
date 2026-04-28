<template>
  <section class="stats-wrapper" aria-label="Project highlights">
    <div class="stats-grid">
      <div class="stat">
        <div class="stat-value">32,800%</div>
        <div class="stat-label">Faster than alternatives</div>
      </div>
      <div class="stat">
        <div class="stat-value">100%</div>
        <div class="stat-label">Open source</div>
      </div>
      <div class="stat">
        <div class="stat-value">Rust</div>
        <div class="stat-label">Memory-safe by design</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-wrapper {
  padding: 32px 24px;
  margin: 0 auto;
  max-width: 1152px;
}

.stats-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  text-align: center;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  line-height: 1.1;
}

.stat-label {
  margin-top: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  font-weight: 500;
}
</style>
