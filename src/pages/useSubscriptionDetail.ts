import { useState, useEffect, useMemo, useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { CommandItem } from '../components/CommandPalette';
import type { BillingInterval } from '../components/ScheduleChangePreview';
import { subscriptions, type Payment } from '../api/client';
import type { Subscription } from '../types/subscription';
import {
    deriveSubscriptionViewModel,
    extractErrorStatus,
    formatReactivationError,
    getErrorMessage,
    type LoadErrorState,
    type ReactivationErrorState,
} from './subscriptionDetailHelpers';

export function useSubscriptionDetail(id: string | undefined, navigate: NavigateFunction) {
    // ── Subscription fetch state ──────────────────────────────────────────────
    const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<LoadErrorState | null>(null);
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
    const [reactivationError, setReactivationError] = useState<ReactivationErrorState | null>(null);

    // ── Proration preview state ────────────────────────────────────────────────
    const [isProrationModalOpen, setIsProrationModalOpen] = useState(false);

    // ── Downgrade state ───────────────────────────────────────────────────────
    const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
    const [isDowngrading, setIsDowngrading] = useState(false);

    const handleDowngradeConfirm = useCallback(async () => {
        setIsDowngrading(true);
        try {
            console.log('Downgrading subscription', id, 'to Basic plan');
            await new Promise((resolve) => setTimeout(resolve, 1200));
            setIsDowngradeModalOpen(false);
        } catch (err) {
            console.error('Downgrade failed:', err);
        } finally {
            setIsDowngrading(false);
        }
    }, [id]);

    const handleViewFullUsage = useCallback(() => {
        navigate(`/subscriptions/${id}/usage`);
    }, [id, navigate]);

    // Reactivation goes through the typed subscriptions client. Errors keep
    // the modal open and are surfaced in an alert under the header.
    const handleReactivateConfirm = useCallback(async (startDate: Date) => {
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
            setReactivationError(formatReactivationError(err));
        } finally {
            setIsReactivating(false);
        }
    }, [id]);

    const handleRetryLoad = useCallback(() => {
        if (!id) return;
        setIsLoading(true);
        setLoadError(null);
        subscriptions
            .get(id)
            .then((data) => setSubscriptionData(data))
            .catch((err: unknown) => {
                const status = extractErrorStatus(err);
                if (status === 404) {
                    setNotFound(true);
                } else {
                    setLoadError({
                        status,
                        message: getErrorMessage(err, 'Failed to load subscription.'),
                    });
                }
            })
            .finally(() => setIsLoading(false));
    }, [id]);

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
                const status = extractErrorStatus(err);
                if (status === 404) {
                    setNotFound(true);
                } else {
                    setLoadError({
                        status,
                        message: getErrorMessage(err, 'Failed to load subscription.'),
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
                setPaymentsError(getErrorMessage(err, 'Failed to load recent payments.'));
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
    const viewModel = deriveSubscriptionViewModel(subscriptionData);

    const scopedActions = useMemo<CommandItem[]>(() => {
        const actions: CommandItem[] = [];

        if (viewModel.showReactivateCTA) {
            actions.push({
                id: 'reactivate-sub',
                label: 'Reactivate subscription',
                group: 'Actions',
                keywords: 'restore resume',
                perform: () => setIsReactivationModalOpen(true),
            });
        }

        if (viewModel.subscriptionStatus === 'active') {
            actions.push({
                id: 'downgrade-sub',
                label: 'Downgrade plan',
                group: 'Actions',
                keywords: 'lower plan',
                perform: () => setIsDowngradeModalOpen(true),
            });
            actions.push({
                id: 'preview-proration',
                label: 'Preview Proration',
                group: 'Actions',
                keywords: 'proration calculate',
                perform: () => setIsProrationModalOpen(true),
            });
        }

        actions.push({
            id: 'view-usage',
            label: 'View full usage',
            group: 'Actions',
            keywords: 'metrics api calls',
            perform: handleViewFullUsage,
        });

        actions.push({
            id: 'back-to-subs',
            label: 'Back to Subscriptions',
            group: 'Pages',
            keywords: 'list',
            perform: () => navigate('/subscriptions'),
        });

        return actions;
    }, [viewModel.showReactivateCTA, viewModel.subscriptionStatus, navigate, handleViewFullUsage]);

    return {
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
        ...viewModel,
    };
}
