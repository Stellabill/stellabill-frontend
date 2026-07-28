import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import RecentPayments from '../components/RecentPayments';
import UsageThisPeriod from '../components/UsageThisPeriod';
import PaymentFailedBanner from '../components/Dunning/PaymentFailedBanner';
import PlanStatusTimeline from '../components/PlanStatusTimeline';

export default function SubscriptionDetail() {
    const { id } = useParams();
    const [isPaused, setIsPaused] = useState(false);
    const [pauseUntilDate, setPauseUntilDate] = useState<string | null>(null);
    const [isResuming, setIsResuming] = useState(false);

    const handleViewFullUsage = () => {
        console.log('Navigate to full usage page');
        // TODO: Navigate to full usage page or expand section
    };

    const handleResume = async () => {
        setIsResuming(true);
        try {
            // TODO: Call API to resume subscription
            console.log('Resuming subscription', id);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsPaused(false);
            setPauseUntilDate(null);
        } catch (error) {
            console.error('Failed to resume subscription:', error);
        } finally {
            setIsResuming(false);
        }
    };

    // Mock data - replace with actual API data
    const isUsageBased = true; // Determine from subscription data
    const usageData = {
        billingPeriod: 'Mar 1 — Mar 31',
        usage: '32450 API calls',
        estimatedCharge: '10 USDC'
    };

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

            <RecentPayments subscriptionId={id} />

            <PlanStatusTimeline subscriptionId={id} />
        </div>
    );
}
