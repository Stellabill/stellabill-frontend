/**
 * Token Version Data Layer
 *
 * Stores historical snapshots of the design-token palette so the diff viewer
 * can compare any two releases side-by-side.
 *
 * Each version maps CSS custom-property names to their resolved values.
 */

export interface TokenEntry {
  /** The CSS custom-property name, e.g. "--color-surface-canvas" */
  name: string;
  /** Resolved value as it appeared in that release */
  value: string;
  /** Semantic category for impact-scope badges */
  category: TokenCategory;
}

export type TokenCategory =
  | 'surface'
  | 'text'
  | 'border'
  | 'brand'
  | 'feedback'
  | 'shadow'
  | 'spacing'
  | 'typography'
  | 'radius'
  | 'z-index'
  | 'component'
  | 'status';

export interface TokenVersion {
  id: string;
  label: string;
  date: string;
  tokens: TokenEntry[];
}

/* ────────────────────────────────────────────
   v0.0.1 — Initial release
   ──────────────────────────────────────────── */
const v001Tokens: TokenEntry[] = [
  // Surfaces
  { name: '--color-surface-canvas',        value: '#f8fafc', category: 'surface' },
  { name: '--color-surface-page',          value: '#f1f5f9', category: 'surface' },
  { name: '--color-surface-card',          value: '#ffffff', category: 'surface' },
  { name: '--color-surface-card-hover',    value: '#f8fafc', category: 'surface' },
  { name: '--color-surface-elevated',      value: '#ffffff', category: 'surface' },
  { name: '--color-surface-subtle',        value: '#eef2f7', category: 'surface' },
  { name: '--color-surface-control',       value: '#ffffff', category: 'surface' },

  // Text
  { name: '--color-text-primary',          value: '#0f172a', category: 'text' },
  { name: '--color-text-secondary',        value: '#334155', category: 'text' },
  { name: '--color-text-muted',            value: '#475569', category: 'text' },
  { name: '--color-text-subtle',           value: '#64748b', category: 'text' },
  { name: '--color-text-disabled',         value: '#94a3b8', category: 'text' },

  // Borders
  { name: '--color-border-subtle',         value: '#e2e8f0', category: 'border' },
  { name: '--color-border-default',        value: '#cbd5e1', category: 'border' },
  { name: '--color-border-strong',         value: '#94a3b8', category: 'border' },
  { name: '--color-focus-ring',            value: '#0891b2', category: 'border' },

  // Brand
  { name: '--color-brand-primary',         value: '#067d99', category: 'brand' },
  { name: '--color-brand-primary-hover',   value: '#075f73', category: 'brand' },
  { name: '--color-brand-accent',          value: '#0f766e', category: 'brand' },
  { name: '--color-brand-text',            value: '#067d99', category: 'brand' },
  { name: '--color-brand-on',              value: '#ffffff', category: 'brand' },

  // Feedback
  { name: '--color-success',               value: '#047857', category: 'feedback' },
  { name: '--color-success-bg',            value: '#d1fae5', category: 'feedback' },
  { name: '--color-warning',               value: '#b45309', category: 'feedback' },
  { name: '--color-warning-bg',            value: '#fef3c7', category: 'feedback' },
  { name: '--color-danger',                value: '#b91c1c', category: 'feedback' },
  { name: '--color-danger-bg',             value: '#fee2e2', category: 'feedback' },

  // Shadows
  { name: '--shadow-sm',                   value: '0 1px 2px rgba(15,23,42,0.08)', category: 'shadow' },
  { name: '--shadow-md',                   value: '0 8px 18px rgba(15,23,42,0.10)', category: 'shadow' },

  // Spacing
  { name: '--space-4',                     value: '1rem',    category: 'spacing' },
  { name: '--space-6',                     value: '1.5rem',  category: 'spacing' },
  { name: '--space-8',                     value: '2rem',    category: 'spacing' },

  // Radius
  { name: '--radius-md',                   value: '0.5rem',  category: 'radius' },
  { name: '--radius-lg',                   value: '0.75rem', category: 'radius' },
  { name: '--radius-xl',                   value: '1rem',    category: 'radius' },

  // Status
  { name: '--status-active-bg',            value: '#d1fae5', category: 'status' },
  { name: '--status-active-text',          value: '#065f46', category: 'status' },
  { name: '--status-paused-bg',            value: '#fef3c7', category: 'status' },
  { name: '--status-paused-text',          value: '#92400e', category: 'status' },
  { name: '--status-cancelled-bg',         value: '#fee2e2', category: 'status' },
  { name: '--status-cancelled-text',       value: '#991b1b', category: 'status' },
];

/* ────────────────────────────────────────────
   v0.0.2 — Dark-mode refinement + new tokens
   ──────────────────────────────────────────── */
