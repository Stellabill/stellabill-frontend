import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Amount from '../components/common/Amount';
import { AmountInput } from '../components/common/AmountInput';
import { ToastContainer } from '../components/TransactionToast';
import { type PlanInterval } from '../data/catalogPlans';
import { useCheckout, type UseCheckoutOptions } from '../hooks/useCheckout';
import { usePageTitle } from '../hooks/usePageTitle';
import { addBillingInterval } from '../utils/billingDate';
import styles from './Checkout.module.css';

const INTERVAL_LABELS: Record<PlanInterval, string> = {
  Monthly: 'month',
  Yearly: 'year',
};

const cardStyle = {
  maxWidth: 560,
  margin: '0 auto',
  padding: '2rem',
  background: '#161B22',
  borderRadius: 16,
  border: '1px solid #30363D',
  color: '#e2e8f0',
} as const;

const linkStyle = { color: '#4FD1C5' } as const;

const primaryButtonStyle = {
  padding: '0.75rem 1.5rem',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
  color: '#0f172a',
  fontWeight: 600,
  cursor: 'pointer',
} as const;

const disabledButtonStyle = {
  ...primaryButtonStyle,
  opacity: 0.55,
  cursor: 'not-allowed',
} as const;

export interface CheckoutProps {
  checkoutOptions?: UseCheckoutOptions;
}

