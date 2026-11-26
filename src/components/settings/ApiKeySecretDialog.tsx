
import { Shield, AlertTriangle, Copy, Check } from 'lucide-react'
import styles from './ApiKeysSettings.module.css'

interface ApiKeySecretDialogProps {
  secretModal: {
    title: string
    keyName: string
    secret: string
  }
  copiedSecret: boolean
  onCopy: () => void
  onClose: () => void
}

export default function ApiKeySecretDialog({
  secretModal,
  copiedSecret,
  onCopy,
  onClose,
}: ApiKeySecretDialogProps) {
  return (
    <div
      role="dialog"
      aria-labelledby="secret-modal-title"
      className={styles.modalOverlay}
    >
      <div className={styles.secretModalCard}>
        <div className={styles.modalHeaderRow}>
          <Shield size={24} className={styles.successIcon} />
          <h3 id="secret-modal-title" className={styles.modalHeaderTitle}>
            {secretModal.title}
          </h3>
        </div>

        <div className={styles.warningBanner}>
          <AlertTriangle size={18} className={styles.warningIcon} />
          <div className={styles.warningBody}>
            <strong className={styles.warningHeading}>
              {"Copy now — you won't see it again"}
            </strong>
            {"Please copy and store this API key in a secure location. For your security, this full key will not be shown again."}
          </div>
        </div>

        <div className={styles.fieldGroupLast}>
          <label
            htmlFor="generated-secret-key"
            className={styles.fieldLabelMuted}
          >
            Secret Key for <strong>{secretModal.keyName}</strong>
          </label>

          <div className={styles.secretInputRow}>
            <input
              id="generated-secret-key"
              type="text"
              readOnly
              value={secretModal.secret}
              className={styles.secretInput}
            />

            <button
              type="button"
              aria-label="Copy secret key"
              onClick={onCopy}
              className={styles.copySecretButton}
            >
              {copiedSecret
                ? <Check size={16} className={styles.successIcon} />
                : <Copy size={16} />}
              {copiedSecret ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.primaryButton}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
