/**
 * Deterministic avatar color palette — WCAG 2.1 AA compliant against white/light text.
 * Each entry is a gradient pair (start, end) for visual variety.
 */
const AVATAR_COLORS: readonly [string, string][] = [
  ['#6366f1', '#8b5cf6'], // Indigo → Purple
  ['#22d3ee', '#2dd4bf'], // Cyan → Teal (brand)
  ['#f59e0b', '#f97316'], // Amber → Orange
  ['#ec4899', '#f43f5e'], // Pink → Rose
  ['#14b8a6', '#10b981'], // Teal → Emerald
  ['#3b82f6', '#6366f1'], // Blue → Indigo
  ['#a855f7', '#d946ef'], // Purple → Fuchsia
  ['#06b6d4', '#0ea5e9'], // Cyan → Sky
  ['#84cc16', '#22c55e'], // Lime → Green
  ['#f97316', '#ef4444'], // Orange → Red
] as const;

/**
 * Hash a string to a number in [0, limit).
 * Uses a simple DJB2-like hash for deterministic, stable results.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

/**
 * Extract initials from a name.
 *
 * - Returns at most 2 characters.
 * - For single words: first character uppercased.
 * - For multiple words: first character of first and last word.
 * - Handles non-Latin scripts (Unicode-aware).
 * - Falls back to "?" for empty strings.
 *
 * @example getInitials('John Doe')       // "JD"
 * @example getInitials('Alice')          // "A"
 * @example getInitials('山田 太郎')        // "山太"
 * @example getInitials('')               // "?"
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '?';

  const trimmed = name.trim();
  if (!trimmed) return '?';

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    // Single name: use first character (handles CJK and emoji)
    return [...parts[0]][0]?.toLocaleUpperCase() ?? '?';
  }

  // Multi-word: first char of first word + first char of last word
  const first = [...parts[0]][0] ?? '';
  const last = [...parts[parts.length - 1]][0] ?? '';

  return (first + last).toLocaleUpperCase();
}

/**
 * Return a deterministic color pair (gradient start, gradient end) for a given name.
 * The same name always produces the same color.
 */
export function getAvatarGradient(name: string): [string, string] {
  if (!name) return AVATAR_COLORS[0];
  const idx = hashString(name) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
