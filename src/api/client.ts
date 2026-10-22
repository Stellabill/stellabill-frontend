import { Subscription } from '@/types/subscription'

const API_BASE = '/api'

const DEFAULT_TIMEOUT_MS = 15000;

export interface ApiError extends Error {
  status?: number;
  technicalDetails?: string;
  isOffline?: boolean;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}

export async function api<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  // Simulate network offline for demo if URL has ?simulate_offline
  if (typeof window !== 'undefined' && window.location.search.includes('simulate_offline')) {
    const error: ApiError = new Error('No internet connection');
    error.isOffline = true;
    throw error;
  }

  // Simulate API error for demo if URL has ?simulate_error
  if (typeof window !== 'undefined' && window.location.search.includes('simulate_error')) {
    const error: ApiError = new Error('Internal Server Error');
    error.status = 500;
    error.technicalDetails = 'Database connection timeout in the backend service. [Trace: 0x823fa1]';
    throw error;
  }

  const controller = new AbortController();
  let isTimeout = false;
  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;

  const timeoutId = setTimeout(() => {
    isTimeout = true;
    controller.abort();
  }, timeoutMs);

  const callerSignal = options?.signal;
  let onCallerAbort: (() => void) | undefined;

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort(callerSignal.reason);
    } else {
      onCallerAbort = () => {
        controller.abort(callerSignal.reason);
      };
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!res.ok) {
      const error: ApiError = new Error(`API error: ${res.statusText || res.status}`);
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
      error.status = res.status;
      error.technicalDetails = `Expected application/json but received ${contentType || 'none'}`;
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
        error.status = res.status;
        error.technicalDetails = err.message;
        throw error;
      }
      throw err;
    }
  } catch (e: unknown) {
    if (isTimeout) {
      const error: ApiError = new Error('Request timed out');
      error.isTimeout = true;
      throw error;
    }

    if (callerSignal?.aborted) {
      const error: ApiError = (e instanceof Error ? e : new Error(String(e))) as ApiError;
      throw error;
    }

    const apiError: ApiError = (e instanceof Error ? e : new Error(String(e))) as ApiError;

    if (apiError.name === 'TypeError') {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        apiError.message = 'Network request failed (offline)';
        apiError.isOffline = true;
      }
      apiError.isNetworkError = true;
    }

    throw apiError;
  } finally {
    clearTimeout(timeoutId);
    if (callerSignal && onCallerAbort) {
      callerSignal.removeEventListener('abort', onCallerAbort);
    }
  }
}

export const subscriptions = {
  list: () => api<{ subscriptions: Subscription[] }>('/subscriptions'),
  get: (id: string) => api<Subscription>(`/subscriptions/${id}`),
  pause: (id: string) => {
    // Simulating API call for development/demonstration
    return new Promise((resolve, reject) => {
      console.log(`Simulating pause for subscription: ${id}`);
      
      // Allow simulation of action failure via query param
      if (typeof window !== 'undefined' && window.location.search.includes('fail_action')) {
        setTimeout(() => {
          const error: ApiError = new Error('Action Failed');
          error.status = 400;
          error.technicalDetails = 'The subscription is already in the requested state or pending a transaction.';
          reject(error);
        }, 800);
        return;
      }

      setTimeout(() => resolve({ success: true }), 800);
    });
  },
  cancel: (id: string) => {
    // Simulating API call for development/demonstration
    return new Promise((resolve, reject) => {
      console.log(`Simulating cancel for subscription: ${id}`);

      if (typeof window !== 'undefined' && window.location.search.includes('fail_action')) {
        setTimeout(() => {
          const error: ApiError = new Error('Action Failed');
          error.status = 400;
          error.technicalDetails = 'The subscription is already in the requested state or pending a transaction.';
          reject(error);
        }, 1000);
        return;
      }

      setTimeout(() => resolve({ success: true }), 1000);
    });
  },
  resume: (id: string) => {
    // Simulating API call for development/demonstration
    return new Promise((resolve, reject) => {
      console.log(`Simulating resume for subscription: ${id}`);

      if (typeof window !== 'undefined' && window.location.search.includes('fail_action')) {
        setTimeout(() => {
          const error: ApiError = new Error('Action Failed');
          error.status = 400;
          error.technicalDetails = 'The subscription is already in the requested state or pending a transaction.';
          reject(error);
        }, 800);
        return;
      }

      setTimeout(() => resolve({ success: true }), 800);
    });
  },
}

export const plans = {
  list: () => api<{ plans: unknown[] }>('/plans'),
}
