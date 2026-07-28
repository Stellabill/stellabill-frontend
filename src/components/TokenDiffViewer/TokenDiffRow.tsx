/**
 * TokenDiffRow
 *
 * Renders a single row in the token diff list, showing the status icon,
 * token name, old/new swatch comparison, contrast delta, and impact scope.
 *
 * Colour-blind-safe: uses distinct shapes/text labels, not colour alone.
 */

import type { DiffEntry } from './diffEngine';
import { isColor, getImpactScope } from './diffEngine';

/* ── Status icon config (colour-blind safe) ── */
const STATUS_CONFIG = {
  added:     { symbol: '+',  label: 'Added',     className: 'token-diff-row__icon--added' },
  removed:   { symbol: '−',  label: 'Removed',   className: 'token-diff-row__icon--removed' },
  changed:   { symbol: '↔', label: 'Changed',   className: 'token-diff-row__icon--changed' },
  unchanged: { symbol: '=',  label: 'Unchanged', className: 'token-diff-row__icon--unchanged' },
} as const;

interface TokenDiffRowProps {
  entry: DiffEntry;
}

/** Render a colour swatch or a "N/A" placeholder for non-colour tokens. */
function Swatch({ value, ariaLabel }: { value: string; ariaLabel: string }) {
  if (isColor(value)) {
    return (
      <span
        className="token-diff-row__swatch"
        style={{ backgroundColor: value }}
        role="img"
        aria-label={`${ariaLabel}: ${value}`}
        title={value}
      />
    );
  }
  return (
    <span
      className="token-diff-row__swatch token-diff-row__swatch--non-color"
      role="img"
      aria-label={`${ariaLabel}: ${value}`}
      title={value}
    >
      val
    </span>
  );
}

export default function TokenDiffRow({ entry }: TokenDiffRowProps) {
  const cfg = STATUS_CONFIG[entry.type];

  /* Determine what values to show */
  const showOld = entry.type === 'changed' || entry.type === 'removed';
  const showNew = entry.type === 'changed' || entry.type === 'added';

  const oldValue = entry.type === 'changed' ? entry.oldValue : entry.type === 'removed' ? entry.value : '';
  const newValue = entry.type === 'changed' ? entry.newValue : entry.type === 'added' ? entry.value : entry.value;

  const contrastDelta = entry.type === 'changed' ? entry.contrastDelta : null;

  return (
    <div
      className={`token-diff-row token-diff-row--${entry.type}`}
      role="row"
      aria-label={`${cfg.label} token: ${entry.name}`}
    >
      {/* Status icon */}
      <span
        className={`token-diff-row__icon ${cfg.className}`}
        role="img"
        aria-label={cfg.label}
        title={cfg.label}
      >
        {cfg.symbol}
      </span>

      {/* Token name */}
      <span className="token-diff-row__name">{entry.name}</span>

      {/* Swatches */}
      <span className="token-diff-row__swatches">
        {showOld && (
          <span className="token-diff-row__swatch-pair">
            <Swatch value={oldValue} ariaLabel="Old value" />
            <span className="token-diff-row__swatch-label token-diff-row__swatch-label--old">
              {oldValue}
            </span>
          </span>
        )}
        {entry.type === 'changed' && (
          <span className="token-diff-row__swatch-arrow" aria-hidden="true">→</span>
        )}
        {showNew && (
          <span className="token-diff-row__swatch-pair">
            <Swatch value={newValue} ariaLabel="New value" />
            <span className="token-diff-row__swatch-label">{newValue}</span>
          </span>
        )}
        {entry.type === 'unchanged' && (
          <span className="token-diff-row__swatch-pair">
            <Swatch value={newValue} ariaLabel="Value" />
            <span className="token-diff-row__swatch-label">{newValue}</span>
          </span>
        )}
      </span>

      {/* Contrast delta (only for changed colour tokens) */}
      <span className={`token-diff-row__delta${contrastDelta !== null && contrastDelta > 0.1 ? ' token-diff-row__delta--warning' : ''}`}>
        {contrastDelta !== null ? (
          <>
            <span aria-hidden="true">Δ</span>{' '}
            <span>{contrastDelta.toFixed(3)}</span>
          </>
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </span>

      {/* Impact scope badge */}
      <span className="token-diff-row__scope">
        {getImpactScope(entry.category)}
      </span>
    </div>
  );
}
