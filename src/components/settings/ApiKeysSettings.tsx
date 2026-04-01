import { useState } from 'react'
import { Key, Plus, Eye, EyeOff, Copy, RotateCcw, Trash2, AlertTriangle, Shield } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  scopes: string[]
  createdAt: string
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
}

export default function ApiKeysSettings() {
  const [apiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_51H2K3a...',
      scopes: ['read', 'write', 'admin'],
      createdAt: '2024-01-15',
      lastUsed: '2024-03-28',
      isActive: true,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_51H2K3a...',
      scopes: ['read', 'write'],
      createdAt: '2024-02-01',
      lastUsed: '2024-03-27',
      expiresAt: '2024-06-01',
      isActive: true,
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState<string | null>(null)
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
    // TODO: Show toast notification
  }

  const handleRevokeKey = (keyId: string) => {
    console.log('Revoking key:', keyId)
    setShowRevokeConfirmation(null)
  }

  const handleRotateKey = (keyId: string) => {
    console.log('Rotating key:', keyId)
  }

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
      <div style={{ background: '#0a0a0a', borderRadius: '6px', border: '1px solid #2d2d44', overflow: 'hidden' }}>
        {apiKeys.map((key, index) => (
          <div
            key={key.id}
            style={{
              borderBottom: index < apiKeys.length - 1 ? '1px solid #2d2d44' : 'none',
            }}
          >
            <div style={{ padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
                      {key.name}
                    </h4>
                    {key.isActive ? (
                      <span style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ background: '#64748b', color: '#fff', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                    {key.expiresAt && ` • Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleKeyVisibility(key.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #2d2d44',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {visibleKeys.has(key.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                    {visibleKeys.has(key.id) ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(key.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #2d2d44',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                  <button
                    onClick={() => handleRotateKey(key.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #f59e0b',
                      background: 'transparent',
                      color: '#f59e0b',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={12} />
                    Rotate
                  </button>
                  <button
                    onClick={() => setShowRevokeConfirmation(key.id)}
                    style={{
                      display: 'flex',
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
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>API Key:</div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#e2e8f0',
                  background: '#1a1a1a',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                }}>
                  {visibleKeys.has(key.id) ? key.key : '•'.repeat(20) + key.key.slice(-4)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Scopes:</div>
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create API Key Modal */}
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Key Name
              </label>
              <input
                type="text"
                placeholder="e.g., Production API Key"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: '#0a0a0a',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Scopes
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['read', 'write', 'admin'].map((scope) => (
                  <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#67d5f0',
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{scope.charAt(0).toUpperCase() + scope.slice(1)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {scope === 'read' ? 'Read access to resources' :
                         scope === 'write' ? 'Read and write access to resources' :
                         'Full administrative access'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#67d5f0',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#e2e8f0' }}>Set Expiration Date</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Automatically disable this key on a specific date
                  </div>
                </div>
              </label>
            </div>

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
      {showRevokeConfirmation && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0' }}>
                Revoke API Key
              </h3>
            </div>

            <p style={{ margin: '0 0 1.5rem', color: '#64748b', lineHeight: '1.5' }}>
              Are you sure you want to revoke this API key? This action cannot be undone and will immediately disable access for any applications using this key.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowRevokeConfirmation(null)}
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
                onClick={() => handleRevokeKey(showRevokeConfirmation)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
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
