import { z } from 'zod';
import { clickhouseConfig, insertRows } from '../clickhouse.ts';
import { accepted, noStore, preflight } from '../http.ts';

const TABLE = 'telemetry_submissions';

const MAX_BODY_BYTES = 512 * 1024;
const MAX_NODES = 2_000;
const MAX_EXTENSIONS = 500;
const MAX_MAP_ENTRIES = 512;
const MAX_AUTHORS = 32;

const label = z.string().max(128).catch('');
const line = z.string().max(1_024).catch('');
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).catch(0);

const counts = z
  .record(label, count)
  .catch({})
  .transform((value) => Object.fromEntries(Object.entries(value).slice(0, MAX_MAP_ENTRIES)));

const MEMORY_FALLBACK = { total_bytes: 0, free_bytes: 0, used_bytes: 0, used_bytes_process: 0 };

const memory = z
  .object({
    total_bytes: count,
    free_bytes: count,
    used_bytes: count,
    used_bytes_process: count,
  })
  .catch(MEMORY_FALLBACK);

const TRIPLE_FALLBACK = { total: 0, online: 0, offline: 0 };

const triple = z.object({ total: count, online: count, offline: count }).catch(TRIPLE_FALLBACK);

const host = {
  version: label,
  container_type: label,
  architecture: label,
  kernel_version: line,
  memory,
};

const node = z.object({ ...host, servers: triple });
const databaseAgentHost = z.object({ ...host, instances: triple });

const extension = z.object({
  metadata_toml: z
    .object({
      package_name: label,
      name: label,
      panel_version: label,
      license_text: z.string().nullish().catch(null),
    })
    .catch({ package_name: '', name: '', panel_version: '', license_text: null }),
  package_name: label,
  description: line,
  authors: z.array(label).catch([]),
  version: label,
});

const list = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z
    .array(item.catch(null as never))
    .catch([])
    .transform((entries) => entries.filter((entry) => entry !== null).slice(0, max));

export const telemetrySchema = z.object({
  uuid: z.guid(),
  panel: z
    .object({
      version: label,
      container_type: label,
      database_version: label,
      cache_version: label,
      architecture: label,
      kernel_version: line,
    })
    .catch({
      version: '',
      container_type: '',
      database_version: '',
      cache_version: '',
      architecture: '',
      kernel_version: '',
    }),
  resources: z
    .object({
      users: z.object({ total: count, languages: counts }).catch({ total: 0, languages: {} }),
      backups: z.object({ total: count, disks: counts }).catch({ total: 0, disks: {} }),
      servers: z.object({ total: count }).catch({ total: 0 }),
    })
    .catch({
      users: { total: 0, languages: {} },
      backups: { total: 0, disks: {} },
      servers: { total: 0 },
    }),
  extensions: list(extension, MAX_EXTENSIONS),
  nodes: list(node, MAX_NODES),
  database_agent_hosts: list(databaseAgentHost, MAX_NODES),
});

export type Telemetry = z.infer<typeof telemetrySchema>;

function column<T, R>(entries: T[], select: (entry: T) => R): R[] {
  return entries.map(select);
}

