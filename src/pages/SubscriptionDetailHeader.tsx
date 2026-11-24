import { Link } from 'react-router-dom';
import type { ReactivationErrorState, SubscriptionStatus } from './subscriptionDetailHelpers';
import styles from './SubscriptionDetail.module.css';

export interface SubscriptionDetailHeaderProps {
    id: string | undefined;
    subscriptionStatus: SubscriptionStatus;
    showReactivateCTA: boolean;
    isWithinWindow: boolean;
    reactivationError: ReactivationErrorState | null;
    onOpenReactivation: () => void;
    onOpenDowngrade: () => void;
    onOpenProration: () => void;
}

export default function SubscriptionDetailHeader({
    id,
    subscriptionStatus,
    showReactivateCTA,
    isWithinWindow,
    reactivationError,
    onOpenReactivation,
    onOpenDowngrade,
    onOpenProration,
}: SubscriptionDetailHeaderProps) {
    return (
        <>
            {reactivationError && (
                <div
                    role="alert"
                    style={{
                        marginBottom: '1.5rem',
                        padding: '0.875rem 1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(239,68,68,0.45)',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#fca5a5',
                    }}
                >
                    <strong>Reactivation failed:</strong> {reactivationError.message}
                    {reactivationError.technicalDetails && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                            {reactivationError.technicalDetails}
                        </div>
                    )}
                </div>
            )}

            {/* ── Page header with optional Reactivate CTA ──────────────────── */}
            <div className={styles.headerSection}>
                <Link
                    to="/subscriptions"
                    className={styles.backLink}
                >
                    &larr; Back to Subscriptions
                </Link>

                <div className={styles.headerRow}>
                    <div>
                        <h1 className={styles.pageTitle}>Subscription {id}</h1>
                        <p className={styles.pageSubtitle}>
                            View details and recent payments for this subscription.
                        </p>
                    </div>

                    {/* Reactivate CTA — only for cancelled subs within the support window */}
                    {showReactivateCTA && (
                        <button
                            onClick={onOpenReactivation}
                            className={`${styles.ctaButton} ${styles.reactivateButton}`}
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
                            onClick={onOpenDowngrade}
                            className={`${styles.ctaButton} ${styles.downgradeButton}`}
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
                            onClick={onOpenProration}
                            className={`${styles.ctaButton} ${styles.prorationButton}`}
                            aria-label="Preview proration for plan change"
                        >
                            Preview Proration
                        </button>
                    )}
                </div>

                {/* Reactivation window notice */}
                {subscriptionStatus === 'cancelled' && !isWithinWindow && (
                    <div
                        className={styles.windowNotice}
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
        </>
    );
}
