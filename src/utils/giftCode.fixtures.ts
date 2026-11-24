import {
  canonicalCode,
  normalizeGiftCode,
  type GiftCodeValidationOptions,
  type GiftCodeValidationResult,
  type GiftCodeValidator,
  type GiftDetails,
} from "./giftCode";

/** Latency of the placeholder gift service. Kept above zero so the UI loading state is exercised. */
export const MOCK_GIFT_VALIDATION_LATENCY_MS = 1500;

export const MOCK_EXPIRED_CODES = new Map<string, string>([
  [canonicalCode("GIFT-EXPIRED-CODE1"), "2026-08-15T12:00:00"],
]);

export const MOCK_REDEEMED_CODES = new Set([canonicalCode("GIFT-ALREADY-USED1")]);

export const MOCK_UNRECOGNIZED_CODES = new Set([canonicalCode("GIFT-INVALID-CODE1")]);

export const MOCK_GIFT: Omit<GiftDetails, "expiresOn"> = {
  planId: "1",
  planName: "Premium Access",
  merchant: "Stellar News",
  duration: 12,
  gifterName: "Sarah Johnson",
  message: "I thought you'd enjoy this subscription. Happy reading!",
  value: 120,
  currency: "USDC",
};

function mockExpiresOn(): string {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
}

export const validateGiftCodeFixture: GiftCodeValidator = async (
  value: string,
  { latencyMs = MOCK_GIFT_VALIDATION_LATENCY_MS }: Pick<GiftCodeValidationOptions, "latencyMs"> = {},
): Promise<GiftCodeValidationResult> => {
  const code = normalizeGiftCode(value);
  if (code === null) {
    return { status: "invalid", code: null, reason: "malformed" };
  }

  if (latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }

  const expiredOn = MOCK_EXPIRED_CODES.get(code);
  if (expiredOn !== undefined) {
    return { status: "expired", code, expiredOn };
  }
  if (MOCK_REDEEMED_CODES.has(code)) {
    return { status: "redeemed", code };
  }
  if (MOCK_UNRECOGNIZED_CODES.has(code)) {
    return { status: "invalid", code, reason: "not_found" };
  }

  return { status: "ok", code, giftDetails: { ...MOCK_GIFT, expiresOn: mockExpiresOn() } };
};
