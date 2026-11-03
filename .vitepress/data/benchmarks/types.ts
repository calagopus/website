export type AuthMode = 'unauthenticated' | 'authenticated';
export type TargetKind = 'panel' | 'daemon';

export type Operation =
  | 'health'
  | 'login'
  | 'account'
  | 'listServers'
  | 'websocketCredentials'
  | 'system'
  | 'listDirectory'
  | 'fileContents'
  | 'chmod';

export type TaskOperation =
  | 'compress'
  | 'decompress'
  | 'deleteTree'
  | 'writeFile'
  | 'listDirectory'
  | 'sftpLogin'
  | 'sftpList'
  | 'sftpUpload'
  | 'sftpDownload'
  | 'sftpGetTree'
  | 'sftpPutTree';

export type ScenarioParams = Readonly<Record<string, string | number | undefined>>;

export interface LoadProfile {
  concurrency: number;
  requests?: number;
  durationMs?: number;
  warmupMs?: number;
}

export interface LoadScenario {
  kind: 'load';
  name: string;
  operation: Operation;
  auth: AuthMode;
  load: LoadProfile;
  params?: ScenarioParams;
}

export interface TaskScenario {
  kind: 'task';
  name: string;
  operation: TaskOperation;
  auth: AuthMode;
  repetitions: number;
  warmup: boolean;
  params?: ScenarioParams;
}

export type Scenario = LoadScenario | TaskScenario;

export interface ResourceLimit {
  cpus: number;
  memoryMb?: number;
}

export interface LatencyStats {
  min: number;
  max: number;
  mean: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface TaskStats {
  min: number;
  max: number;
  mean: number;
  median: number;
}

export interface ResourceUsage {
  cpuMs: number;
  windowMs: number;
  cpuPercentMean: number;
  cpuPercentMax: number;
  /** Anonymous + shared-anonymous memory (`anon + shmem`) */
  heapMbMean: number;
  heapMbMax: number;
  samples: number;
}

export interface LoadResult {
  kind: 'load';
  scenario: LoadScenario;
  ok: number;
  ratelimited: number;
  failed: number;
  errored: number;
  elapsedMs: number;
  throughput: number;
  latency: LatencyStats | null;
  statusCounts: Readonly<Partial<Record<number, number>>>;
  resources: ResourceUsage | null;
  cpuMsPerRequest: number | null;
}

export interface TaskResult {
  kind: 'task';
  scenario: TaskScenario;
  ok: number;
  failed: number;
  stats: TaskStats | null;
  bytes: number;
  mbPerSec: number | null;
  statusCounts: Readonly<Partial<Record<number, number>>>;
  resources: ResourceUsage | null;
  cpuMsPerRun: number | null;
}

export type ScenarioResult = LoadResult | TaskResult;

export interface VariantReport {
  limit: ResourceLimit;
  idle: ResourceUsage | null;
  results: ScenarioResult[];
}

export interface SuiteReport {
  target: string;
  kind: TargetKind;
  version: string | null;
  storage?: 'tmpfs' | 'disk' | null;
  startedAt: string;
  notes: string[];
  variants: VariantReport[];
}

export interface SystemBenchmark {
  system: string;
  report: SuiteReport;
}

export interface TargetBenchmarks {
  name: string;
  kind: TargetKind;
  icon: string;
  color: string;
  systems: SystemBenchmark[];
}
