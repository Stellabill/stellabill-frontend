import type {
  ChangeEventHandler,
  FocusEventHandler,
  RefObject,
} from "react";
import { formatDisplayAmount } from "./topUpAmount";
import type { TopUpStep } from "./useTopUpModalState";
import TopUpQuickSelect, { type QuickSelectOption } from "./TopUpQuickSelect";

interface TopUpModalStepsProps {
  step: TopUpStep;
  currentBalance: number;
  currency: string;
  quickSelectOptions: QuickSelectOption[];
  selectedQs: string | null;
  onQuickSelect: (id: string, value: number) => void;
  amount: string;
  amountInputRef: RefObject<HTMLInputElement>;
  onInputChange: ChangeEventHandler<HTMLInputElement>;
  onInputBlur: FocusEventHandler<HTMLInputElement>;
  validationMessage: string | null;
  walletBalance: number;
  topUpNum: number;
  newBalance: number;
  coverage: number;
  confirmedBalance: number | null;
}

export default function TopUpModalSteps({
  step,
  currentBalance,
  currency,
  quickSelectOptions,
  selectedQs,
  onQuickSelect,
  amount,
  amountInputRef,
  onInputChange,
  onInputBlur,
  validationMessage,
  walletBalance,
  topUpNum,
  newBalance,
  coverage,
  confirmedBalance,
}: TopUpModalStepsProps) {
  return (
    <>
      {step === "select" && (
        <section className="step-content">
          <div className="balance-card">
            <div className="balance-label">Current prepaid balance</div>
            <div className="balance-value">
              {formatDisplayAmount(currentBalance)} <span className="balance-currency">{currency}</span>
            </div>
          </div>

          <TopUpQuickSelect
            options={quickSelectOptions}
            selectedOption={selectedQs}
            currency={currency}
            onSelect={onQuickSelect}
          />

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
                  onChange={onInputChange}
                  onBlur={onInputBlur}
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
    </>
  );
}
