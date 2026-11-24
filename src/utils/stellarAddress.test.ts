import { describe, it, expect } from 'vitest';
import { isValidEd25519PublicKey } from './stellarAddress';

const VALID_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

describe('isValidEd25519PublicKey', () => {
  it('returns true for a known-valid G... Stellar address', () => {
    expect(isValidEd25519PublicKey(VALID_ADDRESS)).toBe(true);
  });

  it('returns false for wrong length', () => {
    expect(isValidEd25519PublicKey('')).toBe(false);
    expect(isValidEd25519PublicKey(VALID_ADDRESS.slice(0, 55))).toBe(false);
    expect(isValidEd25519PublicKey(VALID_ADDRESS + 'A')).toBe(false);
  });

  it('returns false for lowercase addresses', () => {
    expect(isValidEd25519PublicKey(VALID_ADDRESS.toLowerCase())).toBe(false);
  });

  it('returns false for characters outside the RFC 4648 base32 alphabet', () => {
    // '0', '1', '8', '9' are not in A-Z2-7
    expect(isValidEd25519PublicKey('G0' + VALID_ADDRESS.slice(2))).toBe(false);
    expect(isValidEd25519PublicKey('G1' + VALID_ADDRESS.slice(2))).toBe(false);
    expect(isValidEd25519PublicKey('G8' + VALID_ADDRESS.slice(2))).toBe(false);
    expect(isValidEd25519PublicKey('G9' + VALID_ADDRESS.slice(2))).toBe(false);
  });

  it('returns false when one character is changed (bad CRC16-XModem checksum)', () => {
    const mutated =
      VALID_ADDRESS.slice(0, 10) +
      (VALID_ADDRESS[10] === 'A' ? 'B' : 'A') +
      VALID_ADDRESS.slice(11);
    expect(mutated).toHaveLength(56);
    expect(isValidEd25519PublicKey(mutated)).toBe(false);
  });

  it('returns false for a non-G version byte such as an S... secret seed', () => {
    const secretSeed = 'S' + VALID_ADDRESS.slice(1);
    expect(secretSeed).toHaveLength(56);
    expect(isValidEd25519PublicKey(secretSeed)).toBe(false);
  });

  it('returns false for non-string inputs', () => {
    // @ts-expect-error testing runtime guard
    expect(isValidEd25519PublicKey(null)).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(isValidEd25519PublicKey(undefined)).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(isValidEd25519PublicKey(12345)).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(isValidEd25519PublicKey({})).toBe(false);
  });
});
