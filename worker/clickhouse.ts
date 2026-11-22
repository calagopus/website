const ASYNC_INSERT_TIMEOUT_MS = 5_000;
const ACKNOWLEDGED_INSERT_TIMEOUT_MS = 20_000;
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
  acknowledged = false,
): Promise<void> {
  if (rows.length === 0) return;

  const endpoint = new URL(config.url);
  endpoint.searchParams.set('database', config.database);
  endpoint.searchParams.set('query', `INSERT INTO ${table} FORMAT JSONEachRow`);
  endpoint.searchParams.set('async_insert', acknowledged ? '0' : '1');
  endpoint.searchParams.set('wait_for_async_insert', acknowledged ? '1' : '0');
  const timeout = acknowledged ? ACKNOWLEDGED_INSERT_TIMEOUT_MS : ASYNC_INSERT_TIMEOUT_MS;
  endpoint.searchParams.set('max_execution_time', String(Math.ceil(timeout / 1_000)));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-ClickHouse-User': config.user,
      'X-ClickHouse-Key': config.password,
      'Content-Type': 'application/json',
    },
    body: rows.map((row) => JSON.stringify(row)).join('\n'),
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`clickhouse insert failed: HTTP ${response.status} ${detail.slice(0, ERROR_EXCERPT)}`);
  }

  await response.body?.cancel();
}

const QUERY_TIMEOUT_MS = 20_000;
const MAX_RESULT_ROWS = 100_000;

/**
 * Runs a read-only query and returns its rows. Values for `{name:Type}` placeholders in the
 * statement must be passed through `params`, never interpolated, so callers cannot build SQL.
 */
export async function queryRows<T>(
  config: ClickHouseConfig,
  query: string,
  params: Record<string, string | number> = {},
): Promise<T[]> {
  const endpoint = new URL(config.url);
  endpoint.searchParams.set('database', config.database);
  endpoint.searchParams.set('default_format', 'JSON');
  endpoint.searchParams.set('output_format_json_quote_64bit_integers', '0');
  endpoint.searchParams.set('max_result_rows', String(MAX_RESULT_ROWS));
  endpoint.searchParams.set('result_overflow_mode', 'throw');
  endpoint.searchParams.set('max_execution_time', String(Math.ceil(QUERY_TIMEOUT_MS / 1_000)));
  endpoint.searchParams.set('readonly', '2');

  for (const [name, value] of Object.entries(params)) {
    endpoint.searchParams.set(`param_${name}`, String(value));
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-ClickHouse-User': config.user,
      'X-ClickHouse-Key': config.password,
      'Content-Type': 'text/plain',
    },
    body: query,
    signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`clickhouse query failed: HTTP ${response.status} ${detail.slice(0, ERROR_EXCERPT)}`);
  }

  const body = (await response.json()) as { data?: T[] };
  return body.data ?? [];
}
