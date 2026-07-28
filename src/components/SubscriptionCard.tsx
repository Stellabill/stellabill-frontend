import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './SubscriptionCard.css';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface SubscriptionData {
  id: string;
  planName: string;
  merchant: string;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  interval: string;
  prepaidBalance: number;
  coverage: number;
  nextChargeDate: string;
  icon?: string;
}

interface SubscriptionCardProps {
  subscription: SubscriptionData;
}

/**
 * Detects if the device likely supports hover (i.e. not a touch-primary device).
 * On touch devices we rely on click to toggle; on desktop we use hover-with-delay.
 */
function isHoverCapable(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Calculates the best popover position to avoid viewport overflow.
 * Returns 'bottom' | 'top' | 'left' | 'right'.
 */
function calcPopoverPosition(
  cardRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
): 'bottom' | 'top' | 'left' | 'right' {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const margin = 12;

  // Prefer bottom, then top, then right, then left
  const spaceBelow = viewportH - (cardRect.bottom + margin);
  const spaceAbove = cardRect.top - margin;
  const spaceRight = viewportW - (cardRect.right + margin);
  const spaceLeft = cardRect.left - margin;

  if (spaceBelow >= popoverHeight + 40) return 'bottom';
  if (spaceAbove >= popoverHeight + 40) return 'top';
  if (spaceRight >= popoverWidth + 20) return 'right';
  if (spaceLeft >= popoverWidth + 20) return 'left';
  // Fallback: whichever side has the most room
  const sides = [
    { pos: 'bottom' as const, space: spaceBelow },
    { pos: 'top' as const, space: spaceAbove },
    { pos: 'right' as const, space: spaceRight },
    { pos: 'left' as const, space: spaceLeft },
  ];
  sides.sort((a, b) => b.space - a.space);
  return sides[0].pos;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const {
    id,
    planName,
    merchant,
    status,
    price,
    currency,
    interval,
    prepaidBalance,
    coverage,
    nextChargeDate,
    icon
  } = subscription;

  /* ── Popover state ─────────────────────────────────────────── */
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom');

  const cardRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hoverCapable = isHoverCapable();

  /* ── Clear timers helper ───────────────────────────────────── */
  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  /* ── Open popover with optional delay ──────────────────────── */
  const openPopover = useCallback((delay = 0) => {
    clearTimers();
    if (delay > 0) {
      openTimerRef.current = setTimeout(() => {
        setIsPopoverOpen(true);
      }, delay);
    } else {
      setIsPopoverOpen(true);
    }
  }, [clearTimers]);

  /* ── Close popover with optional delay ─────────────────────── */
  const closePopover = useCallback((delay = 0) => {
    clearTimers();
    if (delay > 0) {
      closeTimerRef.current = setTimeout(() => {
        setIsPopoverOpen(false);
      }, delay);
    } else {
      setIsPopoverOpen(false);
    }
  }, [clearTimers]);

  /* ── Toggle popover on click (touch/mobile) ────────────────── */
  const togglePopover = useCallback(() => {
    clearTimers();
    setIsPopoverOpen(prev => !prev);
  }, [clearTimers]);

  /* ── Keyboard handlers ─────────────────────────────────────── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePopover();
    }
    if (e.key === 'Escape' && isPopoverOpen) {
      e.preventDefault();
      setIsPopoverOpen(false);
    }
  }, [togglePopover, isPopoverOpen]);

  /* ── Recalculate position whenever popover opens ───────────── */
  useEffect(() => {
    if (isPopoverOpen && cardRef.current) {
      // Give the DOM a chance to layout so we can measure the popover
      requestAnimationFrame(() => {
        if (popoverRef.current && cardRef.current) {
          const cardRect = cardRef.current.getBoundingClientRect();
          const popoverWidth = popoverRef.current.offsetWidth;
          const popoverHeight = popoverRef.current.offsetHeight;
          setPopoverPosition(calcPopoverPosition(cardRect, popoverWidth, popoverHeight));
        }
      });
    }
  }, [isPopoverOpen]);

  /* ── Click-outside to close ────────────────────────────────── */
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        cardRef.current &&
        !cardRef.current.contains(e.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    // Delay adding the listener to avoid the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  /* ── Close on Escape ───────────────────────────────────────── */
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPopoverOpen]);

  /* ── Cleanup timers on unmount ─────────────────────────────── */
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  /* ── Status config ─────────────────────────────────────────── */
  const statusConfig = {
    active: { label: 'Active', icon: '▲', className: 'active' },
    paused: { label: 'Paused', icon: '⏸', className: 'paused' },
    cancelled: { label: 'Cancelled', icon: '✕', className: 'cancelled' }
  };

  const currentStatus = statusConfig[status];

  /* ── Compute inline popover styles based on position ───────── */
  const getPopoverStyle = (): React.CSSProperties => {
    if (!cardRef.current) return {};
    const cardRect = cardRef.current.getBoundingClientRect();
    const gap = 8;

    switch (popoverPosition) {
      case 'bottom':
        return {
          top: cardRect.height + gap,
          left: 0,
          right: 'auto',
          bottom: 'auto',
          transformOrigin: 'top center',
        };
      case 'top':
        return {
          bottom: cardRect.height + gap,
          left: 0,
          right: 'auto',
          top: 'auto',
          transformOrigin: 'bottom center',
        };
      case 'right':
        return {
          left: cardRect.width + gap,
          top: 0,
          right: 'auto',
          bottom: 'auto',
          transformOrigin: 'left center',
        };
      case 'left':
        return {
          right: cardRect.width + gap,
          top: 0,
          left: 'auto',
          bottom: 'auto',
          transformOrigin: 'right center',
        };
      default:
        return { transformOrigin: 'top center' };
    }
  };

  return (
    <article
      className={`subscription-card${isPopoverOpen ? ' subscription-card--popover-open' : ''}`}
      ref={cardRef}
      aria-expanded={isPopoverOpen}
      aria-haspopup="dialog"
      tabIndex={0}
      onMouseEnter={() => {
        if (hoverCapable) openPopover(300);
      }}
      onMouseLeave={() => {
        if (hoverCapable) closePopover(200);
      }}
      onClick={() => {
        togglePopover();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="subscription-card-header">
        <div className="subscription-card-info">
          <div className="subscription-icon" role="img" aria-label={`${planName} icon`}>
            {icon || '📄'}
          </div>
          <div className="subscription-title-group">
            <h3 className="subscription-plan-name">{planName}</h3>
            <p className="subscription-merchant">{merchant}</p>
          </div>
        </div>
        <span className={`subscription-status-badge ${currentStatus.className}`}>
          <span className="status-icon" aria-hidden="true">{currentStatus.icon}</span>
          {currentStatus.label}
        </span>
      </div>

      <div className="subscription-pricing">
        <span className="subscription-price">{price} {currency}</span>
        <span className="subscription-interval"> / {interval}</span>
        <p className="subscription-id">ID: {id}</p>
      </div>

      <div className="subscription-details">
        <div className="subscription-detail-row">
          <span className="detail-icon" aria-hidden="true">💵</span>
          <span className="detail-label">Prepaid balance</span>
          <span className="detail-value">
            <span className="balance-pill">{prepaidBalance} {currency}</span>
          </span>
        </div>

        <div className="subscription-detail-row">
          <span className="detail-icon" aria-hidden="true">📊</span>
          <span className="detail-label">Coverage</span>
          <span className="detail-value">~{coverage} payments</span>
        </div>

        <div className="subscription-detail-row">
          <span className="detail-icon" aria-hidden="true">📅</span>
          <span className="detail-label">Next charge</span>
          <span className="detail-value">{nextChargeDate}</span>
        </div>
      </div>

      <div className="subscription-actions" onClick={(e) => e.stopPropagation()}>
        <Link to={`/subscriptions/${id}`}>
          <button className="manage-btn">
            Manage
          </button>
        </Link>
        <a
          href={`/subscriptions/${id}`}
          className="external-link-icon"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open subscription in new tab"
          onClick={(e) => e.stopPropagation()}
        >
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      {/* ── Quick-view popover ───────────────────────────────── */}
      {isPopoverOpen && (
        <div
          className={`subscription-popover subscription-popover--${popoverPosition}`}
          ref={popoverRef}
          role="dialog"
          aria-label={`Quick view for ${planName}`}
          aria-modal="false"
          onMouseEnter={() => {
            // Keep popover open when hovering over it
            if (hoverCapable) {
              clearTimers();
            }
          }}
          onMouseLeave={() => {
            if (hoverCapable) {
              closePopover(200);
            }
          }}
          style={getPopoverStyle()}
        >
          {/* Arrow indicator */}
          <div className="subscription-popover__arrow" aria-hidden="true" />

          {/* Key facts */}
          <div className="subscription-popover__body">
            <div className="subscription-popover__fact">
              <span className="subscription-popover__fact-icon" aria-hidden="true">📋</span>
              <span className="subscription-popover__fact-label">Plan</span>
              <span className="subscription-popover__fact-value">{planName}</span>
            </div>

            <div className="subscription-popover__fact">
              <span className="subscription-popover__fact-icon" aria-hidden="true">📌</span>
              <span className="subscription-popover__fact-label">Status</span>
              <span className={`subscription-popover__fact-value subscription-popover__status--${currentStatus.className}`}>
                {currentStatus.label}
              </span>
            </div>

            <div className="subscription-popover__fact">
              <span className="subscription-popover__fact-icon" aria-hidden="true">📅</span>
              <span className="subscription-popover__fact-label">Next charge</span>
              <span className="subscription-popover__fact-value">{nextChargeDate}</span>
            </div>
          </div>

          {/* View details CTA */}
          <div className="subscription-popover__footer">
            <Link
              to={`/subscriptions/${id}`}
              className="subscription-popover__cta"
              onClick={(e) => e.stopPropagation()}
            >
              View details
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="subscription-popover__cta-arrow"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
