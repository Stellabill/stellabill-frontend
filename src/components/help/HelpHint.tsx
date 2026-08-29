import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { getTerm } from './glossary';
import './HelpHint.css';

export interface HelpHintContent {
  /** Popover title. Defaults to the glossary term name or "More information". */
  title?: string;
  /** The definition text shown as the popover body. */
  definition?: string;
  /** Optional worked example shown below the definition. */
  example?: string;
  /** Optional "Learn more" destination. Rendered as an external link. */
  learnMoreUrl?: string;
}

export interface HelpHintProps extends HelpHintContent {
  /** Look up title, definition, example, and link from the billing glossary. */
  termId?: string;
  /** Accessible name for the `?` trigger button. */
  triggerLabel?: string;
  /** CSS class applied to the root wrapper. */
  className?: string;
  /** Milliseconds of hover before the popover opens. */
  openDelayMs?: number;
  /** Milliseconds after the pointer leaves before the popover closes. */
  closeDelayMs?: number;
  /** Popover placement relative to the trigger. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const DEFAULT_OPEN_DELAY_MS = 150;
const DEFAULT_CLOSE_DELAY_MS = 150;

export default function HelpHint({
  termId,
  title,
  definition,
  example,
  learnMoreUrl,
  triggerLabel,
  className,
  openDelayMs = DEFAULT_OPEN_DELAY_MS,
  closeDelayMs = DEFAULT_CLOSE_DELAY_MS,
  placement = 'bottom',
}: HelpHintProps) {
  const glossaryTerm = termId ? getTerm(termId) : undefined;

  const popoverTitle = title ?? glossaryTerm?.term ?? 'More information';
  const popoverDefinition = definition ?? glossaryTerm?.definition;
  const popoverExample = example ?? glossaryTerm?.example;
  const popoverLearnMoreUrl = learnMoreUrl ?? glossaryTerm?.learnMoreUrl;

  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByFocusRef = useRef(false);
  const ignoreNextFocusRef = useRef(false);

  const contentId = useId();
  const titleId = useId();

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    clearTimers();
    setIsOpen(true);
  }, [clearTimers]);

  const close = useCallback(() => {
    clearTimers();
    setIsOpen(false);
  }, [clearTimers]);

  const scheduleOpen = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (openTimerRef.current === null) {
      openTimerRef.current = setTimeout(open, openDelayMs);
    }
  }, [open, openDelayMs]);

  const scheduleClose = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current === null) {
      closeTimerRef.current = setTimeout(close, closeDelayMs);
    }
  }, [close, closeDelayMs]);

  /**
   * In browsers a click moves focus first (firing the focus-open handler)
   * and only then the click event. Track whether focus just opened the
   * popover so the accompanying click confirms instead of toggling closed.
   */
  const handleTriggerClick = useCallback(() => {
    clearTimers();
    if (openedByFocusRef.current) {
      openedByFocusRef.current = false;
      setIsOpen(true);
      return;
    }
    setIsOpen((prev) => !prev);
  }, [clearTimers]);

  const handleFocus = useCallback(() => {
    if (ignoreNextFocusRef.current) {
      ignoreNextFocusRef.current = false;
      return;
    }
    openedByFocusRef.current = true;
    open();
  }, [open]);

  // Close on Escape and outside pointer press; never move focus on open.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        ignoreNextFocusRef.current = true;
        close();
        triggerRef.current?.focus();
        setTimeout(() => {
          ignoreNextFocusRef.current = false;
        }, 0);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, close]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const triggerAriaLabel =
    triggerLabel ?? (glossaryTerm ? `Learn more about ${popoverTitle}` : `More information about ${popoverTitle}`);

  return (
    <span
      ref={wrapperRef}
      className={`help-hint help-hint--${placement}${className ? ` ${className}` : ''}`}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onFocus={handleFocus}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          close();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="help-hint__trigger"
        aria-label={triggerAriaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-describedby={contentId}
        onClick={handleTriggerClick}
      >
        <CircleHelp size={14} aria-hidden="true" />
      </button>

      <div
        id={contentId}
        role="region"
        aria-label={popoverTitle}
        aria-hidden={!isOpen}
        className="help-hint__popover"
        hidden={!isOpen}
      >
        <span id={titleId} className="help-hint__title">
          {popoverTitle}
        </span>
        {popoverDefinition && (
          <p className="help-hint__definition">{popoverDefinition}</p>
        )}
        {popoverExample && (
          <p className="help-hint__example">
            <span className="help-hint__example-label">Example</span>
            {popoverExample}
          </p>
        )}
        {popoverLearnMoreUrl && (
          <a
            className="help-hint__link"
            href={popoverLearnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        )}
      </div>
    </span>
  );
}
