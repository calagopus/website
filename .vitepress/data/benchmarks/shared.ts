import { systems } from './systems.ts';
import type { LoadResult, ScenarioResult, TargetBenchmarks, TaskResult } from './types.ts';

export const isLoad = (result: ScenarioResult): result is LoadResult => result.kind === 'load';
export const isTask = (result: ScenarioResult): result is TaskResult => result.kind === 'task';

export const systemIndex = (id: string): number => systems.findIndex((system) => system.id === id);

/**
 * A drop that misses a target renders as silent gaps rather than failing, so require every target in
 * a group to cover the same systems, and require those systems to be declared in `systems.ts`.
 */
export function assertCoverage(group: string, targets: Record<string, TargetBenchmarks>): string[] {
  const entries = Object.entries(targets);
  const [firstId, first] = entries[0];
  const expected = first.systems.map((bench) => bench.system);

  for (const id of expected) {
    if (systemIndex(id) < 0) throw new Error(`${group}/${firstId}: system '${id}' is not declared in systems.ts`);
  }
  for (const [id, target] of entries) {
    const got = target.systems.map((bench) => bench.system);
    if (got.length !== expected.length || got.some((s, i) => s !== expected[i])) {
      throw new Error(
        `${group}/${id}: covers [${got.join(', ')}], expected [${expected.join(', ')}] to match ${firstId}`,
      );
    }
  }
  return expected;
}

/** The page presents one run, so a report from a different day means a half-applied import. */
export function assertSingleRun(group: string, targets: Record<string, TargetBenchmarks>): string {
  const dates = new Set<string>();
  for (const target of Object.values(targets)) {
    for (const bench of target.systems) dates.add(bench.report.startedAt.slice(0, 10));
  }
  if (dates.size !== 1) throw new Error(`${group}: reports span ${[...dates].sort().join(', ')} - expected one run`);
  return [...dates][0];
}

/** tmpfs and disk file-task results are not comparable, and the page's methodology names one mode. */
export function assertSingleStorage(group: string, targets: Record<string, TargetBenchmarks>): string | null {
  const modes = new Map<string, string[]>();
  for (const [id, target] of Object.entries(targets)) {
    for (const bench of target.systems) {
      const mode = bench.report.storage ?? 'unrecorded';
      modes.set(mode, [...(modes.get(mode) ?? []), `${id}/${bench.system}`]);
    }
  }
  if (modes.size !== 1) {
    const detail = [...modes].map(([mode, where]) => `${mode}: ${where.join(', ')}`).join('; ');
    throw new Error(`${group}: reports mix storage modes (${detail})`);
  }
  const [mode] = modes.keys();
  return mode === 'unrecorded' ? null : mode;
}

/** Version is per report; a group-wide chip is only honest if every system ran the same build. */
export function targetVersion(target: TargetBenchmarks): string | null {
  const versions = new Set(target.systems.map((bench) => bench.report.version ?? ''));
  if (versions.size !== 1)
    throw new Error(`${target.name}: systems ran different versions (${[...versions].join(', ')})`);
  return [...versions][0].replace(/^v/, '') || null;
}
