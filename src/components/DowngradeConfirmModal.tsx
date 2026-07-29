/**
 * DowngradeConfirmModal
 *
 * Confirmation dialog for plan downgrades.  Shows the subscriber exactly what
 * they are giving up (lost features), the price delta, the effective date, and
 * requires an explicit acknowledgement checkbox before the action can proceed.
 *
 * Features
 * ─────────
 * • "You will lose" feature list with per-item icons
 * • Price-delta row (current → new, savings highlighted)
 * • Effective-date microcopy (immediate vs. end-of-cycle)
 * • Required acknowledgement checkbox (blocks confirm until checked)
 * • Link to full plan comparison page
 * • No-features-lost graceful fallback
 * • Full keyboard nav + focus trap via useModalFocus
 * • WCAG 2.1 AA: role=dialog, aria-modal, aria-labelledby/describedby,
 *   aria-live on confirm button, all icons aria-hidden, checkbox labelled
 * • Responsive: single-column on mobile
 * • RTL-safe layout
 * • Reduced-motion: animation suppressed
 */

import { useRef, useState, useEffect, MouseEvent } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X, ExternalLink, Info } from 'lucide-react';
import { useModalFocus } from '../hooks/useModalFocus';
import './DowngradeConfirmModal.css';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  /** Unique key for React rendering */
  id: string;
  /** Human-readable feature name */
  label: string;
}

