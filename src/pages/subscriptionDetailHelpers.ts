import type { BillingInterval } from '../components/ScheduleChangePreview';
import type { ReactivationPlan } from '../components/ReactivationModal';
import type { PlanFeature } from '../components/DowngradeConfirmModal';
import type { ApiError } from '../api/client';
import type { Subscription } from '../types/subscription';

// ── Subscription status type ─────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

/**
 * Maximum days after cancellation during which reactivation is allowed.
 * Surface the CTA only within this window.
 */
export const REACTIVATION_WINDOW_DAYS = 30;

export const INTERVAL_OPTIONS: { label: string; value: BillingInterval }[] = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Every 2 weeks', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly', value: 'yearly' },
];

export const DOWNGRADE_LOST_FEATURES: PlanFeature[] = [
    { id: 'api-calls',   label: 'Unlimited API calls (limited to 10k/mo on Basic)' },
    { id: 'support',     label: 'Priority support' },
    { id: 'analytics',   label: 'Advanced analytics dashboard' },
    { id: 'webhooks',    label: 'Custom webhooks' },
];

export const DEFAULT_RETRY_SCHEDULE: { id: string; when: string; status: 'past' | 'upcoming' }[] = [
    { id: 'r1', when: 'Mar 24 — Attempted', status: 'past' },
    { id: 'r2', when: 'Mar 26 — Next retry', status: 'upcoming' },
    { id: 'r3', when: 'Mar 30 — Final retry', status: 'upcoming' },
];

export interface ReactivationErrorState {
    message: string;
    technicalDetails?: string;
}

export interface LoadErrorState {
    status?: number;
    message: string;
}

export interface SubscriptionScheduleSummary {
    currentInterval: BillingInterval;
    nextCharge: string;
    amount: number;
    currency: string;
    billingDay: number;
}

export interface SubscriptionViewModel {
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt: Date | null;
    isTrialSubscription: boolean;
    cancelledAt: Date | null;
    failedAttempts: number;
    showDunningBanner: boolean;
    subscription: SubscriptionScheduleSummary;
    isUsageBased: boolean;
    usageData: Subscription['usage'] | null;
    reactivationPlan: ReactivationPlan;
    daysSinceCancellation: number;
    isWithinWindow: boolean;
    showReactivateCTA: boolean;
}

export function extractErrorStatus(err: unknown): number | undefined {
    return typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status?: number }).status
        : undefined;
}

export function getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
}

export function formatReactivationError(err: unknown): ReactivationErrorState {
    const apiError = err as ApiError;
    return {
        message:
            apiError instanceof Error && apiError.message
                ? apiError.message
                : 'Failed to reactivate subscription. Please try again.',
        technicalDetails: apiError?.technicalDetails,
    };
}

export function getDaysSinceCancellation(cancelledAt: Date | null, now = Date.now()): number {
    if (!cancelledAt) return 0;
    return Math.floor((now - cancelledAt.getTime()) / (1000 * 60 * 60 * 24));
}

export function isWithinReactivationWindow(
    cancelledAt: Date | null,
    now = Date.now(),
    windowDays = REACTIVATION_WINDOW_DAYS,
): boolean {
    if (!cancelledAt) return false;
    return getDaysSinceCancellation(cancelledAt, now) <= windowDays;
}

export function getAvailableIntervalOptions(
    currentInterval: BillingInterval,
): { label: string; value: BillingInterval }[] {
    return INTERVAL_OPTIONS.filter((opt) => opt.value !== currentInterval);
}

export function togglePendingInterval(
    prev: BillingInterval | null,
    next: BillingInterval,
): BillingInterval | null {
    return prev === next ? null : next;
}

export function deriveSubscriptionViewModel(
    subscriptionData: Subscription | null,
    now = Date.now(),
): SubscriptionViewModel {
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

    const subscription: SubscriptionScheduleSummary = {
        currentInterval: (subscriptionData?.interval ?? 'monthly') as BillingInterval,
        nextCharge: subscriptionData?.nextCharge ?? '',
        amount: subscriptionData?.amount ?? subscriptionData?.price ?? 0,
        currency: subscriptionData?.currency ?? 'USDC',
        billingDay: subscriptionData?.billingDay ?? 1,
    };

    const isUsageBased = Boolean(subscriptionData?.usageBased);
    const usageData = subscriptionData?.usage ?? null;

    const reactivationPlan: ReactivationPlan = {
        name: subscriptionData?.planName ?? 'Pro Monthly',
        interval: subscriptionData?.interval ?? 'Monthly',
        price: `${subscription.amount} ${subscription.currency}`,
        deleted: false,
    };

    const daysSinceCancellation = getDaysSinceCancellation(cancelledAt, now);
    const isWithinWindow = isWithinReactivationWindow(cancelledAt, now);
    const showReactivateCTA = subscriptionStatus === 'cancelled' && isWithinWindow;

    return {
        subscriptionStatus,
        trialEndsAt,
        isTrialSubscription,
        cancelledAt,
        failedAttempts,
        showDunningBanner,
        subscription,
        isUsageBased,
        usageData,
        reactivationPlan,
        daysSinceCancellation,
        isWithinWindow,
        showReactivateCTA,
    };
}
