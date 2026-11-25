import { AlertTriangle, RotateCcw } from 'lucide-react'
import styles from './ApiKeysSettings.module.css'
import type { ApiKey } from './useApiKeys'

interface ApiKeyRevokeDialogProps {
  keyToRevoke: ApiKey
  isOnlyKey: boolean
  confirmationText: string
  isRevokeConfirmed: boolean
  onConfirmationTextChange: (value: string) => void
  onCancel: () => void
  onRevoke: () => void
  onRotate: () => void
}

export default function ApiKeyRevokeDialog({
  keyToRevoke,
  isOnlyKey,
  confirmationText,
  isRevokeConfirmed,
  onConfirmationTextChange,
  onCancel,
  onRevoke,
  onRotate,
}: ApiKeyRevokeDialogProps) {
  return (
    <div
      role="dialog"
      aria-labelledby="revoke-modal-title"
      aria-describedby="revoke-modal-desc"
      className={styles.modalOverlay}
    >
      <div className={styles.revokeModalCard}>
        <div className={styles.modalHeaderRow}>
          <AlertTriangle size={24} className={styles.dangerIcon} />
          <h3 id="revoke-modal-title" className={styles.modalHeaderTitle}>
            Revoke API Key
          </h3>
        </div>

        <div id="revoke-modal-desc" className={styles.revokeDesc}>
          <p className={styles.revokeIntro}>
            Are you sure you want to revoke{' '}
            <strong>{keyToRevoke.name}</strong>? This action cannot be undone.
          </p>

          <div className={styles.consequencesBox}>
            <strong className={styles.consequencesTitle}>
              Consequences:
            </strong>
            <ul className={styles.consequencesList}>
              <li>
                Any applications or scripts using this key will immediately fail.
              </li>
              <li>
                You will not be able to view or restore this key again.
              </li>
              {isOnlyKey && (
                <li className={styles.onlyKeyWarning}>
                  This is your only active key. API access will be completely disabled.
                </li>
              )}
            </ul>
          </div>

          <div className={styles.fieldGroupCompact}>
            <label
              htmlFor="revoke-confirm-input"
              className={styles.fieldLabel}
            >
              Please type <strong>{keyToRevoke.name}</strong> to confirm.
            </label>

            <input
              id="revoke-confirm-input"
              type="text"
              dir="auto"
              value={confirmationText}
              onChange={(e) => onConfirmationTextChange(e.target.value)}
              placeholder={keyToRevoke.name}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isRevokeConfirmed}
            onClick={onRotate}
            className={styles.rotateButton}
          >
            <RotateCcw size={16} />
            Revoke &amp; Rotate
          </button>

          <button
            type="button"
            disabled={!isRevokeConfirmed}
            onClick={onRevoke}
            className={styles.revokeConfirmButton}
          >
            Revoke Key
          </button>
        </div>
      </div>
    </div>
  )
}
