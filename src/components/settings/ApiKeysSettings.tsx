import { useState } from 'react'
import { Key, Plus, Eye, EyeOff, Copy, RotateCcw, Trash2, AlertTriangle, Shield, Calendar, User } from 'lucide-react'

interface ApiKey {
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

export default function ApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_51H2K3a...',
      scopes: ['read', 'write', 'admin'],
      createdAt: '2024-01-15',
      createdBy: 'alice@example.com',
      lastUsed: '2024-03-28',
      isActive: true,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_51H2K3a...',
      scopes: ['read', 'write'],
      createdAt: '2024-02-01',
      createdBy: 'bob@example.com',
      lastUsed: '2024-03-27',
      expiresAt: '2024-06-01',
      isActive: true,
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState<string | null>(null)
  const [revokeConfirmationText, setRevokeConfirmationText] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleRevokeKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId))
    setShowRevokeConfirmation(null)
    setRevokeConfirmationText('')
  }

  const handleRevokeAndRotateKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === keyId
          ? {
              ...k,
              key: `sk_new_${Math.random().toString(36).substring(7)}...`,
              createdAt: new Date().toISOString().split('T')[0],
              lastUsed: undefined,
            }
          : k
      )
    )
    setShowRevokeConfirmation(null)
    setRevokeConfirmationText('')
  }

  const activeKeysCount = apiKeys.filter(k => k.isActive).length;
  const keyToRevoke = apiKeys.find(k => k.id === showRevokeConfirmation);
  const isOnlyKey = activeKeysCount === 1 && keyToRevoke?.isActive;
  const isRevokeConfirmed = revokeConfirmationText.trim() === keyToRevoke?.name;

  return (
    <div>
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
          onClick={() => setShowCreateModal(true)}
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

      {/* API Keys List */}
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
                    display: 'inline-block'
                  }}>
                    {visibleKeys.has(key.id) ? key.key : '•'.repeat(16) + key.key.slice(-4)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => toggleKeyVisibility(key.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#67d5f0',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {visibleKeys.has(key.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                      {visibleKeys.has(key.id) ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#67d5f0',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Copy size={12} />
                      Copy
                    </button>
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

      {/* Create API Key Modal - Minimally changed just retaining structure */}
      {showCreateModal && (
        <div style={{
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
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #2d2d44',
          }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0' }}>
              Create API Key
            </h3>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCreateModal(false)}
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
                onClick={() => setShowCreateModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Key size={16} />
                Create Key
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
          <div style={{
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #2d2d44',
          }}>
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
                  setShowRevokeConfirmation(null);
                  setRevokeConfirmationText('');
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
