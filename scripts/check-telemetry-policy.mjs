import assert from 'node:assert/strict';
import { classifyObservations } from '../worker/telemetry-policy.ts';

const DAY = 86400;
const HOUR = 3600;
const T0 = Date.UTC(2026, 0, 1) / 1000;
const UUID = '00000000-0000-4000-8000-000000000001';
const SMALL = { users_total: 10, servers_total: 5 };
const BIG = { users_total: 10_000, servers_total: 5 };
let seq = 0;

function obs(day, hour, metrics = {}, extra = {}) {
  return {
    uuid: UUID,
    submission_id: `sub-${++seq}`,
    received_at: T0 + day * DAY + hour * HOUR,
    valid: 1,
    action: '',
    users_total: 0,
    servers_total: 0,
    backups_total: 0,
    node_count: 0,
    database_agent_host_count: 0,
    node_memory_bytes: 0,
    servers_online: 0,
    ...metrics,
    ...extra,
  };
}
function reasons(observations) {
  return classifyObservations(observations).decisions.map((d) => d.reason);
}
function days(from, to, metrics, hour = 12) {
  return Array.from({ length: to - from }, (_, i) => obs(from + i, hour, metrics));
}
const baseline = () => days(0, 5, SMALL);
const BASELINE_REASONS = ['probation', 'probation', 'accepted', 'accepted', 'accepted'];

