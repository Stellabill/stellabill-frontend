import { useState } from 'react'
import { Save, Building2, Mail, Globe, Users, Trash2, Edit2 } from 'lucide-react'

interface OrganizationData {
  name: string
  domain: string
  email: string
  timezone: string
  currency: string
  language: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  avatar?: string
  joinedAt: string
}

export default function OrganizationSettings() {
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: 'Acme Corporation',
    domain: 'acme.com',
    email: 'admin@acme.com',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en-US',
  })

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@acme.com',
      role: 'admin',
      joinedAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@acme.com',
      role: 'member',
      joinedAt: '2024-02-01',
    },
  ])

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving organization data:', orgData)
    setIsEditing(false)
  }

  const handleDeleteOrganization = () => {
    // TODO: Implement delete logic with proper confirmation
    console.log('Deleting organization...')
    setShowDeleteConfirmation(false)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
          Organization Settings
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Manage your organization profile and team members
        </p>
      </div>

      {/* Organization Profile */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={20} style={{ color: '#67d5f0' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Profile Information
            </h3>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: isEditing ? 'none' : '1px solid #2d2d44',
              background: isEditing ? '#ef4444' : 'transparent',
              color: isEditing ? '#fff' : '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isEditing ? (
              <>
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Edit2 size={14} />
                <span>Edit</span>
              </>
            )}
          </button>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '1.5rem', border: '1px solid #2d2d44' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Organization Name
              </label>
              <input
                type="text"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Domain
              </label>
              <input
                type="text"
                value={orgData.domain}
                onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={orgData.email}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Timezone
              </label>
              <select
                value={orgData.timezone}
                onChange={(e) => setOrgData({ ...orgData, timezone: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Currency
              </label>
              <select
                value={orgData.currency}
                onChange={(e) => setOrgData({ ...orgData, currency: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.5rem' }}>
                Language
              </label>
              <select
                value={orgData.language}
                onChange={(e) => setOrgData({ ...orgData, language: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #2d2d44',
                  background: isEditing ? '#1a1a2e' : '#0f0f0f',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsEditing(false)}
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
                onClick={handleSave}
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
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} style={{ color: '#67d5f0' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Team Members
            </h3>
            <span style={{ background: '#2d2d44', color: '#94a3b8', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {teamMembers.length} members
            </span>
          </div>
          <button
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #2d2d44',
              background: 'transparent',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Invite Member
          </button>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: '6px', border: '1px solid #2d2d44', overflow: 'hidden' }}>
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: index < teamMembers.length - 1 ? '1px solid #2d2d44' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #67d5f0, #5ce0b8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: '#e2e8f0', marginBottom: '0.25rem' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {member.email}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background:
                      member.role === 'admin'
                        ? '#dc2626'
                        : member.role === 'member'
                        ? '#2563eb'
                        : '#64748b',
                    color: '#fff',
                  }}
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#ef4444' }}>
            Danger Zone
          </h3>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '1.5rem', border: '1px solid #dc2626' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
              Delete Organization
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
              Permanently delete your organization and all associated data. This action cannot be undone and will immediately cancel all active subscriptions.
            </p>
          </div>
          
          <button
            onClick={() => setShowDeleteConfirmation(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              border: '1px solid #dc2626',
              background: 'transparent',
              color: '#ef4444',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={16} />
            Delete Organization
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
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
                Confirm Organization Deletion
              </h3>
            </div>
            
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', lineHeight: '1.5' }}>
              This action cannot be undone. This will permanently delete your organization "{orgData.name}" and all associated data including:
            </p>
            
            <ul style={{ margin: '0 0 1.5rem', paddingLeft: '1.5rem', color: '#64748b' }}>
              <li>All subscription plans and configurations</li>
              <li>Customer data and subscription history</li>
              <li>Billing information and payment methods</li>
              <li>API keys and tokens</li>
              <li>Team member access</li>
            </ul>
            
            <div style={{ background: '#1a1a1a', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                Type <strong>"DELETE"</strong> to confirm this action:
              </p>
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #dc2626',
                  background: '#0a0a0a',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowDeleteConfirmation(false)}
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
                onClick={handleDeleteOrganization}
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
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
