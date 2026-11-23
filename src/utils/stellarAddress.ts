/**
 * Stellar StrKey validation for account (ed25519 public key) addresses.
 *
 * A `G...` address is base32 (RFC 4648, no padding) of:
 *   1 version byte (6 << 3) + 32 key bytes + 2-byte CRC16-XModem checksum (little endian).
 * A regex alone accepts typos; this verifies the version byte and checksum too.
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ED25519_PUBLIC_KEY_VERSION = 6 << 3; // 'G'

function base32Decode(input: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of input) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) return null;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  // Leftover bits must be zero padding for a canonical encoding.
  if (bits > 0 && (value & ((1 << bits) - 1)) !== 0) return null;
  return Uint8Array.from(out);
}

function crc16XModem(bytes: Uint8Array): number {
  let crc = 0x0000;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

/** True when `address` is a canonical Stellar account address (G..., 56 chars, valid checksum). */
export function isValidEd25519PublicKey(address: string): boolean {
  if (typeof address !== 'string' || address.length !== 56 || !address.startsWith('G')) {
    return false;
  }
  const decoded = base32Decode(address);
  if (!decoded || decoded.length !== 35) return false;
  if (decoded[0] !== ED25519_PUBLIC_KEY_VERSION) return false;

  const payload = decoded.subarray(0, 33);
  const expected = crc16XModem(payload);
  const actual = decoded[33] | (decoded[34] << 8);
  return expected === actual;
}
