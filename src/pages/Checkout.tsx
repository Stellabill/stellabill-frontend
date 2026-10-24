import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AmountInput } from '../components/common/AmountInput';
import { useWallet } from '../wallet/WalletContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { findCatalogPlan, type PlanInterval } from '../data/catalogPlans';
import { addBillingInterval } from '../utils/billingDate';

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
      <div style={{ padding: '2rem' }}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>Plan not found</h1>
          <p style={{ color: '#94a3b8' }}>The plan you are trying to subscribe to does not exist.</p>
          <Link to="/browse-plans" style={linkStyle}>
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
    <div style={{ padding: '2rem' }}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Confirm subscription</h1>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', margin: '0 0 1.5rem' }}>
          <dt style={{ color: '#94a3b8' }}>Plan</dt>
          <dd style={{ margin: 0 }}>
            {plan.name} <span style={{ color: '#94a3b8' }}>by {plan.merchant}</span>
          </dd>
          <dt style={{ color: '#94a3b8' }}>Price</dt>
          <dd style={{ margin: 0 }}>
            {plan.price} {plan.currency} per {INTERVAL_LABELS[plan.interval]}
          </dd>
          <dt style={{ color: '#94a3b8' }}>First charge</dt>
          <dd style={{ margin: 0 }}>{firstChargeDate ? firstChargeDate.toLocaleDateString() : '—'}</dd>
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
          <p role="alert" style={{ color: '#ef4444' }}>
            {walletError.message}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || status === 'connecting'}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
              color: '#0f172a',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {!isWalletConnected ? 'Connect wallet' : submitting ? 'Confirming…' : 'Confirm subscription'}
          </button>
          <Link to="/browse-plans" style={linkStyle}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
