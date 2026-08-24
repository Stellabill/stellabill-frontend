import React, { useRef, useState, useEffect, useId } from 'react';
import { X, Link, Check, Copy } from 'lucide-react';
import { useModalFocus } from '@/hooks/useModalFocus';
import './ShareURLModal.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShareURLModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  viewName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareURLModal({ isOpen, onClose, url, viewName }: ShareURLModalProps) {
  const [copied, setCopied] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);

  const titleId = useId();
  const descId = useId();

  // Focus trap + escape + restoration (focus copy button on open)
  useModalFocus(modalRef, {
    isOpen,
    onClose,
    initialFocusRef: copyBtnRef as React.RefObject<HTMLElement>,
  });

  // Reset copy state when modal opens
  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  // ── Copy handler ─────────────────────────────────────────────────────────

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
      const input = modalRef.current?.querySelector<HTMLInputElement>('.sum__url-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  function handleInputClick(e: React.MouseEvent<HTMLInputElement>) {
    e.currentTarget.select();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div
      className="sum__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={modalRef} className="sum__panel">
        {/* Header */}
        <div className="sum__header">
          <div className="sum__header-title-row">
            <Link size={16} className="sum__header-icon" aria-hidden="true" />
            <h2 id={titleId} className="sum__title">Share view</h2>
          </div>
          <button
            type="button"
            className="sum__close-btn"
            aria-label="Close share modal"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="sum__body">
          <p id={descId} className="sum__description">
            Share a link to the <strong className="sum__view-name">{viewName}</strong> view.
            Anyone with the link can see the same filters.
          </p>

          <div className="sum__url-row">
            <input
              type="text"
              readOnly
              value={url}
              className="sum__url-input"
              aria-label={`Share URL for view: ${viewName}`}
              onClick={handleInputClick}
            />
            <button
              ref={copyBtnRef}
              type="button"
              className={`sum__copy-btn${copied ? ' sum__copy-btn--copied' : ''}`}
              aria-label={copied ? 'URL copied to clipboard' : 'Copy URL to clipboard'}
              aria-live="polite"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={15} aria-hidden="true" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={15} aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sum__footer">
          <button
            type="button"
            className="sum__done-btn"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareURLModal;
