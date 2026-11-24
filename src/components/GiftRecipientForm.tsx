import type { RefObject } from "react";
import {
  DELIVERY_OPTIONS,
  DURATION_OPTIONS,
  type DeliveryMethod,
  type GiftFormErrors,
} from "./giftPurchaseTypes";

interface GiftRecipientFormProps {
  recipientName: string;
  recipientEmail: string;
  duration: number;
  message: string;
  deliveryMethod: DeliveryMethod;
  errors: GiftFormErrors;
  emailInputRef: RefObject<HTMLInputElement>;
  onRecipientNameChange: (value: string) => void;
  onRecipientEmailChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onMessageChange: (value: string) => void;
  onDeliveryMethodChange: (value: DeliveryMethod) => void;
}

export default function GiftRecipientForm({
  recipientName,
  recipientEmail,
  duration,
  message,
  deliveryMethod,
  errors,
  emailInputRef,
  onRecipientNameChange,
  onRecipientEmailChange,
  onDurationChange,
  onMessageChange,
  onDeliveryMethodChange,
}: GiftRecipientFormProps) {
  return (
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
          onChange={(event) => onRecipientNameChange(event.target.value)}
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
          onChange={(event) => onRecipientEmailChange(event.target.value)}
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
          onChange={(event) => onDurationChange(Number(event.target.value))}
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
          onChange={(event) => onMessageChange(event.target.value)}
          rows={4}
          maxLength={300}
          aria-describedby="message-count"
        />
        <div className="gift-char-count" id="message-count">
          {message.length} / 300
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
          onChange={(event) => onDeliveryMethodChange(event.target.value as DeliveryMethod)}
        >
          {DELIVERY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
