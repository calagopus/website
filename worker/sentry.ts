import { ProtocolError } from '@modelcontextprotocol/server';
import {
  addBreadcrumb,
  type CloudflareOptions,
  captureException,
  cronTriggersIntegration,
  type ErrorEvent,
  type EventHint,
  getActiveSpan,
} from '@sentry/cloudflare';

type SentryEnv = Env & {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
};

const MCP_MECHANISM = 'auto.ai.mcp_server';
const CRON_MONITOR = 'website-scheduled-refresh';

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'content-type',
  'content-length',
  'user-agent',
  'mcp-protocol-version',
  'mcp-method',
  'mcp-name',
];

const CLIENT_FAULT_MESSAGE =
  /^(Rejected |Unsupported Media Type|Not Acceptable|Invalid Request|Bad Request|Parse error|Method not allowed|Conflict|Session not found|Invalid event ID|Invalid (Host|Origin) header|Payload Too Large)/;
const CLIENT_FAULT_ERROR_NAMES = new Set(['SyntaxError', 'ZodError']);
const CLIENT_FAULT_RPC_CODES = new Set([-32020, -32021, -32022]);

export function isMcpClientFault(error: unknown): boolean {
  if (error instanceof ProtocolError) return true;
  if (!(error instanceof Error)) return false;
  if (CLIENT_FAULT_ERROR_NAMES.has(error.name)) return true;

  const rpcCode = error.name.match(/^JsonRpcError_(-?\d+)$/)?.[1];
  if (rpcCode !== undefined) return CLIENT_FAULT_RPC_CODES.has(Number(rpcCode));

  return CLIENT_FAULT_MESSAGE.test(error.message);
}

function dropMcpClientFaults(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const mechanism = event.exception?.values?.at(-1)?.mechanism;
  if (mechanism?.type !== MCP_MECHANISM) return event;

  const errorType = mechanism.data?.error_type;
  if (errorType !== 'transport' && errorType !== 'protocol') return event;

  return isMcpClientFault(hint.originalException) ? null : event;
}

export function reportMcpHandlerError(error: Error): void {
  if (isMcpClientFault(error)) {
    getActiveSpan()?.setAttribute('mcp.request.rejected', error.message);
    addBreadcrumb({ category: 'mcp', level: 'warning', message: error.message });
    return;
  }

  captureException(error, { mechanism: { type: MCP_MECHANISM, handled: false, data: { error_type: 'handler' } } });
}

export function reportMcpToolFailure(tool: string, error: unknown): void {
  captureException(error, {
    mechanism: { type: MCP_MECHANISM, handled: true, data: { error_type: 'tool_execution', tool_name: tool } },
  });
}

function sampleRate(raw: string | undefined): number {
  const parsed = Number.parseFloat(raw ?? '');
  return Number.isFinite(parsed) ? parsed : 1;
}

export function sentryOptions(env: SentryEnv): CloudflareOptions {
  return {
    dsn: env.SENTRY_DSN,
    enabled: Boolean(env.SENTRY_DSN),
    environment: env.SENTRY_ENVIRONMENT ?? 'production',
    tracesSampleRate: sampleRate(env.SENTRY_TRACES_SAMPLE_RATE),
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: FORWARDED_REQUEST_HEADERS }, response: false },
      httpBodies: [],
      mcp: { inputs: true, outputs: false },
    },
    integrations: [cronTriggersIntegration({ monitorSlug: () => CRON_MONITOR })],
    beforeSend: dropMcpClientFaults,
  };
}
