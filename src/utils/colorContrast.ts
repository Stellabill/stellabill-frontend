/**
 * WCAG 2.1 contrast ratio utilities.
 *
 * References:
 *   https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *   https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

/** Minimum contrast ratio for WCAG 2.1 Level AA normal text (4.5:1). */
export const WCAG_AA_NORMAL = 4.5;

/** Minimum contrast ratio for WCAG 2.1 Level AA large text / UI components (3:1). */
export const WCAG_AA_LARGE = 3.0;

/** Minimum contrast ratio for WCAG 2.1 Level AAA normal text (7:1). */
export const WCAG_AAA_NORMAL = 7.0;

/**
 * Parse a CSS hex colour string (#rgb, #rrggbb, #rgba, #rrggbbaa) into an
 * [r, g, b] tuple in the 0–255 range.  Returns null for unrecognised input.
 */
export function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, '').trim();

  if (clean.length === 3 || clean.length === 4) {
    // Short form: expand each digit.
    const [r, g, b] = clean.split('').map((d) => parseInt(d + d, 16));
    return [r, g, b];
  }

  if (clean.length === 6 || clean.length === 8) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }

  return null;
}

/**
 * Convert a single 8-bit channel value to its linearised sRGB component.
 * Per WCAG 2.1 §1.4.3 formula.
 */
function linearise(channel: number): number {
  const sRGB = channel / 255;
  return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

/**
 * Calculate the relative luminance of a colour given as [r, g, b] (0–255).
 * Returns a value between 0 (black) and 1 (white).
 */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(linearise);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate the WCAG 2.1 contrast ratio between two colours supplied as hex
 * strings.  Returns `null` if either colour cannot be parsed.
 *
 * @example
 *   contrastRatio('#1e40af', '#dbeafe') // ~5.6
 */
export function contrastRatio(
  foreground: string,
  background: string,
): number | null {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return null;

  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Return a human-readable label for a contrast ratio:
 *   "AAA" ≥ 7:1 | "AA" ≥ 4.5:1 | "AA Large" ≥ 3:1 | "Fail"
 */
export function wcagLevel(ratio: number | null): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio === null) return 'Fail';
  if (ratio >= WCAG_AAA_NORMAL) return 'AAA';
  if (ratio >= WCAG_AA_NORMAL) return 'AA';
  if (ratio >= WCAG_AA_LARGE) return 'AA Large';
  return 'Fail';
}

/**
 * Returns true if the foreground/background pair passes WCAG 2.1 AA for
 * normal-sized text (contrast ≥ 4.5:1).
 */
export function passesAA(foreground: string, background: string): boolean {
  const ratio = contrastRatio(foreground, background);
  return ratio !== null && ratio >= WCAG_AA_NORMAL;
}
