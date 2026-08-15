export interface ReportContext {
  route?: string;
  userId?: string | null;
  extra?: Record<string, unknown>;
}

class ErrorHandler {
  monitoringEndpoint = '/api/monitoring';

  async report(error: unknown, context: ReportContext = {}) {
    try {
      const payload = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof location !== 'undefined' ? location.href : undefined,
        timestamp: new Date().toISOString(),
        context,
      } as const;

      // Fire-and-forget reporting; don't block app flow
      if (typeof fetch !== 'undefined') {
        fetch(this.monitoringEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((e) => {
          // Swallow reporting errors but log locally for debugging
          // eslint-disable-next-line no-console
          console.warn('ErrorHandler: failed to send report', e);
        });
      }

      // Always log locally so developers can see errors in dev
      // eslint-disable-next-line no-console
      console.error('Reported error', payload);
    } catch (reportErr) {
      // eslint-disable-next-line no-console
      console.warn('ErrorHandler.report failed', reportErr);
    }
  }
}

const handler = new ErrorHandler();
export default handler;
