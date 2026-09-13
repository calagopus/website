import { defineLoader } from 'vitepress';
import { loadSponsorSections, type SponsorSectionsData } from '../plugins/sponsor-sections.ts';

export type { SponsorSection, SponsorSectionsData } from '../plugins/sponsor-sections.ts';

declare const data: SponsorSectionsData;

export { data };

export default defineLoader({
  async load(): Promise<SponsorSectionsData> {
    return await loadSponsorSections();
  },
});
