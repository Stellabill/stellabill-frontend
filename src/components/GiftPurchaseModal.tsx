import { useEffect, useRef } from "react";
import { useModalFocus } from "../hooks/useModalFocus";
import { X, Gift, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";
import { generateGiftCode } from "../utils/giftCode";
import GiftConfirmationStep from "./GiftConfirmationStep";
import GiftRecipientForm from "./GiftRecipientForm";
import GiftReviewStep from "./GiftReviewStep";
import type { Plan } from "./giftPurchaseTypes";
import { useGiftPurchaseState } from "./useGiftPurchaseState";
import { validateGiftDetails } from "./giftPurchaseValidation";
import "./GiftPurchaseModal.css";

export type { GiftPurchaseData, Plan } from "./giftPurchaseTypes";

interface GiftPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onPurchaseComplete?: (giftCode: string) => void;
}

export default function GiftPurchaseModal({
  isOpen,
  onClose,
  plan,
  onPurchaseComplete,
}: GiftPurchaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    step,
    setStep,
    recipientName,
    setRecipientName,
    recipientEmail,
    setRecipientEmail,
    duration,
    setDuration,
    message,
    setMessage,
    deliveryMethod,
    setDeliveryMethod,
    errors,
    setErrors,
    isProcessing,
    setIsProcessing,
    giftCode,
    setGiftCode,
    copyStatus,
    setCopyStatus,
  } = useGiftPurchaseState(isOpen);

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef: emailInputRef, closeOnEscape: !isProcessing });

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleNext = () => {
    const newErrors = validateGiftDetails(recipientEmail, message);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setStep("review");
    }
  };

  const handleBack = () => {
    setStep("details");
    setErrors({});
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const code = generateGiftCode();
      setGiftCode(code);
      setStep("complete");

      onPurchaseComplete?.(code);
    } catch (error) {
      setErrors({ purchase: "Gift purchase failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCode = async () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    const succeeded = await copyToClipboard(giftCode);
    setCopyStatus(succeeded ? "success" : "error");
    copyTimerRef.current = setTimeout(() => {
      setCopyStatus("idle");
      copyTimerRef.current = null;
    }, 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Gift: ${plan?.name}`,
      text: `I've sent you a ${duration}-month gift subscription to ${plan?.name}! Redeem it with code: ${giftCode}`,
      url: `${window.location.origin}/redeem-gift?code=${giftCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyCode();
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div
      className="gift-modal-overlay"
      onClick={(event) => event.target === event.currentTarget && !isProcessing && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
      aria-busy={isProcessing}
    >
      <div className="gift-modal-backdrop" />

      <div ref={modalRef} className="gift-modal-content">
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          {copyStatus === "success"
            ? "Gift code copied to clipboard"
            : copyStatus === "error"
              ? "Copy failed — select and copy manually"
              : ""}
        </div>
        {/* Header */}
        <div className="gift-modal-header">
          <div className="gift-modal-header-icon">
            <Gift className="gift-icon" />
          </div>
          <div className="gift-modal-header-text">
            <h2 id="gift-modal-title" className="gift-modal-title">
              {step === "complete" ? "Gift sent successfully!" : `Send ${plan.name} as a gift`}
            </h2>
            {step !== "complete" && (
              <p className="gift-modal-subtitle">{plan.description}</p>
            )}
          </div>
          <button
            className="gift-modal-close"
            onClick={() => !isProcessing && onClose()}
            aria-label="Close modal"
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="gift-steps" role="tablist" aria-label="Gift purchase steps">
          <div className={`gift-step ${step === "details" ? "active" : "complete"}`}>
            <span className="gift-step-number">1</span>
            <span className="gift-step-label">Gift Details</span>
          </div>
          <div className="gift-step-divider" />
          <div className={`gift-step ${step === "review" ? "active" : step === "complete" ? "complete" : ""}`}>
            <span className="gift-step-number">2</span>
            <span className="gift-step-label">Review</span>
          </div>
          <div className="gift-step-divider" />
          <div className={`gift-step ${step === "complete" ? "active" : ""}`}>
            <span className="gift-step-number">3</span>
            <span className="gift-step-label">Complete</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="gift-modal-body">
          {step === "details" && (
            <GiftRecipientForm
              recipientName={recipientName}
              recipientEmail={recipientEmail}
              duration={duration}
              message={message}
              deliveryMethod={deliveryMethod}
              errors={errors}
              emailInputRef={emailInputRef}
              onRecipientNameChange={setRecipientName}
              onRecipientEmailChange={(value) => {
                setRecipientEmail(value);
                if (errors.recipientEmail) {
                  setErrors({ ...errors, recipientEmail: "" });
                }
              }}
              onDurationChange={setDuration}
              onMessageChange={(value) => {
                setMessage(value);
                if (errors.message) {
                  setErrors({ ...errors, message: "" });
                }
              }}
              onDeliveryMethodChange={setDeliveryMethod}
            />
          )}

          {step === "review" && (
            <GiftReviewStep
              plan={plan}
              recipientEmail={recipientEmail}
              duration={duration}
              deliveryMethod={deliveryMethod}
              message={message}
            />
          )}

          {step === "complete" && (
            <GiftConfirmationStep
              plan={plan}
              recipientEmail={recipientEmail}
              duration={duration}
              deliveryMethod={deliveryMethod}
              giftCode={giftCode}
              copyStatus={copyStatus}
              onCopyCode={handleCopyCode}
              onShare={handleShare}
            />
          )}
        </div>

        {/* Actions */}
        {errors.purchase && (
          <div className="gift-error-alert" role="alert">
            {errors.purchase}
          </div>
        )}

        <div className="gift-modal-actions">
          {step === "details" && (
            <>
              <button
                className="gift-btn-secondary"
                onClick={onClose}
                type="button"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="gift-btn-primary"
                onClick={handleNext}
                type="button"
                disabled={isProcessing}
              >
                Review gift
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <button
                className="gift-btn-secondary"
                onClick={handleBack}
                type="button"
                disabled={isProcessing}
              >
                <ArrowLeft size={18} />
                Back
              </button>
              <button
                className="gift-btn-primary"
                onClick={handlePurchase}
                type="button"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm purchase
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </>
          )}

          {step === "complete" && (
            <button
              className="gift-btn-primary gift-btn-full"
              onClick={onClose}
              type="button"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
