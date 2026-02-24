/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import "./TopUpModal.css";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SELECT_OPTIONS = [
  { id: "1m", duration: "1 month", amount: 10 },
  { id: "3m", duration: "3 months", amount: 30 },
  { id: "6m", duration: "6 months", amount: 60 },
];

export default function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
  const [amount, setAmount] = useState<string>("0.00");
  const [selectedQs, setSelectedQs] = useState<string | null>(null);
  const [, setIsFocused] = useState(false);

  const currentBalance = 30;
  const planPrice = 10;
  const walletBalance = 150;

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleQuickSelect = (id: string, val: number) => {
    setSelectedQs(id);
    setAmount(val.toFixed(2));
  };

  const handleInputChange = (e: any) => {
    const val = e.target.value;
    // Basic number validation
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
      // Clear quick select if manually edited
      setSelectedQs(null);
    }
  };

  const handleInputBlur = () => {
    // Format to 2 decimal places if valid number
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      setAmount(num.toFixed(2));
    } else {
      setAmount("0.00");
    }
  };

  if (!isOpen) return null;

  const topUpNum = parseFloat(amount) || 0;
  const newBalance = currentBalance + topUpNum;
  const coverage = Math.floor(newBalance / planPrice);

  return (
    <div
      className="topup-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="topup-modal-content" ref={modalRef}>
        <div className="topup-modal-header">
          <div>
            <div className="topup-icon-box">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h2 className="topup-modal-title">Top up balance</h2>
            <p className="topup-modal-subtitle">
              Add USDC to your prepaid balance for{" "}
              <strong>Premium Access</strong>
            </p>
          </div>
          <button
            className="topup-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="balance-card">
          <div className="balance-label">Current prepaid balance</div>
          <div className="balance-value">
            {currentBalance} <span className="balance-currency">USDC</span>
          </div>
        </div>

        <div>
          <span className="section-label">Quick select</span>
          <div className="quick-select-grid">
            {QUICK_SELECT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`quick-select-btn ${selectedQs === opt.id ? "selected" : ""}`}
                onClick={() => handleQuickSelect(opt.id, opt.amount)}
              >
                <span className="qs-duration">{opt.duration}</span>
                <span className="qs-amount">{opt.amount} USDC</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="section-label">Amount (USDC)</span>
          <div className="amount-field">
            <div className="amount-input-wrapper">
              <span className="currency-symbol">$</span>
              <input
                type="text"
                className="amount-input"
                value={amount}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="0.00"
              />
            </div>
            <span className="amount-currency">USDC</span>
          </div>
        </div>

        <div className="wallet-row">
          <div className="wallet-info-box">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Your wallet balance
          </div>
          <div className="wallet-balance-value">{walletBalance} USDC</div>
        </div>

        {topUpNum > 0 && (
          <div className="summary-block">
            <div className="summary-header">
              <span className="summary-label">New prepaid balance</span>
              <svg
                className="trend-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <div className="summary-value">
              {newBalance.toFixed(2)}{" "}
              <span className="summary-currency">USDC</span>
            </div>
            <div className="summary-subtext">Covers ~{coverage} payments</div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">
            Top up
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
