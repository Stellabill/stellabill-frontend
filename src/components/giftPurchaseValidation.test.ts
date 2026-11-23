import { describe, expect, it } from "vitest";
import { isValidGiftEmail, validateGiftDetails } from "./giftPurchaseValidation";

describe("isValidGiftEmail", () => {
  it("accepts a valid email address", () => {
    expect(isValidGiftEmail("recipient@example.com")).toBe(true);
  });

  it("rejects malformed email addresses", () => {
    expect(isValidGiftEmail("invalid-email")).toBe(false);
  });
});

describe("validateGiftDetails", () => {
  it("requires a recipient email and reports malformed addresses", () => {
    expect(validateGiftDetails(" ", "")).toEqual({
      recipientEmail: "Please enter a recipient email address",
    });
    expect(validateGiftDetails("invalid-email", "")).toEqual({
      recipientEmail: "Please enter a valid email address",
    });
  });

  it("reports messages over the character limit", () => {
    const message = "a".repeat(301);

    expect(validateGiftDetails("recipient@example.com", message)).toEqual({
      message: `Message must be 300 characters or less (currently ${message.length})`,
    });
  });

  it("returns no errors for valid details", () => {
    expect(validateGiftDetails("recipient@example.com", "Happy holidays!")).toEqual({});
  });
});
