/**
 * WhyPopover
 * ----------
 * "Why these times?" popover explaining the scheduling heuristics.
 * Self-contained: owns its own open/position state via useWhyPopover.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import {
  BarChart2,
  CalendarClock,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';
import type { RetryScheduleVizLabels } from './retryScheduleVizHelpers';
import { useWhyPopover } from './useWhyPopover';

// ─── Heuristic explanations ──────────────────────────────────

const DEFAULT_WHY_ITEMS = [
  {
    icon: <CalendarClock size={14} />,
    title: 'Off-peak window',
    body: 'Retries run in early-morning off-peak windows (02:00–06:00 UTC) when bank processors have lower error rates.',
  },
  {
    icon: <TrendingUp size={14} />,
    title: 'Exponential back-off',
    body: 'Each subsequent attempt waits longer (1 h → 6 h → 24 h → 72 h) to avoid triggering fraud checks.',
  },
  {
    icon: <BarChart2 size={14} />,
    title: 'Success-probability model',
    body: 'Machine-learning scores predict the likelihood of success based on card network, time-of-day, and recent decline codes.',
  },
  {
    icon: <ShieldCheck size={14} />,
    title: 'Smart method rotation',
    body: 'If a card is hard-declined, we attempt your next configured method (USDC wallet, prepaid balance) before giving up.',
  },
];

// ─── Component ───────────────────────────────────────────────

export interface WhyPopoverProps {
  labels: RetryScheduleVizLabels;
  customContent?: React.ReactNode;
}

export function WhyPopover({ labels, customContent }: WhyPopoverProps) {
  const { isOpen, positionBelow, setPositionBelow, toggle, close } = useWhyPopover();

  const rootRef    = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);
  const id         = useId();
  const popoverId  = `${id}-why-popover`;
  const titleId    = `${id}-why-title`;

  useModalFocus(popoverRef, {
    isOpen,
    onClose: close,
    initialFocusRef: closeRef,
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [isOpen, close]);

  // Flip above/below based on available space
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const popover = popoverRef.current;
      if (!popover) return;
      const rect = popover.getBoundingClientRect();
      setPositionBelow(rect.top < 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, setPositionBelow]);

  const handleClose = useCallback(() => {
    close();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [close]);

  return (
    <span className="rsv__why-wrap" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="rsv__why-btn"
        aria-label={labels.whyTitle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={toggle}
      >
        <HelpCircle size={12} aria-hidden="true" />
        {labels.whyButton}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className={`rsv__why-popover${positionBelow ? ' rsv__why-popover--below' : ''}`}
        >
          <h4 id={titleId} className="rsv__why-title">
            {labels.whyTitle}
          </h4>

          {customContent ?? (
            <ul className="rsv__why-list" role="list">
              {DEFAULT_WHY_ITEMS.map((item) => (
                <li key={item.title} className="rsv__why-item">
                  <span className="rsv__why-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <p className="rsv__why-text">
                    <strong>{item.title}</strong>
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <button
            ref={closeRef}
            type="button"
            className="rsv__why-close"
            onClick={handleClose}
          >
            {labels.whyClose}
          </button>
        </div>
      )}
    </span>
  );
}
