import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultGenerateApiKey, maskApiKey } from './apiKey';

const PREFIX = 'sk_live_';
// 24 random bytes rendered as two lowercase hex characters each.
const KEY_FORMAT = /^sk_live_[0-9a-f]{48}$/;
const MASK = '•';

/** Replaces crypto.getRandomValues with a stub that fills the buffer from `fill`. */
function mockRandomBytes(fill: (index: number) => number) {
  return vi
    .spyOn(globalThis.crypto, 'getRandomValues')
    .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
      const bytes = array as unknown as Uint8Array;
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = fill(i);
      return array;
    });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('defaultGenerateApiKey', () => {
  it('returns an sk_live_ key with 48 lowercase hex characters', () => {
    const key = defaultGenerateApiKey();

    expect(key.startsWith(PREFIX)).toBe(true);
    expect(key).toHaveLength(PREFIX.length + 48);
    expect(key).toMatch(KEY_FORMAT);
  });

  it('requests exactly 24 random bytes', () => {
    const spy = mockRandomBytes(() => 0);

    defaultGenerateApiKey();

    expect(spy).toHaveBeenCalledTimes(1);
    const buffer = spy.mock.calls[0][0] as Uint8Array;
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer).toHaveLength(24);
  });

  it('hex-encodes each byte, zero-padding values below 0x10', () => {
    mockRandomBytes((i) => [0x00, 0x0f, 0xa5, 0xff][i % 4]);

    expect(defaultGenerateApiKey()).toBe(PREFIX + '000fa5ff'.repeat(6));
  });

  it('produces different keys when the random bytes differ', () => {
    mockRandomBytes(() => 0x11);
    const first = defaultGenerateApiKey();

    vi.restoreAllMocks();
    mockRandomBytes(() => 0x22);
    const second = defaultGenerateApiKey();

    expect(first).toBe(PREFIX + '11'.repeat(24));
    expect(second).toBe(PREFIX + '22'.repeat(24));
    expect(first).not.toBe(second);
  });

  it('still returns a well-formed key when no crypto source is available', () => {
    vi.stubGlobal('crypto', undefined);

    expect(defaultGenerateApiKey()).toBe(PREFIX + '00'.repeat(24));
  });
});

describe('maskApiKey', () => {
  it('keeps the prefix up to the last underscore and the last 4 characters', () => {
    const secret = PREFIX + '0123456789abcdef0123456789abcdef0123456789abwxyz';

    expect(maskApiKey(secret)).toBe(PREFIX + MASK.repeat(16) + 'wxyz');
  });

  it('never reveals the middle of a generated key', () => {
    mockRandomBytes((i) => i);
    const secret = defaultGenerateApiKey();
    const masked = maskApiKey(secret);
    const middle = secret.slice(PREFIX.length, -4);

    expect(masked).not.toContain(middle);
    expect(masked).toBe(PREFIX + MASK.repeat(16) + secret.slice(-4));
  });

  it('uses a fixed-width mask regardless of the secret length', () => {
    const short = maskApiKey('sk_test_abcdefgh');
    const long = maskApiKey('sk_test_' + 'a'.repeat(200) + 'zzzz');

    expect(short).toBe('sk_test_' + MASK.repeat(16) + 'efgh');
    expect(long).toBe('sk_test_' + MASK.repeat(16) + 'zzzz');
  });

  it('falls back to the first 8 characters when there is no underscore', () => {
    expect(maskApiKey('abcdefghijklmnop')).toBe('abcdefgh' + MASK.repeat(16) + 'mnop');
  });

  it('fully masks secrets of 8 characters or fewer', () => {
    for (const secret of ['', 'a', 'sk_', 'abcd1234']) {
      expect(maskApiKey(secret), secret).toBe(MASK.repeat(8));
    }
  });

  it('starts showing a prefix and suffix at 9 characters', () => {
    expect(maskApiKey('abcdefghi')).toBe('abcdefgh' + MASK.repeat(16) + 'fghi');
  });
});
