import { useState } from 'react'
import type { FormEvent } from 'react'
import { Key } from 'lucide-react'
import { AVAILABLE_SCOPES } from './useApiKeys'
import styles from './ApiKeysSettings.module.css'

interface CreateApiKeyDialogProps {
  onCreate: (name: string, scopes: string[], expiry: string) => void
  onClose: () => void
}

interface FormErrors {
  name?: string
  scopes?: string
  expiry?: string
}

export default function CreateApiKeyDialog({
  onCreate,
  onClose,
}: CreateApiKeyDialogProps) {
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([])
  const [newKeyExpiry, setNewKeyExpiry] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const errors: FormErrors = {}

    if (!newKeyName.trim()) {
      errors.name = 'Key name is required'
    }

    if (newKeyScopes.length === 0) {
      errors.scopes = 'At least one scope must be selected'
    }

    if (newKeyExpiry) {
      const parts = newKeyExpiry.split('-')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (parts.length === 3) {
        const expDate = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        )

        if (isNaN(expDate.getTime()) || expDate <= today) {
          errors.expiry = 'Expiry date must be in the future'
        }
      } else {
        const expDate = new Date(newKeyExpiry)

        if (isNaN(expDate.getTime()) || expDate <= today) {
          errors.expiry = 'Expiry date must be in the future'
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    onCreate(newKeyName.trim(), newKeyScopes, newKeyExpiry)
  }

  return (
    <div
      role="dialog"
      aria-labelledby="create-modal-title"
      className={styles.modalOverlay}
    >
      <div className={styles.modalCard}>
        <h3
          id="create-modal-title"
          className={styles.modalTitle}
        >
          Create API Key
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label
              htmlFor="create-key-name"
              className={styles.fieldLabel}
            >
              Key Name <span className={styles.requiredMark}>*</span>
            </label>

            <input
              id="create-key-name"
              type="text"
              value={newKeyName}
              onChange={(e) => {
                setNewKeyName(e.target.value)
                if (formErrors.name) {
                  setFormErrors(prev => ({ ...prev, name: undefined }))
                }
              }}
              placeholder="e.g. Production Backend"
              className={[
                styles.input,
                formErrors.name ? styles.inputError : '',
              ].filter(Boolean).join(' ')}
            />

            {formErrors.name && (
              <div role="alert" className={styles.errorText}>
                {formErrors.name}
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Scopes <span className={styles.requiredMark}>*</span>
            </label>

            <div className={styles.scopesCheckboxGroup}>
              {AVAILABLE_SCOPES.map((scope) => (
                <label
                  key={scope}
                  htmlFor={'scope-' + scope}
                  className={styles.checkboxLabel}
                >
                  <input
                    id={'scope-' + scope}
                    type="checkbox"
                    checked={newKeyScopes.includes(scope)}
                    onChange={(e) => {
                      const checked = e.target.checked

                      setNewKeyScopes(prev =>
                        checked
                          ? [...prev, scope]
                          : prev.filter(s => s !== scope)
                      )

                      if (formErrors.scopes) {
                        setFormErrors(prev => ({
                          ...prev,
                          scopes: undefined,
                        }))
                      }
                    }}
                    className={styles.checkbox}
                  />

                  <span className={styles.scopeLabelText}>
                    {scope}
                  </span>
                </label>
              ))}
            </div>

            {formErrors.scopes && (
              <div role="alert" className={styles.errorText}>
                {formErrors.scopes}
              </div>
            )}
          </div>

          <div className={styles.fieldGroupLast}>
            <label
              htmlFor="create-key-expiry"
              className={styles.fieldLabel}
            >
              Expiry Date (optional)
              </label>

            <input
              id="create-key-expiry"
              type="date"
              value={newKeyExpiry}
              onChange={(e) => {
                setNewKeyExpiry(e.target.value)
                if (formErrors.expiry) {
                  setFormErrors(prev => ({
                    ...prev,
                    expiry: undefined,
                  }))
                }
              }}
              className={[
                styles.input,
                formErrors.expiry ? styles.inputError : '',
              ].filter(Boolean).join(' ')}
            />

            {formErrors.expiry && (
              <div role="alert" className={styles.errorText}>
                {formErrors.expiry}
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.primaryButton}
            >
              <Key size={16} />
              Create Key
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
