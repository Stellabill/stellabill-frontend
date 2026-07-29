import { useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import Tag from '../Tag';
import ColorSwatch, { TAG_COLORS, TAG_COLOR_PAIRS, type TagColor } from './ColorSwatch';
import { contrastRatio, wcagLevel, WCAG_AA_NORMAL } from '../../utils/colorContrast';
import './ColorPicker.css';

export interface ColorPickerProps {
  /** Current selected colour. */
  value: TagColor;
  /** The tag label to show in the live preview. */
  previewLabel?: string;
  /** Called when the user selects a new colour. */
  onChange: (color: TagColor) => void;
  /** Optional id used as the `aria-labelledby` target. */
  labelId?: string;
}

/**
 * Accessible tag colour picker.
 *
 * - Swatch grid uses the ARIA radio-group + radio pattern.
 * - Arrow keys move focus between swatches (roving tabindex).
 * - Live tag preview updates instantly.
 * - Shows a contrast-ratio badge and a warning when the pair falls below
 *   WCAG 2.1 AA (4.5:1).
 */
export default function ColorPicker({
  value,
  previewLabel = 'Preview',
  onChange,
  labelId,
}: ColorPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Keyboard navigation (roving tabindex, arrow keys) ─────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const buttons = Array.from(
        gridRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [],
      );
      if (buttons.length === 0) return;

      const focused = document.activeElement as HTMLButtonElement | null;
      const currentIdx = focused ? buttons.indexOf(focused) : -1;

      const COLS = 4; // grid has 4 columns
      let nextIdx = currentIdx;

      switch (e.key) {
        case 'ArrowRight':
          nextIdx = (currentIdx + 1) % buttons.length;
          break;
        case 'ArrowLeft':
          nextIdx = (currentIdx - 1 + buttons.length) % buttons.length;
          break;
        case 'ArrowDown':
          nextIdx = Math.min(currentIdx + COLS, buttons.length - 1);
          break;
        case 'ArrowUp':
          nextIdx = Math.max(currentIdx - COLS, 0);
          break;
        case 'Home':
          nextIdx = 0;
          break;
        case 'End':
          nextIdx = buttons.length - 1;
          break;
        default:
          return; // Don't prevent default for other keys
      }

      e.preventDefault();
      buttons[nextIdx]?.focus();
    },
    [],
  );

  // ── Contrast info for the current selection ────────────────────────────────
  const { bg, text } = TAG_COLOR_PAIRS[value];
  const ratio = contrastRatio(text, bg);
  const level = wcagLevel(ratio);
  const passesAA = ratio !== null && ratio >= WCAG_AA_NORMAL;
  const ratioDisplay = ratio !== null ? ratio.toFixed(1) : '—';

  return (
    <div className="color-picker" aria-label="Tag colour">
      {/* ── Swatch grid ─────────────────────────────────────────────────── */}
      <div
        ref={gridRef}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : 'Select colour'}
        className="color-picker__grid"
        onKeyDown={handleKeyDown}
      >
        {TAG_COLORS.map((color, idx) => (
          <ColorSwatch
            key={color}
            color={color}
            selected={color === value}
            onSelect={onChange}
            // Roving tabindex: only the selected swatch (or first if none) is
            // in the tab sequence.
            tabIndex={color === value ? 0 : -1}
            {...{ 'data-index': idx }}
          />
        ))}
      </div>

      {/* ── Live preview ────────────────────────────────────────────────── */}
      <div className="color-picker__preview-row" aria-live="polite" aria-atomic="true">
        <span className="color-picker__preview-label" id="color-picker-preview-heading">
          Preview
        </span>
        <Tag
          label={previewLabel || 'Preview'}
          color={value}
          size="small"
          aria-label={`Tag preview: ${previewLabel || 'Preview'} in ${value}`}
        />
      </div>

      {/* ── Contrast badge + warning ─────────────────────────────────────── */}
      <div
        className={`color-picker__contrast${passesAA ? ' color-picker__contrast--pass' : ' color-picker__contrast--fail'}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="color-picker__contrast-ratio">
          {ratioDisplay}:1
        </span>
        <span className={`color-picker__contrast-badge color-picker__contrast-badge--${level.toLowerCase().replace(' ', '-')}`}>
          {level}
        </span>

        {!passesAA && (
          <span className="color-picker__contrast-warning" role="alert">
            <AlertTriangle
              size={14}
              aria-hidden="true"
              className="color-picker__contrast-warning-icon"
            />
            <span>
              Contrast {ratioDisplay}:1 is below the WCAG AA minimum of {WCAG_AA_NORMAL}:1 for normal text.
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
