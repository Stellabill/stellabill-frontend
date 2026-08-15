import ErrorHandler from '@/lib/errorHandler';

export type ErrorSeverity = 'critical' | 'warning' | 'info';

export function useErrorHandler() {
  return async function handleError(error: unknown, options?: { severity?: ErrorSeverity; userMessage?: string; context?: Record<string, unknown> }) {
    // Report to central monitoring
    try {
      await ErrorHandler.report(error, { extra: options?.context });
    } catch (e) {
      // swallow
      // eslint-disable-next-line no-console
      console.warn('useErrorHandler: reporting failed', e);
    }

    // Surface non-critical errors to the user using a minimal fallback
    if (options?.severity !== 'critical') {
      // Prefer an in-app toast/notification; fallback to alert when not available
      try {
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast(options?.userMessage || 'Something went wrong');
        } else if (typeof window !== 'undefined') {
          // Use a temporarily visible alert to ensure users get feedback in absence of a toast system
          // Note: Replace this with integration into the app's notification system if available.
          window.alert(options?.userMessage || 'An error occurred. Please try again.');
        }
      } catch (e) {
        // ignore UI errors
      }
    }
  };
}
