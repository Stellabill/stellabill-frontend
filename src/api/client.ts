import type { Subscription, SubscriptionStatus } from '@/types/subscription'
import { reportError } from '@/utils/errorReporter'

const API_BASE = '/api'

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 200;
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD']);

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse';

export interface BaseApiError extends Error {
  kind?: ApiErrorKind;
  status?: number;
  technicalDetails?: string;
  isOffline?: boolean;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}

export interface NetworkApiError extends BaseApiError {
  kind: 'network';
  isNetworkError: true;
}

export interface TimeoutApiError extends BaseApiError {
  kind: 'timeout';
  isTimeout: true;
}

export interface HttpApiError extends BaseApiError {
  kind: 'http';
  status: number;
}

export interface ParseApiError extends BaseApiError {
  kind: 'parse';
  status?: number;
}

export type DiscriminatedApiError =
  | NetworkApiError
  | TimeoutApiError
  | HttpApiError
  | ParseApiError;

export type ApiError = BaseApiError | DiscriminatedApiError;

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  jitter?: (delayMs: number, attempt: number) => number;
}

function createAbortError(reason?: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }
  const err = new Error(typeof reason === 'string' && reason ? reason : 'The operation was aborted');
  err.name = 'AbortError';
  return err;
}

function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  customJitter?: (delayMs: number, attempt: number) => number
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  if (customJitter) {
    return Math.max(0, customJitter(exponential, attempt));
  }
  // Full/half jitter in [0.5 * exponential, 1.0 * exponential]
  const factor = 0.5 + Math.random() * 0.5;
  return Math.round(exponential * factor);
}

