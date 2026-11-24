import { useState, useCallback, useRef } from 'react';
import {
  subscriptions,
  type ReactivateSubscriptionPayload,
  type DowngradeSubscriptionPayload,
} from '../api/client';
import type { ToastOptions } from '../components/TransactionToast';

export type SubscriptionActionType =
  | 'cancel'
  | 'pause'
  | 'resume'
  | 'downgrade'
  | 'reactivate';

export interface SubscriptionActionError {
  message: string;
  technicalDetails?: string;
}

export interface ActionExecutionOptions {
  /** Called synchronously before the API request to apply an optimistic UI update. */
  onOptimistic?: () => void;
  /** Called if the API request fails to roll back the optimistic UI update. */
  onRollback?: () => void;
  /** Called after the API request succeeds. */
  onSuccess?: () => void;
  /** Called after the API request fails (in addition to rollback and toast). */
  onError?: (error: SubscriptionActionError) => void;
  /** Whether to show a pending toast immediately while the action is in flight. */
  showPendingToast?: boolean;
  pendingTitle?: string;
  pendingMessage?: string;
  successTitle?: string;
  successMessage?: string;
  fallbackErrorMessage?: string;
}

export function getSubscriptionActionError(
  error: unknown,
  fallbackMessage: string,
): SubscriptionActionError {
  if (!(error instanceof Error)) return { message: fallbackMessage };

  const technicalDetails =
    'technicalDetails' in error && typeof error.technicalDetails === 'string'
      ? error.technicalDetails
      : undefined;
  return { message: error.message || fallbackMessage, technicalDetails };
}

export interface UseSubscriptionActionsReturn {
  pendingAction: SubscriptionActionType | null;
  pendingId: string | null;
  isPending: boolean;
  error: SubscriptionActionError | null;
  clearError: () => void;
  toasts: ToastOptions[];
  addToast: (
    status: ToastOptions['status'],
    title: string,
    message?: string,
  ) => string;
  updateToast: (
    id: string,
    status: ToastOptions['status'],
    title: string,
    message?: string,
  ) => void;
  removeToast: (id: string) => void;
  cancel: (id: string, options?: ActionExecutionOptions) => Promise<boolean>;
  pause: (id: string, options?: ActionExecutionOptions) => Promise<boolean>;
  resume: (id: string, options?: ActionExecutionOptions) => Promise<boolean>;
  downgrade: (
    id: string,
    payload?: DowngradeSubscriptionPayload,
    options?: ActionExecutionOptions,
  ) => Promise<boolean>;
  reactivate: (
    id: string,
    payload: ReactivateSubscriptionPayload,
    options?: ActionExecutionOptions,
  ) => Promise<boolean>;
}

const DEFAULT_MESSAGES: Record<
  SubscriptionActionType,
  {
    pendingTitle: string;
    pendingMessage: string;
    successTitle: string;
    successMessage: string;
    fallbackError: string;
  }
> = {
  cancel: {
    pendingTitle: 'Cancelling subscription',
    pendingMessage: 'Please wait while we cancel your subscription.',
    successTitle: 'Subscription cancelled',
    successMessage: 'Your subscription has been cancelled.',
    fallbackError: 'Failed to cancel subscription. Please try again.',
  },
  pause: {
    pendingTitle: 'Pausing subscription',
    pendingMessage: 'Please wait while we pause your subscription.',
    successTitle: 'Subscription paused',
    successMessage: 'Your subscription has been paused.',
    fallbackError: 'Failed to pause subscription. Please try again.',
  },
  resume: {
    pendingTitle: 'Resuming subscription',
    pendingMessage: 'Please wait while we resume your subscription.',
    successTitle: 'Subscription resumed',
    successMessage: 'Your subscription is active again.',
    fallbackError: 'Failed to resume subscription. Please try again.',
  },
  downgrade: {
    pendingTitle: 'Downgrading plan',
    pendingMessage: 'Please wait while we downgrade your plan.',
    successTitle: 'Plan downgraded',
    successMessage: 'Your subscription plan has been downgraded.',
    fallbackError: 'Failed to downgrade plan. Please try again.',
  },
  reactivate: {
    pendingTitle: 'Reactivating subscription',
    pendingMessage: 'Please wait while we reactivate your subscription.',
    successTitle: 'Subscription reactivated',
    successMessage: 'Your subscription has been reactivated.',
    fallbackError: 'Failed to reactivate subscription. Please try again.',
  },
};

