import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useCommandScope } from '../hooks/useCommandScope';
import { usePageTitle } from '../hooks/usePageTitle';
import type { CommandItem } from '../components/CommandPalette';
import RecentPayments from '../components/RecentPayments';
import UsageThisPeriod from '../components/UsageThisPeriod';
import PaymentFailedBanner from '../components/Dunning/PaymentFailedBanner';
import PlanStatusTimeline from '../components/PlanStatusTimeline';
import ScheduleChangePreview, { type BillingInterval } from '../components/ScheduleChangePreview';
import ReactivationModal, { type ReactivationPlan } from '../components/ReactivationModal';
import DowngradeConfirmModal, { type PlanFeature } from '../components/DowngradeConfirmModal';
import TrialCountdownBanner from '../components/TrialCountdownBanner';
import ProrationPreviewModal from '../components/common/ProrationPreviewModal';
import ErrorState from '../components/common/ErrorState';
import { subscriptions } from '../api/client';
import type { Subscription } from '../types/subscription';

// ── Mock subscription status type ────────────────────────────────────────────
type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

/**
 * Maximum days after cancellation during which reactivation is allowed.
 * Surface the CTA only within this window.
 */
const REACTIVATION_WINDOW_DAYS = 30;

export default function SubscriptionDetail() {
    usePageTitle('Subscription Details');
    const { id } = useParams();

    // ── Subscription fetch state ──────────────────────────────────────────────
    const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<{ status?: number; message: string } | null>(null);
    const [notFound, setNotFound] = useState(false);

    // ── Schedule-change preview state ─────────────────────────────────────────
    const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);

    // ── Reactivation state ────────────────────────────────────────────────────
    const [isReactivationModalOpen, setIsReactivationModalOpen] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);

    // ── Proration preview state ────────────────────────────────────────────────
    const [isProrationModalOpen, setIsProrationModalOpen] = useState(false);

    // ── Downgrade state ───────────────────────────────────────────────────────
    const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
    const [isDowngrading, setIsDowngrading] = useState(false);

    const downgradeLostFeatures: PlanFeature[] = [
        { id: 'api-calls',   label: 'Unlimited API calls (limited to 10k/mo on Basic)' },
        { id: 'support',     label: 'Priority support' },
        { id: 'analytics',   label: 'Advanced analytics dashboard' },
        { id: 'webhooks',    label: 'Custom webhooks' },
    ];

    const handleDowngradeConfirm = async () => {
        setIsDowngrading(true);
        try {
            console.log('Downgrading subscription', id, 'to Basic plan');
            await new Promise(resolve => setTimeout(resolve, 1200));
            setIsDowngradeModalOpen(false);
        } catch (err) {
            console.error('Downgrade failed:', err);
        } finally {
            setIsDowngrading(false);
        }
    };

    const handleViewFullUsage = () => {
        navigate(`/subscriptions/${id}/usage`);
    };

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

    const navigate = useNavigate();

    // ── Fetch subscription on mount / id change ───────────────────────────────
    useEffect(() => {
        if (!id) {
            setNotFound(true);
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        let cancelled = false;

        setIsLoading(true);
        setLoadError(null);
        setNotFound(false);
        setSubscriptionData(null);

        subscriptions
            .get(id, { signal: controller.signal })
            .then((data) => {
                if (cancelled) return;
                setSubscriptionData(data);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                const status =
                    typeof err === 'object' && err !== null && 'status' in err
                        ? (err as { status?: number }).status
                        : undefined;
                if (status === 404) {
                    setNotFound(true);
                } else {
                    setLoadError({
                        status,
                        message:
                            err instanceof Error ? err.message : 'Failed to load subscription.',
                    });
                }
            })
            .finally(() => {
                if (cancelled) return;
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [id]);

    // ── Derived data from fetched subscription ────────────────────────────────
    const subscriptionStatus: SubscriptionStatus = subscriptionData?.status ?? 'active';
    const trialEndsAt = subscriptionData?.trialEndsAt
        ? new Date(subscriptionData.trialEndsAt)
        : null;
    const isTrialSubscription = Boolean(trialEndsAt);
    const cancelledAt = subscriptionData?.cancelledAt
        ? new Date(subscriptionData.cancelledAt)
        : null;
    const failedAttempts = subscriptionData?.failedAttempts ?? 0;
    const showDunningBanner = failedAttempts > 0;

    const subscription = {
        currentInterval: (subscriptionData?.interval ?? 'monthly') as BillingInterval,
        nextCharge: subscriptionData?.nextCharge ?? '',
        amount: subscriptionData?.amount ?? 0,
        currency: subscriptionData?.currency ?? 'USDC',
        billingDay: subscriptionData?.billingDay ?? 1,
    };

    const isUsageBased = Boolean(subscriptionData?.usageBased);
    const usageData = subscriptionData?.usage ?? null;

    // Plan data for the reactivation modal
    const reactivationPlan: ReactivationPlan = {
        name: subscriptionData?.planName ?? 'Pro Monthly',
        interval: subscriptionData?.interval ?? 'Monthly',
        price: `${subscription.amount} ${subscription.currency}`,
        deleted: false,
    };

    // Only surface the CTA when reactivation is within the support window
    const daysSinceCancellation = cancelledAt
        ? Math.floor((Date.now() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const isWithinWindow = cancelledAt
        ? daysSinceCancellation <= REACTIVATION_WINDOW_DAYS
        : false;
    const showReactivateCTA = subscriptionStatus === 'cancelled' && isWithinWindow;

    const scopedActions = useMemo<CommandItem[]>(() => {
        const actions: CommandItem[] = [];
        
        if (showReactivateCTA) {
            actions.push({
                id: 'reactivate-sub',
                label: 'Reactivate subscription',
                group: 'Actions',
                keywords: 'restore resume',
                perform: () => setIsReactivationModalOpen(true)
            });
        }
        
        if (subscriptionStatus === 'active') {
            actions.push({
                id: 'downgrade-sub',
                label: 'Downgrade plan',
                group: 'Actions',
                keywords: 'lower plan',
                perform: () => setIsDowngradeModalOpen(true)
            });
            actions.push({
                id: 'preview-proration',
                label: 'Preview Proration',
                group: 'Actions',
                keywords: 'proration calculate',
                perform: () => setIsProrationModalOpen(true)
            });
        }
        
        actions.push({
            id: 'view-usage',
            label: 'View full usage',
            group: 'Actions',
            keywords: 'metrics api calls',
            perform: handleViewFullUsage
        });
        
        actions.push({
            id: 'back-to-subs',
            label: 'Back to Subscriptions',
            group: 'Pages',
            keywords: 'list',
            perform: () => navigate('/subscriptions')
        });

        return actions;
    }, [showReactivateCTA, subscriptionStatus, navigate]);
    
    useCommandScope(`Subscription ${id || 'Detail'}`, scopedActions);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ padding: '2rem', background: '#0a0a0a', minHeight: '100vh', color: '#f8fafc' }}>
                <div
                    role="status"
                    aria-label="Loading subscription"
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                    <div style={{ height: '1rem', width: '180px', background: '#1a1a1a', borderRadius: '6px' }} />
                    <div style={{ height: '2rem', width: '320px', background: '#1a1a1a', borderRadius: '8px' }} />
                    <div style={{ height: '120px', width: '100%', background: '#111', borderRadius: '12px' }} />
                    <div style={{ height: '120px', width: '100%', background: '#111', borderRadius: '12px' }} />
                </div>
            </div>
        );
    }

    // ── Not-found state ───────────────────────────────────────────────────────
    if (notFound) {
        return (
            <div style={{ padding: '2rem', background: '#0a0a0a', minHeight: '100vh', color: '#f8fafc' }}>
                <div
                    role="alert"
                    style={{
                        maxWidth: '480px',
                        margin: '4rem auto',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '1px solid #2a2a2a',
                        background: '#111',
                        textAlign: 'center',
                    }}
                >
                    <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem' }}>Subscription not found</h1>
                    <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
                        We couldn&apos;t find a subscription with id <strong>{id}</strong>.
                    </p>
                    <Link
                        to="/subscriptions"
                        style={{
                            display: 'inline-block',
                            padding: '0.625rem 1.25rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,204,255,0.45)',
                            background: 'rgba(0,204,255,0.1)',
                            color: '#00ccff',
                            fontWeight: 700,
                            textDecoration: 'none',
                        }}
                    >
                        Back to Subscriptions
                    </Link>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (loadError) {
        return (
            <div style={{ padding: '2rem', background: '#0a0a0a', minHeight: '100vh', color: '#f8fafc' }}>
                <ErrorState
                    title="Failed to load subscription"
                    message={loadError.message}
                    onRetry={() => {
                        if (!id) return;
                        setIsLoading(true);
                        setLoadError(null);
                        subscriptions
                            .get(id)
                            .then((data) => setSubscriptionData(data))
                            .catch((err: unknown) => {
                                const status =
                                    typeof err === 'object' && err !== null && 'status' in err
                                        ? (err as { status?: number }).status
                                        : undefined;
                                if (status === 404) {
                                    setNotFound(true);
                                } else {
                                    setLoadError({
                                        status,
                                        message:
                                            err instanceof Error
                                                ? err.message
                                                : 'Failed to load subscription.',
                                    });
                                }
                            })
                            .finally(() => setIsLoading(false));
                    }}
                />
            </div>
        );
    }

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

                    {/* Downgrade CTA — shown for active subscriptions */}
                    {subscriptionStatus === 'active' && (
                        <button
                            onClick={() => setIsDowngradeModalOpen(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1.25rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(245,158,11,0.35)',
                                background: 'rgba(245,158,11,0.08)',
                                color: '#f59e0b',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                            }}
                            aria-label="Downgrade to a lower plan"
                        >
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
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <polyline points="19 12 12 19 5 12" />
                            </svg>
                            Downgrade plan
                        </button>
                    )}

                    {/* ── Proration CTA ──────────────────────────────────────── */}
                    {subscriptionStatus === 'active' && (
                        <button
                            onClick={() => setIsProrationModalOpen(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1.25rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(34,211,238,0.35)',
                                background: 'rgba(34,211,238,0.08)',
                                color: '#22d3ee',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                            }}
                            aria-label="Preview proration for plan change"
                        >
                            Preview Proration
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

            {/* ── Trial countdown banner ────────────────────────────────────── */}
            {isTrialSubscription && trialEndsAt && (
                <TrialCountdownBanner
                    trialEndsAt={trialEndsAt}
                    upgradeHref="/plans"
                    onUpgrade={() => navigate('/plans')}
                />
            )}

            {/* ── Dunning banner ────────────────────────────────────────────── */}
            {showDunningBanner && (
                <PaymentFailedBanner
                    subscriptionId={id}
                    failedAttempts={failedAttempts}
                    retrySchedule={[
                        { id: 'r1', when: 'Mar 24 — Attempted', status: 'past' },
                        { id: 'r2', when: 'Mar 26 — Next retry', status: 'upcoming' },
                        { id: 'r3', when: 'Mar 30 — Final retry', status: 'upcoming' },
                    ]}
                    onFixPayment={() => {
                        navigate('/settings');
                    }}
                />
            )}

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

            {/* ── Proration preview modal ─────────────────────────────────── */}
            <ProrationPreviewModal
                isOpen={isProrationModalOpen}
                onClose={() => setIsProrationModalOpen(false)}
                onConfirm={() => {
                    setIsProrationModalOpen(false);
                }}
                currentPlan="Pro"
                newPlan="Basic"
                effectiveDate="Aug 1, 2026"
                lineItems={[
                    { label: 'Unused Pro (15 days)', amount: 2500, type: 'credit' },
                    { label: 'Basic plan (remaining 15 days)', amount: 1000, type: 'charge' },
                ]}
                nextInvoiceTotal={1000}
            />

            {/* ── Downgrade confirmation modal ──────────────────────────────── */}
            <DowngradeConfirmModal
                isOpen={isDowngradeModalOpen}
                onClose={() => setIsDowngradeModalOpen(false)}
                onConfirm={handleDowngradeConfirm}
                currentPlanName="Pro"
                currentPlanPrice="50 USDC / mo"
                newPlanName="Basic"
                newPlanPrice="20 USDC / mo"
                lostFeatures={downgradeLostFeatures}
                isDelayed={true}
                effectiveDate="Aug 1, 2026"
                comparePlansHref="/plans"
                isLoading={isDowngrading}
            />
        </div>
    );
}
