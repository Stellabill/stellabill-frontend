import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, subscriptions, plans, onboarding } from './client';
import { FIXTURE_MUTATION_DELAY_MS } from './client';
import type { ApiError, SubscriptionStatusChange } from './client';
import {
  setErrorReporterAdapter,
  resetErrorReporterAdapter,
  REDACTED_ADDRESS,
  type ErrorReportPayload,
} from '@/utils/errorReporter';

describe('client.ts', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    // mock window.location to not interfere
    vi.stubGlobal('window', {
      location: {
        search: ''
      }
    });
    vi.stubGlobal('navigator', {
      onLine: true
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetErrorReporterAdapter();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('api()', () => {
    it('fetches data successfully', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api('/test-path');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/test-path', {
        signal: expect.any(Object),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('merges custom options and headers', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api('/test-path', { method: 'POST', headers: { 'Authorization': 'Bearer token' } });
      expect(global.fetch).toHaveBeenCalledWith('/api/test-path', {
        method: 'POST',
        signal: expect.any(Object),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
      });
    });

    it('throws ApiError on non-ok response with json details', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ details: 'Invalid input data' }),
      });

      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('API error: Bad Request');
        expect((e as ApiError).kind).toBe('http');
        expect((e as ApiError).status).toBe(400);
        expect((e as ApiError).technicalDetails).toBe('Invalid input data');
      }
    });

    it('throws ApiError on non-ok response with json object without details field', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: '',
        json: async () => ({ error: 'Unprocessable' }),
      });

      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('API error: 422');
        expect((e as ApiError).kind).toBe('http');
        expect((e as ApiError).status).toBe(422);
        expect((e as ApiError).technicalDetails).toBe(JSON.stringify({ error: 'Unprocessable' }));
      }
    });

    it('throws ApiError on non-ok response with fallback text details if json fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Not JSON') },
      });

      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('API error: Internal Server Error');
        expect((e as ApiError).kind).toBe('http');
        expect((e as ApiError).status).toBe(500);
        expect((e as ApiError).technicalDetails).toBe('No additional details provided by server.');
      }
    });

    it('throws ApiError with isOffline=true and kind="network" if fetch throws TypeError and navigator is offline', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      vi.stubGlobal('navigator', { onLine: false });

      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('Network request failed (offline)');
        expect((e as ApiError).kind).toBe('network');
        expect((e as ApiError).isOffline).toBe(true);
        expect((e as ApiError).isNetworkError).toBe(true);
      }
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('throws original error if fetch throws non-TypeError or navigator is online', async () => {
      const originalError = new Error('Some other error');
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(originalError);

      await expect(api('/test')).rejects.toThrow('Some other error');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('wraps non-Error thrown values into an Error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('raw string failure');

      await expect(api('/test')).rejects.toThrow('raw string failure');
    });

    it('resolves with undefined on 204 No Content response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      });

      const result = await api('/test-204');
      expect(result).toBeUndefined();
    });

    it('resolves with undefined for empty response body via content-length 0', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '0' }),
      });

      const result = await api('/test-empty');
      expect(result).toBeUndefined();
    });

    it('resolves with undefined when res.text() returns whitespace-only body', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '   ',
      });

      const result = await api('/test-whitespace');
      expect(result).toBeUndefined();
    });

    it('parses valid JSON via res.text() when available', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"ok":true}',
      });

      const result = await api<{ ok: boolean }>('/test-text-json');
      expect(result).toEqual({ ok: true });
    });

    it('rejects with kind="parse" when res.text() returns invalid JSON', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{invalid json',
      });

      try {
        await api('/test-bad-json');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        const err = e as ApiError;
        expect(err.message).toBe('Unexpected response format');
        expect(err.kind).toBe('parse');
        expect(err.status).toBe(200);
        expect(err.technicalDetails).toBeTruthy();
      }
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('rejects with kind="parse" when res.json() throws SyntaxError (without res.text)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      });

      try {
        await api('/test-json-syntax');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        const err = e as ApiError;
        expect(err.message).toBe('Unexpected response format');
        expect(err.kind).toBe('parse');
        expect(err.status).toBe(200);
      }
    });

    it('rethrows non-SyntaxError from res.json() when res.text is absent', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Stream read failure');
        },
      });

      await expect(api('/test-json-other-err')).rejects.toThrow('Stream read failure');
    });

    it('rejects with an ApiError carrying status and kind="parse" on HTML 200 response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '<!DOCTYPE html><html><body>Error</body></html>',
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      });

      try {
        await api('/test-html');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('Unexpected response format');
        expect((e as ApiError).kind).toBe('parse');
        expect((e as ApiError).status).toBe(200);
        expect((e as ApiError).technicalDetails).toContain('text/html');
      }
    });

    it('rejects with kind="parse" when content-type header is missing', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => 'plain',
      });

      try {
        await api('/test-no-ct');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as ApiError).kind).toBe('parse');
        expect((e as ApiError).technicalDetails).toBe('Expected application/json but received none');
      }
    });

    it('rejects with isTimeout and kind="timeout" when request exceeds default timeout', async () => {
      vi.useFakeTimers();
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        (_url: string, options?: RequestInit) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          })
      );

      const promise = api('/test-timeout');
      const assertion = expect(promise).rejects.toMatchObject({
        kind: 'timeout',
        isTimeout: true,
        message: 'Request timed out',
      });
      await vi.advanceTimersByTimeAsync(15000);
      await assertion;
      vi.useRealTimers();
    });

    it('respects custom timeoutMs option with AbortController composition', async () => {
      vi.useFakeTimers();
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        (_url: string, options?: RequestInit) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          })
      );

      const promise = api('/test-custom-timeout', { timeoutMs: 2500 });
      const assertion = expect(promise).rejects.toMatchObject({
        kind: 'timeout',
        isTimeout: true,
      });
      await vi.advanceTimersByTimeAsync(2500);
      await assertion;
      expect(global.fetch).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('rejects with AbortError when caller aborts the request', async () => {
      const callerController = new AbortController();
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        (_url: string, options?: RequestInit) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          })
      );

      const promise = api('/test-caller-abort', { signal: callerController.signal });
      callerController.abort();

      await expect(promise).rejects.toMatchObject({
        name: 'AbortError',
      });
      await expect(promise).rejects.not.toHaveProperty('isTimeout', true);
    });

    it('rejects immediately without calling fetch if caller signal is already aborted', async () => {
      const callerController = new AbortController();
      callerController.abort('Custom abort reason');

      await expect(
        api('/test-pre-aborted', { signal: callerController.signal })
      ).rejects.toMatchObject({
        name: 'AbortError',
        message: 'Custom abort reason',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('preserves Error instance when caller signal is already aborted with an Error', async () => {
      const callerController = new AbortController();
      const customAbortErr = new Error('Aborted by user navigation');
      customAbortErr.name = 'AbortError';
      callerController.abort(customAbortErr);

      await expect(
        api('/test-pre-aborted-err', { signal: callerController.signal })
      ).rejects.toBe(customAbortErr);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('throws ApiError with isNetworkError=true and kind="network" after retrying GET on TypeError when online', async () => {
      vi.useFakeTimers();
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('Failed to fetch'));
      vi.stubGlobal('navigator', { onLine: true });

      const promise = api('/test', { baseDelayMs: 100 });
      const assertion = expect(promise).rejects.toMatchObject({
        kind: 'network',
        isNetworkError: true,
      });
      await vi.runAllTimersAsync();
      await assertion;

      // Initial attempt + 2 retries = 3 calls
      expect(global.fetch).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it('retries GET on transient network error and 502/503/504 with exponential backoff and jitter, then succeeds', async () => {
      vi.useFakeTimers();
      const observedDelays: { delayMs: number; attempt: number }[] = [];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ details: 'Temporarily overloaded' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recovered: true }),
        });

      const promise = api<{ recovered: boolean }>('/retry-get', {
        baseDelayMs: 100,
        maxRetries: 2,
        jitter: (delayMs, attempt) => {
          observedDelays.push({ delayMs, attempt });
          return delayMs;
        },
      });

      await vi.advanceTimersByTimeAsync(100);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toEqual({ recovered: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(observedDelays).toEqual([
        { delayMs: 100, attempt: 0 },
        { delayMs: 200, attempt: 1 },
      ]);
      vi.useRealTimers();
    });

    it('retries HEAD on 502 and 504 with exponential backoff', async () => {
      vi.useFakeTimers();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 504,
          statusText: 'Gateway Timeout',
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers(),
        });

      const promise = api('/retry-head', {
        method: 'HEAD',
        baseDelayMs: 50,
        jitter: (d) => d,
      });

      await vi.runAllTimersAsync();
      const res = await promise;
      expect(res).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it('does not retry non-idempotent methods (POST, PUT, PATCH, DELETE) on network error or 503', async () => {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        (global.fetch as ReturnType<typeof vi.fn>).mockClear();
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ details: 'Busy' }),
        });

        await expect(api('/mutate', { method })).rejects.toMatchObject({
          kind: 'http',
          status: 503,
        });
        expect(global.fetch).toHaveBeenCalledTimes(1);
      }

      (global.fetch as ReturnType<typeof vi.fn>).mockClear();
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(api('/mutate', { method: 'POST' })).rejects.toMatchObject({
        kind: 'network',
        isNetworkError: true,
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry GET on non-retryable HTTP statuses (400, 404, 500)', async () => {
      for (const status of [400, 404, 500]) {
        (global.fetch as ReturnType<typeof vi.fn>).mockClear();
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          json: async () => ({}),
        });

        await expect(api('/no-retry-http')).rejects.toMatchObject({
          kind: 'http',
          status,
        });
        expect(global.fetch).toHaveBeenCalledTimes(1);
      }
    });

    it('aborts retry backoff wait when caller signal aborts during backoff', async () => {
      vi.useFakeTimers();
      const callerController = new AbortController();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({}),
      });

      const promise = api('/abort-during-backoff', {
        signal: callerController.signal,
        baseDelayMs: 1000,
        jitter: (d) => d,
      });

      // Let first fetch complete and enter backoff wait
      await vi.advanceTimersByTimeAsync(10);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      callerController.abort();

      await expect(promise).rejects.toMatchObject({
        name: 'AbortError',
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('handles zero backoff delay immediately when jitter returns 0', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true }),
        });

      const res = await api('/zero-delay', {
        jitter: () => 0,
      });
      expect(res).toEqual({ ok: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('simulates offline when ?simulate_offline is in URL', async () => {
      vi.stubGlobal('window', { location: { search: '?simulate_offline=true' } });
      
      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('No internet connection');
        expect((e as ApiError).kind).toBe('network');
        expect((e as ApiError).isOffline).toBe(true);
      }
    });

    it('surfaces server errors returned by the API', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ details: 'Database connection timeout' }),
      });

      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('Internal Server Error');
        expect((e as ApiError).kind).toBe('http');
        expect((e as ApiError).status).toBe(500);
        expect((e as ApiError).technicalDetails).toContain('Database connection timeout');
      }
    });

    it('reports API errors to the errorReporter adapter with route context and scrubbed wallet addresses', async () => {
      const reports: ErrorReportPayload[] = [];
      setErrorReporterAdapter({
        report(payload) {
          reports.push(payload);
        },
      });

      const walletAddress = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
      vi.stubGlobal('window', {
        location: {
          search: '',
          pathname: '/wallet',
        },
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          details: 'Wallet ' + walletAddress + ' has no active subscriptions',
        }),
      });

      await expect(api('/subscriptions/' + walletAddress)).rejects.toThrow('API error: Not Found');

      expect(reports).toHaveLength(1);
      expect(reports[0].source).toBe('api');
      expect(reports[0].route).toBe('/wallet');
      expect(reports[0].status).toBe(404);
      expect(reports[0].endpoint).toBe('/subscriptions/' + REDACTED_ADDRESS);
      expect(reports[0].metadata).toEqual({
        technicalDetails: 'Wallet ' + REDACTED_ADDRESS + ' has no active subscriptions',
      });
    });
  });

  describe('subscriptions', () => {
    it('list() calls api with correct path', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscriptions: [] }),
      });
      await subscriptions.list();
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions', expect.any(Object));
    });

    it('get() calls api with correct path', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub1' }),
      });
      await subscriptions.get('sub1');
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/sub1', expect.any(Object));
    });

    it('payments() calls api with correct path', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ payments: [] }),
      });
      await subscriptions.payments('sub1');
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/sub1/payments', expect.any(Object));
    });

  });

  describe('subscriptions (typed mutations)', () => {
    type FetchMock = ReturnType<typeof vi.fn>;

    function jsonResponse(body: unknown, status = 200, statusText = 'OK') {
      return {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        json: async () => body,
      };
    }

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.useRealTimers();
    });

    const cases = [
      { action: 'pause', status: 'Paused', call: () => subscriptions.pause('sub 1') },
      { action: 'resume', status: 'Active', call: () => subscriptions.resume('sub 1') },
      { action: 'cancel', status: 'Cancelled', call: () => subscriptions.cancel('sub 1') },
      {
        action: 'reactivate',
        status: 'Active',
        call: () =>
          subscriptions.reactivate('sub 1', { startDate: '2026-12-01T00:00:00.000Z' }),
      },
    ] as const;

    describe.each(cases)('$action()', ({ action, status, call }) => {
      it('POSTs to the action endpoint and returns the typed status change', async () => {
        (global.fetch as FetchMock).mockResolvedValueOnce(
          jsonResponse({ id: 'sub 1', status }),
        );

        const result: SubscriptionStatusChange = await call();

        expect(result).toEqual({ id: 'sub 1', status });
        const [url, init] = (global.fetch as FetchMock).mock.calls[0];
        expect(url).toBe(`/api/subscriptions/sub%201/${action}`);
        expect(init.method).toBe('POST');
        expect(init.headers['Content-Type']).toBe('application/json');
        if (action === 'reactivate') {
          expect(JSON.parse(init.body)).toEqual({ startDate: '2026-12-01T00:00:00.000Z' });
        } else {
          expect(init.body).toBeUndefined();
        }
      });

      it('maps a 404 to an ApiError with status and details', async () => {
        (global.fetch as FetchMock).mockResolvedValueOnce(
          jsonResponse({ details: 'Subscription not found' }, 404, 'Not Found'),
        );

        await expect(call()).rejects.toMatchObject({
          message: 'API error: Not Found',
          status: 404,
          technicalDetails: 'Subscription not found',
        });
      });

      it('maps a 500 to an ApiError with status and details', async () => {
        (global.fetch as FetchMock).mockResolvedValueOnce(
          jsonResponse({ error: 'boom' }, 500, 'Internal Server Error'),
        );

        const err = (await call().catch((e: unknown) => e)) as ApiError;
        expect(err.status).toBe(500);
        expect(err.message).toBe('API error: Internal Server Error');
        expect(err.technicalDetails).toBe(JSON.stringify({ error: 'boom' }));
      });

      it('flags network failures with isNetworkError', async () => {
        (global.fetch as FetchMock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

        const err = (await call().catch((e: unknown) => e)) as ApiError;
        expect(err.isNetworkError).toBe(true);
        expect(err.status).toBeUndefined();
      });

      it('resolves locally in fixture mode without calling fetch', async () => {
        vi.stubEnv('VITE_USE_FIXTURES', 'true');
        vi.useFakeTimers();

        const promise = call();
        await vi.advanceTimersByTimeAsync(FIXTURE_MUTATION_DELAY_MS);

        await expect(promise).resolves.toEqual({ id: 'sub 1', status });
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('rejects with a 400 ApiError in fixture mode with ?fail_action', async () => {
        vi.stubEnv('VITE_USE_FIXTURES', 'true');
        vi.stubGlobal('window', { location: { search: '?fail_action=true' } });
        vi.useFakeTimers();

        const promise = call();
        const assertion = expect(promise).rejects.toMatchObject({
          message: 'Action Failed',
          status: 400,
        });
        await vi.advanceTimersByTimeAsync(FIXTURE_MUTATION_DELAY_MS);
        await assertion;
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('list() maps a network failure to an ApiError', async () => {
      (global.fetch as FetchMock).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const err = (await subscriptions.list().catch((e: unknown) => e)) as ApiError;
      expect(err.isNetworkError).toBe(true);
    });

    it('get() maps a 404 to an ApiError', async () => {
      (global.fetch as FetchMock).mockResolvedValueOnce(
        jsonResponse({ details: 'missing' }, 404, 'Not Found'),
      );
      await expect(subscriptions.get('nope')).rejects.toMatchObject({ status: 404 });
    });

    it('get() maps a 500 to an ApiError', async () => {
      (global.fetch as FetchMock).mockResolvedValueOnce(
        jsonResponse({ details: 'db down' }, 500, 'Internal Server Error'),
      );
      await expect(subscriptions.get('sub1')).rejects.toMatchObject({
        status: 500,
        technicalDetails: 'db down',
      });
    });

    it('list() forwards request options such as an abort signal', async () => {
      (global.fetch as FetchMock).mockResolvedValueOnce(jsonResponse({ subscriptions: [] }));
      const controller = new AbortController();
      await subscriptions.list({ signal: controller.signal });
      expect((global.fetch as FetchMock).mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });

    it('cancel() simulates failure with ?fail_action', async () => {
      vi.stubGlobal('window', { location: { search: '?fail_action=true' } });
      vi.useFakeTimers();
      const promise = subscriptions.cancel('sub1');
      vi.runAllTimers();
      await expect(promise).rejects.toMatchObject({
        message: 'Action Failed',
        status: 400,
      });
      vi.useRealTimers();
    });

    it('resume() simulates success and failure with ?fail_action', async () => {
      vi.useFakeTimers();
      const okPromise = subscriptions.resume('sub1');
      vi.runAllTimers();
      await expect(okPromise).resolves.toEqual({ success: true });

      vi.stubGlobal('window', { location: { search: '?fail_action=true' } });
      const failPromise = subscriptions.resume('sub1');
      vi.runAllTimers();
      await expect(failPromise).rejects.toMatchObject({
        message: 'Action Failed',
        status: 400,
      });
      vi.useRealTimers();
    });
  });

  describe('plans', () => {
    it('list() calls api with correct path', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plans: [] }),
      });
      await plans.list();
      expect(global.fetch).toHaveBeenCalledWith('/api/plans', expect.any(Object));
    });

    it('create() sends POST request with payload', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'plan-1' }),
      });
      const payload = {
        usage_enabled: true,
        trial_period_days: 14,
        price: 25,
        price_type: 'flat',
        interval: 'monthly',
      };
      await plans.create(payload);
      expect(global.fetch).toHaveBeenCalledWith('/api/plans', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: expect.any(Object),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('onboarding', () => {
    it('submits business and payout data', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });
      const payload = {
        business: { businessName: 'Test Business', website: 'example.com', country: 'US' },
        payout: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7',
      };

      await onboarding.submit(payload);

      expect(global.fetch).toHaveBeenCalledWith('/api/onboarding', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: expect.any(Object),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('gifts', () => {
    it('purchase() returns a generated gift code and expiresOn ISO date', async () => {
      const result = await gifts.purchase({
        planId: '1',
        recipientEmail: 'recipient@example.com',
        duration: 12,
        deliveryMethod: 'email',
      });

      expect(result.code).toMatch(/^GIFT-[A-Z0-9]{6}-[A-Z0-9]{6}$/);
      expect(Number.isNaN(Date.parse(result.expiresOn))).toBe(false);
    });

    it('purchase() rejects with ApiError when ?fail_action is in URL', async () => {
      vi.stubGlobal('window', { location: { search: '?fail_action=true' } });

      await expect(
        gifts.purchase({
          planId: '1',
          recipientEmail: 'recipient@example.com',
          duration: 12,
          deliveryMethod: 'email',
        })
      ).rejects.toMatchObject({
        message: 'Gift purchase failed',
        status: 400,
      });
    });
  });
});

