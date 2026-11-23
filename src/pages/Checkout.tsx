import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AmountInput } from '../components/common/AmountInput';
import { useWallet } from '../wallet/WalletContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { findCatalogPlan, type PlanInterval } from '../data/catalogPlans';
import { addBillingInterval } from '../utils/billingDate';
import styles from './Checkout.module.css';

const INTERVAL_LABELS: Record<PlanInterval, string> = {
  Monthly: 'month',
  Yearly: 'year',
};

export default function Checkout() {
  usePageTitle('Checkout');
  const { planId } = useParams();
  const navigate = useNavigate();
  const { status, connect, error: walletError } = useWallet();
  const plan = planId ? findCatalogPlan(planId) : undefined;
  const [deposit, setDeposit] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>(plan?.currency ?? 'USDC');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isWalletConnected = status === 'connected';

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      setError('Unable to connect wallet. Please try again.');
    }
  };

  const handleConfirm = async () => {
    if (!isWalletConnected) {
      await handleConnect();
      return;
    }
    if (deposit === null || Number.isNaN(deposit) || deposit <= 0) {
      setError('Enter a valid initial deposit.');
      return;
    }
    setError(null);
    setSubmitting(true);
    // No subscriptions backend is deployed for this demo; return to the subscriptions list.
    navigate('/subscriptions');
  };

  return (
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
    </div>
  );
}
