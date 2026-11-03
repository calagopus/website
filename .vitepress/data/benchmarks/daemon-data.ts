import { daemonIds, daemons } from './daemons/index.ts';
import { assertCoverage, assertSingleRun, assertSingleStorage, targetVersion } from './shared.ts';
import { systems } from './systems.ts';
import type { ScenarioResult, TaskOperation } from './types.ts';

export type { DaemonId } from './daemons/index.ts';
export { daemonIds, daemons } from './daemons/index.ts';

export const daemonCoveredSystems: string[] = assertCoverage('daemons', daemons);
export const daemonRunDate: string = assertSingleRun('daemons', daemons);
export const daemonStorage: string | null = assertSingleStorage('daemons', daemons);
export const daemonChartSystems = systems.filter((system) => daemonCoveredSystems.includes(system.id));
export const daemonPendingSystems = systems.filter((system) => !daemonCoveredSystems.includes(system.id));

export const daemonVersions: Record<string, string | null> = Object.fromEntries(
  daemonIds.map((id) => [id, targetVersion(daemons[id])]),
);

export const daemonCpuOptions: number[] = daemons.calagopus.systems[0].report.variants.map((v) => v.limit.cpus);

export interface DaemonScenario {
  name: string;
  kind: ScenarioResult['kind'];
  operation: string;
  missingFrom: string[];
  hasBytes: boolean;
}

function buildScenarios(): DaemonScenario[] {
  const widest = daemonIds
    .map((id) => daemons[id].systems[0].report.variants[0].results)
    .sort((a, b) => b.length - a.length)[0];

  return widest.map((result) => {
    const name = result.scenario.name;
    const missingFrom = daemonIds.filter(
      (id) => !daemons[id].systems[0].report.variants[0].results.some((r) => r.scenario.name === name),
    );
    return {
      name,
      kind: result.kind,
      operation: result.scenario.operation,
      missingFrom,
      hasBytes: result.kind === 'task' && result.bytes > 0,
    };
  });
}

export const daemonScenarios: DaemonScenario[] = buildScenarios();
export const loadScenarios = daemonScenarios.filter((s) => s.kind === 'load');
export const taskScenarios = daemonScenarios.filter((s) => s.kind === 'task');

const FAMILIES: { label: string; operations: TaskOperation[] }[] = [
  { label: 'Compression', operations: ['compress'] },
  { label: 'Decompression', operations: ['decompress'] },
  { label: 'Deletion', operations: ['deleteTree'] },
  { label: 'Transfer', operations: ['writeFile'] },
  { label: 'Large directory listings', operations: ['listDirectory'] },
  {
    label: 'SFTP',
    operations: ['sftpLogin', 'sftpList', 'sftpUpload', 'sftpDownload', 'sftpGetTree', 'sftpPutTree'],
  },
];

const familyOperations = new Set<string>(FAMILIES.flatMap((family) => family.operations));
const unfamilied = taskScenarios.filter((s) => !familyOperations.has(s.operation));
if (unfamilied.length > 0) {
  throw new Error(`daemons: task scenarios with no family: ${unfamilied.map((s) => s.name).join(', ')}`);
}

export const taskFamilies = FAMILIES.map(({ label, operations }) => ({
  label,
  scenarios: taskScenarios.filter((s) => (operations as string[]).includes(s.operation)),
})).filter((family) => family.scenarios.length > 0);