function waitWithSignal(delayMs: number, signal?: AbortSignal | null): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError(signal.reason));
  }
  if (delayMs <= 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    let onAbort: (() => void) | undefined;
    const timerId = setTimeout(() => {
      if (signal && onAbort) {
        signal.removeEventListener('abort', onAbort);
      }
      resolve();
    }, delayMs);

    if (signal) {
      onAbort = () => {
        clearTimeout(timerId);
        reject(createAbortError(signal.reason));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export async function api<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase();

  // Simulate network offline for demo if URL has ?simulate_offline
  if (typeof window !== 'undefined' && window.location.search.includes('simulate_offline')) {
    const error: ApiError = new Error('No internet connection');
    error.kind = 'network';
    error.isOffline = true;
    error.isNetworkError = true;
    reportError(error, {
      source: 'api',
      endpoint: path,
      method,
      metadata: { isOffline: true },
    });
    throw error;
  }

  // Simulate API error for demo if URL has ?simulate_error
  if (typeof window !== 'undefined' && window.location.search.includes('simulate_error')) {
    const error: ApiError = new Error('Internal Server Error');
    error.kind = 'http';
    error.status = 500;
    error.technicalDetails = 'Database connection timeout in the backend service. [Trace: 0x823fa1]';
    reportError(error, {
      source: 'api',
      endpoint: path,
      method,
      status: error.status,
      metadata: { technicalDetails: error.technicalDetails },
    });
    throw error;
  }

  const timeoutMs = options?.timeoutMs ?? options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const isIdempotent = IDEMPOTENT_METHODS.has(method);
  const maxRetries = isIdempotent ? (options?.maxRetries ?? DEFAULT_MAX_RETRIES) : 0;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const callerSignal = options?.signal;
  const customJitter = options?.jitter;

  const fetchInit: RequestInit = { ...options };
  delete (fetchInit as ApiRequestOptions).timeout;
  delete (fetchInit as ApiRequestOptions).timeoutMs;
  delete (fetchInit as ApiRequestOptions).maxRetries;
  delete (fetchInit as ApiRequestOptions).baseDelayMs;
  delete (fetchInit as ApiRequestOptions).jitter;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (callerSignal?.aborted) {
      throw createAbortError(callerSignal.reason);
    }

    const controller = new AbortController();
    let isTimeout = false;

    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, timeoutMs);

    let onCallerAbort: (() => void) | undefined;
    if (callerSignal) {
      onCallerAbort = () => {
        controller.abort(callerSignal.reason);
      };
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }

    try {
      const res = await fetch(API_BASE + path, {
        ...fetchInit,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchInit.headers,
        },
      });

      if (!res.ok) {
        const error: ApiError = new Error('API error: ' + (res.statusText || String(res.status)));
        error.kind = 'http';
        error.status = res.status;
        try {
          const body = await res.json();
          error.technicalDetails = body.details || JSON.stringify(body);
        } catch {
          error.technicalDetails = 'No additional details provided by server.';
        }
        throw error;
      }

      if (res.status === 204 || res.headers?.get?.('content-length') === '0') {
        return undefined as unknown as T;
      }

      const contentType = res.headers?.get?.('content-type');
      if (res.headers && (!contentType || !contentType.includes('application/json'))) {
        const error: ApiError = new Error('Unexpected response format');
        error.kind = 'parse';
        error.status = res.status;
        error.technicalDetails = 'Expected application/json but received ' + (contentType || 'none');
        throw error;
      }

      if (typeof res.text === 'function') {
        const text = await res.text();
        if (!text || !text.trim()) {
          return undefined as unknown as T;
        }
        try {
          return JSON.parse(text) as T;
        } catch (err) {
          const error: ApiError = new Error('Unexpected response format');
          error.kind = 'parse';
          error.status = res.status;
          error.technicalDetails = err instanceof Error ? err.message : 'Invalid JSON';
          throw error;
        }
      }

      try {
        return (await res.json()) as T;
      } catch (err) {
        if (err instanceof SyntaxError) {
          const error: ApiError = new Error('Unexpected response format');
          error.kind = 'parse';
          error.status = res.status;
          error.technicalDetails = err.message;
          throw error;
        }
        throw err;
      }
    } catch (e: unknown) {
      if (isTimeout) {
        const error: ApiError = new Error('Request timed out');
        error.kind = 'timeout';
        error.isTimeout = true;
        reportError(error, {
          source: 'api',
          endpoint: path,
          method,
          metadata: { isTimeout: true },
        });
        throw error;
      }

      if (callerSignal?.aborted) {
        const error: ApiError = (e instanceof Error ? e : createAbortError(e)) as ApiError;
        throw error;
      }

      const apiError: ApiError = (e instanceof Error ? e : new Error(String(e))) as ApiError;

      if (apiError.name === 'TypeError' && !apiError.kind) {
        apiError.kind = 'network';
        apiError.isNetworkError = true;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          apiError.message = 'Network request failed (offline)';
          apiError.isOffline = true;
        }
      }

      const isOfflineNow =
        Boolean(apiError.isOffline) || (typeof navigator !== 'undefined' && !navigator.onLine);
      const isRetryableNetwork = apiError.kind === 'network' && !isOfflineNow;
      const isRetryableHttp =
        apiError.kind === 'http' &&
        typeof apiError.status === 'number' &&
        RETRYABLE_STATUS_CODES.has(apiError.status);

      if (attempt < maxRetries && (isRetryableNetwork || isRetryableHttp)) {
        const delayMs = computeBackoffDelay(attempt, baseDelayMs, customJitter);
        await waitWithSignal(delayMs, callerSignal);
        continue;
      }

      reportError(apiError, {
        source: 'api',
        endpoint: path,
        method,
        status: apiError.status,
        metadata: {
          ...(apiError.technicalDetails ? { technicalDetails: apiError.technicalDetails } : {}),
          ...(apiError.isOffline ? { isOffline: true } : {}),
          ...(apiError.isNetworkError ? { isNetworkError: true } : {}),
        },
      });

      throw apiError;
    } finally {
      clearTimeout(timeoutId);
      if (callerSignal && onCallerAbort) {
        callerSignal.removeEventListener('abort', onCallerAbort);
      }
    }
  }

  /* v8 ignore next */
  throw new Error('Unreachable');
}

export interface Payment {
  id: string;
  date: string;
  amount: string;
  status: 'success' | 'failed';
  hash: string;
}

/* ─── Subscriptions client ──────────────────────────────────────────────────
 *
 * Endpoints the frontend expects (all under the `/api` prefix that
 * `vite.config.ts` proxies to the backend in development):
 *
 *   GET  /subscriptions                    -> SubscriptionListResponse
 *   GET  /subscriptions/:id                -> Subscription          (404 if unknown)
 *   GET  /subscriptions/:id/payments       -> { payments: Payment[] }
 *   POST /subscriptions/:id/pause          -> SubscriptionStatusChange
 *   POST /subscriptions/:id/resume         -> SubscriptionStatusChange
 *   POST /subscriptions/:id/cancel         -> SubscriptionStatusChange
 *   POST /subscriptions/:id/reactivate     body: ReactivateSubscriptionRequest
 *                                          -> SubscriptionStatusChange
 *
 * Mutations send `Content-Type: application/json`. Non-2xx responses become
 * an `ApiError` with `status` and `technicalDetails` (the body's `details`
 * field, or the whole JSON body); network failures set `isNetworkError` /
 * `isOffline` and timeouts set `isTimeout`. See `api()` above.
 *
 * When `VITE_USE_FIXTURES` is set (hosted demo, no backend) mutations resolve
 * locally through `fixtureSubscriptionMutations` instead of calling the
 * network. Append `?fail_action` to the URL to exercise the error path there.
 * Reads are not intercepted here: pages decide how to source fixture lists.
 */

