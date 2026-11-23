const GIFT_CODE_PREFIX = "GIFT";

const SEGMENT_LENGTH = 6;
const BODY_LENGTH = SEGMENT_LENGTH * 2;
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const GIFT_CODE_REGEX = /^GIFT-[A-Z0-9]{6}-[A-Z0-9]{6}$/;

/** Latency of the placeholder gift service. Kept above zero so the UI loading state is exercised. */
export const MOCK_GIFT_VALIDATION_LATENCY_MS = 1500;

export interface GiftDetails {
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

export type GiftCodeValidationResult =
  | { status: "ok"; code: string; giftDetails: GiftDetails }
  | { status: "invalid"; code: string | null; reason: "malformed" | "not_found" }
  | { status: "expired"; code: string; expiredOn: string }
  | { status: "redeemed"; code: string };

function withDashes(body: string): string {
  return `${GIFT_CODE_PREFIX}-${body.slice(0, SEGMENT_LENGTH)}-${body.slice(SEGMENT_LENGTH)}`;
}

/**
 * Accepts any reasonable spelling of a code (`gift abc123 xyz789`, `ABC123XYZ789`,
 * `GIFT-ABC123-XYZ789`) and returns the canonical dash-separated form, or null when the
 * code cannot be a gift code.
 */
export function normalizeGiftCode(value: string): string | null {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length === 0) return null;

  const candidates = compact.startsWith(GIFT_CODE_PREFIX)
    ? [compact.slice(GIFT_CODE_PREFIX.length), compact]
    : [compact];
  const body = candidates.find((candidate) => candidate.length === BODY_LENGTH);
  if (body === undefined) return null;

  return withDashes(body);
}

function randomBody(length: number): string {
  const values = new Uint32Array(length);
  globalThis.crypto.getRandomValues(values);

  let body = "";
  for (let index = 0; index < length; index += 1) {
    body += CODE_ALPHABET[values[index] % CODE_ALPHABET.length];
  }
  return body;
}

export function generateGiftCode(): string {
  return withDashes(randomBody(BODY_LENGTH));
}

// Fixtures are matched against normalized input, so they are stored in canonical form.
function canonicalCode(value: string): string {
  const code = normalizeGiftCode(value);
  if (code === null) {
    throw new Error(`Gift code fixture is not a valid code: ${value}`);
  }
  return code;
}

const MOCK_EXPIRED_CODES = new Map<string, string>([
  [canonicalCode("GIFT-EXPIRED-CODE1"), "2026-08-15T12:00:00"],
]);

const MOCK_REDEEMED_CODES = new Set([canonicalCode("GIFT-ALREADY-USED1")]);

const MOCK_UNRECOGNIZED_CODES = new Set([canonicalCode("GIFT-INVALID-CODE1")]);

const MOCK_GIFT: Omit<GiftDetails, "expiresOn"> = {
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

export async function validateGiftCode(
  value: string,
  { latencyMs = MOCK_GIFT_VALIDATION_LATENCY_MS }: { latencyMs?: number } = {}
): Promise<GiftCodeValidationResult> {
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
}
