import ReactivationModal, { type ReactivationPlan } from '../components/ReactivationModal';
import DowngradeConfirmModal from '../components/DowngradeConfirmModal';
import ProrationPreviewModal from '../components/common/ProrationPreviewModal';
import { DOWNGRADE_LOST_FEATURES } from './subscriptionDetailHelpers';

export interface SubscriptionDetailModalsProps {
    isReactivationModalOpen: boolean;
    onCloseReactivation: () => void;
    onConfirmReactivation: (startDate: Date) => Promise<void>;
    reactivationPlan: ReactivationPlan;
    isWithinWindow: boolean;
    billingDay: number;
    isReactivating: boolean;
    isProrationModalOpen: boolean;
    onCloseProration: () => void;
    onConfirmProration: () => void;
    isDowngradeModalOpen: boolean;
    onCloseDowngrade: () => void;
    onConfirmDowngrade: () => Promise<void>;
    isDowngrading: boolean;
}

export default function SubscriptionDetailModals({
    isReactivationModalOpen,
    onCloseReactivation,
    onConfirmReactivation,
    reactivationPlan,
    isWithinWindow,
    billingDay,
    isReactivating,
    isProrationModalOpen,
    onCloseProration,
    onConfirmProration,
    isDowngradeModalOpen,
    onCloseDowngrade,
    onConfirmDowngrade,
    isDowngrading,
}: SubscriptionDetailModalsProps) {
    return (
        <>
            {/* ── Reactivation modal ────────────────────────────────────────── */}
            <ReactivationModal
                isOpen={isReactivationModalOpen}
                onClose={onCloseReactivation}
                onConfirm={onConfirmReactivation}
                plan={reactivationPlan}
                windowExpired={!isWithinWindow}
                billingDay={billingDay}
                isLoading={isReactivating}
            />

            {/* ── Proration preview modal ─────────────────────────────────── */}
            <ProrationPreviewModal
                isOpen={isProrationModalOpen}
                onClose={onCloseProration}
                onConfirm={onConfirmProration}
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
                onClose={onCloseDowngrade}
                onConfirm={onConfirmDowngrade}
                currentPlanName="Pro"
                currentPlanPrice="50 USDC / mo"
                newPlanName="Basic"
                newPlanPrice="20 USDC / mo"
                lostFeatures={DOWNGRADE_LOST_FEATURES}
                isDelayed={true}
                effectiveDate="Aug 1, 2026"
                comparePlansHref="/plans"
                isLoading={isDowngrading}
            />
        </>
    );
}