const v002Tokens: TokenEntry[] = [
  // Surfaces — card-hover changed
  { name: '--color-surface-canvas',        value: '#f8fafc', category: 'surface' },
  { name: '--color-surface-page',          value: '#f1f5f9', category: 'surface' },
  { name: '--color-surface-card',          value: '#ffffff', category: 'surface' },
  { name: '--color-surface-card-hover',    value: '#f1f5f9', category: 'surface' },  // CHANGED
  { name: '--color-surface-elevated',      value: '#ffffff', category: 'surface' },
  { name: '--color-surface-subtle',        value: '#eef2f7', category: 'surface' },
  { name: '--color-surface-control',       value: '#ffffff', category: 'surface' },
  { name: '--color-surface-overlay',       value: 'rgba(255,255,255,0.96)', category: 'surface' }, // ADDED
  { name: '--color-surface-active',        value: '#e0f7fb', category: 'surface' },  // ADDED

  // Text — unchanged
  { name: '--color-text-primary',          value: '#0f172a', category: 'text' },
  { name: '--color-text-secondary',        value: '#334155', category: 'text' },
  { name: '--color-text-muted',            value: '#475569', category: 'text' },
  { name: '--color-text-subtle',           value: '#64748b', category: 'text' },
  { name: '--color-text-disabled',         value: '#94a3b8', category: 'text' },
  { name: '--color-text-inverse',          value: '#ffffff', category: 'text' }, // ADDED

  // Borders — focus ring changed
  { name: '--color-border-subtle',         value: '#e2e8f0', category: 'border' },
  { name: '--color-border-default',        value: '#cbd5e1', category: 'border' },
  { name: '--color-border-strong',         value: '#94a3b8', category: 'border' },
  { name: '--color-focus-ring',            value: '#06b6d4', category: 'border' },  // CHANGED

  // Brand — added text-hover
  { name: '--color-brand-primary',         value: '#067d99', category: 'brand' },
  { name: '--color-brand-primary-hover',   value: '#075f73', category: 'brand' },
  { name: '--color-brand-accent',          value: '#0f766e', category: 'brand' },
  { name: '--color-brand-text',            value: '#067d99', category: 'brand' },
  { name: '--color-brand-on',              value: '#ffffff', category: 'brand' },
  { name: '--color-brand-text-hover',      value: '#075f73', category: 'brand' }, // ADDED

  // Feedback — unchanged
  { name: '--color-success',               value: '#047857', category: 'feedback' },
  { name: '--color-success-bg',            value: '#d1fae5', category: 'feedback' },
  { name: '--color-warning',               value: '#b45309', category: 'feedback' },
  { name: '--color-warning-bg',            value: '#fef3c7', category: 'feedback' },
  { name: '--color-danger',                value: '#b91c1c', category: 'feedback' },
  { name: '--color-danger-bg',             value: '#fee2e2', category: 'feedback' },
  { name: '--color-info',                  value: '#1d4ed8', category: 'feedback' }, // ADDED
  { name: '--color-info-bg',               value: '#dbeafe', category: 'feedback' }, // ADDED

  // Shadows — unchanged
  { name: '--shadow-sm',                   value: '0 1px 2px rgba(15,23,42,0.08)', category: 'shadow' },
  { name: '--shadow-md',                   value: '0 8px 18px rgba(15,23,42,0.10)', category: 'shadow' },

  // Spacing — unchanged
  { name: '--space-4',                     value: '1rem',    category: 'spacing' },
  { name: '--space-6',                     value: '1.5rem',  category: 'spacing' },
  { name: '--space-8',                     value: '2rem',    category: 'spacing' },

  // Radius — unchanged
  { name: '--radius-md',                   value: '0.5rem',  category: 'radius' },
  { name: '--radius-lg',                   value: '0.75rem', category: 'radius' },
  { name: '--radius-xl',                   value: '1rem',    category: 'radius' },

  // Status — unchanged
  { name: '--status-active-bg',            value: '#d1fae5', category: 'status' },
  { name: '--status-active-text',          value: '#065f46', category: 'status' },
  { name: '--status-paused-bg',            value: '#fef3c7', category: 'status' },
  { name: '--status-paused-text',          value: '#92400e', category: 'status' },
  { name: '--status-cancelled-bg',         value: '#fee2e2', category: 'status' },
  { name: '--status-cancelled-text',       value: '#991b1b', category: 'status' },
];

/* ────────────────────────────────────────────
   v0.0.3 — Brand refresh + shadow scale
   ──────────────────────────────────────────── */
