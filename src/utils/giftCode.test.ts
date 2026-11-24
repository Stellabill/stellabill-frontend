import { describe, it, expect } from 'vitest';
import {
  GIFT_CODE_REGEX,
  generateGiftCode,
  normalizeGiftCode,
  validateGiftCode,
} from './giftCode';

const instant = { latencyMs: 0 };

describe('normalizeGiftCode', () => {
  it('maps every spelling of a code to the same canonical code', () => {
    const variants = [
      'GIFT-ABC123-XYZ789',
      'gift-abc123-xyz789',
      'GIFT ABC123 XYZ789',
      'gift abc123 xyz789',
      'ABC123XYZ789',
      'abc123-xyz789',
      'GIFT-ABC123XYZ789',
      'GIFT-ABC-123-XYZ-789',
      '  GIFT-abc123-xyz789  ',
      'gift.abc123.xyz789',
    ];

    for (const variant of variants) {
      expect(normalizeGiftCode(variant), variant).toBe('GIFT-ABC123-XYZ789');
    }
  });

  it('keeps a code whose body happens to start with the prefix', () => {
    expect(normalizeGiftCode('GIFT-GIFTAB-123456')).toBe('GIFT-GIFTAB-123456');
  });

  it('returns null for input that cannot be a gift code', () => {
    const malformed = [
      '',
      '   ',
      '---',
      'GIFT-',
      'GIFT',
      'ABC123',
      'gift-abc123',
      'GIFT-ABC123-XYZ78',
      'GIFT-ABC123-XYZ7890',
      'GIFT-ABC123-XYZ789-EXTRA',
      'GIFT-ABC12*-XYZ789',
      'INVALID',
    ];

    for (const value of malformed) {
      expect(normalizeGiftCode(value), value).toBeNull();
    }
  });

  it('always returns a code matching the published format', () => {
    expect(normalizeGiftCode('abc123xyz789')).toMatch(GIFT_CODE_REGEX);
  });
});

describe('generateGiftCode', () => {
  it('generates codes that are already canonical', () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const code = generateGiftCode();
      expect(code).toMatch(GIFT_CODE_REGEX);
      expect(code.length).toBe(18);
      expect(normalizeGiftCode(code)).toBe(code);
    }
  });

  it('generates distinct codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateGiftCode()));
    expect(codes.size).toBe(100);
  });
});

describe('validateGiftCode', () => {
  it('resolves a well-formed code with its gift details', async () => {
    const result = await validateGiftCode('GIFT-ABC123-XYZ789', instant);

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.code).toBe('GIFT-ABC123-XYZ789');
    expect(result.giftDetails).toMatchObject({
      planId: '1',
      planName: 'Premium Access',
      merchant: 'Stellar News',
      duration: 12,
      value: 120,
      currency: 'USDC',
    });
    expect(new Date(result.giftDetails.expiresOn).getTime()).toBeGreaterThan(Date.now());
  });

  it('accepts loosely formatted codes without asking the sender to retype them', async () => {
    const loose = [
      'gift-abc123-xyz789',
      'GIFT ABC123 XYZ789',
      'ABC123XYZ789',
      'GIFT-ABC123XYZ789',
    ];

    for (const value of loose) {
      const result = await validateGiftCode(value, instant);
      expect(result.status, value).toBe('ok');
      expect(result.code, value).toBe('GIFT-ABC123-XYZ789');
    }
  });

  it('validates a code handed out by the purchase flow', async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const result = await validateGiftCode(generateGiftCode(), instant);
      expect(result.status).toBe('ok');
    }
  });

  it('reports expired codes with their expiry date', async () => {
    const result = await validateGiftCode('GIFT-EXPIRE-DCODE1', instant);

    expect(result.status).toBe('expired');
    if (result.status !== 'expired') return;
    const expiredOn = new Date(result.expiredOn);
    expect(expiredOn.getFullYear()).toBe(2026);
    expect(expiredOn.getMonth()).toBe(7);
    expect(expiredOn.getDate()).toBe(15);
  });

  it('reports redeemed codes', async () => {
    const result = await validateGiftCode('GIFT-ALREADY-USED1', instant);

    expect(result.status).toBe('redeemed');
    if (result.status !== 'redeemed') return;
    expect(result.code).toBe('GIFT-ALREAD-YUSED1');
  });

  it('reports unknown codes as not found', async () => {
    const result = await validateGiftCode('GIFT-INVALID-CODE1', instant);

    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') return;
    expect(result.reason).toBe('not_found');
    expect(result.code).toBe('GIFT-INVALI-DCODE1');
  });

  it('reports malformed codes without contacting the gift service', async () => {
    const result = await validateGiftCode('INVALID', { latencyMs: 60_000 });

    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') return;
    expect(result.reason).toBe('malformed');
    expect(result.code).toBeNull();
  });
});
