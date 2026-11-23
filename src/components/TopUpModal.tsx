/** @jsxImportSource react */
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useModalFocus } from "@/hooks/useModalFocus";
import "./TopUpModal.css";

export interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  planPrice?: number;
  currentBalance?: number;
  walletBalance?: number;
  currency?: string;
  onConfirm?: (amount: number) => Promise<unknown>;
}

type TopUpStep = "select" | "review" | "complete";

const STROOPS_PER_UNIT = 10_000_000n;

function toMinorUnits(val: number | string): bigint {
  if (typeof val === "number") {
    if (!Number.isFinite(val) || val <= 0) return 0n;
    const s = val.toFixed(7);
    const [intPart, fracPart] = s.split(".");
    return BigInt(intPart) * STROOPS_PER_UNIT + BigInt(fracPart || "0");
  }
  const trimmed = val.trim();
  if (!trimmed || trimmed === ".") return 0n;
  const [intPart, fracPart = ""] = trimmed.split(".");
  const safeInt = intPart === "" ? 0n : BigInt(intPart);
  const safeFrac = BigInt(fracPart.slice(0, 7).padEnd(7, "0"));
  return safeInt * STROOPS_PER_UNIT + safeFrac;
}

function formatDisplayAmount(val: number): string {
  const s = val.toFixed(7).replace(/0+$/, "");
  const parts = s.split(".");
  if (parts.length === 1) return `${parts[0]}.00`;
  if (parts[1].length < 2) return `${parts[0]}.${parts[1].padEnd(2, "0")}`;
  return s;
}

