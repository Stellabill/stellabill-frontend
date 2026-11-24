import { useState } from "react";
import Modal from "./common/Modal";
import { X, Gift, Calendar, DollarSign, Package, Loader2 } from "lucide-react";
import { gifts, type GiftRedeemResult } from "../api/client";
import {
  formatExpiredGiftMessage,
  GIFT_ALREADY_REDEEMED_MESSAGE,
  type GiftDetails,
} from "../utils/giftCode";
import "./RedeemConfirmModal.css";

interface RedeemConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftDetails: GiftDetails;
  giftCode: string;
  onRedemptionComplete: () => void;
  redeemGift?: (code: string) => Promise<GiftRedeemResult>;
}

export default function RedeemConfirmModal({
  isOpen,
  onClose,
  giftDetails,
  giftCode,
  onRedemptionComplete,
  redeemGift = gifts.redeem,
}: RedeemConfirmModalProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState("");

  const handleRedeem = async () => {
    setIsRedeeming(true);
    setError("");

    try {
      const result = await redeemGift(giftCode);

      if (result.status === "ok") {
        onRedemptionComplete();
        return;
      }

      if (result.status === "already-redeemed") {
        setError(GIFT_ALREADY_REDEEMED_MESSAGE);
        return;
      }

      if (result.status === "expired") {
        setError(formatExpiredGiftMessage(result.expiredOn ?? giftDetails.expiresOn));
        return;
      }
    } catch {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      unstyled
      labelledBy="redeem-confirm-title"
      closeOnBackdrop={!isRedeeming}
      closeOnEscape={!isRedeeming}
      busy={isRedeeming}
      contentClassName="redeem-confirm-content"
    >
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
    </Modal>
  );
}
