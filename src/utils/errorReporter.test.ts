import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  scrubPii,
  scrubValue,
  REDACTED_ADDRESS,
  reportError,
  setErrorReporterAdapter,
  getErrorReporterAdapter,
  resetErrorReporterAdapter,
  noopErrorAdapter,
  consoleErrorAdapter,
  installGlobalErrorHandlers,
  type ErrorReporterAdapter,
  type ErrorReportPayload,
} from './errorReporter';

const SAMPLE_STELLAR_PUBKEY = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
const SAMPLE_STELLAR_SECRET = 'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4';
const SAMPLE_SOROBAN_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const SAMPLE_MUXED_ADDRESS = 'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAAAAAAAAAAAAJLK';
const SAMPLE_EVM_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

describe('errorReporter', () => {
  beforeEach(() => {
    resetErrorReporterAdapter();
  });

  afterEach(() => {
    resetErrorReporterAdapter();
    vi.restoreAllMocks();
  });

  describe('scrubPii', () => {
    it('scrubs Stellar G... public key addresses', () => {
      const raw = 'Failed to load subscription for wallet ' + SAMPLE_STELLAR_PUBKEY;
      expect(scrubPii(raw)).toBe(
        'Failed to load subscription for wallet ' + REDACTED_ADDRESS
      );
    });

    it('scrubs Stellar S... secret seeds, C... contracts, M... muxed addresses, and 0x hex addresses', () => {
      const raw = [
        'pub=' + SAMPLE_STELLAR_PUBKEY,
        'seed=' + SAMPLE_STELLAR_SECRET,
        'contract=' + SAMPLE_SOROBAN_CONTRACT,
        'muxed=' + SAMPLE_MUXED_ADDRESS,
        'eth=' + SAMPLE_EVM_ADDRESS,
      ].join(' | ');

      const scrubbed = scrubPii(raw);
      expect(scrubbed).not.toContain(SAMPLE_STELLAR_PUBKEY);
      expect(scrubbed).not.toContain(SAMPLE_STELLAR_SECRET);
      expect(scrubbed).not.toContain(SAMPLE_SOROBAN_CONTRACT);
      expect(scrubbed).not.toContain(SAMPLE_MUXED_ADDRESS);
      expect(scrubbed).not.toContain(SAMPLE_EVM_ADDRESS);
      expect(scrubbed).toBe(
        [
          'pub=' + REDACTED_ADDRESS,
          'seed=' + REDACTED_ADDRESS,
          'contract=' + REDACTED_ADDRESS,
          'muxed=' + REDACTED_ADDRESS,
          'eth=' + REDACTED_ADDRESS,
        ].join(' | ')
      );
    });

    it('leaves regular text and short tokens intact', () => {
      const text = 'API error: 500 Internal Server Error at /api/subscriptions/sub_123';
      expect(scrubPii(text)).toBe(text);
    });
  });

  describe('scrubValue', () => {
    it('recursively scrubs nested objects, arrays, and Error instances', () => {
      const nested = {
        account: SAMPLE_STELLAR_PUBKEY,
        list: ['wallet:' + SAMPLE_EVM_ADDRESS, 42, true],
        err: new Error('Failure for ' + SAMPLE_STELLAR_PUBKEY),
      };

      const result = scrubValue(nested);
      expect(result.account).toBe(REDACTED_ADDRESS);
      expect(result.list[0]).toBe('wallet:' + REDACTED_ADDRESS);
      expect(result.list[1]).toBe(42);
      expect(result.err.message).toBe('Failure for ' + REDACTED_ADDRESS);
    });

    it('handles circular references safely', () => {
      const circular: Record<string, unknown> = { wallet: SAMPLE_STELLAR_PUBKEY };
      circular.self = circular;

      const result = scrubValue(circular);
      expect(result.wallet).toBe(REDACTED_ADDRESS);
      expect(result.self).toBe('[Circular]');
    });
  });

  describe('adapters and reportError', () => {
    it('defaults to noopErrorAdapter and does not log to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(getErrorReporterAdapter()).toBe(noopErrorAdapter);

      const payload = reportError(new Error('Silent failure'), {
        source: 'boundary',
        route: '/dashboard',
      });

      expect(payload.message).toBe('Silent failure');
      expect(payload.route).toBe('/dashboard');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('routes errors through consoleErrorAdapter when configured', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      setErrorReporterAdapter(consoleErrorAdapter);

      reportError(new Error('Crash for ' + SAMPLE_STELLAR_PUBKEY), {
        source: 'boundary',
        route: '/wallets/' + SAMPLE_STELLAR_PUBKEY,
        componentStack: '\n    at WalletView (' + SAMPLE_STELLAR_PUBKEY + ')',
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const [label, reportedPayload] = consoleSpy.mock.calls[0] as [
        string,
        ErrorReportPayload,
      ];
      expect(label).toContain('[ErrorReporter:boundary]');
      expect(label).toContain(REDACTED_ADDRESS);
      expect(label).not.toContain(SAMPLE_STELLAR_PUBKEY);
      expect(reportedPayload.route).toBe('/wallets/' + REDACTED_ADDRESS);
      expect(reportedPayload.componentStack).toContain(REDACTED_ADDRESS);
      expect(reportedPayload.componentStack).not.toContain(SAMPLE_STELLAR_PUBKEY);
    });

    it('dispatches structured payload with route context and scrubbed metadata to custom adapter', () => {
      const reports: Array<{ payload: ErrorReportPayload; rawError: unknown }> = [];
      const customAdapter: ErrorReporterAdapter = {
        report(payload, rawError) {
          reports.push({ payload, rawError });
        },
      };

      setErrorReporterAdapter(customAdapter);

      const err = new Error('Denied access to ' + SAMPLE_STELLAR_PUBKEY);
      err.stack = 'Error: Denied access to ' + SAMPLE_STELLAR_PUBKEY + '\n    at fetchAccount (client.ts:42:11)';

      reportError(err, {
        source: 'api',
        route: '/subscriptions',
        endpoint: '/accounts/' + SAMPLE_STELLAR_PUBKEY,
        method: 'post',
        status: 403,
        metadata: {
          payerAddress: SAMPLE_STELLAR_PUBKEY,
          attempt: 2,
        },
      });

      expect(reports).toHaveLength(1);
      const { payload, rawError } = reports[0];
      expect(payload.source).toBe('api');
      expect(payload.route).toBe('/subscriptions');
      expect(payload.method).toBe('POST');
      expect(payload.status).toBe(403);
      expect(payload.message).toBe('Denied access to ' + REDACTED_ADDRESS);
      expect(payload.stack).toContain(REDACTED_ADDRESS);
      expect(payload.stack).not.toContain(SAMPLE_STELLAR_PUBKEY);
      expect(payload.endpoint).toBe('/accounts/' + REDACTED_ADDRESS);
      expect(payload.metadata).toEqual({
        payerAddress: REDACTED_ADDRESS,
        attempt: 2,
      });
      expect((rawError as Error).message).toBe('Denied access to ' + REDACTED_ADDRESS);
    });

    it('falls back to window.location.pathname when route is not explicitly passed', () => {
      const reportMock = vi.fn();
      setErrorReporterAdapter({ report: reportMock });

      window.history.pushState({}, '', '/checkout/' + SAMPLE_STELLAR_PUBKEY);
      reportError('String error message', { source: 'custom' });

      expect(reportMock).toHaveBeenCalledTimes(1);
      const payload = reportMock.mock.calls[0][0] as ErrorReportPayload;
      expect(payload.route).toBe('/checkout/' + REDACTED_ADDRESS);
      expect(payload.message).toBe('String error message');
    });

    it('swallows exceptions thrown inside a faulty adapter', () => {
      setErrorReporterAdapter({
        report() {
          throw new Error('Adapter internal failure');
        },
      });

      expect(() => reportError(new Error('App error'))).not.toThrow();
    });
  });

  describe('installGlobalErrorHandlers', () => {
    it('captures window.onerror and unhandledrejection events and cleans up properly', () => {
      const reportMock = vi.fn();
      setErrorReporterAdapter({ report: reportMock });

      window.history.pushState({}, '', '/plans');
      const cleanup = installGlobalErrorHandlers(window);

      // 1. Trigger window.onerror
      const syntaxErr = new Error('Uncaught error for ' + SAMPLE_STELLAR_PUBKEY);
      window.onerror?.(
        syntaxErr.message,
        'http://localhost:5173/src/main.tsx',
        18,
        5,
        syntaxErr
      );

      expect(reportMock).toHaveBeenCalledTimes(1);
      const onErrorPayload = reportMock.mock.calls[0][0] as ErrorReportPayload;
      expect(onErrorPayload.source).toBe('window.onerror');
      expect(onErrorPayload.route).toBe('/plans');
      expect(onErrorPayload.message).toBe('Uncaught error for ' + REDACTED_ADDRESS);
      expect(onErrorPayload.metadata).toEqual({
        filename: 'http://localhost:5173/src/main.tsx',
        lineno: 18,
        colno: 5,
      });

      // 2. Trigger unhandledrejection
      const rejectionEvent = new Event('unhandledrejection') as PromiseRejectionEvent;
      Object.defineProperty(rejectionEvent, 'reason', {
        value: new Error('Rejected tx for ' + SAMPLE_STELLAR_PUBKEY),
      });
      window.dispatchEvent(rejectionEvent);

      expect(reportMock).toHaveBeenCalledTimes(2);
      const rejectionPayload = reportMock.mock.calls[1][0] as ErrorReportPayload;
      expect(rejectionPayload.source).toBe('unhandledrejection');
      expect(rejectionPayload.route).toBe('/plans');
      expect(rejectionPayload.message).toBe('Rejected tx for ' + REDACTED_ADDRESS);

      // 3. Cleanup removes handlers
      cleanup();
      window.dispatchEvent(rejectionEvent);
      expect(reportMock).toHaveBeenCalledTimes(2);
    });
  });
});
