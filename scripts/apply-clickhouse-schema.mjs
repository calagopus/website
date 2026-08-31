import { readFile } from 'node:fs/promises';

const SCHEMA = 'scripts/clickhouse-schema.sql';
const CONFIG = 'wrangler.json';

const url = process.env.CLICKHOUSE_URL;
const user = process.env.CLICKHOUSE_USER;
const password = process.env.CLICKHOUSE_PASSWORD;

if (!url || !user || !password) {
  console.error('CLICKHOUSE_URL, CLICKHOUSE_USER and CLICKHOUSE_PASSWORD must be set.');
  process.exit(2);
}

const { vars } = JSON.parse(await readFile(CONFIG, 'utf8'));
const database = process.env.CLICKHOUSE_DATABASE || vars.CLICKHOUSE_DATABASE;

if (!database) {
  console.error(`${CONFIG}: vars.CLICKHOUSE_DATABASE must be set.`);
  process.exit(2);
}

async function execute(statement, options = {}) {
  const endpoint = new URL(url);
  if (options.database !== null) endpoint.searchParams.set('database', database);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'X-ClickHouse-User': user, 'X-ClickHouse-Key': password },
    body: statement,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${(await response.text()).trim()}`);
  }

  await response.text();
}

/** Splits on semicolons outside of quotes and strips `--` comments. */
function statements(sql) {
  return sql
    .split('\n')
    .map((sqlLine) => sqlLine.replace(/--.*$/, ''))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

const sql = await readFile(SCHEMA, 'utf8');
const pending = statements(sql);

await execute(`CREATE DATABASE IF NOT EXISTS \`${database}\``, { database: null });

for (const [index, statement] of pending.entries()) {
  try {
    await execute(statement);
  } catch (error) {
    console.error(`statement ${index + 1}/${pending.length} failed: ${error.message}`);
    console.error(statement.split('\n')[0]);
    process.exit(1);
  }
}

console.log(`applied ${pending.length} statement(s) to ClickHouse database "${database}".`);
