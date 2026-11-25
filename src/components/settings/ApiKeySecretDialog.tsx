import { Key, Copy } from 'lucide-react'
import styles from './ApiKeysSettings.module.css'

interface ApiKeySecretDialogProps {
  secretModal: string
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
      <div className={styles.modalCard}>
        <div className={styles.secretHeader}>
          <div className={styles.secretIcon}>
            <Key size={24} />
          </div>

          <h3
            id="secret-modal-title"
            className={styles.modalTitle}
          >
            API Key Created Successfully
          </h3>

          <p className={styles.secretWarning}>
            Copy your API key now. You won't be able to see it again.
          </p>
        </div>

        <div className={styles.secretKeyContainer}>
          <code className={styles.secretKey}>
            {secretModal}
          </code>

          <button
            type="button"
            onClick={onCopy}
            className={styles.copyButton}
            aria-label="Copy secret key"
          >
            <Copy size={16} />
            {copiedSecret ? 'Copied!' : 'Copy'}
          </button>
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
