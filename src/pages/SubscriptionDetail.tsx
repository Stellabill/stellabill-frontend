import { useParams, Link } from 'react-router-dom';
import RecentPayments from '../components/RecentPayments';

export default function SubscriptionDetail() {
    const { id } = useParams();

    return (
        <div style={{ padding: '2rem', background: '#0a0a0a', minHeight: '100vh', color: '#f8fafc' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/subscriptions" style={{ color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    &larr; Back to Subscriptions
                </Link>
                <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Subscription {id}</h1>
                <p style={{ color: '#64748b', margin: 0 }}>View details and recent payments for this subscription.</p>
            </div>

            <RecentPayments subscriptionId={id} />
        </div>
    );
}
