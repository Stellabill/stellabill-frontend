import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import RecentPayments from '../components/RecentPayments';
import UsageThisPeriod from '../components/UsageThisPeriod';
import PaymentFailedBanner from '../components/Dunning/PaymentFailedBanner';
import PlanStatusTimeline from '../components/PlanStatusTimeline';
import ScheduleChangePreview, { type BillingInterval } from '../components/ScheduleChangePreview';
import ReactivationModal, { type ReactivationPlan } from '../components/ReactivationModal';

// ── Mock subscription status type ────────────────────────────────────────────
type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

/**
 * Maximum days after cancellation during which reactivation is allowed.
 * Surface the CTA only within this window.
 */
const REACTIVATION_WINDOW_DAYS = 30;

export default function SubscriptionDetail() {
    const { id } = useParams();

    // ── Schedule-change preview state ─────────────────────────────────────────
    const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);

    // ── Reactivation state ────────────────────────────────────────────────────
    const [isReactivationModalOpen, setIsReactivationModalOpen] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);

    const handleViewFullUsage = () => {
        console.log('Navigate to full usage page');
        // TODO: Navigate to full usage page or expand section
    };

    // ── Mock data — replace with actual API responses ─────────────────────────
    const isUsageBased = true;
    const usageData = {
        billingPeriod: 'Mar 1 — Mar 31',
        usage: '32450 API calls',
        estimatedCharge: '10 USDC',
    };

    // Mock subscription metadata
    const subscriptionStatus: SubscriptionStatus = 'cancelled';
    const cancelledAt = new Date();
    cancelledAt.setDate(cancelledAt.getDate() - 7); // cancelled 7 days ago

    const subscription = {
        currentInterval: 'weekly' as BillingInterval,
        nextCharge: '2026-08-05',
        amount: 50,
        currency: 'USDC',
        billingDay: 15, // subscriber's original billing day of month
    };

    // Plan data for the reactivation modal
    const reactivationPlan: ReactivationPlan = {
        name: 'Pro Monthly',
        interval: 'Monthly',
        price: '50 USDC',
        deleted: false,
    };

    // Only surface the CTA when reactivation is within the support window
    const daysSinceCancellation = Math.floor(
        (Date.now() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isWithinWindow = daysSinceCancellation <= REACTIVATION_WINDOW_DAYS;
    const showReactivateCTA = subscriptionStatus === 'cancelled' && isWithinWindow;

    // Reactivation handler — swap out the console.log for your API call
    const handleReactivateConfirm = async (startDate: Date) => {
        setIsReactivating(true);
        try {
            console.log('Reactivating subscription', id, 'with start date', startDate.toISOString());
            // TODO: await api.subscriptions.reactivate(id, { startDate })
            await new Promise(resolve => setTimeout(resolve, 1200));
            setIsReactivationModalOpen(false);
        } catch (err) {
            console.error('Reactivation failed:', err);
        } finally {
            setIsReactivating(false);
        }
    };

    const intervalOptions: { label: string; value: BillingInterval }[] = [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Every 2 weeks', value: 'biweekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Yearly', value: 'yearly' },
    ];

    return (
        <div style={{ padding: '2rem', background: '#0a0a0a', minHeight: '100vh', color: '#f8fafc' }}>

            {/* ── Page header with optional Reactivate CTA ──────────────────── */}
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    to="/subscriptions"
                    style={{ color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}
                >
                    &larr; Back to Subscriptions
                </Link>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem' }}>Subscription {id}</h1>
                        <p style={{ color: '#64748b', margin: 0 }}>
                            View details and recent payments for this subscription.
                        </p>
                    </div>

                    {/* Reactivate CTA — only for cancelled subs within the support window */}
                    {showReactivateCTA && (
                        <button
                            onClick={() => setIsReactivationModalOpen(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1.25rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,204,255,0.45)',
                                background: 'rgba(0,204,255,0.1)',
                                color: '#00ccff',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                            }}
                            aria-label="Reactivate this subscription"
                        >
                            {/* Refresh icon */}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                            Reactivate
                        </button>
                    )}
                </div>

                {/* Reactivation window notice */}
                {subscriptionStatus === 'cancelled' && !isWithinWindow && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(251,191,36,0.25)',
                            background: 'rgba(251,191,36,0.05)',
                            fontSize: '0.8125rem',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                        role="status"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Reactivation window has expired. Browse plans to start a new subscription.
                    </div>
                )}
            </div>

            {/* ── Dunning banner ────────────────────────────────────────────── */}
            <PaymentFailedBanner
                subscriptionId={id}
                failedAttempts={1}
                retrySchedule={[
                    { id: 'r1', when: 'Mar 24 — Attempted', status: 'past' },
                    { id: 'r2', when: 'Mar 26 — Next retry', status: 'upcoming' },
                    { id: 'r3', when: 'Mar 30 — Final retry', status: 'upcoming' },
                ]}
                onFixPayment={() => {
                    console.log('Open fix payment flow for subscription', id);
                }}
            />

            {/* ── Usage this period ─────────────────────────────────────────── */}
            {isUsageBased && (
                <div style={{ marginBottom: '2rem' }}>
                    <UsageThisPeriod
                        billingPeriod={usageData?.billingPeriod}
                        usage={usageData?.usage}
                        estimatedCharge={usageData?.estimatedCharge}
                        onViewFullUsage={handleViewFullUsage}
                    />
                </div>
            )}

            {/* ── Billing schedule / schedule-change preview ────────────────── */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem' }}>
                    Billing schedule
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Change to:</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {intervalOptions
                            .filter(opt => opt.value !== subscription.currentInterval)
                            .map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        setPendingInterval((prev: BillingInterval | null) => prev === opt.value ? null : opt.value)
                                    }
                                    aria-pressed={pendingInterval === opt.value}
                                    style={{
                                        padding: '0.375rem 0.875rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: pendingInterval === opt.value
                                            ? '1px solid rgba(0,204,255,0.6)'
                                            : '1px solid #2a2a2a',
                                        background: pendingInterval === opt.value
                                            ? 'rgba(0,204,255,0.12)'
                                            : '#111',
                                        color: pendingInterval === opt.value ? '#00ccff' : '#94a3b8',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                    </div>
                </div>

                {pendingInterval && (
                    <ScheduleChangePreview
                        currentNextCharge={subscription.nextCharge}
                        currentInterval={subscription.currentInterval}
                        newInterval={pendingInterval}
                        amount={subscription.amount}
                        currency={subscription.currency}
                        cycles={3}
                    />
                )}
            </div>

            <RecentPayments subscriptionId={id} />
            <PlanStatusTimeline subscriptionId={id} />

            {/* ── Reactivation modal ────────────────────────────────────────── */}
            <ReactivationModal
                isOpen={isReactivationModalOpen}
                onClose={() => setIsReactivationModalOpen(false)}
                onConfirm={handleReactivateConfirm}
                plan={reactivationPlan}
                windowExpired={!isWithinWindow}
                billingDay={subscription.billingDay}
                isLoading={isReactivating}
            />
        </div>
    );
}
