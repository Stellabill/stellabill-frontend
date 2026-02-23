import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

interface Payment {
    id: string;
    date: string;
    amount: string;
    status: 'success' | 'failed';
    hash: string;
}

const MOCK_PAYMENTS: Payment[] = [
    { id: '1', date: 'Feb 15, 2026', amount: '10 USDC', status: 'success', hash: '0xabc...def123' },
    { id: '2', date: 'Jan 15, 2026', amount: '10 USDC', status: 'success', hash: '0x123...abc456' },
    { id: '3', date: 'Dec 15, 2025', amount: '10 USDC', status: 'success', hash: '0x456...def789' },
    { id: '4', date: 'Dec 1, 2025', amount: '10 USDC', status: 'failed', hash: '' },
    { id: '5', date: 'Nov 15, 2025', amount: '10 USDC', status: 'success', hash: '0x789...ghi012' },
];

export default function RecentPayments({ subscriptionId }: { subscriptionId?: string }) {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<Payment[]>([]);

    useEffect(() => {
        // Simulate API fetch delay
        const timer = setTimeout(() => {
            setPayments(MOCK_PAYMENTS);
            setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [subscriptionId]);

    return (
        <div style={{
            background: '#0a0a0a',
            borderRadius: '12px',
            border: '1px solid #1f2937',
            padding: '1.5rem',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: '#1f2937',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Clock size={16} color="#9ca3af" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>Recent payments</h2>
                </div>
                <Link
                    to={`/subscriptions/${subscriptionId || '123'}/payments`}
                    style={{
                        color: '#00D3F3',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500
                    }}
                >
                    View all
                </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }} role="table" aria-label="Recent payments table">
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1f2937' }}>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: '#62748E', fontSize: '12px', fontWeight: 500, width: '25%' }}>DATE</th>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: '#62748E', fontSize: '12px', fontWeight: 500, width: '25%' }}>AMOUNT</th>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: '#62748E', fontSize: '12px', fontWeight: 500, width: '25%' }}>STATUS</th>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: '#62748E', fontSize: '12px', fontWeight: 500, width: '25%' }}>TRANSACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(31, 41, 55, 0.5)' }}>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '20px', backgroundColor: '#1f2937', borderRadius: '4px', width: '60%', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '20px', backgroundColor: '#1f2937', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '28px', backgroundColor: '#1f2937', borderRadius: '14px', width: '80px', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '20px', backgroundColor: '#1f2937', borderRadius: '4px', width: '70%', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                </tr>
                            ))
                        ) : payments.length > 0 ? (
                            payments.map((payment) => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid #1f2937' }}>
                                    <td style={{ padding: '1rem 0', color: '#e2e8f0', fontSize: '14px', fontWeight: 400 }}>{payment.date}</td>
                                    <td style={{ padding: '1rem 0', color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>{payment.amount}</td>
                                    <td style={{ padding: '1rem 0' }}>
                                        {payment.status === 'success' ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                backgroundColor: 'rgba(0, 201, 80, 0.2)',
                                                border: '1px solid rgba(0, 201, 80, 0.3)',
                                                borderRadius: '100px',
                                                color: '#05DF72',
                                                fontSize: '12px',
                                                fontWeight: 500
                                            }}>
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                                Success
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                backgroundColor: 'rgba(251, 44, 54, 0.2)',
                                                border: '1px solid rgba(251, 44, 54, 0.3)',
                                                borderRadius: '100px',
                                                color: '#FF6467',
                                                fontSize: '12px',
                                                fontWeight: 500
                                            }}>
                                                <XCircle size={12} strokeWidth={3} />
                                                Failed
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        {payment.status === 'success' ? (
                                            <a
                                                href={`https://etherscan.io/tx/${payment.hash}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    color: '#00D3F3',
                                                    textDecoration: 'none',
                                                    fontSize: '14px',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {payment.hash}
                                                <ExternalLink size={14} />
                                            </a>
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 400 }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
                                    No recent payments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}} />
        </div>
    );
}
