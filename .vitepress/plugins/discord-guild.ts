import { fetchJson } from '../lib/fetch-retry.ts';

const NAME = 'Calagopus';
const API_URL = 'https://calagopus.com/api/guild';

interface ApiGuild {
  name: string;
  members: {
    approximate_total: number;
    approximate_online: number;
  };
}

export interface DiscordGuildData {
  name: string;
  members: number | null;
}

export async function loadDiscordGuild(): Promise<DiscordGuildData> {
  if (process.env.CALAGOPUS_GUILD_OFFLINE) return { name: NAME, members: null };

  const api = await fetchJson<ApiGuild>(API_URL, 'Discord guild', 'CALAGOPUS_GUILD_OFFLINE');

  return { name: api.name, members: api.members.approximate_total };
}
