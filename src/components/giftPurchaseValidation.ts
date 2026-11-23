import type { GiftFormErrors } from "./giftPurchaseTypes";

export function isValidGiftEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateGiftDetails(recipientEmail: string, message: string): GiftFormErrors {
  const errors: GiftFormErrors = {};

  if (!recipientEmail.trim()) {
    errors.recipientEmail = "Please enter a recipient email address";
  } else if (!isValidGiftEmail(recipientEmail)) {
    errors.recipientEmail = "Please enter a valid email address";
  }

  if (message.length > 300) {
    errors.message = `Message must be 300 characters or less (currently ${message.length})`;
  }

  return errors;
}