// classifyObservations
{
  const result = classifyObservations([...baseline(), ...days(5, 45, BIG)]);
  const r = result.decisions.map((d) => d.reason);
  assert.deepEqual(r.slice(0, 10), [
    ...BASELINE_REASONS,
    'growth:users_total',
    'growth:users_total',
    'rebaseline',
    'accepted',
    'accepted',
  ]);
  assert.deepEqual(new Set(r.slice(8)), new Set(['accepted']));
  assert.equal(result.decisions[7].accepted, 1);
  assert.equal(result.decisions[7].eligible, 1);
  assert.equal(result.history.at(-1).users_total, 10_000);
}
{
  const r = reasons([...baseline(), obs(5, 23, BIG), obs(6, 12, BIG), obs(7, 1, BIG), obs(8, 0, BIG)]);
  assert.deepEqual(r.slice(5), ['growth:users_total', 'growth:users_total', 'growth:users_total', 'rebaseline']);
}
{
  const input = [];
  for (let d = 0; d < 20; d++) {
    const small = obs(d, d % 2 ? 18 : 6, SMALL);
    const big = obs(d, d % 2 ? 6 : 18, BIG);
    input.push(...(d % 2 ? [big, small] : [small, big]));
  }
  const { decisions } = classifyObservations(input);
  for (const [i, d] of decisions.entries()) {
    assert.equal(d.accepted, input[i].users_total === 10 ? 1 : 0, `${i} ${d.reason}`);
  }
}
{
  const inflated = { users_total: 10, servers_total: 5_000 };
  const input = baseline();
  for (let d = 5; d < 25; d++) input.push(obs(d, 6, inflated), obs(d, 12, SMALL), obs(d, 20, inflated));
  const { decisions } = classifyObservations(input);
  for (const [i, d] of decisions.entries()) {
    if (input[i].servers_total === 5_000) assert.equal(d.reason, 'growth:servers_total', `${i}`);
    else assert.equal(d.accepted, 1, `${i} ${d.reason}`);
  }
}
{
  const r = reasons([...days(0, 3, SMALL), ...days(3, 10, { users_total: 30_500_001 })]);
  assert.deepEqual(r.slice(3), Array(7).fill('limit:users_total'));
}
{
  const r = reasons([
    ...baseline(),
    obs(5, 12, BIG),
    obs(6, 12, BIG),
    obs(7, 12, BIG, { action: 'quarantine' }),
    ...days(8, 11, BIG),
  ]);
  assert.deepEqual(r.slice(5), [
    'growth:users_total',
    'growth:users_total',
    'manual_quarantine',
    'growth:users_total',
    'growth:users_total',
    'rebaseline',
  ]);
  const approved = classifyObservations([...baseline(), obs(5, 12, BIG, { action: 'approve' })]).decisions[5];
  assert.equal(approved.reason, 'manual_approval');
  assert.equal(approved.accepted, 1);
}
{
  const r = reasons([...baseline(), obs(5, 12, BIG), ...days(6, 40, SMALL)]);
  assert.deepEqual(r.slice(0, 6), [...BASELINE_REASONS, 'growth:users_total']);
  assert.deepEqual(r.slice(6), Array(34).fill('accepted'));
}
{
  const real = { users_total: 10_000, servers_total: 800 };
  const input = [];
  for (let d = 0; d < 20; d++) {
    input.push(obs(d, 12, real), obs(d, 13, d % 2 ? { users_total: 1_999, servers_total: 800 } : {}));
  }
  const result = classifyObservations(input);
  for (const [i, d] of result.decisions.entries()) {
    if (i % 2) assert.equal(d.reason, 'drop:users_total', `${i}`);
    else assert.equal(d.accepted, 1, `${i} ${d.reason}`);
  }
  assert.equal(result.history.at(-1).users_total, 10_000);
}
{
  const r = reasons([
    ...days(0, 5, { users_total: 3_000, servers_total: 300 }),
    ...days(5, 15, { users_total: 50, servers_total: 3 }),
  ]);
  assert.deepEqual(r.slice(5), ['drop:users_total', 'drop:users_total', 'rebaseline', ...Array(7).fill('accepted')]);
}
{
  const r = reasons([
    ...days(0, 5, { ...SMALL, backups_total: 6_000 }),
    ...days(5, 10, { ...SMALL, backups_total: 900 }),
  ]);
  assert.deepEqual(r.slice(5), Array(5).fill('accepted'));
}
{
  const online = Array.from({ length: 12 }, (_, d) =>
    obs(d, 12, { servers_total: 1_000, servers_online: d % 2 ? 600 : 0 }),
  );
  const memory = Array.from({ length: 12 }, (_, d) =>
    obs(d, 12, { ...SMALL, node_count: 1, node_memory_bytes: d % 2 ? 3 * 1024 ** 4 : 0 }),
  );
  for (const input of [online, memory]) {
    for (const d of classifyObservations(input).decisions) assert.equal(d.accepted, 1, d.reason);
  }
}
{
  const fake = { users_total: 121_269, servers_total: 16, node_count: 3 };
  const result = classifyObservations([...days(0, 10, fake), obs(10, 12, fake, { action: 'approve' })]);
  for (const d of result.decisions) {
    assert.equal(d.reason, 'implausible:users_per_server');
    assert.equal(d.accepted, 0);
  }
  assert.equal(result.history.length, 0);

  assert.deepEqual(reasons([obs(0, 12, { servers_total: 5, servers_online: 6 })]), ['implausible:servers_online']);
  assert.deepEqual(reasons([obs(0, 12, { node_memory_bytes: 1 })]), ['implausible:node_memory_bytes']);
  for (const [users, servers] of [
    [10_000, 5],
    [25_000, 100],
  ]) {
    assert.deepEqual(reasons([obs(0, 12, { users_total: users, servers_total: servers })]), ['probation']);
    assert.deepEqual(reasons([obs(0, 12, { users_total: users + 1, servers_total: servers })]), [
      'implausible:users_per_server',
    ]);
  }
}
{
  const r = reasons([...baseline(), obs(5, 12, { users_total: 30_500_001 }, { action: 'approve' })]);
  assert.equal(r[5], 'limit:users_total');
}
{
  const base = days(0, 5, { users_total: 100, servers_total: 5 });
  const back = { users_total: 50_000, servers_total: 500 };
  const lastAccepted = base.at(-1).received_at;

  const early = classifyObservations([...base, obs(0, 0, back, { received_at: lastAccepted + 30 * DAY - 1 })]);
  assert.equal(early.decisions[5].reason, 'growth:users_total');

  const result = classifyObservations([...base, ...days(34, 37, back)]);
  assert.deepEqual(
    result.decisions.slice(5).map((d) => [d.reason, d.eligible]),
    [
      ['probation', 0],
      ['probation', 0],
      ['accepted', 1],
    ],
  );
  assert.equal(result.history.at(-1).users_total, 50_000);
}
{
  // UTC days 0, 1, 2; the first report starts at 01:00 (+1 s)
  for (const [offset, reason] of [
    [0, 'accepted'],
    [1, 'probation'],
  ]) {
    const first = T0 + HOUR + offset;
    const input = [first, T0 + DAY + 12 * HOUR, T0 + 2 * DAY].map((t) => obs(0, 0, SMALL, { received_at: t }));
    assert.deepEqual(reasons(input).at(-1), reason, `${offset}`);
  }
}
{
  const N = 20_000;
  const start = T0 + 22 * HOUR;
  const variants = [
    () => ({ users_total: 10_000, servers_total: 500 }),
    (i) => ({ users_total: i % 2 ? 100_000 : 10_000, servers_total: 500 }),
  ];
  for (const metrics of variants) {
    const input = [obs(0, 21, SMALL)];
    for (let i = 0; i < N; i++) {
      input.push(obs(0, 0, metrics(i), { received_at: start + Math.floor((i * 46 * HOUR) / N) }));
    }
    const t = performance.now();
    const { decisions } = classifyObservations(input);
    const elapsed = performance.now() - t;
    assert.ok(elapsed < 1000, `${elapsed}ms`);
    assert.equal(decisions.length, N + 1);
    assert.ok(decisions.slice(1).every((d) => d.reason === 'growth:users_total'));
  }
}

console.log('telemetry policy checks passed');
