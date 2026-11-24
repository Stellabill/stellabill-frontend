import type { Dispatch, SetStateAction } from 'react';
import ScheduleChangePreview, { type BillingInterval } from '../components/ScheduleChangePreview';
import {
    getAvailableIntervalOptions,
    togglePendingInterval,
    type SubscriptionScheduleSummary,
} from './subscriptionDetailHelpers';
import styles from './SubscriptionDetail.module.css';

export interface SubscriptionBillingScheduleProps {
    subscription: SubscriptionScheduleSummary;
    pendingInterval: BillingInterval | null;
    onSelectInterval: Dispatch<SetStateAction<BillingInterval | null>>;
}

export default function SubscriptionBillingSchedule({
    subscription,
    pendingInterval,
    onSelectInterval,
}: SubscriptionBillingScheduleProps) {
    const availableOptions = getAvailableIntervalOptions(subscription.currentInterval);

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
                Billing schedule
            </h2>

            <div className={styles.scheduleControls}>
                <span className={styles.scheduleLabel}>Change to:</span>
                <div className={styles.intervalGroup}>
                    {availableOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() =>
                                onSelectInterval((prev) => togglePendingInterval(prev, opt.value))
                            }
                            aria-pressed={pendingInterval === opt.value}
                            className={`${styles.intervalButton} ${pendingInterval === opt.value ? styles.intervalButtonActive : ''}`}
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
    );
}
