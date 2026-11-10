import type { LoadScenario } from './types.ts';
import { panelIds, panels } from './panels/index.ts';
import { assertCoverage, assertSingleRun, targetVersion } from './shared.ts';
import { systems } from './systems.ts';

export type { PanelId } from './panels/index.ts';
export { panelIds, panels } from './panels/index.ts';
export { isLoad, isTask, systemIndex } from './shared.ts';
export { systems } from './systems.ts';
export type * from './types.ts';

export const coveredSystems: string[] = assertCoverage('panels', panels);
export const runDate: string = assertSingleRun('panels', panels);

export const chartSystems = systems.filter((system) => coveredSystems.includes(system.id));
export const pendingSystems = systems.filter((system) => !coveredSystems.includes(system.id));

export const panelVersions: Record<string, string | null> = Object.fromEntries(
  panelIds.map((id) => [id, targetVersion(panels[id])]),
);

const reference = panels.calagopus.systems[0].report.variants;

export const scenarios: string[] = reference[0].results.map((result) => result.scenario.name);
export const cpuOptions: number[] = reference.map((variant) => variant.limit.cpus);

for (const [id, panel] of Object.entries(panels)) {
  for (const bench of panel.systems) {
    for (const variant of bench.report.variants) {
      for (const result of variant.results) {
        if (result.kind !== 'load')
          throw new Error(`panels/${id}: unexpected ${result.kind} scenario '${result.scenario.name}'`);
      }
    }
  }
}

export type PanelScenario = LoadScenario;
