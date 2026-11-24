import { useParams, Link, useNavigate } from 'react-router-dom';
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
        </div>
    );
}
