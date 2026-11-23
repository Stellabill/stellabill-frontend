import { describe, it, expect } from 'vitest';
import {
  normalizeNetwork,
  getExpectedNetwork,
  explorerAccountUrl,
  isNetworkMismatch,
} from './network';

const SAMPLE_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

describe('normalizeNetwork', () => {
  it('maps mainnet and public spellings (case-insensitive, trimmed) to Mainnet', () => {
    expect(normalizeNetwork('mainnet')).toBe('Mainnet');
    expect(normalizeNetwork('Mainnet')).toBe('Mainnet');
    expect(normalizeNetwork('MAINNET')).toBe('Mainnet');
    expect(normalizeNetwork('public')).toBe('Mainnet');
    expect(normalizeNetwork('PUBLIC')).toBe('Mainnet');
    expect(normalizeNetwork('pubnet')).toBe('Mainnet');
    expect(normalizeNetwork('livenet')).toBe('Mainnet');
    expect(normalizeNetwork('  public  ')).toBe('Mainnet');
  });

  it('maps testnet spellings to Testnet', () => {
    expect(normalizeNetwork('testnet')).toBe('Testnet');
    expect(normalizeNetwork('Testnet')).toBe('Testnet');
    expect(normalizeNetwork('TESTNET')).toBe('Testnet');
    expect(normalizeNetwork('  testnet  ')).toBe('Testnet');
  });

  it('defaults empty, nullish, and unknown inputs to Testnet', () => {
    expect(normalizeNetwork(undefined)).toBe('Testnet');
    expect(normalizeNetwork(null)).toBe('Testnet');
    expect(normalizeNetwork('')).toBe('Testnet');
    expect(normalizeNetwork('   ')).toBe('Testnet');
    expect(normalizeNetwork('futurenet')).toBe('Testnet');
    expect(normalizeNetwork('unknown')).toBe('Testnet');
  });
});

describe('getExpectedNetwork', () => {
  it('uses the passed env value', () => {
    expect(getExpectedNetwork('testnet')).toBe('Testnet');
    expect(getExpectedNetwork('mainnet')).toBe('Mainnet');
    expect(getExpectedNetwork('public')).toBe('Mainnet');
  });

  it('defaults to Testnet for empty or unrecognized env values', () => {
    expect(getExpectedNetwork('')).toBe('Testnet');
    expect(getExpectedNetwork('staging')).toBe('Testnet');
  });
});

describe('explorerAccountUrl', () => {
  it('builds distinct Stellar Expert URLs per network containing the address', () => {
    const mainnetUrl = explorerAccountUrl('Mainnet', SAMPLE_ADDRESS);
    const publicUrl = explorerAccountUrl('public', SAMPLE_ADDRESS);
    const testnetUrl = explorerAccountUrl('Testnet', SAMPLE_ADDRESS);

    expect(mainnetUrl).toBe(
      'https://stellar.expert/explorer/public/account/' + SAMPLE_ADDRESS,
    );
    expect(publicUrl).toBe(mainnetUrl);
    expect(testnetUrl).toBe(
      'https://stellar.expert/explorer/testnet/account/' + SAMPLE_ADDRESS,
    );
    expect(mainnetUrl).not.toBe(testnetUrl);
    expect(mainnetUrl).toContain(SAMPLE_ADDRESS);
    expect(testnetUrl).toContain(SAMPLE_ADDRESS);
  });

  it('falls back to the testnet explorer URL for unknown network strings', () => {
    expect(explorerAccountUrl('unknown', SAMPLE_ADDRESS)).toBe(
      'https://stellar.expert/explorer/testnet/account/' + SAMPLE_ADDRESS,
    );
  });
});

describe('isNetworkMismatch', () => {
  it('returns false when wallet network is null, undefined, or empty', () => {
    expect(isNetworkMismatch(null, 'Mainnet')).toBe(false);
    expect(isNetworkMismatch(null, 'Testnet')).toBe(false);
    expect(isNetworkMismatch(undefined, 'Mainnet')).toBe(false);
    expect(isNetworkMismatch('', 'Mainnet')).toBe(false);
  });

  it('returns false when wallet network matches expected network (including aliases)', () => {
    expect(isNetworkMismatch('Testnet', 'Testnet')).toBe(false);
    expect(isNetworkMismatch('testnet', 'Testnet')).toBe(false);
    expect(isNetworkMismatch('Mainnet', 'Mainnet')).toBe(false);
    expect(isNetworkMismatch('public', 'Mainnet')).toBe(false);
    expect(isNetworkMismatch('mainnet', 'public')).toBe(false);
  });

  it('returns true when wallet network differs from expected network', () => {
    expect(isNetworkMismatch('Mainnet', 'Testnet')).toBe(true);
    expect(isNetworkMismatch('Testnet', 'Mainnet')).toBe(true);
    expect(isNetworkMismatch('public', 'testnet')).toBe(true);
    expect(isNetworkMismatch('testnet', 'public')).toBe(true);
  });
});
