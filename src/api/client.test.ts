import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, subscriptions, plans, onboarding } from './client';
import type { ApiError } from './client';
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
        expect((e as ApiError).status).toBe(400);
        expect((e as ApiError).technicalDetails).toBe('Invalid input data');
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
        expect((e as ApiError).status).toBe(500);
        expect((e as ApiError).technicalDetails).toBe('No additional details provided by server.');
      }
    });

    it('throws ApiError with isOffline=true if fetch throws TypeError and navigator is offline', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      vi.stubGlobal('navigator', { onLine: false });

      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('Network request failed (offline)');
        expect((e as ApiError).isOffline).toBe(true);
      }
    });

    it('throws original error if fetch throws non-TypeError or navigator is online', async () => {
      const originalError = new Error('Some other error');
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(originalError);

      await expect(api('/test')).rejects.toThrow('Some other error');
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

    it('resolves with undefined for empty response body', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '0' }),
      });

      const result = await api('/test-empty');
      expect(result).toBeUndefined();
    });

    it('rejects with an ApiError carrying status on HTML 200 response', async () => {
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
        expect((e as ApiError).status).toBe(200);
      }
    });

    it('rejects with isTimeout when request exceeds timeout', async () => {
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
      vi.advanceTimersByTime(15000);

      await expect(promise).rejects.toMatchObject({
        isTimeout: true,
      });
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

    it('throws ApiError with isNetworkError=true if fetch throws TypeError and navigator is online', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      vi.stubGlobal('navigator', { onLine: true });

      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as ApiError).isNetworkError).toBe(true);
        expect((e as ApiError).isOffline).toBeFalsy();
      }
    });

    it('simulates offline when ?simulate_offline is in URL', async () => {
      vi.stubGlobal('window', { location: { search: '?simulate_offline=true' } });
      
      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('No internet connection');
        expect((e as ApiError).isOffline).toBe(true);
      }
    });

    it('simulates error when ?simulate_error is in URL', async () => {
      vi.stubGlobal('window', { location: { search: '?simulate_error=true' } });
      
      try {
        await api('/test');
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('Internal Server Error');
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

    it('pause() simulates success', async () => {
      vi.useFakeTimers();
      const promise = subscriptions.pause('sub1');
      vi.runAllTimers();
      const res = await promise;
      expect(res).toEqual({ success: true });
      vi.useRealTimers();
    });
    
    it('pause() simulates failure with ?fail_action', async () => {
      vi.stubGlobal('window', { location: { search: '?fail_action=true' } });
      vi.useFakeTimers();
      const promise = subscriptions.pause('sub1');
      vi.runAllTimers();
      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toBe('Action Failed');
        expect((e as ApiError).status).toBe(400);
      }
      vi.useRealTimers();
    });

    it('cancel() simulates success', async () => {
      vi.useFakeTimers();
      const promise = subscriptions.cancel('sub1');
      vi.runAllTimers();
      const res = await promise;
      expect(res).toEqual({ success: true });
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
});