export function useSubscriptionActions(): UseSubscriptionActionsReturn {
  const [pendingAction, setPendingAction] =
    useState<SubscriptionActionType | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<SubscriptionActionError | null>(null);
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const toastCounter = useRef(0);
  const inFlightRef = useRef(false);

  const addToast = useCallback(
    (status: ToastOptions['status'], title: string, message?: string) => {
      toastCounter.current += 1;
      const id = 'subscription-' + String(toastCounter.current);
      setToasts((prev) => [...prev, { id, status, title, message }]);
      return id;
    },
    [],
  );

  const updateToast = useCallback(
    (
      id: string,
      status: ToastOptions['status'],
      title: string,
      message?: string,
    ) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status, title, message } : t)),
      );
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const runAction = useCallback(
    async (
      actionType: SubscriptionActionType,
      id: string,
      apiCall: () => Promise<unknown>,
      options?: ActionExecutionOptions,
    ): Promise<boolean> => {
      if (inFlightRef.current) return false;
      inFlightRef.current = true;
      setPendingAction(actionType);
      setPendingId(id);
      setError(null);

      const defaults = DEFAULT_MESSAGES[actionType];
      const pendingToastId = options?.showPendingToast
        ? addToast(
            'pending',
            options.pendingTitle ?? defaults.pendingTitle,
            options.pendingMessage ?? defaults.pendingMessage,
          )
        : null;

      options?.onOptimistic?.();

      try {
        await apiCall();
        const successTitle = options?.successTitle ?? defaults.successTitle;
        const successMessage =
          options?.successMessage ?? defaults.successMessage;

        if (pendingToastId) {
          updateToast(pendingToastId, 'success', successTitle, successMessage);
        } else {
          addToast('success', successTitle, successMessage);
        }

        options?.onSuccess?.();
        return true;
      } catch (err: unknown) {
        options?.onRollback?.();
        const actionError = getSubscriptionActionError(
          err,
          options?.fallbackErrorMessage ?? defaults.fallbackError,
        );
        setError(actionError);

        if (pendingToastId) {
          updateToast(
            pendingToastId,
            'error',
            actionError.message,
            actionError.technicalDetails,
          );
        } else {
          addToast('error', actionError.message, actionError.technicalDetails);
        }

        options?.onError?.(actionError);
        return false;
      } finally {
        inFlightRef.current = false;
        setPendingAction(null);
        setPendingId(null);
      }
    },
    [addToast, updateToast],
  );

  const cancel = useCallback(
    (id: string, options?: ActionExecutionOptions) =>
      runAction('cancel', id, () => subscriptions.cancel(id), options),
    [runAction],
  );

  const pause = useCallback(
    (id: string, options?: ActionExecutionOptions) =>
      runAction('pause', id, () => subscriptions.pause(id), options),
    [runAction],
  );

  const resume = useCallback(
    (id: string, options?: ActionExecutionOptions) =>
      runAction('resume', id, () => subscriptions.resume(id), {
        showPendingToast: true,
        ...options,
      }),
    [runAction],
  );

  const downgrade = useCallback(
    (
      id: string,
      payload?: DowngradeSubscriptionPayload,
      options?: ActionExecutionOptions,
    ) =>
      runAction(
        'downgrade',
        id,
        () => subscriptions.downgrade(id, payload),
        options,
      ),
    [runAction],
  );

  const reactivate = useCallback(
    (
      id: string,
      payload: ReactivateSubscriptionPayload,
      options?: ActionExecutionOptions,
    ) =>
      runAction(
        'reactivate',
        id,
        () => subscriptions.reactivate(id, payload),
        options,
      ),
    [runAction],
  );

  return {
    pendingAction,
    pendingId,
    isPending: pendingAction !== null,
    error,
    clearError,
    toasts,
    addToast,
    updateToast,
    removeToast,
    cancel,
    pause,
    resume,
    downgrade,
    reactivate,
  };
}
