import { useRef, useState } from "react";
import { useModalFocus } from "../hooks/useModalFocus";
import { X, Gift, Calendar, DollarSign, Package, Loader2 } from "lucide-react";
import "./RedeemConfirmModal.css";

interface GiftDetails {
  planId: string;
  planName: string;
  merchant: string;
  duration: number;
  gifterName?: string;
  message?: string;
  value: number;
  currency: string;
  expiresOn: string;
}

interface RedeemConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftDetails: GiftDetails;
  giftCode: string;
  onRedemptionComplete: () => void;
}

export default function RedeemConfirmModal({
  isOpen,
  onClose,
  giftDetails,
  giftCode,
  onRedemptionComplete,
}: RedeemConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState("");

  useModalFocus(modalRef, { isOpen, onClose });

  const handleRedeem = async () => {
    setIsRedeeming(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // On success, call the completion handler
      onRedemptionComplete();
    } catch (err) {
      setError("Failed to redeem gift. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const startDate = formatDate(new Date().toISOString());
  const expiryDate = formatDate(giftDetails.expiresOn);
  const gifterDisplayName = giftDetails.gifterName || "Anonymous";

  if (!isOpen) return null;

  return (
    <div
      className="redeem-confirm-overlay"
      onClick={(event) => event.target === event.currentTarget && !isRedeeming && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="redeem-confirm-title"
    >
      <div className="redeem-confirm-backdrop" />

      <div ref={modalRef} className="redeem-confirm-content">
        {/* Header */}
        <div className="redeem-confirm-header">
          <div className="redeem-confirm-header-icon">
            <Gift className="redeem-confirm-gift-icon" />
          </div>
          <div className="redeem-confirm-header-text">
            <h2 id="redeem-confirm-title" className="redeem-confirm-title">
              Confirm Your Gift Subscription
            </h2>
            <p className="redeem-confirm-gifter">
              Gift from: <strong>{gifterDisplayName}</strong>
            </p>
          </div>
          <button
            className="redeem-confirm-close"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isRedeeming}
          >
            <X size={20} />
          </button>
        </div>

        {/* Gift Details Card */}
        <div className="redeem-gift-card">
          <div className="redeem-gift-card-header">
            <Package size={24} className="redeem-gift-card-icon" />
            <div>
              <h3 className="redeem-gift-card-title">{giftDetails.planName}</h3>
              <p className="redeem-gift-card-merchant">{giftDetails.merchant}</p>
            </div>
          </div>

          <dl className="redeem-gift-details">
            <div className="redeem-gift-detail-item">
              <dt>
                <Calendar size={16} aria-hidden="true" />
                Duration
              </dt>
              <dd>{giftDetails.duration} month{giftDetails.duration !== 1 ? "s" : ""}</dd>
            </div>
            <div className="redeem-gift-detail-item">
              <dt>
                <DollarSign size={16} aria-hidden="true" />
                Value
              </dt>
              <dd>{giftDetails.value} {giftDetails.currency}</dd>
            </div>
            <div className="redeem-gift-detail-item">
              <dt>
                <Calendar size={16} aria-hidden="true" />
                Starts
              </dt>
              <dd>{startDate}</dd>
            </div>
            <div className="redeem-gift-detail-item redeem-gift-detail-expiry">
              <dt>
                <Calendar size={16} aria-hidden="true" />
                Expires
              </dt>
              <dd>{expiryDate}</dd>
            </div>
          </dl>
        </div>

        {/* Personal Message */}
        {giftDetails.message && (
          <div className="redeem-message-card">
            <h3 className="redeem-message-heading">Personal Message</h3>
            <blockquote className="redeem-message-text">
              "{giftDetails.message}"
            </blockquote>
            <p className="redeem-message-signature">— {gifterDisplayName}</p>
          </div>
        )}

        {/* Terms Notice */}
        <div className="redeem-terms-notice">
          <p>
            By redeeming, you accept the terms and your subscription begins immediately.
            After expiration, you can continue by adding a payment method.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="redeem-error-alert" role="alert">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="redeem-confirm-actions">
          <button
            className="redeem-btn-secondary"
            onClick={onClose}
            type="button"
            disabled={isRedeeming}
          >
            Cancel
          </button>
          <button
            className="redeem-btn-primary"
            onClick={handleRedeem}
            type="button"
            disabled={isRedeeming}
          >
            {isRedeeming ? (
              <>
                <Loader2 size={18} className="spinner" />
                Activating...
              </>
            ) : (
              "Activate subscription"
            )}
          </button>
        </div>

        {/* Code Reference */}
        <div className="redeem-code-reference">
          Code: <code>{giftCode}</code>
        </div>
      </div>
    </div>
  );
}
