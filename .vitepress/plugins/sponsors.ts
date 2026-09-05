import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchJson } from '../lib/fetch-retry.ts';
import { formatMonth, formatUsd } from '../lib/format.ts';
import {
  type Sponsor,
  type SponsorProvider,
  type SponsorStatus,
  type SponsorsData,
  sponsorProviderLabel,
} from '../lib/sponsor-display.ts';

export type {
  Sponsor,
  SponsorProfile,
  SponsorProvider,
  SponsorStatus,
  SponsorsData,
} from '../lib/sponsor-display.ts';

const API_URL = 'https://calagopus.com/api/sponsors';

interface ApiProfile {
  account_id: string;
  github_id: number | null;
  discord_user_id: string | null;
  login: string;
  name: string | null;
  url: string;
  avatar_url: string;
}

interface ApiSponsor {
  provider: SponsorProvider;
  status: SponsorStatus;
  profile: ApiProfile | null;
  monthly_cents: number;
  one_time_cents: number;
  recurring_cents: number;
  lifetime_cents: number;
  estimated_months: number | null;
  first_sponsored_at: string | null;
  last_activity_at: string | null;
}

interface ApiSponsors {
  currency: string;
  monthly_cents: number;
  totals: {
    one_time_cents: number;
    recurring_cents: number;
    lifetime_cents: number;
  };
  sponsors: ApiSponsor[];
}

let pending: Promise<ApiSponsors> | null = null;

function fetchSponsors(): Promise<ApiSponsors> {
  pending ??= fetchJson<ApiSponsors>(API_URL, 'sponsors', 'CALAGOPUS_SPONSORS_OFFLINE');
  return pending;
}

function toSponsor(sponsor: ApiSponsor): Sponsor {
  return {
    provider: sponsor.provider,
    status: sponsor.status,
    profile: sponsor.profile && {
      login: sponsor.profile.login,
      name: sponsor.profile.name,
      url: sponsor.profile.url,
      avatarUrl: sponsor.profile.avatar_url,
    },
    monthlyCents: sponsor.monthly_cents,
    oneTimeCents: sponsor.one_time_cents,
    lifetimeCents: sponsor.lifetime_cents,
    rank: 0,
    firstSponsoredAt: sponsor.first_sponsored_at,
  };
}

function compareSince(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : 1;
}

export async function loadSponsors(): Promise<SponsorsData> {
  if (process.env.CALAGOPUS_SPONSORS_OFFLINE) {
    return { monthlyCents: 0, lifetimeCents: 0, sponsors: [] };
  }

  const api = await fetchSponsors();
  const sponsors = api.sponsors.map(toSponsor);

  sponsors.sort(
    (a, b) =>
      b.lifetimeCents - a.lifetimeCents ||
      compareSince(a.firstSponsoredAt, b.firstSponsoredAt) ||
      (a.profile?.login ?? '').localeCompare(b.profile?.login ?? ''),
  );

  for (const [index, sponsor] of sponsors.entries()) {
    const previous = sponsors[index - 1];
    sponsor.rank = previous?.lifetimeCents === sponsor.lifetimeCents ? previous.rank : index + 1;
  }

  return {
    monthlyCents: api.monthly_cents,
    lifetimeCents: api.totals.lifetime_cents,
    sponsors,
  };
}

function sponsorLabel(sponsor: Sponsor): string {
  if (!sponsor.profile) return 'Anonymous';
  const { login, name, url } = sponsor.profile;
  return `[${name ? `${name} (@${login})` : `@${login}`}](${url})`;
}

function table(header: string[], rows: string[][]): string {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

const STATUS_LABEL: Record<SponsorStatus, string> = { monthly: 'Monthly', former: 'Former monthly', one_time: '-' };

function sponsorsMarkdown(data: SponsorsData): string {
  const monthly = data.sponsors
    .filter((sponsor) => sponsor.status === 'monthly')
    .sort((a, b) => b.monthlyCents - a.monthlyCents || b.lifetimeCents - a.lifetimeCents);

  const blocks = [
    `${data.sponsors.length} sponsors have contributed ${formatUsd(data.lifetimeCents)} in total. ` +
      `Active monthly sponsorships currently add up to ${formatUsd(data.monthlyCents)}/month.`,
  ];

  if (monthly.length > 0) {
    blocks.push(
      '## Monthly sponsors',
      table(
        ['Sponsor', 'Via', 'Monthly', 'One-time', 'Lifetime', 'Since'],
        monthly.map((sponsor) => [
          sponsorLabel(sponsor),
          sponsorProviderLabel(sponsor),
          `${formatUsd(sponsor.monthlyCents)}/month`,
          sponsor.oneTimeCents > 0 ? formatUsd(sponsor.oneTimeCents) : '-',
          formatUsd(sponsor.lifetimeCents),
          formatMonth(sponsor.firstSponsoredAt, '-'),
        ]),
      ),
    );
  }

  blocks.push(
    '## All-time leaderboard',
    table(
      ['#', 'Sponsor', 'Via', 'Status', 'Total'],
      data.sponsors.map((sponsor) => [
        `${sponsor.rank}`,
        sponsorLabel(sponsor),
        sponsorProviderLabel(sponsor),
        STATUS_LABEL[sponsor.status],
        formatUsd(sponsor.lifetimeCents),
      ]),
    ),
  );

  return blocks.join('\n\n');
}

export async function expandSponsorsMarkdown(outDir: string): Promise<void> {
  if (process.env.CALAGOPUS_SPONSORS_OFFLINE) return;

  const markdown = sponsorsMarkdown(await loadSponsors());
  const file = join(outDir, 'docs/about/sponsors.md');
  const source = await readFile(file, 'utf8');
  await writeFile(
    file,
    source.replace(/^<SponsorList\s*\/>$/m, () => markdown),
  );
}
