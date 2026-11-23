import { useEffect, useRef, useState } from 'react'
import { Key, Plus, Copy, RotateCcw, Trash2, AlertTriangle, Shield, Calendar, User, Check } from 'lucide-react'
import { defaultGenerateApiKey, maskApiKey } from '../../utils/apiKey'

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
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {copyFeedback
          ? copyFeedback.success
            ? 'API key copied to clipboard'
            : 'Copy failed — select and copy manually'
          : ''}
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
          API Keys & Security
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Manage API keys, tokens, and security settings for your organization
        </p>
      </div>

      {/* Security Notice */}
      <div style={{ background: '#1e293b', borderRadius: '6px', padding: '1rem', marginBottom: '2rem', border: '1px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Shield size={20} style={{ color: '#3b82f6', marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>
              Security Best Practices
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.5' }}>
              <li>Never share your API keys publicly or commit them to version control</li>
              <li>Use environment variables to store keys in your applications</li>
              <li>Regularly rotate keys and remove unused ones</li>
              <li>Grant minimum required scopes for each key</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Keys Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Key size={20} style={{ color: '#67d5f0' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
            API Keys
          </h3>
          <span style={{ background: '#2d2d44', color: '#94a3b8', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            {apiKeys.length} keys
          </span>
        </div>
        <button
          onClick={() => {
            resetCreateForm()
            setShowCreateModal(true)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid #2d2d44',
            background: 'transparent',
            color: '#e2e8f0',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Create API Key
        </button>
      </div>

      {/* API Keys Table */}
      <div style={{ background: '#0a0a0a', borderRadius: '6px', border: '1px solid #2d2d44', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2d2d44', background: '#1a1a2e' }}>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>Key Name</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>Secret Key</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>Scopes</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>Metadata</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key, index) => (
              <tr
                key={key.id}
                style={{
                  borderBottom: index < apiKeys.length - 1 ? '1px solid #2d2d44' : 'none',
                }}
              >
                <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>{key.name}</span>
                    {key.isActive ? (
                      <span style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>Active</span>
                    ) : (
                      <span style={{ background: '#64748b', color: '#fff', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>Inactive</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </td>

                <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#e2e8f0',
                    background: '#1a1a1a',
                    padding: '0.375rem 0.5rem',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}>
                    {key.key}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleCopyKey(key.id, key.key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#67d5f0',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                    {copyFeedback?.keyId === key.id && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: copyFeedback.success ? '#10b981' : '#ef4444',
                        }}
                      >
                        {copyFeedback.success ? 'Copied!' : 'Copy failed — select and copy manually'}
                      </span>
                    )}
                  </div>
                </td>

                <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {key.scopes.map((scope) => (
                      <span
                        key={scope}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background:
                            scope === 'admin' ? '#dc2626' :
                            scope === 'write' ? '#2563eb' : '#64748b',
                          color: '#fff',
                        }}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </td>

                <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <User size={12} /> <span>{key.createdBy}</span>
                    </div>
                    {key.lastUsed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={12} /> <span>Used {new Date(key.lastUsed).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}>
                        <Calendar size={12} /> <span>Never used</span>
                      </div>
                    )}
                  </div>
                </td>

                <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                  <button
                    ref={(el) => { if (el) revokeTriggerRefs.current.set(key.id, el) }}
                    onClick={() => setShowRevokeConfirmation(key.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #dc2626',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {apiKeys.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '520px',
              width: '90%',
              border: '1px solid #2d2d44',
            }}
          >
            <h3
              id="create-modal-title"
              style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0' }}
            >
              Create API Key
            </h3>

            <form onSubmit={handleCreateKey} noValidate>
              {/* Key Name Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="create-key-name"
                  style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}
                >
                  Key Name <span style={{ color: '#ef4444' }}>*</span>
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
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid ' + (formErrors.name ? '#ef4444' : '#2d2d44'),
                    background: '#0a0a0a',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
                {formErrors.name && (
                  <div role="alert" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>
                    {formErrors.name}
                  </div>
                )}
              </div>

              {/* Scopes Checkboxes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}>
                  Scopes <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      htmlFor={'scope-' + scope}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#e2e8f0',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
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
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{scope}</span>
                    </label>
                  ))}
                </div>
                {formErrors.scopes && (
                  <div role="alert" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>
                    {formErrors.scopes}
                  </div>
                )}
              </div>

              {/* Expiry Date (Optional) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="create-key-expiry"
                  style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}
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
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid ' + (formErrors.expiry ? '#ef4444' : '#2d2d44'),
                    background: '#0a0a0a',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
                {formErrors.expiry && (
                  <div role="alert" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>
                    {formErrors.expiry}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: '1px solid #2d2d44',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '550px',
              width: '90%',
              border: '1px solid #2d2d44',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Shield size={24} style={{ color: '#10b981' }} />
              <h3 id="secret-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0' }}>
                {showSecretModal.title}
              </h3>
            </div>

            {/* Prominent warning notice */}
            <div
              style={{
                background: '#241a08',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '0.875rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <AlertTriangle size={18} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.875rem', color: '#fef3c7', lineHeight: '1.4' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#fbbf24' }}>
                  {"Copy now — you won't see it again"}
                </strong>
                {"Please copy and store this API key in a secure location. For your security, this full key will not be shown again."}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="generated-secret-key"
                style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}
              >
                Secret Key for <strong>{showSecretModal.keyName}</strong>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="generated-secret-key"
                  type="text"
                  readOnly
                  value={showSecretModal.secret}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #2d2d44',
                    background: '#0a0a0a',
                    color: '#67d5f0',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  aria-label="Copy secret key"
                  onClick={() => {
                    copyToClipboard(showSecretModal.secret)
                    setCopiedSecret(true)
                    setTimeout(() => setCopiedSecret(false), 2000)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid #2d2d44',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copiedSecret ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                  {copiedSecret ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSecretModal(null)
                  setCopiedSecret(false)
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
                  color: '#0f172a',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #2d2d44',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <h3 id="revoke-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0' }}>
                Revoke API Key
              </h3>
            </div>

            <div id="revoke-modal-desc" style={{ margin: '0 0 1.5rem', color: '#94a3b8', lineHeight: '1.5', fontSize: '0.875rem' }}>
              <p style={{ margin: '0 0 1rem' }}>
                Are you sure you want to revoke <strong>{keyToRevoke.name}</strong>? This action cannot be undone.
              </p>

              <div style={{ background: '#2d1b1e', border: '1px solid #ef4444', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem' }}>
                <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.5rem' }}>Consequences:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#fca5a5' }}>
                  <li>Any applications or scripts using this key will immediately fail.</li>
                  <li>You will not be able to view or restore this key again.</li>
                  {isOnlyKey && (
                    <li style={{ fontWeight: 600 }}>This is your only active key. API access will be completely disabled.</li>
                  )}
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="revoke-confirm-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#e2e8f0' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #2d2d44',
                    background: '#0a0a0a',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setShowRevokeConfirmation(null)
                  setRevokeConfirmationText('')
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #2d2d44',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                disabled={!isRevokeConfirmed}
                onClick={() => handleRevokeAndRotateKey(keyToRevoke.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #f59e0b',
                  background: isRevokeConfirmed ? 'transparent' : 'rgba(245, 158, 11, 0.2)',
                  color: isRevokeConfirmed ? '#f59e0b' : '#925e07',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isRevokeConfirmed ? 'pointer' : 'not-allowed',
                }}
              >
                <RotateCcw size={16} />
                Revoke & Rotate
              </button>

              <button
                disabled={!isRevokeConfirmed}
                onClick={() => handleRevokeKey(keyToRevoke.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: isRevokeConfirmed ? '#dc2626' : '#7f1d1d',
                  color: isRevokeConfirmed ? '#fff' : '#ef4444',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isRevokeConfirmed ? 'pointer' : 'not-allowed',
                }}
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
