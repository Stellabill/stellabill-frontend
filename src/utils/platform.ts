/**
 * Platform detection utilities for cross-platform keyboard shortcut display.
 * 
 * Detects the user's operating system to render platform-appropriate modifier keys:
 * - macOS: Cmd (⌘)
 * - Windows/Linux: Ctrl
 */

export type Platform = 'mac' | 'windows' | 'linux' | 'other';

/**
 * Detect the user's platform based on navigator.
 * 
 * @returns The detected platform identifier.
 */
export function getPlatform(): Platform {
  // Server-side rendering guard
  if (typeof navigator === 'undefined') {
    return 'other';
  }

  // Modern approach: User-Agent Client Hints
  if ('userAgentData' in navigator) {
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string };
    };
    const platform = nav.userAgentData?.platform?.toLowerCase();
    if (platform?.includes('mac')) return 'mac';
    if (platform?.includes('win')) return 'windows';
    if (platform?.includes('linux')) return 'linux';
  }

  // Fallback: navigator.platform (deprecated but widely supported)
  const platform = navigator.platform?.toLowerCase() ?? '';
  if (platform.includes('mac')) return 'mac';
  if (platform.includes('win')) return 'windows';
  if (platform.includes('linux')) return 'linux';

  // Final fallback: parse user agent string
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) return 'mac';
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('linux')) return 'linux';

  return 'other';
}

/**
 * Check if the user is on macOS.
 * 
 * @returns True if the platform is macOS.
 */
export function isMac(): boolean {
  return getPlatform() === 'mac';
}

/**
 * Get the primary modifier key name for the platform.
 * 
 * @returns "Cmd" for macOS, "Ctrl" for others.
 */
export function getModifierKey(): 'Cmd' | 'Ctrl' {
  return isMac() ? 'Cmd' : 'Ctrl';
}

/**
 * Get the modifier key symbol for display.
 * 
 * @returns "⌘" for macOS, "Ctrl" for others.
 */
export function getModifierSymbol(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Format a keyboard shortcut for display with platform-aware modifiers.
 * 
 * @param keys - Array of key names, e.g. ['mod', 'K'] or ['Esc']
 * @returns Array of display keys with 'mod' replaced by platform modifier
 * 
 * @example
 * ```ts
 * formatShortcut(['mod', 'K']) // ['⌘', 'K'] on Mac, ['Ctrl', 'K'] on Windows
 * formatShortcut(['Esc']) // ['Esc']
 * ```
 */
export function formatShortcut(keys: string[]): string[] {
  return keys.map((key) => {
    if (key.toLowerCase() === 'mod') {
      return getModifierSymbol();
    }
    return key;
  });
}
