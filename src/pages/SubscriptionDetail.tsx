import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import RecentPayments from '../components/RecentPayments';
import UsageThisPeriod from '../components/UsageThisPeriod';
import PaymentFailedBanner from '../components/Dunning/PaymentFailedBanner';
import PlanStatusTimeline from '../components/PlanStatusTimeline';
import ScheduleChangePreview, { type BillingInterval } from '../components/ScheduleChangePreview';

export default function SubscriptionDetail() {
    const { id } = useParams();
    // ── Schedule-change preview state ────────────────────────────────────────
    const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);

    const handleViewFullUsage = () => {
        console.log('Navigate to full usage page');
        // TODO: Navigate to full usage page or expand section
    };

    // Mock data - replace with actual API data
    const isUsageBased = true; // Determine from subscription data
    const usageData = {
        billingPeriod: 'Mar 1 — Mar 31',
        usage: '32450 API calls',
        estimatedCharge: '10 USDC'
    };

    // Mock subscription data - replace with actual API response
    const subscription = {
        currentInterval: 'weekly' as BillingInterval,
        nextCharge: '2026-08-05',
        amount: 50,
        currency: 'USDC',
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
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/subscriptions" style={{ color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    &larr; Back to Subscriptions
                </Link>
                <h1 style={{ margin: '0 0 0.5rem' }}>Subscription {id}</h1>
                <p style={{ color: '#64748b', margin: 0 }}>View details and recent payments for this subscription.</p>
            </div>

            {/* Dunning banner - shown when there are failed attempts for this subscription */}
            <PaymentFailedBanner
                subscriptionId={id}
                failedAttempts={1}
                retrySchedule={[
                    { id: 'r1', when: 'Mar 24 — Attempted', status: 'past' },
                    { id: 'r2', when: 'Mar 26 — Next retry', status: 'upcoming' },
                    { id: 'r3', when: 'Mar 30 — Final retry', status: 'upcoming' },
                ]}
                onFixPayment={() => {
                    // Ideally route to payment method flow
                    console.log('Open fix payment flow for subscription', id);
                }}
            />

            {/* Usage This Period Section - Only for usage-based subscriptions */}
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

            {/* ── Schedule Change Section ──────────────────────────────────────── */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem' }}>
                    Billing schedule
                </h2>

                {/* Interval selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Change to:</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {intervalOptions
                            .filter(opt => opt.value !== subscription.currentInterval)
                            .map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        setPendingInterval(prev =>
                                            prev === opt.value ? null : opt.value
                                        )
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

                {/* Preview renders only when a new interval is selected */}
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
        </div>
    );
}