export default function Checkout({ checkoutOptions }: CheckoutProps = {}) {
export default function Checkout() {
  usePageTitle('Checkout');
  const { planId } = useParams();
  const {
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
  } = useCheckout(planId, checkoutOptions);

  const [deposit, setDeposit] = useState<number | null>(plan?.price ?? null);
  const [currency, setCurrency] = useState<string>(plan?.currency ?? 'USDC');
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setDeposit((prev) => (prev === null ? plan.price : prev));
      setCurrency(plan.currency);
    }
  }, [plan]);

  const firstChargeDate = useMemo(() => {
    if (!plan) return null;
    return addBillingInterval(new Date(), plan.interval === 'Monthly' ? 'monthly' : 'yearly', 1);
  }, [plan]);

  if (!plan) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Plan not found</h1>
          <p className={styles.mutedText}>The plan you are trying to subscribe to does not exist.</p>
          <Link to="/browse-plans" className={styles.link}>
            Back to Browse Plans
          </Link>
        </div>
      </div>
    );
  }

  const hasInsufficientBalance =
    balance !== null && deposit !== null && !Number.isNaN(deposit) && deposit > balance;

  const isSubmitBlocked =
    !isWalletConnected ||
    networkMismatch ||
    balanceLoading ||
    hasInsufficientBalance ||
    status === 'pending';

  const handleConnect = async () => {
    setConnectError(null);
    try {
      await wallet.connect();
    } catch (err: unknown) {
      setConnectError(
        err instanceof Error ? err.message : 'Unable to connect wallet. Please try again.',
      );
    }
  };

  const handleConfirm = async () => {
    if (!isWalletConnected) {
      await handleConnect();
      return;
    }
    if (networkMismatch) {
      return;
    }
    if (deposit === null || Number.isNaN(deposit) || deposit <= 0) {
      await submitCheckout(0, currency);
      return;
    }
    await submitCheckout(deposit, currency);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Confirm subscription</h1>

        <section aria-label="Order summary">
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.5rem 1.5rem',
              margin: '0 0 1.5rem',
            }}
          >
            <dt style={{ color: '#94a3b8' }}>Plan</dt>
            <dd style={{ margin: 0 }}>
              {plan.name} <span style={{ color: '#94a3b8' }}>by {plan.merchant}</span>
            </dd>
            <dt style={{ color: '#94a3b8' }}>Price</dt>
            <dd style={{ margin: 0 }}>
              <Amount
                value={plan.price}
                currency={plan.currency}
                data-testid="checkout-plan-price"
              />{' '}
              per {INTERVAL_LABELS[plan.interval]}
            </dd>
            <dt style={{ color: '#94a3b8' }}>First charge</dt>
            <dd style={{ margin: 0 }}>{firstChargeDate ? firstChargeDate.toLocaleDateString() : '—'}</dd>
            <dt style={{ color: '#94a3b8' }}>Network</dt>
            <dd style={{ margin: 0 }}>{expectedNetwork}</dd>
            {isWalletConnected && !networkMismatch && (
              <>
                <dt style={{ color: '#94a3b8' }}>Available balance</dt>
                <dd style={{ margin: 0 }}>
                  {balanceLoading ? (
                    'Checking balance…'
                  ) : balanceError ? (
                    <span style={{ color: '#f59e0b' }}>{balanceError}</span>
                  ) : (
                    <Amount
                      value={balance}
                      currency={plan.currency}
                      data-testid="checkout-wallet-balance"
                    />
                  )}
                </dd>
              </>
            )}
          </dl>
        </section>

        {!isWalletConnected && (
          <div
            role="alert"
            style={{
              padding: '0.875rem 1rem',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fcd34d',
              marginBottom: '1.25rem',
            }}
          >
            <strong>Wallet required:</strong> Connect your Freighter wallet to review your balance
            and sign the subscription transaction.
          </div>
        )}

        {networkMismatch && (
          <div
            role="alert"
            style={{
              padding: '0.875rem 1rem',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              marginBottom: '1.25rem',
            }}
          >
            <strong>Network mismatch:</strong> Your wallet is connected to{' '}
            <span>{wallet.network}</span>, but checkout requires{' '}
            <span>{expectedNetwork}</span>. Please switch networks in Freighter to continue.
          </div>
        )}

        {status === 'confirmed' && result ? (
          <div
            role="status"
            data-testid="checkout-confirmed"
            style={{
              padding: '1.25rem',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', color: '#6ee7b7' }}>
              Subscription confirmed
            </h2>
            <p style={{ margin: '0 0 0.75rem', color: '#cbd5e1' }}>
              Deposited{' '}
              <Amount
                value={result.amount}
                currency={result.currency}
                data-testid="checkout-confirmed-amount"
              />{' '}
              for {plan.name}.
            </p>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              Transaction: <code>{result.txHash}</code>
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                View on Stellar Expert
              </a>
              <Link to="/subscriptions" style={linkStyle}>
                Go to Subscriptions
              </Link>
            </div>
          </div>
        ) : (
          <>
            <AmountInput
              label="Initial prepaid deposit"
              value={deposit}
              onChange={setDeposit}
              currency={currency}
              onCurrencyChange={setCurrency}
              required
              disabled={status === 'pending'}
              error={
                hasInsufficientBalance && balance !== null
                  ? 'Insufficient ' +
                    currency +
                    ' balance. Available: ' +
                    balance.toFixed(2) +
                    ' ' +
                    currency +
                    '.'
                  : undefined
              }
            />

            {(connectError || (wallet.error && !isWalletConnected)) && (
              <p role="alert" style={{ color: '#ef4444', marginTop: '0.75rem' }}>
                {connectError ?? wallet.error?.message}
              </p>
            )}

            {status === 'pending' && (
              <div
                role="status"
                data-testid="checkout-pending"
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(103, 213, 240, 0.1)',
                  border: '1px solid rgba(103, 213, 240, 0.3)',
                  color: '#bae6fd',
                }}
              >
                Waiting for Freighter signature and transaction confirmation…
              </div>
            )}

            {status === 'failed' && error && (
              <div
                role="alert"
                data-testid="checkout-failed"
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                }}
              >
                <p style={{ margin: '0 0 0.75rem' }}>{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 6,
                    border: '1px solid #f87171',
                    background: 'transparent',
                    color: '#fecaca',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
              {!isWalletConnected ? (
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  disabled={wallet.status === 'connecting'}
                  style={wallet.status === 'connecting' ? disabledButtonStyle : primaryButtonStyle}
                >
                  {wallet.status === 'connecting' ? 'Connecting…' : 'Connect wallet'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={isSubmitBlocked}
                  style={isSubmitBlocked ? disabledButtonStyle : primaryButtonStyle}
                >
                  {status === 'pending' ? 'Signing & confirming…' : 'Confirm subscription'}
                </button>
              )}
              <Link to="/browse-plans" style={linkStyle}>
                Cancel
              </Link>
            </div>
          </>
        )}
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Confirm subscription</h1>
        <dl className={styles.detailsList}>
          <dt className={styles.detailTerm}>Plan</dt>
          <dd className={styles.detailValue}>
            {plan.name} <span className={styles.mutedText}>by {plan.merchant}</span>
          </dd>
          <dt className={styles.detailTerm}>Price</dt>
          <dd className={styles.detailValue}>
            {plan.price} {plan.currency} per {INTERVAL_LABELS[plan.interval]}
          </dd>
          <dt className={styles.detailTerm}>First charge</dt>
          <dd className={styles.detailValue}>{firstChargeDate ? firstChargeDate.toLocaleDateString() : '—'}</dd>
        </dl>
        <AmountInput
          label="Initial prepaid deposit"
          value={deposit}
          onChange={setDeposit}
          currency={currency}
          onCurrencyChange={setCurrency}
          required
          error={error ?? undefined}
        />
        {walletError && !isWalletConnected && (
          <p role="alert" className={styles.errorAlert}>
            {walletError.message}
          </p>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || status === 'connecting'}
            className={styles.confirmButton}
          >
            {!isWalletConnected ? 'Connect wallet' : submitting ? 'Confirming…' : 'Confirm subscription'}
          </button>
          <Link to="/browse-plans" className={styles.link}>
            Cancel
          </Link>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
