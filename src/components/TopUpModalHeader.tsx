import type { TopUpStep } from "./useTopUpModalState";

interface TopUpModalHeaderProps {
  planName: string;
  currency: string;
  step: TopUpStep;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function TopUpModalHeader({
  planName,
  currency,
  step,
  onClose,
  isSubmitting,
}: TopUpModalHeaderProps) {
  return (
    <>
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
    </>
  );
}
