import { Check, Copy, Share2, Mail, MessageSquare, Link as LinkIcon } from "lucide-react";
import type { CopyStatus, DeliveryMethod, Plan } from "./giftPurchaseTypes";

interface GiftConfirmationStepProps {
  plan: Plan;
  recipientEmail: string;
  duration: number;
  deliveryMethod: DeliveryMethod;
  giftCode: string;
  copyStatus: CopyStatus;
  onCopyCode: () => void;
  onShare: () => void;
}

export default function GiftConfirmationStep({
  plan,
  recipientEmail,
  duration,
  deliveryMethod,
  giftCode,
  copyStatus,
  onCopyCode,
  onShare,
}: GiftConfirmationStepProps) {
  return (
    <div className="gift-complete">
      <div className="gift-complete-icon">
        <Check size={32} />
      </div>

      <div className="gift-code-card">
        <div className="gift-code-display">{giftCode}</div>
        <div className="gift-code-actions">
          <button
            className="gift-code-btn"
            onClick={onCopyCode}
            aria-label="Copy gift code to clipboard"
          >
            <Copy size={16} />
            {copyStatus === "success" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Copy"}
          </button>
          <button
            className="gift-code-btn gift-code-btn-primary"
            onClick={onShare}
            aria-label="Share gift code"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
        {copyStatus === "error" && (
          <p className="gift-form-error">Copy failed — select and copy manually</p>
        )}
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
  );
}
