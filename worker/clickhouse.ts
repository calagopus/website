const INSERT_TIMEOUT_MS = 5_000;
const ERROR_EXCERPT = 500;

export interface ClickHouseConfig {
  url: string;
  user: string;
  password: string;
  database: string;
}

export function clickhouseConfig(env: Env): ClickHouseConfig | null {
  if (!env.CLICKHOUSE_URL || !env.CLICKHOUSE_USER || !env.CLICKHOUSE_PASSWORD) return null;

  return {
    url: env.CLICKHOUSE_URL,
    user: env.CLICKHOUSE_USER,
    password: env.CLICKHOUSE_PASSWORD,
    database: env.CLICKHOUSE_DATABASE || 'default',
  };
}

export async function insertRows(
  config: ClickHouseConfig,
  table: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) return;

  const endpoint = new URL(config.url);
  endpoint.searchParams.set('database', config.database);
  endpoint.searchParams.set('query', `INSERT INTO ${table} FORMAT JSONEachRow`);
  endpoint.searchParams.set('async_insert', '1');
  endpoint.searchParams.set('wait_for_async_insert', '0');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-ClickHouse-User': config.user,
      'X-ClickHouse-Key': config.password,
      'Content-Type': 'application/json',
    },
    body: rows.map((row) => JSON.stringify(row)).join('\n'),
    signal: AbortSignal.timeout(INSERT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`clickhouse insert failed: HTTP ${response.status} ${detail.slice(0, ERROR_EXCERPT)}`);
  }

  await response.body?.cancel();
}
