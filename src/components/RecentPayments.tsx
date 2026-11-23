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
            background: 'var(--color-surface-card)',
            borderRadius: '12px',
            border: '1px solid var(--color-border-subtle)',
            padding: '1.5rem',
            fontFamily: 'var(--font-family-body)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'var(--color-surface-subtle)',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Clock size={16} color="var(--color-text-muted)" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Recent payments</h2>
                </div>
                <Link
                    to={`/subscriptions/${subscriptionId || '123'}/payments`}
                    style={{
                        color: 'var(--color-brand-primary)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500
                    }}
                >
                    View all
                </Link>
            </div>

            <div className="recent-payments-table" style={{ 
                overflowX: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--color-border-default) transparent'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }} role="table" aria-label="Recent payments table">
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--table-border)' }}>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--table-header-text)', fontSize: '12px', fontWeight: 500, width: '25%' }}>DATE</th>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--table-header-text)', fontSize: '12px', fontWeight: 500, width: '25%' }}>AMOUNT</th>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--table-header-text)', fontSize: '12px', fontWeight: 500, width: '25%' }}>STATUS</th>
                            <th scope="col" style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--table-header-text)', fontSize: '12px', fontWeight: 500, width: '25%' }}>TRANSACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--table-border)' }}>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '20px', backgroundColor: 'var(--skeleton-base)', borderRadius: '4px', width: '60%', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '20px', backgroundColor: 'var(--skeleton-base)', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '28px', backgroundColor: 'var(--skeleton-base)', borderRadius: '14px', width: '80px', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <div style={{ height: '20px', backgroundColor: 'var(--skeleton-base)', borderRadius: '4px', width: '70%', animation: 'pulse 1.5s infinite' }} />
                                    </td>
                                </tr>
                            ))
                        ) : payments.length > 0 ? (
                            payments.map((payment) => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                                    <td style={{ padding: '1rem 0', color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 400 }}>{payment.date}</td>
                                    <td style={{ padding: '1rem 0', color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 500 }}>{payment.amount}</td>
                                    <td style={{ padding: '1rem 0' }}>
                                        {payment.status === 'success' ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                backgroundColor: 'var(--color-success-bg)',
                                                border: '1px solid var(--color-success-border)',
                                                borderRadius: '100px',
                                                color: 'var(--color-success)',
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
                                                backgroundColor: 'var(--color-danger-bg)',
                                                border: '1px solid var(--color-danger-border)',
                                                borderRadius: '100px',
                                                color: 'var(--color-danger)',
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
                                                    color: 'var(--color-brand-primary)',
                                                    textDecoration: 'none',
                                                    fontSize: '14px',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {payment.hash}
                                                <ExternalLink size={14} />
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 400 }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
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
        .recent-payments-table::-webkit-scrollbar { height: 6px; }
        .recent-payments-table::-webkit-scrollbar-thumb { background-color: var(--color-border-default); border-radius: 10px; }
      `}} />
        </div>
    );
}
