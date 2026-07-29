import { useState } from 'react'
import { Save, Building2, Users, Trash2, Edit2 } from 'lucide-react'
import DangerZone, { DangerZoneItem } from '../common/DangerZone'
import ConfirmDialog from '../common/ConfirmDialog'
import Avatar from '../common/Avatar'
import AvatarUploader from '../common/AvatarUploader'

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

  const [orgAvatar, setOrgAvatar] = useState<string | null>(null)

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@acme.com',
      role: 'admin',
      avatar: undefined,
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
    console.log('Saving organization data:', { ...orgData, avatar: orgAvatar })
    setIsEditing(false)
  }

  const handleDeleteOrganization = () => {
    // TODO: Implement delete logic with proper confirmation
    console.log('Deleting organization...')
    setShowDeleteConfirmation(false)
  }

  const handleAvatarUpload = async (file: File) => {
    // TODO: Replace with actual upload to server/cloud storage
    // For now, create a local preview URL
    const url = URL.createObjectURL(file)
    setOrgAvatar(url)
    console.log('Avatar uploaded:', file.name)
  }

  const handleAvatarRemove = () => {
    if (orgAvatar) {
      URL.revokeObjectURL(orgAvatar)
    }
    setOrgAvatar(null)
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
              <span>Cancel</span>
            ) : (
              <>
                <Edit2 size={14} />
                <span>Edit</span>
              </>
            )}
          </button>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '1.5rem', border: '1px solid #2d2d44' }}>
          {/* Avatar Upload Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #2d2d44',
          }}>
            <AvatarUploader
              currentSrc={orgAvatar}
              name={orgData.name}
              size="xl"
              onUpload={handleAvatarUpload}
              onRemove={handleAvatarRemove}
            />
            <div>
              <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>
                Organization Avatar
              </div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {orgAvatar
                  ? 'Hover over the avatar to change or remove the photo.'
                  : 'Click or drag an image to upload. Recommended: Square, at least 200×200px.'
                }
              </p>
            </div>
          </div>

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
                <Avatar name={member.name} src={member.avatar} size="lg" />
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
      <DangerZone description="Irreversible and destructive actions. Please review carefully before proceeding.">
        <DangerZoneItem
          title="Delete organization"
          description={`Permanently delete "${orgData.name}" and all associated data. This action cannot be undone and will immediately cancel all active subscriptions.`}
          actionLabel="Delete Organization"
          actionIcon={<Trash2 size={14} aria-hidden="true" />}
          onAction={() => setShowDeleteConfirmation(true)}
        />
      </DangerZone>

      <ConfirmDialog
        isOpen={showDeleteConfirmation}
        title="Confirm organization deletion"
        description={
          <>
            This action cannot be undone. This will permanently delete your organization
            <strong> "{orgData.name}" </strong>
            and all associated data, including:
          </>
        }
        consequences={[
          'All subscription plans and configurations',
          'Customer data and subscription history',
          'Billing information and payment methods',
          'API keys and tokens',
          'Team member access',
        ]}
        confirmPhrase="DELETE"
        confirmLabel="Delete organization"
        loadingLabel="Deleting..."
        cancelLabel="Cancel"
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteOrganization}
      />
    </div>
  )
}
