export type ErrorSource =
  | 'boundary'
  | 'api'
  | 'unhandledrejection'
  | 'window.onerror'
  | 'custom'
  | (string & {});

export interface ErrorReportContext {
  source?: ErrorSource;
  route?: string;
  componentStack?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorReportPayload {
  message: string;
  name: string;
  stack?: string;
  source: ErrorSource;
  route: string;
  timestamp: string;
  componentStack?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorReporterAdapter {
  report(payload: ErrorReportPayload, rawError?: unknown): void;
}

export const REDACTED_ADDRESS = '[REDACTED_WALLET_ADDRESS]';

// Matches Stellar StrKey tokens:
// - G... (56 chars: ed25519 public key)
// - S... (56 chars: ed25519 secret seed)
// - C... (56 chars: Soroban contract address)
// - M... (69 chars: muxed account address)
// Also matches 0x-prefixed hex wallet addresses (40-64 hex chars).
const STELLAR_ADDRESS_REGEX = /\b(?:[GSCM][A-Z2-7]{55}|M[A-Z2-7]{68})\b/g;
const HEX_WALLET_REGEX = /\b0x[a-fA-F0-9]{40,64}\b/g;

/**
 * Scrubs wallet addresses (Stellar public keys, secret seeds, contract/muxed addresses,
 * and hex wallet addresses) from free-form text to prevent leaking PII in telemetry.
 */
export function scrubPii(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }
  return input
    .replace(STELLAR_ADDRESS_REGEX, REDACTED_ADDRESS)
    .replace(HEX_WALLET_REGEX, REDACTED_ADDRESS);
}

/**
 * Recursively scrubs wallet addresses from arbitrary values (strings, arrays, plain objects).
 */
export function scrubValue<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value === 'string') {
    return scrubPii(value) as unknown as T;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value as object)) {
    return '[Circular]' as unknown as T;
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, seen)) as unknown as T;
  }

  if (value instanceof Error) {
    const clonedError = new Error(scrubPii(value.message));
    clonedError.name = scrubPii(value.name);
    if (value.stack) {
      clonedError.stack = scrubPii(value.stack);
    }
    return clonedError as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[scrubPii(key)] = scrubValue(val, seen);
  }
  return out as T;
}

/**
 * Default no-op adapter used in production when no external adapter is configured.
 */
export const noopErrorAdapter: ErrorReporterAdapter = {
  report(): void {
    // intentionally no-op
  },
};

/**
 * Console adapter for local development diagnostics.
 */
export const consoleErrorAdapter: ErrorReporterAdapter = {
  report(payload: ErrorReportPayload): void {
    console.error('[ErrorReporter:' + payload.source + '] ' + payload.message, payload);
  },
};

let activeAdapter: ErrorReporterAdapter = noopErrorAdapter;

export function setErrorReporterAdapter(adapter: ErrorReporterAdapter | null | undefined): void {
  activeAdapter = adapter ?? noopErrorAdapter;
}

export function getErrorReporterAdapter(): ErrorReporterAdapter {
  return activeAdapter;
}

export function resetErrorReporterAdapter(): void {
  activeAdapter = noopErrorAdapter;
}

function resolveCurrentRoute(explicitRoute?: string): string {
  if (explicitRoute && explicitRoute.trim().length > 0) {
    return scrubPii(explicitRoute);
  }
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname || '/';
    return scrubPii(pathname);
  }
  return '/';
}

function normalizeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: scrubPii(error.name || 'Error'),
      message: scrubPii(error.message || 'Unknown error'),
      stack: error.stack ? scrubPii(error.stack) : undefined,
    };
  }
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: scrubPii(error),
    };
  }
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { name?: unknown; message?: unknown; stack?: unknown };
    const name = typeof candidate.name === 'string' ? candidate.name : 'Error';
    const message =
      typeof candidate.message === 'string'
        ? candidate.message
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error);
            }
          })();
    const stack = typeof candidate.stack === 'string' ? candidate.stack : undefined;
    return {
      name: scrubPii(name),
      message: scrubPii(message),
      stack: stack ? scrubPii(stack) : undefined,
    };
  }
  return {
    name: 'Error',
    message: scrubPii(String(error ?? 'Unknown error')),
  };
}

/**
 * Formats, scrubs PII from, and dispatches an error report to the active adapter.
 */
export function reportError(
  error: unknown,
  context: ErrorReportContext = {}
): ErrorReportPayload {
  const normalized = normalizeError(error);
  const route = resolveCurrentRoute(context.route);
  const source: ErrorSource = context.source ?? 'custom';

  const payload: ErrorReportPayload = {
    name: normalized.name,
    message: normalized.message,
    ...(normalized.stack !== undefined ? { stack: normalized.stack } : {}),
    source,
    route,
    timestamp: new Date().toISOString(),
    ...(context.componentStack !== undefined
      ? { componentStack: scrubPii(context.componentStack) }
      : {}),
    ...(context.endpoint !== undefined ? { endpoint: scrubPii(context.endpoint) } : {}),
    ...(context.method !== undefined ? { method: context.method.toUpperCase() } : {}),
    ...(context.status !== undefined ? { status: context.status } : {}),
    ...(context.metadata !== undefined ? { metadata: scrubValue(context.metadata) } : {}),
  };

  try {
    const scrubbedRawError = error instanceof Error ? scrubValue(error) : normalized.message;
    activeAdapter.report(payload, scrubbedRawError);
  } catch {
    // Never let a faulty telemetry adapter crash the application
  }

  return payload;
}

/**
 * Installs global window.onerror and unhandledrejection listeners that route
 * uncaught runtime exceptions and rejected promises through reportError().
 * Returns a cleanup function to detach the listeners.
 */
export function installGlobalErrorHandlers(targetWindow?: Window): () => void {
  const win = targetWindow ?? (typeof window !== 'undefined' ? window : undefined);
  if (!win) {
    return () => {};
  }

  const previousOnError = win.onerror;

  const onErrorHandler: OnErrorEventHandler = (
    eventOrMessage,
    sourceUrl,
    lineno,
    colno,
    error
  ) => {
    const rawError =
      error ??
      (typeof eventOrMessage === 'string'
        ? new Error(eventOrMessage)
        : new Error('Unhandled window error'));

    reportError(rawError, {
      source: 'window.onerror',
      metadata: {
        ...(typeof sourceUrl === 'string' ? { filename: sourceUrl } : {}),
        ...(typeof lineno === 'number' ? { lineno } : {}),
        ...(typeof colno === 'number' ? { colno } : {}),
      },
    });

    if (typeof previousOnError === 'function') {
      return previousOnError.call(win, eventOrMessage, sourceUrl, lineno, colno, error);
    }
    return false;
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event?.reason ?? new Error('Unhandled promise rejection');
    reportError(reason, {
      source: 'unhandledrejection',
    });
  };

  win.onerror = onErrorHandler;
  win.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    if (win.onerror === onErrorHandler) {
      win.onerror = previousOnError;
    }
    win.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
