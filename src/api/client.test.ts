import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, subscriptions, plans } from './client';
import type { ApiError } from './client';

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
});

