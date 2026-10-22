/**
 * Centralized links and external URLs configuration.
 */

export const SUPPORT_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_URL) ||
  'https://github.com/Stellabill/stellabill-frontend/issues';

export const STELLAR_WALLETS_DOCS_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STELLAR_WALLETS_DOCS_URL) ||
  'https://docs.stellar.org/wallets';

export const DOCS_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DOCS_URL) ||
  'https://github.com/Stellabill/stellabill-frontend/tree/main/docs';

export const README_URL = 'https://github.com/Stellabill/stellabill-frontend#readme';

export const GITHUB_REPO_URL = 'https://github.com/Stellabill/stellabill-frontend';

/**
 * Returns the StellarExpert explorer URL for an account address.
 */
export function getExplorerAccountUrl(address: string): string {
  return 'https://stellar.expert/explorer/public/account/' + address;
}
