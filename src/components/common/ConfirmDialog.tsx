import { useEffect, useId, useRef, useState, ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Modal from './Modal'
import './ConfirmDialog.css'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: ReactNode
  consequences?: string[]
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  isLoading?: boolean
  destructive?: boolean
  confirmPhrase?: string
  closeOnOverlayClick?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  consequences,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingLabel,
  isLoading = false,
  destructive = true,
  confirmPhrase,
  closeOnOverlayClick = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const [phraseInput, setPhraseInput] = useState('')
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) {
      setPhraseInput('')
    }
  }, [isOpen])

  const phraseRequired = Boolean(confirmPhrase && confirmPhrase.length > 0)
  const phraseSatisfied = !phraseRequired || phraseInput.trim() === confirmPhrase
  const confirmDisabled = isLoading || !phraseSatisfied

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      unstyled
      role="alertdialog"
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
      initialFocusRef={cancelBtnRef}
      closeOnBackdrop={closeOnOverlayClick && !isLoading}
      closeOnEscape={!isLoading}
      busy={isLoading}
      overlayTestId="confirm-dialog-overlay"
      contentClassName={`confirm-dialog${destructive ? ' confirm-dialog--destructive' : ''}`}
    >
        <div className="confirm-dialog__header">
          {destructive && (
            <div className="confirm-dialog__icon" aria-hidden="true">
              <AlertTriangle size={20} />
            </div>
          )}
          <h2 id={titleId} className="confirm-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="confirm-dialog__close"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="confirm-dialog__body">
          {description && (
            <p id={descriptionId} className="confirm-dialog__description">
              {description}
            </p>
          )}

          {consequences && consequences.length > 0 && (
            <ul className="confirm-dialog__consequences" aria-label="Consequences">
              {consequences.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}

          {phraseRequired && (
            <div className="confirm-dialog__confirm-prompt">
              <label
                htmlFor={`${titleId}-phrase`}
                className="confirm-dialog__confirm-prompt-label"
              >
                Type <strong>{confirmPhrase}</strong> to confirm
              </label>
              <input
                id={`${titleId}-phrase`}
                type="text"
                value={phraseInput}
                onChange={(e) => setPhraseInput(e.target.value)}
                disabled={isLoading}
                className="confirm-dialog__confirm-prompt-input"
                placeholder={confirmPhrase}
                autoComplete="off"
                aria-required="true"
              />
            </div>
          )}
        </div>

        <div className="confirm-dialog__footer">
          <button
            ref={cancelBtnRef}
            type="button"
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
            onClick={onClose}
            disabled={isLoading}
            data-confirm-dialog-initial-focus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-dialog__btn confirm-dialog__btn--confirm"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {isLoading ? loadingLabel ?? `${confirmLabel}...` : confirmLabel}
          </button>
        </div>
    </Modal>
  )
}
