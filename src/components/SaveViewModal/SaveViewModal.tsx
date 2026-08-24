import React, { useRef, useState, useEffect, useId, useCallback } from 'react';
import { X } from 'lucide-react';
import { useModalFocus } from '@/hooks/useModalFocus';
import './SaveViewModal.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SaveViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  mode: 'save' | 'rename';
  initialName?: string;
  existingNames?: string[]; // for duplicate name validation
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NAME_LENGTH = 50;

// ─── Component ────────────────────────────────────────────────────────────────

export function SaveViewModal({
  isOpen,
  onClose,
  onSave,
  mode,
  initialName = '',
  existingNames = [],
}: SaveViewModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const titleId = useId();
  const descId = useId();
  const errorId = useId();

  // Use the project's modal focus hook (focus trap, escape, restore)
  useModalFocus(modalRef, {
    isOpen,
    onClose,
    initialFocusRef: inputRef as React.RefObject<HTMLElement>,
  });

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(mode === 'rename' ? (initialName ?? '') : '');
      setError(null);
      setHasSubmitted(false);
    }
  }, [isOpen, mode, initialName]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = useCallback(
    (value: string): string | null => {
      const trimmed = value.trim();
      if (!trimmed) return 'Name is required';
      // On rename, skip duplicate check against the original name
      const names = mode === 'rename'
        ? existingNames.filter((n) => n !== initialName)
        : existingNames;
      if (names.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
        return 'A view with this name already exists';
      }
      return null;
    },
    [existingNames, mode, initialName],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.length > MAX_NAME_LENGTH) return;
    setName(val);
    if (hasSubmitted) {
      setError(validate(val));
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setHasSubmitted(true);
    const err = validate(name);
    if (err) {
      setError(err);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onSave(name.trim());
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const title = mode === 'save' ? 'Save view' : 'Rename view';
  const hasError = hasSubmitted && error !== null;

  return (
    <div
      className="svm__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={modalRef} className="svm__panel">
        {/* Header */}
        <div className="svm__header">
          <h2 id={titleId} className="svm__title">{title}</h2>
          <button
            type="button"
            className="svm__close-btn"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form className="svm__body" onSubmit={handleSubmit} noValidate>
          <p id={descId} className="svm__description">
            {mode === 'save'
              ? 'Name this view to save your current filters for quick access.'
              : 'Enter a new name for this view.'}
          </p>

          <div className="svm__field">
            <label htmlFor={`${titleId}-input`} className="svm__label">
              View name
            </label>
            <input
              ref={inputRef}
              id={`${titleId}-input`}
              type="text"
              className={`svm__input${hasError ? ' svm__input--error' : ''}`}
              value={name}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'save' ? 'e.g. Active this month' : 'View name'}
              maxLength={MAX_NAME_LENGTH}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={hasError ? errorId : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            <div className="svm__input-footer">
              {hasError && error ? (
                <span id={errorId} className="svm__error" role="alert">
                  {error}
                </span>
              ) : (
                <span />
              )}
              <span
                className="svm__char-count"
                aria-live="polite"
                aria-label={`${name.length} of ${MAX_NAME_LENGTH} characters used`}
              >
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="svm__footer">
            <button
              type="button"
              className="svm__btn svm__btn--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="svm__btn svm__btn--save"
              aria-label={mode === 'save' ? 'Save view' : 'Rename view'}
            >
              {mode === 'save' ? 'Save view' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SaveViewModal;
