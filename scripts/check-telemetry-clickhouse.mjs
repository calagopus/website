import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { DAILY_QUERY, TOTALS_QUERY, refreshTelemetryStats } from '../worker/api/telemetry-stats.ts';
import { buildRow, telemetrySchema } from '../worker/api/telemetry.ts';
import { insertRows, queryRows } from '../worker/clickhouse.ts';
import { POLICY_VERSION, SERVED_POLICY_VERSIONS } from '../worker/telemetry-policy.ts';
import {
  COMMITTED_REPUTATION,
  DIRTY_IDENTITIES,
  ELIGIBLE_GENERATIONS,
  replayIdentity,
} from '../worker/telemetry-review.ts';

const config = {
  url: 'http://127.0.0.1:18123',
  user: 'default',
  password: 'telemetry-test-only',
  database: `telemetry_test_${Date.now()}`,
};
const headers = { 'X-ClickHouse-User': config.user, 'X-ClickHouse-Key': config.password };
async function execute(sql, database = config.database) {
  const url = new URL(config.url);
  if (database) url.searchParams.set('database', database);
  const response = await fetch(url, { method: 'POST', headers, body: sql });
  const body = await response.text();
  if (!response.ok) throw new Error(body);
}
const uuid = '00000000-0000-4000-8000-000000000001';
const DAY = 86400;
const now = Math.floor(Date.now() / 1000) - 5;
function row(daysAgo, users = 10) {
  const p = telemetrySchema.parse({
    uuid,
    panel: { version: '1.2.2' },
    resources: {
      users: { total: users, languages: { en: users } },
      servers: { total: 1 },
      backups: { total: 0, disks: {} },
    },
    nodes: [],
  });
  return { ...buildRow(p, 'XX'), received_at: now - daysAgo * DAY };
}
async function totals() {
  return (await queryRows(config, TOTALS_QUERY, { from: '2000-01-01', hours: 48 }))[0];
}
async function moderate(observation, action) {
  await insertRows(
    config,
    'telemetry_moderation',
    [
      {
        uuid,
        submission_id: observation.submission_id,
        event_id: crypto.randomUUID(),
        recorded_at: Date.now(),
        action,
        reason: 'integration test',
      },
    ],
    true,
  );
}
await execute(`CREATE DATABASE ${config.database}`, null);
try {
  const schema = await readFile(new URL('./clickhouse-schema.sql', import.meta.url), 'utf8');
  for (const statement of schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean))
    await execute(statement);
  const rows = [row(4), row(3), row(2), row(1), row(0, 30500001)];
  await insertRows(config, 'telemetry_observations', rows, true);
  assert.equal(Number((await queryRows(config, 'SELECT count() AS count FROM telemetry_observations'))[0].count), 5);
  assert.equal((await queryRows(config, DIRTY_IDENTITIES)).length, 1);
  assert.equal(await replayIdentity(config, uuid), true);
  assert.equal((await queryRows(config, DIRTY_IDENTITIES)).length, 0);
  assert.equal(Number((await totals()).users), 10);
  const days = await queryRows(config, DAILY_QUERY, { from: '2000-01-01' });
  assert.equal(days.length, 3);
  assert.equal(days[0].day, new Date((now - 2 * DAY) * 1000).toISOString().slice(0, 10));
  const decisions = await queryRows(config, `SELECT reason FROM telemetry_decisions ORDER BY received_at`);
  assert.deepEqual(
    decisions.map((d) => d.reason),
    ['probation', 'probation', 'accepted', 'accepted', 'limit:users_total'],
  );

  const [current] = await queryRows(config, COMMITTED_REPUTATION);
  await insertRows(
    config,
    'telemetry_reputation',
    [{ ...current, policy_version: POLICY_VERSION - 1, started_at: current.started_at + 1 }],
    true,
  );
  const staleServed = SERVED_POLICY_VERSIONS.includes(POLICY_VERSION - 1);
  assert.equal((await queryRows(config, ELIGIBLE_GENERATIONS)).length, staleServed ? 1 : 0);
  assert.equal(Number((await totals()).users), staleServed ? 10 : 0);
  assert.equal((await queryRows(config, DIRTY_IDENTITIES)).length, 1);
  await replayIdentity(config, uuid);
  assert.equal(Number((await queryRows(config, COMMITTED_REPUTATION))[0].policy_version), POLICY_VERSION);
  assert.equal((await queryRows(config, DIRTY_IDENTITIES)).length, 0);

  await moderate(rows[3], 'quarantine');
  assert.equal((await queryRows(config, ELIGIBLE_GENERATIONS)).length, 0);
  assert.equal(Number((await totals()).instances), 0);
  await replayIdentity(config, uuid);
  const quarantineDays = await queryRows(config, DAILY_QUERY, { from: '2000-01-01' });
  assert.equal(quarantineDays.length, 2);
  assert.equal(Number((await totals()).instances), 0);

  await moderate(rows[3], 'reset');
  await replayIdentity(config, uuid);
  assert.equal(Number((await totals()).users), 10);
  await moderate(rows[4], 'approve');
  await replayIdentity(config, uuid);
  assert.equal(Number((await totals()).users), 10);
  await moderate(rows[4], 'reset');
  await replayIdentity(config, uuid);
  assert.equal(Number((await totals()).users), 10);

  const sameDay = row(1, 11);
  sameDay.received_at = rows[3].received_at + 5;
  await insertRows(config, 'telemetry_observations', [sameDay], true);
  await replayIdentity(config, uuid);
  assert.equal(Number((await totals()).users), 11);
  await moderate(sameDay, 'quarantine');
  await replayIdentity(config, uuid);
  assert.equal(Number((await totals()).users), 10);

  const [committed] = await queryRows(
    config,
    'SELECT * FROM telemetry_reputation ORDER BY started_at DESC,generation DESC LIMIT 1',
  );
  const staleGeneration = crypto.randomUUID();
  await insertRows(
    config,
    'telemetry_accepted_history',
    [{ uuid, generation: staleGeneration, submission_id: crypto.randomUUID(), received_at: now, users_total: 99999 }],
    true,
  );
  assert.equal(Number((await totals()).users), 10);
  await insertRows(
    config,
    'telemetry_reputation',
    [{ ...committed, generation: staleGeneration, started_at: committed.started_at - 1 }],
    true,
  );
  assert.equal(Number((await totals()).users), 10);

  let cached;
  await refreshTelemetryStats({
    CLICKHOUSE_URL: config.url,
    CLICKHOUSE_USER: config.user,
    CLICKHOUSE_PASSWORD: config.password,
    CLICKHOUSE_DATABASE: config.database,
    VERSION_CACHE: {
      put: async (key, value) => {
        cached = { key, ...JSON.parse(value) };
      },
    },
  });
  assert.equal(cached.status, 'insufficient_data');
  assert.equal(cached.key, 'telemetry::accepted-snapshot:v1');
  const oldOrphan = crypto.randomUUID();
  const recentOrphan = crypto.randomUUID();
  const [latestHistory] = await queryRows(
    config,
    `SELECT * EXCEPT(day) FROM telemetry_accepted_history WHERE generation = {generation:UUID} LIMIT 1`,
    { generation: committed.generation },
  );
  await insertRows(
    config,
    'telemetry_accepted_history',
    [
      { ...latestHistory, generation: oldOrphan, generated_at: now - 8 * DAY },
      { ...latestHistory, generation: recentOrphan, generated_at: now },
      { ...latestHistory, generated_at: now - 8 * DAY },
    ],
    true,
  );
  const rawCount = Number((await queryRows(config, 'SELECT count() AS count FROM telemetry_observations'))[0].count);
  const cliEnv = {
    ...process.env,
    CLICKHOUSE_URL: config.url,
    CLICKHOUSE_USER: config.user,
    CLICKHOUSE_PASSWORD: config.password,
    CLICKHOUSE_DATABASE: config.database,
  };
  const prune = execFileSync(process.execPath, ['scripts/telemetry.mjs', 'prune'], { env: cliEnv, encoding: 'utf8' });
  assert.match(prune, /Removed obsolete derived generations/);
  const retained = await queryRows(config, 'SELECT generation FROM telemetry_accepted_history GROUP BY generation');
  assert.ok(!retained.some((r) => r.generation === oldOrphan));
  assert.ok(retained.some((r) => r.generation === recentOrphan));
  assert.ok(retained.some((r) => r.generation === committed.generation));
  assert.equal(
    Number((await queryRows(config, 'SELECT count() AS count FROM telemetry_observations'))[0].count),
    rawCount,
  );
  const status = JSON.parse(
    execFileSync(process.execPath, ['scripts/telemetry.mjs', 'quarantined', uuid], { env: cliEnv, encoding: 'utf8' }),
  );
  assert.ok(status.decisions.some((d) => d.reason === 'limit:users_total'));
  const reset = execFileSync(
    process.execPath,
    ['scripts/telemetry.mjs', 'reset', uuid, rows[4].submission_id, 'test reversal'],
    { env: cliEnv, encoding: 'utf8' },
  );
  assert.match(reset, /Moderation saved and history rebuilt/);
  assert.equal(Number((await totals()).users), 10);

  const existing = Array.from({ length: 100 }, () => crypto.randomUUID());
  const newcomers = Array.from({ length: 120 }, () => crypto.randomUUID());
  await insertRows(
    config,
    'telemetry_observations',
    [...existing, ...newcomers].map((id) => ({ ...row(0), uuid: id })),
    true,
  );
  await insertRows(
    config,
    'telemetry_reputation',
    existing.map((id) => ({
      ...committed,
      uuid: id,
      generation: crypto.randomUUID(),
      source_count: 0,
      source_fingerprint: '0',
      moderation_revision: '',
    })),
    true,
  );
  const flood = crypto.randomUUID();
  await execute(
    `INSERT INTO telemetry_observations (uuid,submission_id,received_at,panel_version) SELECT toUUID('${flood}'),generateUUIDv4(),now(),'1.2.2' FROM numbers(20001)`,
  );
  const queue = await queryRows(config, DIRTY_IDENTITIES);
  assert.equal(queue.length, 221);
  const head = queue.slice(0, 100);
  assert.equal(head.filter((r) => existing.includes(r.uuid)).length, 75);
  assert.equal(head.filter((r) => newcomers.includes(r.uuid)).length, 25);
  assert.ok(queue.some((r) => r.uuid === flood));
  assert.equal(await replayIdentity(config, flood), true);
  const [flooded] = await queryRows(
    config,
    'SELECT count() AS count FROM telemetry_decisions WHERE uuid = {uuid:UUID}',
    {
      uuid: flood,
    },
  );
  assert.equal(Number(flooded.count), 24);
  await refreshTelemetryStats({
    CLICKHOUSE_URL: config.url,
    CLICKHOUSE_USER: config.user,
    CLICKHOUSE_PASSWORD: config.password,
    CLICKHOUSE_DATABASE: config.database,
    VERSION_CACHE: {
      put: async (key, value) => {
        cached = { key, ...JSON.parse(value) };
      },
    },
  });
  assert.equal(cached.status, 'insufficient_data');
  assert.equal(Number((await totals()).instances), 1);
  console.log('telemetry ClickHouse checks passed');
} finally {
  await execute(`DROP DATABASE ${config.database}`, null);
}
