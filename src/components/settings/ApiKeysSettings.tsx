import { useEffect, useRef, useState } from 'react'
import { Key, Plus, Copy, RotateCcw, Trash2, AlertTriangle, Shield, Calendar, User, Check } from 'lucide-react'
import { defaultGenerateApiKey, maskApiKey } from '../../utils/apiKey'
import styles from './ApiKeysSettings.module.css'

export interface ApiKey {
  id: string
  name: string
  key: string
  scopes: string[]
  createdAt: string
  createdBy: string
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
}

export interface ApiKeysSettingsProps {
  generateApiKey?: () => string
}

const AVAILABLE_SCOPES = ['read', 'write', 'admin'] as const

export default function ApiKeysSettings({
  generateApiKey = defaultGenerateApiKey,
}: ApiKeysSettingsProps = {}) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_••••••••••••••••3a8f',
      scopes: ['read', 'write', 'admin'],
      createdAt: '2024-01-15',
      createdBy: 'alice@example.com',
      lastUsed: '2024-03-28',
      isActive: true,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_••••••••••••••••5b2c',
      scopes: ['read', 'write'],
      createdAt: '2024-02-01',
      createdBy: 'bob@example.com',
      lastUsed: '2024-03-27',
      expiresAt: '2024-06-01',
      isActive: true,
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([])
  const [newKeyExpiry, setNewKeyExpiry] = useState('')
  const [formErrors, setFormErrors] = useState<{ name?: string; scopes?: string; expiry?: string }>({})

  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState<string | null>(null)
  const [revokeConfirmationText, setRevokeConfirmationText] = useState('')

  const [showSecretModal, setShowSecretModal] = useState<{
    title: string
    keyName: string
    secret: string
  } | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const [copyFeedback, setCopyFeedback] = useState<{ keyId: string; success: boolean } | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revokeTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const revokeConfirmInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const copyToClipboard = (text: string): boolean => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
      return true
    }
    return false
  }

  const handleCopyKey = (keyId: string, text: string) => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    setCopyFeedback({ keyId, success: copyToClipboard(text) })
    copyTimerRef.current = setTimeout(() => {
      setCopyFeedback(null)
      copyTimerRef.current = null
    }, 2000)
  }

  const resetCreateForm = () => {
    setNewKeyName('')
    setNewKeyScopes([])
    setNewKeyExpiry('')
    setFormErrors({})
  }

  const handleCloseCreateModal = () => {
    resetCreateForm()
    setShowCreateModal(false)
  }

  const handleCreateKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const errors: { name?: string; scopes?: string; expiry?: string } = {}
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
        const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
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

    const secret = generateApiKey()
    const masked = maskApiKey(secret)

    const newKey: ApiKey = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: newKeyName.trim(),
      key: masked,
      scopes: [...newKeyScopes],
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'alice@example.com',
      expiresAt: newKeyExpiry || undefined,
      isActive: true,
    }

    setApiKeys((prev) => [newKey, ...prev])
    handleCloseCreateModal()

    setShowSecretModal({
      title: 'API Key Created',
      keyName: newKey.name,
      secret,
    })
  }

  const handleRevokeKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId))
    setShowRevokeConfirmation(null)
    setRevokeConfirmationText('')
  }

  const handleRevokeAndRotateKey = (keyId: string) => {
    const keyToRotate = apiKeys.find((k) => k.id === keyId)
    if (!keyToRotate) return

    const newSecret = generateApiKey()
    const masked = maskApiKey(newSecret)

    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === keyId
          ? {
              ...k,
              key: masked,
              createdAt: new Date().toISOString().split('T')[0],
              lastUsed: undefined,
            }
          : k
      )
    )
    setShowRevokeConfirmation(null)
    setRevokeConfirmationText('')

    setShowSecretModal({
      title: 'API Key Rotated',
      keyName: keyToRotate.name,
      secret: newSecret,
    })
  }

  const activeKeysCount = apiKeys.filter((k) => k.isActive).length
  const keyToRevoke = apiKeys.find((k) => k.id === showRevokeConfirmation)
  const isOnlyKey = activeKeysCount === 1 && keyToRevoke?.isActive
  const isRevokeConfirmed = revokeConfirmationText.trim() === keyToRevoke?.name

  return (
    <div>
      <div
        role="status"
        aria-live="polite"
        className={styles.srOnly}
      >
        {copyFeedback
          ? copyFeedback.success
            ? 'API key copied to clipboard'
            : 'Copy failed — select and copy manually'
          : ''}
      </div>
      <div className={styles.header}>
        <h2 className={styles.title}>
          API Keys & Security
        </h2>
        <p className={styles.subtitle}>
          Manage API keys, tokens, and security settings for your organization
        </p>
      </div>

      {/* Security Notice */}
      <div className={styles.noticeCard}>
        <div className={styles.noticeInner}>
          <Shield size={20} className={styles.noticeIcon} />
          <div>
            <h4 className={styles.noticeTitle}>
              Security Best Practices
            </h4>
            <ul className={styles.noticeList}>
              <li>Never share your API keys publicly or commit them to version control</li>
              <li>Use environment variables to store keys in your applications</li>
              <li>Regularly rotate keys and remove unused ones</li>
              <li>Grant minimum required scopes for each key</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Keys Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <Key size={20} className={styles.sectionIcon} />
          <h3 className={styles.sectionTitle}>
            API Keys
          </h3>
          <span className={styles.countBadge}>
            {apiKeys.length} keys
          </span>
        </div>
        <button
          onClick={() => {
            resetCreateForm()
            setShowCreateModal(true)
          }}
          className={styles.createTriggerButton}
        >
          <Plus size={14} />
          Create API Key
        </button>
      </div>

      {/* API Keys Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeadRow}>
              <th className={styles.tableHeadCell}>Key Name</th>
              <th className={styles.tableHeadCell}>Secret Key</th>
              <th className={styles.tableHeadCell}>Scopes</th>
              <th className={styles.tableHeadCell}>Metadata</th>
              <th className={styles.tableHeadCellRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr
                key={key.id}
                className={styles.tableRow}
              >
                <td className={styles.tableCell}>
                  <div className={styles.keyNameRow}>
                    <span className={styles.keyName}>{key.name}</span>
                    {key.isActive ? (
                      <span className={[styles.statusBadge, styles.statusActive].join(' ')}>Active</span>
                    ) : (
                      <span className={[styles.statusBadge, styles.statusInactive].join(' ')}>Inactive</span>
                    )}
                  </div>
                  <div className={styles.createdAt}>
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </td>

                <td className={styles.tableCell}>
                  <div className={styles.secretBox}>
                    {key.key}
                  </div>
                  <div className={styles.copyRow}>
                    <button
                      onClick={() => handleCopyKey(key.id, key.key)}
                      className={styles.copyButton}
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                    {copyFeedback?.keyId === key.id && (
                      <span
                        className={[
                          styles.copyFeedback,
                          copyFeedback.success ? styles.copySuccess : styles.copyError,
                        ].join(' ')}
                      >
                        {copyFeedback.success ? 'Copied!' : 'Copy failed — select and copy manually'}
                      </span>
                    )}
                  </div>
                </td>

                <td className={styles.tableCell}>
                  <div className={styles.scopesList}>
                    {key.scopes.map((scope) => (
                      <span
                        key={scope}
                        className={[
                          styles.scopeBadge,
                          scope === 'admin'
                            ? styles.scopeAdmin
                            : scope === 'write'
                              ? styles.scopeWrite
                              : styles.scopeRead,
                        ].join(' ')}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </td>

                <td className={styles.tableCell}>
                  <div className={styles.metadataList}>
                    <div className={styles.metadataItem}>
                      <User size={12} /> <span>{key.createdBy}</span>
                    </div>
                    {key.lastUsed ? (
                      <div className={styles.metadataItem}>
                        <Calendar size={12} /> <span>Used {new Date(key.lastUsed).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <div className={styles.metadataMuted}>
                        <Calendar size={12} /> <span>Never used</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className={styles.tableCellRight}>
                  <button
                    ref={(el) => { if (el) revokeTriggerRefs.current.set(key.id, el) }}
                    onClick={() => setShowRevokeConfirmation(key.id)}
                    className={styles.revokeButton}
                  >
                    <Trash2 size={12} />
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {apiKeys.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  No API keys found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
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

            <form onSubmit={handleCreateKey} noValidate>
              {/* Key Name Input */}
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
                      setFormErrors((prev) => ({ ...prev, name: undefined }))
                    }
                  }}
                  placeholder="e.g. Production Backend"
                  className={[styles.input, formErrors.name ? styles.inputError : ''].filter(Boolean).join(' ')}
                />
                {formErrors.name && (
                  <div role="alert" className={styles.errorText}>
                    {formErrors.name}
                  </div>
                )}
              </div>

              {/* Scopes Checkboxes */}
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
                          setNewKeyScopes((prev) =>
                            checked ? [...prev, scope] : prev.filter((s) => s !== scope)
                          )
                          if (formErrors.scopes) {
                            setFormErrors((prev) => ({ ...prev, scopes: undefined }))
                          }
                        }}
                        className={styles.checkbox}
                      />
                      <span className={styles.scopeLabelText}>{scope}</span>
                    </label>
                  ))}
                </div>
                {formErrors.scopes && (
                  <div role="alert" className={styles.errorText}>
                    {formErrors.scopes}
                  </div>
                )}
              </div>

              {/* Expiry Date (Optional) */}
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
                      setFormErrors((prev) => ({ ...prev, expiry: undefined }))
                    }
                  }}
                  className={[styles.input, formErrors.expiry ? styles.inputError : ''].filter(Boolean).join(' ')}
                />
                {formErrors.expiry && (
                  <div role="alert" className={styles.errorText}>
                    {formErrors.expiry}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
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
      )}

      {/* Show-Once Secret Key Panel */}
      {showSecretModal && (
        <div
          role="dialog"
          aria-labelledby="secret-modal-title"
          className={styles.modalOverlay}
        >
          <div className={styles.secretModalCard}>
            <div className={styles.modalHeaderRow}>
              <Shield size={24} className={styles.successIcon} />
              <h3 id="secret-modal-title" className={styles.modalHeaderTitle}>
                {showSecretModal.title}
              </h3>
            </div>

            {/* Prominent warning notice */}
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
                Secret Key for <strong>{showSecretModal.keyName}</strong>
              </label>
              <div className={styles.secretInputRow}>
                <input
                  id="generated-secret-key"
                  type="text"
                  readOnly
                  value={showSecretModal.secret}
                  className={styles.secretInput}
                />
                <button
                  type="button"
                  aria-label="Copy secret key"
                  onClick={() => {
                    copyToClipboard(showSecretModal.secret)
                    setCopiedSecret(true)
                    setTimeout(() => setCopiedSecret(false), 2000)
                  }}
                  className={styles.copySecretButton}
                >
                  {copiedSecret ? <Check size={16} className={styles.successIcon} /> : <Copy size={16} />}
                  {copiedSecret ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setShowSecretModal(null)
                  setCopiedSecret(false)
                }}
                className={styles.primaryButton}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirmation && keyToRevoke && (
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
                Are you sure you want to revoke <strong>{keyToRevoke.name}</strong>? This action cannot be undone.
              </p>

              <div className={styles.consequencesBox}>
                <strong className={styles.consequencesTitle}>Consequences:</strong>
                <ul className={styles.consequencesList}>
                  <li>Any applications or scripts using this key will immediately fail.</li>
                  <li>You will not be able to view or restore this key again.</li>
                  {isOnlyKey && (
                    <li className={styles.onlyKeyWarning}>This is your only active key. API access will be completely disabled.</li>
                  )}
                </ul>
              </div>

              <div className={styles.fieldGroupCompact}>
                <label htmlFor="revoke-confirm-input" className={styles.fieldLabel}>
                  Please type <strong>{keyToRevoke.name}</strong> to confirm.
                </label>
                <input
                  id="revoke-confirm-input"
                  ref={revokeConfirmInputRef}
                  type="text"
                  dir="auto"
                  value={revokeConfirmationText}
                  onChange={(e) => setRevokeConfirmationText(e.target.value)}
                  placeholder={keyToRevoke.name}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowRevokeConfirmation(null)
                  setRevokeConfirmationText('')
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                disabled={!isRevokeConfirmed}
                onClick={() => handleRevokeAndRotateKey(keyToRevoke.id)}
                className={styles.rotateButton}
              >
                <RotateCcw size={16} />
                Revoke & Rotate
              </button>

              <button
                disabled={!isRevokeConfirmed}
                onClick={() => handleRevokeKey(keyToRevoke.id)}
                className={styles.revokeConfirmButton}
              >
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
