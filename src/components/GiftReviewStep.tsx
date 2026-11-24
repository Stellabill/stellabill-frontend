import { Mail } from "lucide-react";
import { DELIVERY_OPTIONS, type DeliveryMethod, type Plan } from "./giftPurchaseTypes";

interface GiftReviewStepProps {
  plan: Plan;
  recipientEmail: string;
  duration: number;
  deliveryMethod: DeliveryMethod;
  message: string;
}

export default function GiftReviewStep({
  plan,
  recipientEmail,
  duration,
  deliveryMethod,
  message,
}: GiftReviewStepProps) {
  const totalPrice = plan.price * duration;

  return (
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
            <dd>{DELIVERY_OPTIONS.find((option) => option.value === deliveryMethod)?.label}</dd>
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
  );
}
