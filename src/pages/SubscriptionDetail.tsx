import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCommandScope } from '../hooks/useCommandScope';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSubscriptionActions } from '../hooks/useSubscriptionActions';
import type { CommandItem } from '../components/CommandPalette';
import { useCommandScope } from '../hooks/useCommandScope';
import { usePageTitle } from '../hooks/usePageTitle';
import RecentPayments from '../components/RecentPayments';
import UsageThisPeriod from '../components/UsageThisPeriod';
import PaymentFailedBanner from '../components/Dunning/PaymentFailedBanner';
import PlanStatusTimeline from '../components/PlanStatusTimeline';
import TrialCountdownBanner from '../components/TrialCountdownBanner';
import ErrorState from '../components/ErrorState';
import { DEFAULT_RETRY_SCHEDULE } from './subscriptionDetailHelpers';
import { useSubscriptionDetail } from './useSubscriptionDetail';
import SubscriptionDetailHeader from './SubscriptionDetailHeader';
import SubscriptionBillingSchedule from './SubscriptionBillingSchedule';
import SubscriptionDetailModals from './SubscriptionDetailModals';
import styles from './SubscriptionDetail.module.css';

export default function SubscriptionDetail() {
    usePageTitle('Subscription Details');
    const { id } = useParams();
    const navigate = useNavigate();

    // ── Subscription fetch state ──────────────────────────────────────────────
    const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<{ status?: number; message: string } | null>(null);
    const [notFound, setNotFound] = useState(false);

    // ── Recent payments fetch state ───────────────────────────────────────────
    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);

    // ── Schedule-change preview state ─────────────────────────────────────────
    const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);

    // ── Reactivation state ────────────────────────────────────────────────────
    const [isReactivationModalOpen, setIsReactivationModalOpen] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);
    const [reactivationError, setReactivationError] = useState<{
        message: string;
        technicalDetails?: string;
    } | null>(null);

    // ── Proration preview state ────────────────────────────────────────────────
    const [isProrationModalOpen, setIsProrationModalOpen] = useState(false);

    // ── Downgrade state ───────────────────────────────────────────────────────
    const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);

    const {
        pendingAction,
        isPending,
        toasts,
        removeToast,
        downgrade,
        reactivate,
    } = useSubscriptionActions();

    const isReactivating = pendingAction === 'reactivate';
    const isDowngrading = pendingAction === 'downgrade';

    const downgradeLostFeatures: PlanFeature[] = [
        { id: 'api-calls',   label: 'Unlimited API calls (limited to 10k/mo on Basic)' },
        { id: 'support',     label: 'Priority support' },
        { id: 'analytics',   label: 'Advanced analytics dashboard' },
        { id: 'webhooks',    label: 'Custom webhooks' },
    ];

    const handleDowngradeConfirm = async () => {
        if (!id) return;
        const previousSnapshot = subscriptionData;
        await downgrade(
            id,
            { planName: 'Basic' },
            {
                onOptimistic: () => {
                    setSubscriptionData((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  planName: 'Basic',
                                  price: 20,
                                  amount: 20,
                              }
                            : prev,
                    );
                },
                onRollback: () => {
                    setSubscriptionData(previousSnapshot);
                },
                onSuccess: () => {
                    setIsDowngradeModalOpen(false);
                },
            },
        );
    };

    const handleViewFullUsage = useCallback(() => {
        navigate('/subscriptions/' + String(id) + '/usage');
    }, [navigate, id]);

    // Reactivation goes through the typed subscriptions client. Errors keep
    // the modal open and are surfaced in an alert under the header.
    const handleReactivateConfirm = async (startDate: Date) => {
        if (!id) return;
        setIsReactivating(true);
        setReactivationError(null);
        try {
            const result = await subscriptions.reactivate(id, {
                startDate: startDate.toISOString(),
            });
            setSubscriptionData((prev) =>
                prev ? { ...prev, status: result.status, cancelledAt: null } : prev,
            );
            setIsReactivationModalOpen(false);
        } catch (err) {
            const apiError = err as ApiError;
            setReactivationError({
                message:
                    apiError instanceof Error && apiError.message
                        ? apiError.message
                        : 'Failed to reactivate subscription. Please try again.',
                technicalDetails: apiError?.technicalDetails,
            });
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
        setPaymentsLoading(true);
        setPaymentsError(null);
        setPayments([]);

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

        subscriptions
            .payments(id, { signal: controller.signal })
            .then((data) => {
                if (cancelled) return;
                setPayments(data?.payments ?? []);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setPaymentsError(
                    err instanceof Error ? err.message : 'Failed to load recent payments.',
                );
            })
            .finally(() => {
                if (cancelled) return;
                setPaymentsLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [id]);

    // ── Derived data from fetched subscription ────────────────────────────────
    const subscriptionStatus: SubscriptionStatus =
        (subscriptionData?.status?.toLowerCase() as SubscriptionStatus | undefined) ?? 'active';
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
        amount: subscriptionData?.amount ?? subscriptionData?.price ?? 0,
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
    }, [showReactivateCTA, subscriptionStatus, navigate, handleViewFullUsage]);
    
    const {
        isLoading,
        loadError,
        notFound,
        payments,
        paymentsLoading,
        paymentsError,
        pendingInterval,
        setPendingInterval,
        isReactivationModalOpen,
        setIsReactivationModalOpen,
        isReactivating,
        reactivationError,
        isProrationModalOpen,
        setIsProrationModalOpen,
        isDowngradeModalOpen,
        setIsDowngradeModalOpen,
        isDowngrading,
        handleDowngradeConfirm,
        handleViewFullUsage,
        handleReactivateConfirm,
        handleRetryLoad,
        scopedActions,
        subscriptionStatus,
        trialEndsAt,
        isTrialSubscription,
        failedAttempts,
        showDunningBanner,
        subscription,
        isUsageBased,
        usageData,
        reactivationPlan,
        isWithinWindow,
        showReactivateCTA,
    } = useSubscriptionDetail(id, navigate);

    useCommandScope(`Subscription ${id || 'Detail'}`, scopedActions);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className={styles.page}>
                <div
                    role="status"
                    aria-label="Loading subscription"
                    className={styles.skeletonList}
                >
                    <div className={styles.skeletonLineSm} />
                    <div className={styles.skeletonLineLg} />
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                </div>
            </div>
        );
    }

    // ── Not-found state ───────────────────────────────────────────────────────
    if (notFound) {
        return (
            <div className={styles.page}>
                <div
                    role="alert"
                    className={styles.notFoundCard}
                >
                    <h1 className={styles.notFoundTitle}>Subscription not found</h1>
                    <p className={styles.notFoundMessage}>
                        We couldn&apos;t find a subscription with id <strong>{id}</strong>.
                    </p>
                    <Link
                        to="/subscriptions"
                        className={styles.notFoundBackLink}
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
            <div className={styles.page}>
                <ErrorState
                    title="Failed to load subscription"
                    message={loadError.message}
                    onRetry={handleRetryLoad}
                />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <SubscriptionDetailHeader
                id={id}
                subscriptionStatus={subscriptionStatus}
                showReactivateCTA={showReactivateCTA}
                isWithinWindow={isWithinWindow}
                reactivationError={reactivationError}
                onOpenReactivation={() => setIsReactivationModalOpen(true)}
                onOpenDowngrade={() => setIsDowngradeModalOpen(true)}
                onOpenProration={() => setIsProrationModalOpen(true)}
            />

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
                    retrySchedule={DEFAULT_RETRY_SCHEDULE}
                    onFixPayment={() => {
                        navigate('/settings');
                    }}
                />
            )}

            {/* ── Usage this period ─────────────────────────────────────────── */}
            {isUsageBased && (
                <div className={styles.section}>
                    <UsageThisPeriod
                        billingPeriod={usageData?.billingPeriod}
                        usage={usageData?.usage}
                        estimatedCharge={usageData?.estimatedCharge}
                        onViewFullUsage={handleViewFullUsage}
                    />
                </div>
            )}

            {/* ── Billing schedule / schedule-change preview ────────────────── */}
            <SubscriptionBillingSchedule
                subscription={subscription}
                pendingInterval={pendingInterval}
                onSelectInterval={setPendingInterval}
            />

            <RecentPayments
                subscriptionId={id}
                payments={payments}
                isLoading={paymentsLoading}
                error={paymentsError}
            />
            <PlanStatusTimeline subscriptionId={id} />

            <SubscriptionDetailModals
                isReactivationModalOpen={isReactivationModalOpen}
                onCloseReactivation={() => setIsReactivationModalOpen(false)}
                onConfirmReactivation={handleReactivateConfirm}
                reactivationPlan={reactivationPlan}
                isWithinWindow={isWithinWindow}
                billingDay={subscription.billingDay}
                isReactivating={isReactivating}
                isProrationModalOpen={isProrationModalOpen}
                onCloseProration={() => setIsProrationModalOpen(false)}
                onConfirmProration={() => setIsProrationModalOpen(false)}
                isDowngradeModalOpen={isDowngradeModalOpen}
                onCloseDowngrade={() => setIsDowngradeModalOpen(false)}
                onConfirmDowngrade={handleDowngradeConfirm}
                isDowngrading={isDowngrading}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
