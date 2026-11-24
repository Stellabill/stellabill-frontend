/** @jsxImportSource react */
import { useRef, type ChangeEvent } from "react";
import { useModalFocus } from "@/hooks/useModalFocus";
import { toMinorUnits } from "./topUpAmount";
import TopUpModalHeader from "./TopUpModalHeader";
import TopUpModalSteps from "./TopUpModalSteps";
import { useTopUpModalState } from "./useTopUpModalState";
import type { QuickSelectOption } from "./TopUpQuickSelect";
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
  const {
    amount,
    setAmount,
    selectedQs,
    setSelectedQs,
    step,
    setStep,
    error,
    setError,
    isSubmitting,
    setIsSubmitting,
    confirmedBalance,
    setConfirmedBalance,
  } = useTopUpModalState(isOpen);

  const modalRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const quickSelectOptions: QuickSelectOption[] = [
    { id: "1m", duration: "1 month", amount: planPrice * 1 },
    { id: "3m", duration: "3 months", amount: planPrice * 3 },
    { id: "6m", duration: "6 months", amount: planPrice * 6 },
  ];

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef: amountInputRef });

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
        <TopUpModalHeader
          planName={planName}
          currency={currency}
          step={step}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />

        <TopUpModalSteps
          step={step}
          currentBalance={currentBalance}
          currency={currency}
          quickSelectOptions={quickSelectOptions}
          selectedQs={selectedQs}
          onQuickSelect={handleQuickSelect}
          amount={amount}
          amountInputRef={amountInputRef}
          onInputChange={handleInputChange}
          onInputBlur={handleInputBlur}
          validationMessage={validationMessage}
          walletBalance={walletBalance}
          topUpNum={topUpNum}
          newBalance={newBalance}
          coverage={coverage}
          confirmedBalance={confirmedBalance}
        />

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
