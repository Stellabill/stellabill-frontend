import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AmountInput } from '../components/AmountInput';
import { useWallet } from '../context/WalletContext';
import { useSubscriptions } from '../context/SubscriptionsContext';
import type { Plan } from '../types';
import { getPlan } from '../api/plans';


const INTERVAL_LABELS: Record<Plan['interval'], string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
};

function addInterval(date: Date, interval: Plan['interval']): Date {
  const next = new Date(date.getTime());
  if (interval === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (interval === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export default function Checkout() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { isWalletConnected, connectWallet } = useWallet();
  const { addSubscription } = useSubscriptions();
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [deposit, setDeposit] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPlan(undefined);
    if (!planId) {
      setPlan(null);
      return () => {
        cancelled = true;
      };
    }
    getPlan(planId)
      .then((found) => {
        if (!cancelled) setPlan(found ?? null);
      })
      .catch(() => {
        if (!cancelled) setPlan(null);
      });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const firstChargeDate = useMemo(() => {
    if (!plan) return null;
    return addInterval(new Date(), plan.interval);
  }, [plan]);

  if (plan === undefined) {
    return (
      <div className="checkout-page">
        <p className="checkout-loading">Updating checkout&hellip;</p>
      </div>
    );
  }

  if (plan === null) {
    return (
      <div className="checkout-page">
        <h1>Plan not found</h1>
        <p>The plan you are trying to subscribe to does not exist.</p>
        <Link to="/browse-plans">Back to Browse Plans</Link>
      </div>
    );
  }

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch {
      setError('Unable to connect wallet. Please try again.');
    }
  };

  const handleConfirm = async () => {
    if (!isWalletConnected) {
      await handleConnect();
      return;
    }
    const depositNumber = Number(deposit);
    if (!deposit || Number.isNaN(depositNumber) || depositNumber <= 0) {
      setError('Enter a valid initial deposit.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await addSubscription({ plan, initialDeposit: depositNumber });
      navigate('/subscriptions');
    } catch {
      setError('Unable to create subscription. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Confirm subscription</h1>
      <dl className="checkout-summary">
        <dt>Plan</dt>
        <dd>{plan.name}</dd>
        <dt>Price</dt>
        <dd>
          {plan.price} {plan.currency} per {INTERVAL_LABELS[plan.interval]}
        </dd>
        <dt>Interval</dt>
        <dd>{plan.interval}</dd>
        <dt>First charge</dt>
        <dd>{firstChargeDate ? firstChargeDate.toLocaleDateString() : '\u2014'}</dd>
      </dl>
      <label className="checkout-deposit-label">
        Initial prepaid deposit
        <AmountInput value={deposit} onChange={setDeposit} currency={plan.currency} />
      </label>
      {error && <p className="checkout-error">{error}</p>}
      <div className="checkout-actions">
        <button type="button" onClick={handleConfirm} disabled={submitting}>
          {!isWalletConnected ? 'Connect wallet' : submitting ? 'Confirming\u2026' : 'Confirm subscription'}
        </button>
        <Link to="/browse-plans">Cancel</Link>
      </div>
    </div>
  );
}
