import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface ProrationLineItem {
  label: string;
  amount: number;
  type: 'credit' | 'charge';
}

interface ProrationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  effectiveDate: string;
  lineItems: ProrationLineItem[];
  nextInvoiceTotal: number;
  loading?: boolean;
  error?: string | null;
}

export function ProrationPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  effectiveDate,
  lineItems,
  nextInvoiceTotal,
  loading = false,
  error = null,
}: ProrationPreviewModalProps) {
  const [showInfo, setShowInfo] = useState(false);

  const totalCredit = lineItems.filter(i => i.type === 'credit').reduce((s, i) => s + i.amount, 0);
  const totalCharge = lineItems.filter(i => i.type === 'charge').reduce((s, i) => s + i.amount, 0);

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Proration Preview"
      description="Review the prorated charges and credits for your plan change."
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} isLoading={loading}>Confirm Change</Button>
        </>
      }
    >
      {error && (
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading && !error && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid rgba(34,211,238,0.3)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Calculating proration...
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Current Plan</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>{currentPlan}</div>
            </div>
            <div style={{ background: 'rgba(34,211,238,0.08)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(34,211,238,0.2)' }}>
              <div style={{ fontSize: '12px', color: '#22d3ee', marginBottom: '4px' }}>New Plan</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>{newPlan}</div>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
            Effective date: <strong style={{ color: '#cbd5e1' }}>{effectiveDate}</strong>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }} role="table" aria-label="Proration breakdown">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Item</th>
                <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.type === 'credit' ? (
                      <TrendingDown size={14} style={{ color: '#22c55e', flexShrink: 0 }} aria-hidden="true" />
                    ) : (
                      <TrendingUp size={14} style={{ color: '#ef4444', flexShrink: 0 }} aria-hidden="true" />
                    )}
                    <span style={{ fontSize: '14px', color: '#e2e8f0' }}>{item.label}</span>
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: item.type === 'credit' ? '#22c55e' : '#f87171' }}>
                    {item.type === 'credit' ? '-' : '+'}{formatAmount(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>Net proration</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              {totalCharge > totalCredit ? '+' : '-'}{formatAmount(Math.abs(totalCharge - totalCredit))}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', background: 'rgba(34,211,238,0.06)', borderRadius: '8px', paddingLeft: '12px', paddingRight: '12px' }}>
            <span style={{ fontSize: '14px', color: '#e2e8f0' }}>Next invoice total</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#22d3ee' }}>{formatAmount(nextInvoiceTotal)}</span>
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              aria-expanded={showInfo}
            >
              <Info size={13} aria-hidden="true" />
              {showInfo ? 'Hide details' : 'Learn about proration'}
            </button>
            {showInfo && (
              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '13px', color: '#94a3b8', textAlign: 'left' }}>
                Proration calculates the unused portion of your current plan and applies it as a credit toward your new plan. Charges for the new plan are calculated from the change date through your next billing date. If your new plan costs less, you'll receive a credit on your next invoice.
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

export default ProrationPreviewModal;