export default function TopUpModal({
  isOpen,
  onClose,
  planName = "Premium Access",
  planPrice = 10,
  currentBalance = 30,
  walletBalance = 150,
  currency = "USDC",
  onConfirm,
}: TopUpModalProps) {
  const [amount, setAmount] = useState<string>("0.00");
  const [selectedQs, setSelectedQs] = useState<string | null>(null);
  const [step, setStep] = useState<TopUpStep>("select");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBalance, setConfirmedBalance] = useState<number | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const quickSelectOptions = [
    { id: "1m", duration: "1 month", amount: planPrice * 1 },
    { id: "3m", duration: "3 months", amount: planPrice * 3 },
    { id: "6m", duration: "6 months", amount: planPrice * 6 },
  ];

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef: amountInputRef });

  useEffect(() => {
    if (!isOpen) {
      setAmount("0.00");
      setSelectedQs(null);
      setStep("select");
      setError(null);
      setIsSubmitting(false);
      setConfirmedBalance(null);
    }
  }, [isOpen]);

  const handleQuickSelect = (id: string, val: number) => {
    setSelectedQs(id);
    setAmount(val.toFixed(2));
    setError(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d{0,7}$/.test(value)) {
      setAmount(value);
      setSelectedQs(null);
      setError(null);
    }
  };

  const handleInputBlur = () => {
    if (!amount || amount === ".") {
      setAmount("0.00");
      return;
    }
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed)) {
      setAmount("0.00");
      return;
    }
    const parts = amount.split(".");
    if (parts.length === 1) {
      setAmount(`${parts[0]}.00`);
    } else if (parts[1].length < 2) {
      setAmount(`${parts[0]}.${parts[1].padEnd(2, "0")}`);
    }
  };

  const topUpMinor = toMinorUnits(amount);
  const walletMinor = toMinorUnits(walletBalance);
  const currentMinor = toMinorUnits(currentBalance);
  const planPriceMinor = toMinorUnits(planPrice);

  const topUpNum = parseFloat(amount) || 0;
  const amountInvalid = topUpMinor <= 0n || Number.isNaN(topUpNum);
  const exceedsWallet = topUpMinor > walletMinor;
  const validationMessage = amountInvalid
    ? `Enter a top-up amount greater than 0 ${currency}.`
    : exceedsWallet
    ? "Your wallet balance is not enough for this top-up amount."
    : null;

  const newBalanceMinor = currentMinor + topUpMinor;
  const newBalance = Number(newBalanceMinor) / 10_000_000;
  const coverage = planPriceMinor > 0n ? Number(newBalanceMinor / planPriceMinor) : 0;

  const handleReview = () => {
    if (amountInvalid) {
      setError(`Enter a top-up amount greater than 0 ${currency}.`);
      return;
    }

    if (exceedsWallet) {
      setError("Your wallet balance is not enough for this top-up amount.");
      return;
    }

    setError(null);
    setStep("review");
  };

  const handleConfirm = async () => {
    if (amountInvalid || exceedsWallet) {
      setError("Update the amount before confirming the top up.");
      setStep("select");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (onConfirm) {
        await onConfirm(topUpNum);
      }
      setConfirmedBalance(newBalance);
      setStep("complete");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Failed to confirm top up. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="topup-modal-overlay"
      onClick={(event) => !isSubmitting && event.target === event.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="topup-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topup-modal-title"
        aria-describedby="topup-modal-description"
      >
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
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h2 id="topup-modal-title" className="topup-modal-title">
              Top up balance
            </h2>
            <p id="topup-modal-description" className="topup-modal-subtitle">
              Add {currency} to your prepaid balance for <strong>{planName}</strong>.
            </p>
          </div>
          <button
            className="topup-close-btn"
            onClick={onClose}
            aria-label="Close top up modal"
            type="button"
            disabled={isSubmitting}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ol className="topup-steps" aria-label="Top up flow steps">
          <li
            className={`topup-step ${step === "select" ? "active" : step === "complete" ? "done" : ""}`}
            aria-current={step === "select" ? "step" : undefined}
          >
            1. Choose amount
          </li>
          <li
            className={`topup-step ${step === "review" ? "active" : ""}`}
            aria-current={step === "review" ? "step" : undefined}
          >
            2. Review
          </li>
          <li
            className={`topup-step ${step === "complete" ? "active" : ""}`}
            aria-current={step === "complete" ? "step" : undefined}
          >
            3. Confirmed
          </li>
        </ol>

        {step === "select" && (
          <section className="step-content">
            <div className="balance-card">
              <div className="balance-label">Current prepaid balance</div>
              <div className="balance-value">
                {formatDisplayAmount(currentBalance)} <span className="balance-currency">{currency}</span>
              </div>
            </div>

            <div>
              <span className="section-label">Quick select</span>
              <div className="quick-select-grid">
                {quickSelectOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`quick-select-btn ${selectedQs === option.id ? "selected" : ""}`}
                    onClick={() => handleQuickSelect(option.id, option.amount)}
                  >
                    <span className="qs-duration">{option.duration}</span>
                    <span className="qs-amount">
                      {formatDisplayAmount(option.amount)} {currency}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="section-label">Amount ({currency})</span>
              <div className="amount-field">
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    ref={amountInputRef}
                    type="text"
                    className="amount-input"
                    value={amount}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="0.00"
                    aria-label="Top up amount"
                  />
                </div>
                <span className="amount-currency">{currency}</span>
              </div>
            </div>

            {validationMessage && (
              <div className="validation-note" role="alert">
                {validationMessage}
              </div>
            )}

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
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Your wallet balance
              </div>
              <div className="wallet-balance-value">
                {formatDisplayAmount(walletBalance)} {currency}
              </div>
            </div>

            {topUpNum > 0 && (
              <div className="summary-block">
                <div className="summary-header">
                  <span className="summary-label">Estimated new balance</span>
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
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <div className="summary-value">
                  {formatDisplayAmount(newBalance)} <span className="summary-currency">{currency}</span>
                </div>
                <div className="summary-subtext">Covers ~{coverage} payments</div>
              </div>
            )}

            <div className="guidance-box">
              <strong>Need help choosing an amount?</strong>
              <p>Pick a quick select or enter a custom amount, then review the top-up before confirming.</p>
            </div>
          </section>
        )}

        {step === "review" && (
          <section className="step-content review-content">
            <div className="review-block">
              <div className="review-row">
                <span className="review-label">Top-up amount</span>
                <span className="review-value">
                  {formatDisplayAmount(topUpNum)} {currency}
                </span>
              </div>
              <div className="review-row">
                <span className="review-label">Balance after top-up</span>
                <span className="review-value">
                  {formatDisplayAmount(newBalance)} {currency}
                </span>
              </div>
              <div className="review-row">
                <span className="review-label">Coverage estimate</span>
                <span className="review-value">About {coverage} payments</span>
              </div>
            </div>

            <div className="guidance-box">
              <strong>What happens next</strong>
              <ul>
                <li>The amount is added to your prepaid balance instantly.</li>
                <li>Your next billing cycle will draw from the updated balance.</li>
              </ul>
            </div>
          </section>
        )}

        {step === "complete" && (
          <section className="step-content confirmation-content" role="status" aria-live="polite">
            <div className="confirmation-icon" aria-hidden="true">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3>Top up successful</h3>
            <p>
              Your balance has been updated to {formatDisplayAmount(confirmedBalance ?? newBalance)} {currency}.
            </p>
            <p>We’ll apply this amount toward your next prepaid payment.</p>
          </section>
        )}

        {error && (
          <div className="alert-box" role="alert">
            {error}
          </div>
        )}

        <div className="modal-actions">
          {step === "review" ? (
            <>
              <button
                className="btn-secondary"
                onClick={() => setStep("select")}
                type="button"
                disabled={isSubmitting}
              >
                Edit amount
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                type="button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirming..." : "Confirm top up"}
              </button>
            </>
          ) : step === "complete" ? (
            <button className="btn-primary" onClick={onClose} type="button">
              Close
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose} type="button">
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleReview}
                type="button"
                disabled={amountInvalid || exceedsWallet}
              >
                Review top up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