/** Response of `GET /subscriptions`. */
export interface SubscriptionListResponse {
  subscriptions: Subscription[];
}

/** Response of `GET /subscriptions/:id/payments`. */
export interface SubscriptionPaymentsResponse {
  payments: Payment[];
}

/** Response of every subscription state mutation. */
export interface SubscriptionStatusChange {
  id: string;
  status: SubscriptionStatus;
}

/** Body of `POST /subscriptions/:id/reactivate`. */
export interface ReactivateSubscriptionRequest {
  /** ISO-8601 timestamp at which billing restarts. */
  startDate: string;
}

export type SubscriptionMutation = 'pause' | 'resume' | 'cancel' | 'reactivate';

const MUTATION_RESULT_STATUS: Record<SubscriptionMutation, SubscriptionStatus> = {
  pause: 'Paused',
  resume: 'Active',
  cancel: 'Cancelled',
  reactivate: 'Active',
};

/** Simulated latency for fixture-mode mutations, in ms. */
export const FIXTURE_MUTATION_DELAY_MS = 800;

function subscriptionPath(id: string, suffix = ''): string {
  return `/subscriptions/${encodeURIComponent(id)}${suffix}`;
}

function isFixtureMode(): boolean {
  return Boolean(import.meta.env.VITE_USE_FIXTURES);
}

/**
 * Local stand-in for the mutation endpoints, used when `VITE_USE_FIXTURES` is
 * set so the hosted demo keeps working without a backend.
 */
export function fixtureSubscriptionMutations(
  action: SubscriptionMutation,
  id: string,
): Promise<SubscriptionStatusChange> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.search.includes('fail_action')) {
        const error: ApiError = new Error('Action Failed');
        error.status = 400;
        error.technicalDetails =
          'The subscription is already in the requested state or pending a transaction.';
        reject(error);
        return;
      }
      resolve({ id, status: MUTATION_RESULT_STATUS[action] });
    }, FIXTURE_MUTATION_DELAY_MS);
  });
}

function mutate(
  action: SubscriptionMutation,
  id: string,
  body?: ReactivateSubscriptionRequest,
  options?: ApiRequestOptions,
): Promise<SubscriptionStatusChange> {
  if (isFixtureMode()) {
    return fixtureSubscriptionMutations(action, id);
  }
  return api<SubscriptionStatusChange>(subscriptionPath(id, `/${action}`), {
    ...options,
    method: 'POST',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export const subscriptions = {
  list: (options?: ApiRequestOptions) =>
    api<SubscriptionListResponse>('/subscriptions', options),
  get: (id: string, options?: ApiRequestOptions) =>
    api<Subscription>(subscriptionPath(id), options),
  payments: (id: string, options?: ApiRequestOptions) =>
    api<SubscriptionPaymentsResponse>(subscriptionPath(id, '/payments'), options),
  pause: (id: string, options?: ApiRequestOptions) =>
    mutate('pause', id, undefined, options),
  resume: (id: string, options?: ApiRequestOptions) =>
    mutate('resume', id, undefined, options),
  cancel: (id: string, options?: ApiRequestOptions) =>
    mutate('cancel', id, undefined, options),
  reactivate: (
    id: string,
    request: ReactivateSubscriptionRequest,
    options?: ApiRequestOptions,
  ) => mutate('reactivate', id, request, options),
}

export interface CreatePlanPayload {
  usage_enabled: boolean;
  trial_period_days: number;
  price: number;
  price_type: string;
  interval: string;
}

export const plans = {
  list: () => api<{ plans: unknown[] }>('/plans'),
  create: (payload: CreatePlanPayload) =>
    api<unknown>('/plans', { method: 'POST', body: JSON.stringify(payload) }),
}

export interface OnboardingBusiness {
  businessName: string;
  website: string;
  country: string;
}

export interface OnboardingSubmission {
  business: OnboardingBusiness;
  payout: string;
}

export const onboarding = {
  submit: (payload: OnboardingSubmission) =>
    api<void>('/onboarding', { method: 'POST', body: JSON.stringify(payload) }),
}
export {
  walletTransactions,
  WALLET_TRANSACTION_FIXTURES,
  DEFAULT_WALLET_TRANSACTIONS_LIMIT,
  filterWalletTransactions,
  paginateWalletTransactions,
  extractCounterpartyAddress,
} from './walletTransactions'

export type GiftRedeemResult =
  | { status: 'ok' }
  | { status: 'already-redeemed' }
  | { status: 'expired'; expiredOn?: string };

export const gifts = {
  redeem: (code: string) =>
    api<GiftRedeemResult>('/gifts/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};
