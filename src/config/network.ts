export type StellarNetwork = 'Testnet' | 'Mainnet';

/**
 * Normalizes a network identifier string into the canonical 'Testnet' | 'Mainnet' union.
 * Recognizes 'mainnet', 'public', 'pubnet', and 'livenet' (case-insensitive) as 'Mainnet',
 * defaulting to 'Testnet' otherwise.
 */
export function normalizeNetwork(value?: string | null): StellarNetwork {
  if (!value) return 'Testnet';
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'mainnet' ||
    normalized === 'public' ||
    normalized === 'pubnet' ||
    normalized === 'livenet'
  ) {
    return 'Mainnet';
  }
  return 'Testnet';
}

/**
 * Resolves the application's expected Stellar network from `import.meta.env.VITE_STELLAR_NETWORK`.
 * Defaults to 'Testnet' when unset or unrecognized.
 */
export function getExpectedNetwork(
  envNetwork: string | undefined = import.meta.env?.VITE_STELLAR_NETWORK,
): StellarNetwork {
  return normalizeNetwork(envNetwork);
}

export const EXPECTED_NETWORK: StellarNetwork = getExpectedNetwork();

/**
 * Builds the Stellar Expert account explorer URL for the given network and address.
 */
export function explorerAccountUrl(
  network: StellarNetwork | 'testnet' | 'mainnet' | 'public' | (string & {}),
  address: string,
): string {
  const canonical = normalizeNetwork(network);
  const segment = canonical === 'Mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${segment}/account/${address}`;
}

/**
 * Checks whether the wallet's reported network mismatches the expected network.
 */
export function isNetworkMismatch(
  walletNetwork?: string | null,
  expectedNetwork: string = getExpectedNetwork(),
): boolean {
  if (!walletNetwork) return false;
  return normalizeNetwork(walletNetwork) !== normalizeNetwork(expectedNetwork);
}