const v003Tokens: TokenEntry[] = [
  // Surfaces — canvas & page changed
  { name: '--color-surface-canvas',        value: '#f9fafb', category: 'surface' },  // CHANGED
  { name: '--color-surface-page',          value: '#f3f4f6', category: 'surface' },  // CHANGED
  { name: '--color-surface-card',          value: '#ffffff', category: 'surface' },
  { name: '--color-surface-card-hover',    value: '#f1f5f9', category: 'surface' },
  { name: '--color-surface-elevated',      value: '#ffffff', category: 'surface' },
  { name: '--color-surface-subtle',        value: '#eef2f7', category: 'surface' },
  { name: '--color-surface-control',       value: '#ffffff', category: 'surface' },
  { name: '--color-surface-overlay',       value: 'rgba(255,255,255,0.96)', category: 'surface' },
  { name: '--color-surface-active',        value: '#e0f7fb', category: 'surface' },

  // Text — primary changed
  { name: '--color-text-primary',          value: '#111827', category: 'text' },  // CHANGED
  { name: '--color-text-secondary',        value: '#374151', category: 'text' },  // CHANGED
  { name: '--color-text-muted',            value: '#6b7280', category: 'text' },  // CHANGED
  { name: '--color-text-subtle',           value: '#9ca3af', category: 'text' },  // CHANGED
  { name: '--color-text-disabled',         value: '#d1d5db', category: 'text' },  // CHANGED
  { name: '--color-text-inverse',          value: '#ffffff', category: 'text' },

  // Borders
  { name: '--color-border-subtle',         value: '#e5e7eb', category: 'border' }, // CHANGED
  { name: '--color-border-default',        value: '#d1d5db', category: 'border' }, // CHANGED
  { name: '--color-border-strong',         value: '#9ca3af', category: 'border' }, // CHANGED
  { name: '--color-focus-ring',            value: '#06b6d4', category: 'border' },

  // Brand — primary refreshed
  { name: '--color-brand-primary',         value: '#0891b2', category: 'brand' },  // CHANGED
  { name: '--color-brand-primary-hover',   value: '#0e7490', category: 'brand' },  // CHANGED
  { name: '--color-brand-accent',          value: '#14b8a6', category: 'brand' },  // CHANGED
  { name: '--color-brand-text',            value: '#0891b2', category: 'brand' },  // CHANGED
  { name: '--color-brand-on',              value: '#ffffff', category: 'brand' },
  { name: '--color-brand-text-hover',      value: '#0e7490', category: 'brand' },  // CHANGED
  { name: '--color-brand-glow',            value: 'rgba(6,125,153,0.16)', category: 'brand' }, // ADDED

  // Feedback
  { name: '--color-success',               value: '#059669', category: 'feedback' }, // CHANGED
  { name: '--color-success-bg',            value: '#d1fae5', category: 'feedback' },
  { name: '--color-warning',               value: '#d97706', category: 'feedback' }, // CHANGED
  { name: '--color-warning-bg',            value: '#fef3c7', category: 'feedback' },
  { name: '--color-danger',                value: '#dc2626', category: 'feedback' }, // CHANGED
  { name: '--color-danger-bg',             value: '#fee2e2', category: 'feedback' },
  { name: '--color-info',                  value: '#2563eb', category: 'feedback' }, // CHANGED
  { name: '--color-info-bg',               value: '#dbeafe', category: 'feedback' },

  // Shadows — full scale now
  { name: '--shadow-sm',                   value: '0 1px 2px rgba(0,0,0,0.05)',  category: 'shadow' },  // CHANGED
  { name: '--shadow-md',                   value: '0 4px 6px rgba(0,0,0,0.07)',  category: 'shadow' },  // CHANGED
  { name: '--shadow-lg',                   value: '0 10px 15px rgba(0,0,0,0.10)', category: 'shadow' }, // ADDED
  { name: '--shadow-xl',                   value: '0 20px 25px rgba(0,0,0,0.15)', category: 'shadow' }, // ADDED

  // Spacing
  { name: '--space-4',                     value: '1rem',    category: 'spacing' },
  { name: '--space-6',                     value: '1.5rem',  category: 'spacing' },
  { name: '--space-8',                     value: '2rem',    category: 'spacing' },
  { name: '--space-10',                    value: '2.5rem',  category: 'spacing' }, // ADDED

  // Radius — REMOVED --radius-xl, added --radius-2xl
  { name: '--radius-md',                   value: '0.5rem',  category: 'radius' },
  { name: '--radius-lg',                   value: '0.75rem', category: 'radius' },
  { name: '--radius-2xl',                  value: '1.5rem',  category: 'radius' }, // ADDED (xl removed)

  // Status
  { name: '--status-active-bg',            value: '#d1fae5', category: 'status' },
  { name: '--status-active-text',          value: '#065f46', category: 'status' },
  { name: '--status-paused-bg',            value: '#fef3c7', category: 'status' },
  { name: '--status-paused-text',          value: '#92400e', category: 'status' },
  { name: '--status-cancelled-bg',         value: '#fee2e2', category: 'status' },
  { name: '--status-cancelled-text',       value: '#991b1b', category: 'status' },
];

/* ────────────────────────────────────────────
   Public API
   ──────────────────────────────────────────── */

export const TOKEN_VERSIONS: TokenVersion[] = [
  { id: 'v0.0.1', label: 'v0.0.1 — Initial Release',         date: '2025-09-01', tokens: v001Tokens },
  { id: 'v0.0.2', label: 'v0.0.2 — Dark-Mode Refinement',    date: '2025-12-15', tokens: v002Tokens },
  { id: 'v0.0.3', label: 'v0.0.3 — Brand Refresh',           date: '2026-04-20', tokens: v003Tokens },
];

/** Look up a version by its id string. */
export function getVersion(id: string): TokenVersion | undefined {
  return TOKEN_VERSIONS.find((v) => v.id === id);
}

/** Return the list of available version ids. */
export function getVersionIds(): string[] {
  return TOKEN_VERSIONS.map((v) => v.id);
}
