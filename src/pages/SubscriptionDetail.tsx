import { useParams, Link } from 'react-router-dom';
import RecentPayments from '../components/RecentPayments';
import UsageThisPeriod from '../components/UsageThisPeriod';

export default function SubscriptionDetail() {
    const { id } = useParams();

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

    return (
        <div style={{ padding: '2rem', background: '#0a0a0a', minHeight: '100vh', color: '#f8fafc' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/subscriptions" style={{ color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    &larr; Back to Subscriptions
                </Link>
                <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Subscription {id}</h1>
                <p style={{ color: '#64748b', margin: 0 }}>View details and recent payments for this subscription.</p>
            </div>

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
        </div>
    );
}
