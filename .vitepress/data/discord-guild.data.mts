import { defineLoader } from 'vitepress';
import { type DiscordGuildData, loadDiscordGuild } from '../plugins/discord-guild.ts';

export type { DiscordGuildData } from '../plugins/discord-guild.ts';

declare const data: DiscordGuildData;

export { data };

export default defineLoader({
  async load(): Promise<DiscordGuildData> {
    return await loadDiscordGuild();
  },
});
