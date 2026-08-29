import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { useModalFocus } from "../hooks/useModalFocus";
import { X, Gift, ArrowRight, ArrowLeft, Check, Copy, Share2, Mail, MessageSquare, Link as LinkIcon, Loader2 } from "lucide-react";
import "./GiftPurchaseModal.css";

export interface Plan {
  id: string;
  merchant: string;
  name: string;
  price: number;
  currency: string;
  interval: "Monthly" | "Yearly";
  description: string;
}

export interface GiftPurchaseData {
  recipientName?: string;
  recipientEmail: string;
  duration: number;
  message?: string;
  deliveryMethod: "email" | "manual" | "scheduled";
  deliveryDate?: string;
}

interface GiftPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onPurchaseComplete?: (giftCode: string) => void;
}

type PurchaseStep = "details" | "review" | "complete";

const DURATION_OPTIONS = [
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
];

const DELIVERY_OPTIONS = [
  { value: "email", label: "Email immediately" },
  { value: "manual", label: "Get code to share myself" },
];

export default function GiftPurchaseModal({
  isOpen,
  onClose,
  plan,
  onPurchaseComplete,
}: GiftPurchaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<PurchaseStep>("details");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [duration, setDuration] = useState(12);
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "manual">("email");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef: emailInputRef });

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => {
        setStep("details");
        setRecipientName("");
        setRecipientEmail("");
        setDuration(12);
        setMessage("");
        setDeliveryMethod("email");
        setErrors({});
        setIsProcessing(false);
        setGiftCode("");
        setCopySuccess(false);
      }, 300);
    }
  }, [isOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDetailsStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!recipientEmail.trim()) {
      newErrors.recipientEmail = "Please enter a recipient email address";
    } else if (!validateEmail(recipientEmail)) {
      newErrors.recipientEmail = "Please enter a valid email address";
    }

    if (message.length > 300) {
      newErrors.message = `Message must be 300 characters or less (currently ${message.length})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateDetailsStep()) {
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

      // Generate mock gift code
      const code = `GIFT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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
    try {
      await navigator.clipboard.writeText(giftCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
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

  const totalPrice = plan ? plan.price * duration : 0;
  const messageLength = message.length;

  if (!isOpen || !plan) return null;

  return (
    <div
      className="gift-modal-overlay"
      onClick={(event) => event.target === event.currentTarget && !isProcessing && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
    >
      <div className="gift-modal-backdrop" />

      <div ref={modalRef} className="gift-modal-content">
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
            onClick={onClose}
            aria-label="Close modal"
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="gift-steps" role="tablist" aria-label="Gift purchase steps">
          <div className={`gift-step ${step === "details" ? "active" : step !== "details" ? "complete" : ""}`}>
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
            <div className="gift-form">
              <div className="gift-form-group">
                <label htmlFor="recipient-name" className="gift-form-label">
                  Recipient name (optional)
                </label>
                <input
                  id="recipient-name"
                  type="text"
                  className="gift-form-input"
                  placeholder="Jane Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              <div className="gift-form-group">
                <label htmlFor="recipient-email" className="gift-form-label">
                  Recipient email <span className="gift-required">*</span>
                </label>
                <input
                  ref={emailInputRef}
                  id="recipient-email"
                  type="email"
                  className={`gift-form-input ${errors.recipientEmail ? "error" : ""}`}
                  placeholder="recipient@email.com"
                  value={recipientEmail}
                  onChange={(e) => {
                    setRecipientEmail(e.target.value);
                    if (errors.recipientEmail) {
                      setErrors({ ...errors, recipientEmail: "" });
                    }
                  }}
                  aria-invalid={!!errors.recipientEmail}
                  aria-describedby={errors.recipientEmail ? "email-error" : undefined}
                  required
                />
                {errors.recipientEmail && (
                  <span id="email-error" className="gift-form-error" role="alert">
                    {errors.recipientEmail}
                  </span>
                )}
              </div>

              <div className="gift-form-group">
                <label htmlFor="duration" className="gift-form-label">
                  Gift duration
                </label>
                <select
                  id="duration"
                  className="gift-form-select"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="gift-form-group">
                <label htmlFor="message" className="gift-form-label">
                  Personal message (optional)
                </label>
                <textarea
                  id="message"
                  className={`gift-form-textarea ${errors.message ? "error" : ""}`}
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) {
                      setErrors({ ...errors, message: "" });
                    }
                  }}
                  rows={4}
                  maxLength={300}
                  aria-describedby="message-count"
                />
                <div className="gift-char-count" id="message-count">
                  {messageLength} / 300
                </div>
                {errors.message && (
                  <span className="gift-form-error" role="alert">
                    {errors.message}
                  </span>
                )}
              </div>

              <div className="gift-form-group">
                <label htmlFor="delivery" className="gift-form-label">
                  Delivery method
                </label>
                <select
                  id="delivery"
                  className="gift-form-select"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as "email" | "manual")}
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="gift-review">
              <div className="gift-summary-card">
                <h3 className="gift-summary-heading">Gift Summary</h3>
                <dl className="gift-summary-list">
                  <div className="gift-summary-item">
                    <dt>Plan</dt>
                    <dd>{plan.name}</dd>
                  </div>
                  <div className="gift-summary-item">
                    <dt>Merchant</dt>
                    <dd>{plan.merchant}</dd>
                  </div>
                  <div className="gift-summary-item">
                    <dt>Recipient</dt>
                    <dd>{recipientEmail}</dd>
                  </div>
                  <div className="gift-summary-item">
                    <dt>Duration</dt>
                    <dd>{duration} month{duration !== 1 ? "s" : ""}</dd>
                  </div>
                  <div className="gift-summary-item">
                    <dt>Delivery</dt>
                    <dd>{DELIVERY_OPTIONS.find(o => o.value === deliveryMethod)?.label}</dd>
                  </div>
                  <div className="gift-summary-divider" />
                  <div className="gift-summary-item gift-summary-total">
                    <dt>Total</dt>
                    <dd>{totalPrice} {plan.currency}</dd>
                  </div>
                </dl>
              </div>

              {message && (
                <div className="gift-message-preview">
                  <h3 className="gift-message-heading">Your Message</h3>
                  <p className="gift-message-text">"{message}"</p>
                </div>
              )}

              <div className="gift-info-box">
                <Mail size={16} aria-hidden="true" />
                <p>The recipient will receive a unique redemption code and instructions.</p>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="gift-complete">
              <div className="gift-complete-icon">
                <Check size={32} />
              </div>

              <div className="gift-code-card">
                <div className="gift-code-display">{giftCode}</div>
                <div className="gift-code-actions">
                  <button
                    className="gift-code-btn"
                    onClick={handleCopyCode}
                    aria-label="Copy gift code to clipboard"
                  >
                    <Copy size={16} />
                    {copySuccess ? "Copied!" : "Copy"}
                  </button>
                  <button
                    className="gift-code-btn gift-code-btn-primary"
                    onClick={handleShare}
                    aria-label="Share gift code"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>

              <div className="gift-delivery-notice">
                <Mail size={20} className="gift-delivery-icon" />
                <p>
                  {deliveryMethod === "email" 
                    ? `We've sent redemption instructions to ${recipientEmail}`
                    : "You can now share this gift code with the recipient"}
                </p>
              </div>

              <div className="gift-share-options">
                <h3 className="gift-share-heading">Share this gift</h3>
                <div className="gift-share-buttons">
                  <button className="gift-share-btn" aria-label="Share via email">
                    <Mail size={20} />
                    <span>Email</span>
                  </button>
                  <button className="gift-share-btn" aria-label="Share via message">
                    <MessageSquare size={20} />
                    <span>Message</span>
                  </button>
                  <button className="gift-share-btn" aria-label="Copy link">
                    <LinkIcon size={20} />
                    <span>Link</span>
                  </button>
                </div>
              </div>

              <div className="gift-next-steps">
                <h3 className="gift-next-steps-heading">What's next</h3>
                <ul className="gift-next-steps-list">
                  <li>The recipient can redeem using the code</li>
                  <li>They'll get {duration} month{duration !== 1 ? "s" : ""} of {plan.name}</li>
                  <li>The subscription starts immediately after redemption</li>
                </ul>
              </div>
            </div>
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
