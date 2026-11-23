import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  explorerAccountUrl,
  getExpectedNetwork,
  isNetworkMismatch,
  type StellarNetwork,
} from '../config/network';
import { findCatalogPlan, type Plan } from '../data/catalogPlans';
import { FreighterConnectionError } from '../wallet/freighter';
import { useWallet } from '../wallet/WalletContext';
import type { ToastOptions } from '../components/TransactionToast';

export type CheckoutStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

export interface CheckoutResult {
  txHash: string;
  signedTxXdr: string;
  explorerUrl: string;
  amount: number;
  currency: string;
}

export interface UseCheckoutOptions {
  expectedNetwork?: StellarNetwork;
  fetchBalance?: (address: string, currency: string) => Promise<number>;
  submitTransaction?: (params: {
    signedTxXdr: string;
    plan: Plan;
    address: string;
    amount: number;
    currency: string;
    network: string;
  }) => Promise<{ txHash: string }>;
}

const NETWORK_PASSPHRASES: Record<StellarNetwork, string> = {
  Testnet: 'Test SDF Network ; September 2015',
  Mainnet: 'Public Global Stellar Network ; September 2015',
};

const DEFAULT_DEMO_BALANCE = 250;

const defaultFetchBalance = async (): Promise<number> => DEFAULT_DEMO_BALANCE;

const defaultSubmitTransaction = async ({
  signedTxXdr,
}: {
  signedTxXdr: string;
}): Promise<{ txHash: string }> => {
  // Deterministic mock hash derived from signed XDR for demo environments without a backend.
  const suffix = signedTxXdr.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || '000000000000';
  return { txHash: 'tx_' + suffix + '_' + Date.now().toString(36) };
};

function buildUnsignedSubscriptionXdr(params: {
  planId: string;
  address: string;
  amount: number;
  currency: string;
  network: StellarNetwork;
}): string {
  const payload = JSON.stringify({
    type: 'stellabill.subscribe',
    planId: params.planId,
    source: params.address,
    amount: params.amount,
    currency: params.currency,
    network: params.network,
  });
  return typeof btoa === 'function' ? btoa(payload) : payload;
}

export function useCheckout(planId?: string, options?: UseCheckoutOptions) {
  const wallet = useWallet();
  const plan = useMemo(() => (planId ? findCatalogPlan(planId) : undefined), [planId]);
  const expectedNetwork = options?.expectedNetwork ?? getExpectedNetwork();
  const fetchBalanceFn = options?.fetchBalance ?? defaultFetchBalance;
  const submitTransactionFn = options?.submitTransaction ?? defaultSubmitTransaction;

  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const lastAttemptRef = useRef<{ amount: number; currency: string } | null>(null);

  const isWalletConnected = wallet.status === 'connected' && Boolean(wallet.address);
  const networkMismatch = isWalletConnected && isNetworkMismatch(wallet.network, expectedNetwork);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const upsertToast = useCallback((toast: ToastOptions) => {
    setToasts((prev) => {
      const idx = prev.findIndex((t) => t.id === toast.id);
      if (idx === -1) return [...prev, toast];
      const next = [...prev];
      next[idx] = toast;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isWalletConnected || !wallet.address || networkMismatch || !plan) {
      setBalance(null);
      setBalanceLoading(false);
      setBalanceError(null);
      return;
    }

    let cancelled = false;
    setBalanceLoading(true);
    setBalanceError(null);

    void fetchBalanceFn(wallet.address, plan.currency)
      .then((available) => {
        if (cancelled) return;
        setBalance(available);
        setBalanceLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setBalance(null);
        setBalanceLoading(false);
        setBalanceError(
          err instanceof Error ? err.message : 'Unable to fetch wallet balance.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isWalletConnected, wallet.address, networkMismatch, plan, fetchBalanceFn]);

  const submitCheckout = useCallback(
    async (depositAmount: number, currency: string) => {
      if (!plan) {
        setError('Plan not found.');
        setStatus('failed');
        return;
      }

      if (!isWalletConnected || !wallet.address) {
        setError('Connect your Freighter wallet to complete checkout.');
        setStatus('failed');
        return;
      }

      if (networkMismatch) {
        setError('Wrong network detected. Please switch Freighter to ' + expectedNetwork + '.');
        setStatus('failed');
        return;
      }

      if (Number.isNaN(depositAmount) || depositAmount <= 0) {
        setError('Enter a valid initial deposit.');
        return;
      }

      if (balance !== null && depositAmount > balance) {
        setError(
          'Insufficient ' +
            currency +
            ' balance. Available: ' +
            balance.toFixed(2) +
            ' ' +
            currency +
            '.',
        );
        return;
      }

      lastAttemptRef.current = { amount: depositAmount, currency };
      const toastId = 'checkout-tx';

      setError(null);
      setResult(null);
      setStatus('pending');
      upsertToast({
        id: toastId,
        status: 'pending',
        title: 'Awaiting signature',
        message: 'Confirm the subscription transaction in Freighter.',
        autoClose: false,
      });

      try {
        const unsignedXdr = buildUnsignedSubscriptionXdr({
          planId: plan.id,
          address: wallet.address,
          amount: depositAmount,
          currency,
          network: expectedNetwork,
        });

        const signed = await wallet.signTransaction(unsignedXdr, {
          networkPassphrase: NETWORK_PASSPHRASES[expectedNetwork],
          address: wallet.address,
        });

        const activeNetwork = wallet.network ?? expectedNetwork;
        const { txHash } = await submitTransactionFn({
          signedTxXdr: signed.signedTxXdr,
          plan,
          address: wallet.address,
          amount: depositAmount,
          currency,
          network: activeNetwork,
        });

        const explorerUrl = explorerAccountUrl(activeNetwork, wallet.address);

        setResult({
          txHash,
          signedTxXdr: signed.signedTxXdr,
          explorerUrl,
          amount: depositAmount,
          currency,
        });
        setStatus('confirmed');
        upsertToast({
          id: toastId,
          status: 'success',
          title: 'Subscription confirmed',
          message: 'Deposited ' + String(depositAmount) + ' ' + currency + ' for ' + plan.name + '.',
        });
      } catch (err: unknown) {
        const message =
          err instanceof FreighterConnectionError && err.type === 'user-rejected'
            ? 'Transaction signature was rejected in Freighter. You can retry when ready.'
            : err instanceof Error
              ? err.message
              : 'Transaction failed. Please try again.';

        setError(message);
        setStatus('failed');
        upsertToast({
          id: toastId,
          status: 'error',
          title: 'Checkout failed',
          message,
          actionText: 'Retry',
          onAction: () => {
            if (lastAttemptRef.current) {
              void submitCheckout(
                lastAttemptRef.current.amount,
                lastAttemptRef.current.currency,
              );
            }
          },
          autoClose: false,
        });
      }
    },
    [
      plan,
      isWalletConnected,
      wallet,
      networkMismatch,
      expectedNetwork,
      balance,
      upsertToast,
      submitTransactionFn,
    ],
  );

  const retry = useCallback(() => {
    if (lastAttemptRef.current) {
      void submitCheckout(lastAttemptRef.current.amount, lastAttemptRef.current.currency);
    } else {
      setStatus('idle');
      setError(null);
    }
  }, [submitCheckout]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return {
    plan,
    status,
    error,
    result,
    balance,
    balanceLoading,
    balanceError,
    expectedNetwork,
    isWalletConnected,
    networkMismatch,
    wallet,
    toasts,
    removeToast,
    submitCheckout,
    retry,
    reset,
  };
}
