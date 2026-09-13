import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchJson } from '../lib/fetch-retry.ts';

const API_URL = 'https://bot.calagopus.com/api/sponsors/sections';
const SPONSORS_PAGE = '/docs/about/sponsors';

interface ApiSection {
  discord_user_id: string;
  tier_cents: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  link: string | null;
  since: string;
}

interface ApiSections {
  currency: string;
  sections: ApiSection[];
}

export interface SponsorSection {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  link: string | null;
  since: string;
}

export interface SponsorSectionsData {
  sections: SponsorSection[];
}

const DEMO_SECTIONS: SponsorSection[] = [
  {
    id: 'demo-link',
    name: 'Demo Hosting',
    description: 'Game server hosting in 14 regions, NVMe everywhere.',
    logoUrl: '/fulllogo.png',
    link: 'https://example.com/',
    since: '2026-09-13T07:41:11Z',
  },
  {
    id: 'demo-logo',
    name: 'Demo Metal',
    description: 'Bare metal built for Minecraft networks.',
    logoUrl: '/fulllogo.png',
    link: null,
    since: '2026-09-13T07:41:11Z',
  },
  {
    id: 'demo-description',
    name: 'Demo Studios',
    description: 'We build and run modded servers for communities.',
    logoUrl: null,
    link: null,
    since: '2026-09-13T07:41:11Z',
  },
  {
    id: 'demo-name',
    name: 'Demo Collective',
    description: null,
    logoUrl: null,
    link: null,
    since: '2026-09-13T07:41:11Z',
  },
  {
    id: 'demo-name-2',
    name: 'Demo Networks',
    description: null,
    logoUrl: null,
    link: null,
    since: '2026-09-13T07:41:11Z',
  },
  {
    id: 'demo-name-3',
    name: 'Demo Labs',
    description: null,
    logoUrl: null,
    link: null,
    since: '2026-09-13T07:41:11Z',
  },
];

let pending: Promise<SponsorSectionsData> | null = null;

async function fetchSections(): Promise<SponsorSectionsData> {
  if (process.env.CALAGOPUS_SPONSORS_DEMO) return { sections: DEMO_SECTIONS };
  if (process.env.CALAGOPUS_SPONSORS_OFFLINE) return { sections: [] };

  let api: ApiSections;
  try {
    api = await fetchJson<ApiSections>(API_URL, 'sponsor sections', 'CALAGOPUS_SPONSORS_OFFLINE');
  } catch (error) {
    console.warn(`Building without featured sponsors: ${error}`);
    return { sections: [] };
  }

  return {
    sections: api.sections.map((section) => ({
      id: section.discord_user_id,
      name: section.name,
      description: section.description,
      logoUrl: section.logo_url,
      link: section.link,
      since: section.since,
    })),
  };
}

export function loadSponsorSections(): Promise<SponsorSectionsData> {
  pending ??= fetchSections();
  return pending;
}

function sectionsMarkdown(data: SponsorSectionsData): string {
  const lines = data.sections.map((section) => {
    const parts = [`**${section.name}**`];
    if (section.description) parts.push(section.description);

    if (section.link) parts.push(section.link);
    return `- ${parts.join(' - ')}`;
  });

  return [
    '## Featured sponsors',
    'These sponsors fund Calagopus development through a featured placement.',
    lines.join('\n'),
    `Every sponsor, past and present, is listed on the [sponsors page](${SPONSORS_PAGE}).`,
  ].join('\n\n');
}

export async function expandFeaturedSponsorsMarkdown(outDir: string): Promise<void> {
  const data = await loadSponsorSections();
  const markdown = data.sections.length > 0 ? sectionsMarkdown(data) : '';

  const file = join(outDir, 'index.md');
  const source = await readFile(file, 'utf8');
  await writeFile(
    file,
    source.replace(/^<FeaturedSponsors\s*\/>$/m, () => markdown),
  );
}
