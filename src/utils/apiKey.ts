export function defaultGenerateApiKey(): string {
  const bytes = new Uint8Array(24)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes)
  }
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return 'sk_live_' + hex
}

export function maskApiKey(secret: string): string {
  if (secret.length <= 8) {
    return '••••••••'
  }
  const lastUnderscore = secret.lastIndexOf('_')
  const prefix = lastUnderscore !== -1 ? secret.slice(0, lastUnderscore + 1) : secret.slice(0, 8)
  const last4 = secret.slice(-4)
  return prefix + '•'.repeat(16) + last4
}