export interface DowngradeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called when the user confirms the downgrade.
   * The parent is responsible for the API call.
   */
  onConfirm: () => void;

  /** Current (higher) plan name, e.g. "Pro" */
  currentPlanName: string;
  /** Current plan price string, e.g. "50 USDC / mo" */
  currentPlanPrice: string;

  /** Target (lower) plan name, e.g. "Basic" */
  newPlanName: string;
  /** New plan price string, e.g. "20 USDC / mo" */
  newPlanPrice: string;

  /**
   * Features the subscriber will lose.
   * Pass an empty array to render the "no-features-lost" variant.
   */
  lostFeatures: PlanFeature[];

  /**
   * When true the downgrade takes effect at the end of the current billing
   * period.  When false it is immediate.  Drives the effective-date microcopy.
   */
  isDelayed?: boolean;

  /**
   * Human-readable date the change takes effect.
   * E.g. "Aug 1, 2026" for a delayed downgrade, "Today" for immediate.
   * Falls back to a sensible default if omitted.
   */
  effectiveDate?: string;

  /** Optional URL to the full plan-comparison page */
  comparePlansHref?: string;

  /** True while the API call is in flight */
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DowngradeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlanName,
  currentPlanPrice,
  newPlanName,
  newPlanPrice,
  lostFeatures,
  isDelayed = true,
  effectiveDate,
  comparePlansHref = '/plans',
  isLoading = false,
}: DowngradeConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  const [acknowledged, setAcknowledged] = useState(false);

  // Reset checkbox each time the modal opens
  useEffect(() => {
    if (isOpen) setAcknowledged(false);
  }, [isOpen]);

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef });

  if (!isOpen) return null;

  const canConfirm = acknowledged && !isLoading;

  const resolvedEffectiveDate =
    effectiveDate ?? (isDelayed ? 'end of current billing period' : 'immediately');

  const effectiveDateNotice = isDelayed
    ? `Your plan will change to ${newPlanName} on ${resolvedEffectiveDate}. You keep full access until then.`
    : `Your plan changes to ${newPlanName} ${resolvedEffectiveDate}. Access to removed features ends now.`;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm();
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="downgrade-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="downgrade-modal-title"
      aria-describedby="downgrade-modal-desc"
    >
      <div className="downgrade-modal-content" ref={modalRef}>

        {/* ── Close ───────────────────────────────────────────────────── */}
        <button
          className="downgrade-close-btn"
          onClick={onClose}
          aria-label="Close downgrade dialog"
          disabled={isLoading}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* ── Icon header ─────────────────────────────────────────────── */}
        <div className="downgrade-icon-header" aria-hidden="true">
          <div className="downgrade-icon-circle">
            <AlertTriangle size={26} strokeWidth={2.2} />
          </div>
        </div>

        {/* ── Title ───────────────────────────────────────────────────── */}
        <h2 id="downgrade-modal-title" className="downgrade-title">
          Downgrade to {newPlanName}?
        </h2>
        <p id="downgrade-modal-desc" className="downgrade-description">
          Review what changes before confirming.
        </p>

        {/* ── Plan delta row ───────────────────────────────────────────── */}
        <div className="downgrade-plan-delta" aria-label="Plan price comparison">
          <div className="downgrade-plan-chip downgrade-plan-chip--current">
            <span className="downgrade-plan-chip__name">{currentPlanName}</span>
            <span className="downgrade-plan-chip__price">{currentPlanPrice}</span>
          </div>

          <span className="downgrade-plan-arrow" aria-hidden="true">
            <ArrowRight size={16} />
          </span>

          <div className="downgrade-plan-chip downgrade-plan-chip--new">
            <span className="downgrade-plan-chip__name">{newPlanName}</span>
            <span className="downgrade-plan-chip__price">{newPlanPrice}</span>
          </div>
        </div>

        {/* ── Features lost ───────────────────────────────────────────── */}
        <section
          className="downgrade-features-section"
          aria-labelledby="downgrade-features-heading"
        >
          <h3 id="downgrade-features-heading" className="downgrade-section-label">
            {lostFeatures.length > 0 ? 'You will lose access to' : 'Feature changes'}
          </h3>

          {lostFeatures.length === 0 ? (
            /* No-features-lost variant */
            <div className="downgrade-no-loss" role="status">
              <CheckCircle2 size={16} aria-hidden="true" />
              <p>No features will be removed with this downgrade.</p>
            </div>
          ) : (
            <ul className="downgrade-feature-list" aria-label="Features you will lose">
              {lostFeatures.map((feature) => (
                <li key={feature.id} className="downgrade-feature-item">
                  <span className="downgrade-feature-item__icon" aria-hidden="true">
                    <X size={13} strokeWidth={2.5} />
                  </span>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Effective date notice ────────────────────────────────────── */}
        <div
          className={`downgrade-effective-notice ${isDelayed ? 'downgrade-effective-notice--delayed' : 'downgrade-effective-notice--immediate'}`}
          role="note"
        >
          <Info size={14} aria-hidden="true" className="downgrade-effective-notice__icon" />
          <p>{effectiveDateNotice}</p>
        </div>

        {/* ── Compare plans link ───────────────────────────────────────── */}
        <a
          href={comparePlansHref}
          className="downgrade-compare-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          See full plan comparison
          <ExternalLink size={12} aria-hidden="true" />
          <span className="downgrade-sr-only"> (opens in new tab)</span>
        </a>

        {/* ── Acknowledgement checkbox ─────────────────────────────────── */}
        <label className="downgrade-ack-label" htmlFor="downgrade-ack-checkbox">
          <input
            ref={checkboxRef}
            id="downgrade-ack-checkbox"
            type="checkbox"
            className="downgrade-ack-checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            aria-describedby="downgrade-ack-hint"
            disabled={isLoading}
          />
          <span className="downgrade-ack-text">
            I understand I will lose the features listed above
            {isDelayed ? ' at the end of my current billing period' : ' immediately'}.
          </span>
        </label>
        <p id="downgrade-ack-hint" className="downgrade-ack-hint">
          You must confirm to proceed with the downgrade.
        </p>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="downgrade-actions">
          <button
            ref={initialFocusRef}
            className="downgrade-btn downgrade-btn--cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep current plan
          </button>

          <button
            className="downgrade-btn downgrade-btn--confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            aria-live="polite"
            aria-label={
              isLoading
                ? 'Processing downgrade, please wait'
                : !acknowledged
                ? 'Confirm downgrade (acknowledgement required)'
                : 'Confirm downgrade'
            }
          >
            {isLoading ? (
              <>
                <span className="downgrade-spinner" aria-hidden="true" />
                Processing…
              </>
            ) : (
              'Confirm downgrade'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
