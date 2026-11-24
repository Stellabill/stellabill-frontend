/**
 * Opens an external URL in a new browser tab/window safely with
 * `noopener,noreferrer` to prevent reverse tabnabbing attacks.
 *
 * @param url The external URL to open.
 * @param target Window target (defaults to '_blank').
 * @param features Window features string (defaults to 'noopener,noreferrer').
 * @returns The opened Window proxy or null if opening failed or was blocked.
 */
export function openExternal(
  url: string,
  target: string = '_blank',
  features: string = 'noopener,noreferrer'
): Window | null {
  const safeFeatures = features.includes('noopener')
    ? features
    : (features ? features + ',' : '') + 'noopener,noreferrer';
  // eslint-disable-next-line no-restricted-syntax
  return window.open(url, target, safeFeatures);
}