export function buildRow(telemetry: Telemetry, country: string): Record<string, unknown> {
  const { panel, resources, nodes, database_agent_hosts: hosts, extensions } = telemetry;

  return {
    submission_id: crypto.randomUUID(),
    received_at: Math.floor(Date.now() / 1000),
    country,

    uuid: telemetry.uuid,

    panel_version: panel.version,
    panel_container_type: panel.container_type,
    panel_database_version: panel.database_version,
    panel_cache_version: panel.cache_version,
    panel_architecture: panel.architecture,
    panel_kernel_version: panel.kernel_version,

    users_total: resources.users.total,
    users_languages: resources.users.languages,
    backups_total: resources.backups.total,
    backups_disks: resources.backups.disks,
    servers_total: resources.servers.total,

    'nodes.version': column(nodes, (entry) => entry.version),
    'nodes.container_type': column(nodes, (entry) => entry.container_type),
    'nodes.architecture': column(nodes, (entry) => entry.architecture),
    'nodes.kernel_version': column(nodes, (entry) => entry.kernel_version),
    'nodes.memory_total_bytes': column(nodes, (entry) => entry.memory.total_bytes),
    'nodes.memory_free_bytes': column(nodes, (entry) => entry.memory.free_bytes),
    'nodes.memory_used_bytes': column(nodes, (entry) => entry.memory.used_bytes),
    'nodes.memory_used_bytes_process': column(nodes, (entry) => entry.memory.used_bytes_process),
    'nodes.servers_total': column(nodes, (entry) => entry.servers.total),
    'nodes.servers_online': column(nodes, (entry) => entry.servers.online),
    'nodes.servers_offline': column(nodes, (entry) => entry.servers.offline),

    'database_agent_hosts.version': column(hosts, (entry) => entry.version),
    'database_agent_hosts.container_type': column(hosts, (entry) => entry.container_type),
    'database_agent_hosts.architecture': column(hosts, (entry) => entry.architecture),
    'database_agent_hosts.kernel_version': column(hosts, (entry) => entry.kernel_version),
    'database_agent_hosts.memory_total_bytes': column(hosts, (entry) => entry.memory.total_bytes),
    'database_agent_hosts.memory_free_bytes': column(hosts, (entry) => entry.memory.free_bytes),
    'database_agent_hosts.memory_used_bytes': column(hosts, (entry) => entry.memory.used_bytes),
    'database_agent_hosts.memory_used_bytes_process': column(hosts, (entry) => entry.memory.used_bytes_process),
    'database_agent_hosts.instances_total': column(hosts, (entry) => entry.instances.total),
    'database_agent_hosts.instances_online': column(hosts, (entry) => entry.instances.online),
    'database_agent_hosts.instances_offline': column(hosts, (entry) => entry.instances.offline),

    'extensions.package_name': column(extensions, (entry) => entry.package_name),
    'extensions.name': column(extensions, (entry) => entry.metadata_toml.name),
    'extensions.description': column(extensions, (entry) => entry.description),
    'extensions.version': column(extensions, (entry) => entry.version),
    'extensions.panel_version_req': column(extensions, (entry) => entry.metadata_toml.panel_version),
    'extensions.authors': column(extensions, (entry) => entry.authors.slice(0, MAX_AUTHORS)),
    'extensions.has_license': column(extensions, (entry) => (entry.metadata_toml.license_text ? 1 : 0)),
  };
}

async function withinRateLimit(env: Env, uuid: string, ip: string): Promise<boolean> {
  const checks: Promise<{ success: boolean }>[] = [];

  if (env.TELEMETRY_UUID_LIMITER) checks.push(env.TELEMETRY_UUID_LIMITER.limit({ key: uuid }));
  if (env.TELEMETRY_IP_LIMITER && ip) checks.push(env.TELEMETRY_IP_LIMITER.limit({ key: ip }));

  const outcomes = await Promise.all(checks);
  return outcomes.every((outcome) => outcome.success);
}

export async function handleTelemetry(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method === 'OPTIONS') return preflight('POST, OPTIONS');
  if (request.method !== 'POST') return noStore({ error: 'Method Not Allowed' }, 405);

  const declared = Number.parseInt(request.headers.get('Content-Length') ?? '', 10);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return noStore({ error: 'Payload Too Large' }, 413);

  const raw = await request.text().catch(() => null);
  if (raw === null) return noStore({ error: 'Bad Request' }, 400);
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return noStore({ error: 'Payload Too Large' }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return noStore({ error: 'Invalid JSON' }, 400);
  }

  const parsed = telemetrySchema.safeParse(payload);
  if (!parsed.success) return noStore({ error: 'Invalid telemetry payload' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (!(await withinRateLimit(env, parsed.data.uuid, ip))) return noStore({ error: 'Too Many Requests' }, 429);

  const config = clickhouseConfig(env);
  if (config === null) return accepted();

  const country = (request.cf?.country as string | undefined) ?? 'XX';
  const row = buildRow(parsed.data, country === 'T1' ? 'XX' : country);

  ctx.waitUntil(
    insertRows(config, TABLE, [row]).catch((error) => {
      console.error('telemetry insert failed', error);
    }),
  );

  return accepted();
}
