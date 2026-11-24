import { useEffect, useState } from "react";

export type TopUpStep = "select" | "review" | "complete";

export function useTopUpModalState(isOpen: boolean) {
  const [amount, setAmount] = useState<string>("0.00");
  const [selectedQs, setSelectedQs] = useState<string | null>(null);
  const [step, setStep] = useState<TopUpStep>("select");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBalance, setConfirmedBalance] = useState<number | null>(null);

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

  return {
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
  };
}
