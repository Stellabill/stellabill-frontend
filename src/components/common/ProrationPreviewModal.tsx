import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import styles from './ProrationPreviewModal.module.css';

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
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      {loading && !error && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          Calculating proration...
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={styles.planGrid}>
            <div className={styles.planCard}>
              <div className={styles.planCardLabel}>Current Plan</div>
              <div className={styles.planCardValue}>{currentPlan}</div>
            </div>
            <div className={styles.planCardNew}>
              <div className={styles.planCardLabelNew}>New Plan</div>
              <div className={styles.planCardValue}>{newPlan}</div>
            </div>
          </div>

          <div className={styles.effectiveDate}>
            Effective date: <strong className={styles.effectiveDateValue}>{effectiveDate}</strong>
          </div>

          <table className={styles.lineItemsTable} role="table" aria-label="Proration breakdown">
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderCell}>Item</th>
                <th className={styles.tableHeaderCellAmount}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} className={styles.lineItemRow}>
                  <td className={styles.lineItemLabelCell}>
                    {item.type === 'credit' ? (
                      <TrendingDown size={14} className={styles.creditIcon} aria-hidden="true" />
                    ) : (
                      <TrendingUp size={14} className={styles.chargeIcon} aria-hidden="true" />
                    )}
                    <span className={styles.lineItemLabel}>{item.label}</span>
                  </td>
                  <td
                    className={[
                      styles.lineItemAmountCell,
                      item.type === 'credit'
                        ? styles.lineItemAmountCredit
                        : styles.lineItemAmountCharge,
                    ].join(' ')}
                  >
                    {item.type === 'credit' ? '-' : '+'}{formatAmount(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Net proration</span>
            <span className={styles.summaryValue}>
              {totalCharge > totalCredit ? '+' : '-'}{formatAmount(Math.abs(totalCharge - totalCredit))}
            </span>
          </div>

          <div className={styles.nextInvoiceRow}>
            <span className={styles.nextInvoiceLabel}>Next invoice total</span>
            <span className={styles.nextInvoiceValue}>{formatAmount(nextInvoiceTotal)}</span>
          </div>

          <div className={styles.infoSection}>
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className={styles.infoToggle}
              aria-expanded={showInfo}
            >
              <Info size={13} aria-hidden="true" />
              {showInfo ? 'Hide details' : 'Learn about proration'}
            </button>
            {showInfo && (
              <div className={styles.infoPanel}>
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
