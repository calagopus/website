<script setup lang="ts">
import { computed, ref } from 'vue';
import { type Sponsor, data as sponsors } from '../data/sponsors.data.mts';
import { formatUsd } from '../lib/format.ts';
import {
  sponsorAvatarFallback as avatarFallback,
  sponsorAvatarUrl as avatarUrl,
  sponsorDisplayName as displayName,
  sponsorKey as key,
  sponsorMonthlyMeta as monthlyMeta,
  sponsorProviderLabel as providerLabel,
} from '../lib/sponsor-display.ts';
import Badge from './ui/Badge.vue';
import Card from './ui/Card.vue';

const monthly = computed(() =>
  sponsors.sponsors
    .filter((sponsor) => sponsor.status === 'monthly')
    .sort((a, b) => b.monthlyCents - a.monthlyCents || b.lifetimeCents - a.lifetimeCents),
);

const failedAvatars = ref<string[]>([]);

const hasAvatar = (sponsor: Sponsor): boolean =>
  !!sponsor.profile?.avatarUrl && !failedAvatars.value.includes(key(sponsor) ?? '');

const markAvatarFailed = (sponsor: Sponsor): void => {
  const sponsorKey = key(sponsor);
  if (sponsorKey) failedAvatars.value.push(sponsorKey);
};
</script>

<template>
  <div class="sponsors">
    <div v-if="sponsors.sponsors.length === 0" class="warning custom-block">
      <p class="custom-block-title">Sponsors unavailable</p>
      <p>
        This page was built without the sponsor API. See
        <a href="https://github.com/sponsors/calagopus" target="_blank" rel="noreferrer">GitHub Sponsors</a>
        instead.
      </p>
    </div>

    <template v-else>
      <Card class="summary" padding="lg">
        <div>
          <span class="summary-label">Active monthly sponsorships</span>
          <span class="summary-amount">{{ formatUsd(sponsors.monthlyCents) }}</span>
          <span class="summary-period">/ month</span>
        </div>
        <div class="summary-meta">
          <a href="https://github.com/sponsors/calagopus" target="_blank" rel="noreferrer">
            Become a sponsor on GitHub
          </a>
          <span>{{ sponsors.sponsors.length }} sponsorships · {{ formatUsd(sponsors.lifetimeCents) }} lifetime</span>
        </div>
      </Card>

      <section v-if="monthly.length">
        <h2>Monthly sponsors</h2>
        <div class="cards">
          <Card
            v-for="(sponsor, index) in monthly"
            :key="key(sponsor) ?? index"
            class="card"
            padding="sm"
            :href="sponsor.profile?.url"
            :target="sponsor.profile ? '_blank' : undefined"
            :rel="sponsor.profile ? 'noreferrer' : undefined"
          >
            <img
              v-if="hasAvatar(sponsor)"
              :src="avatarUrl(sponsor)"
              alt=""
              width="48"
              height="48"
              loading="lazy"
              @error="markAvatarFailed(sponsor)"
            />
            <span v-else class="avatar-fallback" aria-hidden="true">{{ avatarFallback(sponsor) }}</span>
            <span class="card-text">
              <span class="card-name">
                {{ displayName(sponsor) }}
                <Badge variant="outline" color="gray">{{ providerLabel(sponsor) }}</Badge>
              </span>
              <span class="card-amount">{{ formatUsd(sponsor.monthlyCents) }}/month</span>
              <span v-if="sponsor.oneTimeCents" class="card-since">
                + {{ formatUsd(sponsor.oneTimeCents) }} one-time
              </span>
              <span class="card-since">{{ monthlyMeta(sponsor) }}</span>
            </span>
          </Card>
        </div>
      </section>

      <section>
        <h2>All-time leaderboard</h2>
        <ol class="rows">
          <li v-for="(sponsor, index) in sponsors.sponsors" :key="key(sponsor) ?? index">
            <span class="rank" :class="{ top: sponsor.rank <= 3 }">{{ sponsor.rank }}</span>
            <img
              v-if="hasAvatar(sponsor)"
              :src="avatarUrl(sponsor)"
              alt=""
              width="28"
              height="28"
              loading="lazy"
              @error="markAvatarFailed(sponsor)"
            />
            <span v-else class="avatar-fallback small" aria-hidden="true">{{ avatarFallback(sponsor) }}</span>
            <span class="row-name">
              <a v-if="sponsor.profile" :href="sponsor.profile.url" target="_blank" rel="noreferrer">
                {{ displayName(sponsor) }}
              </a>
              <span v-else>Anonymous</span>
              <Badge variant="outline" color="gray">{{ providerLabel(sponsor) }}</Badge>
              <Badge v-if="sponsor.status === 'monthly'" variant="light">monthly</Badge>
              <Badge v-else-if="sponsor.status === 'former'" variant="outline" color="gray">former monthly</Badge>
            </span>
            <span class="row-meta">{{ formatUsd(sponsor.lifetimeCents) }}</span>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<style scoped>
.summary {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  margin: 24px 0;
}

.summary-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.summary-amount {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-brand-1);
}

.summary-period {
  margin-left: 4px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.summary-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  text-align: right;
  color: var(--vp-c-text-2);
}

.cards {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
  margin: 16px 0;
}

@media (min-width: 640px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

.card {
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.card img,
.avatar-fallback {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex: none;
}

.avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-default-soft);
}

.avatar-fallback.small,
.rows img {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.card-text {
  display: flex;
  flex-direction: column;
}

.card-name {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.card-amount {
  font-size: 14px;
  color: var(--vp-c-brand-1);
}

.card-since {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.rows {
  padding: 0;
  margin: 16px 0;
  list-style: none;
}

.rows li {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 0;
  margin: 0;
}

.row-name {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
  min-width: 0;
}

.row-name > :first-child {
  min-width: 0;
}

.rows img {
  border-radius: 50%;
  flex: none;
}

.row-meta {
  flex: none;
  margin-left: auto;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.rank {
  flex: none;
  min-width: 2ch;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--vp-c-text-2);
}

.rank.top {
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .summary-meta {
    text-align: left;
  }
}
</style>
