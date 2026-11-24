import { validateGiftCodeFixture } from "./giftCode.fixtures";

const GIFT_CODE_PREFIX = "GIFT";

const SEGMENT_LENGTH = 6;
const BODY_LENGTH = SEGMENT_LENGTH * 2;
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const GIFT_CODE_REGEX = /^GIFT-[A-Z0-9]{6}-[A-Z0-9]{6}$/;

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

export const GIFT_ALREADY_REDEEMED_MESSAGE = "This gift has already been redeemed.";

export function formatExpiredGiftMessage(expiredOn: string): string {
  const formatted = new Date(expiredOn).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `This gift code expired on ${formatted}. Please contact the sender.`;
}

export interface GiftCodeValidationOptions {
  latencyMs?: number;
  useFixtures?: boolean;
  validator?: GiftCodeValidator;
}

export type GiftCodeValidator = (
  value: string,
  options?: Pick<GiftCodeValidationOptions, "latencyMs">,
) => Promise<GiftCodeValidationResult>;

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

/**
 * Returns the canonical form of a gift code or throws if the input is malformed.
 */
export function canonicalCode(value: string): string {
  const code = normalizeGiftCode(value);
  if (code === null) {
    throw new Error(`Gift code fixture is not a valid code: ${value}`);
  }
  return code;
}

export const defaultGiftCodeValidator: GiftCodeValidator = validateGiftCodeFixture;

export async function validateGiftCode(
  value: string,
  options: GiftCodeValidationOptions = {},
): Promise<GiftCodeValidationResult> {
  const { useFixtures = true, validator, latencyMs } = options;

  if (validator) {
    return validator(value, { latencyMs });
  }

  if (useFixtures) {
    return defaultGiftCodeValidator(value, { latencyMs });
  }

  const code = normalizeGiftCode(value);
  if (code === null) {
    return { status: "invalid", code: null, reason: "malformed" };
  }

  throw new Error("Gift code validation API adapter is not configured.");
}
