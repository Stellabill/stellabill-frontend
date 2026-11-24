import { useEffect, useRef, useState } from 'react'
import { Save, Building2, Users, Trash2, Edit2 } from 'lucide-react'
import { organization, type Organization, type OrganizationProfile } from '@/api/client'
import DangerZone, { DangerZoneItem } from '../common/DangerZone'
import ConfirmDialog from '../common/ConfirmDialog'
import Avatar from '../common/Avatar'
import AvatarUploader from '../common/AvatarUploader'
import { FieldLabelWithHelp } from '../common/FieldHelpPopover'

function profileOf(data: Organization): OrganizationProfile {
  const { name, domain, email, timezone, currency, language } = data
  return { name, domain, email, timezone, currency, language }
}

export default function OrganizationSettings() {
  const [saved, setSaved] = useState<Organization | null>(null)
  const [orgData, setOrgData] = useState<OrganizationProfile>({
    name: '', domain: '', email: '', timezone: 'UTC', currency: 'USD', language: 'en-US',
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarAction, setAvatarAction] = useState<'upload' | 'remove' | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [avatarError, setAvatarError] = useState('')
  const previewRef = useRef<string | null>(null)
  const avatarRequest = useRef<AbortController | null>(null)
  const mutationRequest = useRef<AbortController | null>(null)
  const isBusy = isSaving || isDeleting || avatarAction !== null
  const teamMembers = saved?.members ?? []
  const orgAvatar = saved?.avatarUrl ?? null

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)
    organization.get({ signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return
      setSaved(data)
      setOrgData(profileOf(data))
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [loadAttempt])

  useEffect(() => () => {
    avatarRequest.current?.abort()
    mutationRequest.current?.abort()
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
  }, [])

  const cancelEditing = () => {
    if (saved) setOrgData(profileOf(saved))
    setErrors({})
    setSaveError('')
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (isBusy) return
    const profile = { ...orgData, name: orgData.name.trim(), email: orgData.email.trim() }
    const invalid: typeof errors = {}
    if (!profile.name) invalid.name = 'Organization name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) invalid.email = 'Enter a valid contact email.'
    setErrors(invalid)
    setSaveError('')
    setNotice('')
    if (Object.keys(invalid).length) return
    const controller = new AbortController()
    mutationRequest.current = controller
    setIsSaving(true)
    try {
      const data = await organization.update(profile, { signal: controller.signal })
      if (controller.signal.aborted) return
      setSaved(data)
      setOrgData(profileOf(data))
      setIsEditing(false)
      setNotice('Organization saved.')
    } catch {
      if (!controller.signal.aborted) setSaveError('Unable to save organization. Please try again.')
    } finally {
      if (!controller.signal.aborted) setIsSaving(false)
      mutationRequest.current = null
    }
  }

  const handleDeleteOrganization = async () => {
    if (isBusy || !showDeleteConfirmation) return
    const controller = new AbortController()
    mutationRequest.current = controller
    setIsDeleting(true)
    setDeleteError('')
    try {
      await organization.delete({ signal: controller.signal })
      if (!controller.signal.aborted) setDeleted(true)
    } catch {
      if (!controller.signal.aborted) setDeleteError('Unable to delete organization. Please try again.')
    } finally {
      if (!controller.signal.aborted) setIsDeleting(false)
      mutationRequest.current = null
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (isBusy || avatarRequest.current) return
    const controller = new AbortController()
    avatarRequest.current = controller
    setAvatarError('')
    setAvatarAction('upload')
    setUploadProgress(0)
    try {
      const preview = URL.createObjectURL(file)
      previewRef.current = preview
      setAvatarPreview(preview)
      const result = await organization.uploadAvatar(file, {
        signal: controller.signal,
        onProgress: (percent) => { if (!controller.signal.aborted) setUploadProgress(percent) },
      })
      if (!controller.signal.aborted) setSaved((data) => data ? { ...data, avatarUrl: result.avatarUrl } : data)
    } catch {
      if (!controller.signal.aborted) setAvatarError('Avatar upload failed. Please try again.')
    } finally {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }
      if (!controller.signal.aborted) {
        setAvatarPreview(null)
        setAvatarAction(null)
      }
      avatarRequest.current = null
    }
  }

  const handleAvatarRemove = async () => {
    if (isBusy) return
    const controller = new AbortController()
    avatarRequest.current = controller
    setAvatarAction('remove')
    setAvatarError('')
    try {
      await organization.removeAvatar({ signal: controller.signal })
      if (!controller.signal.aborted) setSaved((data) => data ? { ...data, avatarUrl: null } : data)
    } catch {
      if (!controller.signal.aborted) setAvatarError('Unable to remove avatar. Please try again.')
    } finally {
      if (!controller.signal.aborted) setAvatarAction(null)
      avatarRequest.current = null
    }
  }

  if (deleted) return <p role="status">Organization deleted.</p>
  if (loading) return <p role="status">Loading organization...</p>
  if (loadError || !saved) return (
    <div role="alert">
      <p>Unable to load organization.</p>
      <button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry</button>
    </div>
  )

  return (
    <fieldset disabled={isBusy} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Organization Settings
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Manage your organization profile and team members
        </p>
      </div>

      {notice && <p role="status">{notice}</p>}
      {saveError && <p role="alert">{saveError}</p>}
      {avatarError && <p role="alert">{avatarError}</p>}
      {avatarAction === 'upload' && (
        <div role="status">
          Uploading avatar... {uploadProgress}%
          <progress aria-label="Avatar upload progress" value={uploadProgress} max={100} />
        </div>
      )}
      {avatarAction === 'remove' && <p role="status">Removing avatar...</p>}

      {/* Organization Profile */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={20} style={{ color: 'var(--color-brand-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Profile Information
            </h3>
          </div>
          <button
            onClick={() => { setNotice(''); if (isEditing) cancelEditing(); else setIsEditing(true) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: isEditing ? '1px solid var(--color-danger-border)' : '1px solid var(--color-border-default)',
              background: isEditing ? 'var(--color-danger-bg)' : 'transparent',
              color: isEditing ? 'var(--color-danger)' : 'var(--color-text-primary)',
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

        <div style={{ background: 'var(--color-surface-card)', borderRadius: '6px', padding: '1.5rem', border: '1px solid var(--color-border-subtle)' }}>
          {/* Avatar Upload Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <AvatarUploader
              currentSrc={avatarPreview ?? orgAvatar}
              disabled={isBusy}
              name={orgData.name}
              size="xl"
              onUpload={handleAvatarUpload}
              onRemove={handleAvatarRemove}
            />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                Organization Avatar
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {orgAvatar
                  ? 'Hover over the avatar to change or remove the photo.'
                  : 'Click or drag an image to upload. Recommended: Square, at least 200×200px.'
                }
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <FieldLabelWithHelp
                htmlFor="organization-name"
                helpTitle="Organization name"
                help={<p>This display name appears in customer-facing invoices, emails, and workspace headers.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Organization Name
              </FieldLabelWithHelp>
              <input
                id="organization-name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'organization-name-error' : undefined}
                type="text"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
              {errors.name && <p id="organization-name-error" role="alert">{errors.name}</p>}
            </div>

            <div>
              <FieldLabelWithHelp
                htmlFor="organization-domain"
                helpTitle="Domain"
                help={<p>Use the primary company domain for workspace identity and future domain verification.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Domain
              </FieldLabelWithHelp>
              <input
                id="organization-domain"
                type="text"
                value={orgData.domain}
                onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
            </div>

            <div>
              <FieldLabelWithHelp
                htmlFor="organization-contact-email"
                helpTitle="Contact email"
                help={<p>Operational notices and organization-level account messages are sent here.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Contact Email
              </FieldLabelWithHelp>
              <input
                id="organization-contact-email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'organization-contact-email-error' : undefined}
                type="email"
                value={orgData.email}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: isEditing ? 1 : 0.7,
                }}
              />
              {errors.email && <p id="organization-contact-email-error" role="alert">{errors.email}</p>}
            </div>

            <div>
              <FieldLabelWithHelp
                htmlFor="organization-timezone"
                helpTitle="Timezone"
                help={<p>Controls date boundaries for reports, invoice schedules, and activity timestamps.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Timezone
              </FieldLabelWithHelp>
              <select
                id="organization-timezone"
                value={orgData.timezone}
                onChange={(e) => setOrgData({ ...orgData, timezone: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
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
              <FieldLabelWithHelp
                htmlFor="organization-currency"
                helpTitle="Currency"
                help={<p>Sets the default reporting and invoice currency for new plans and billing summaries.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Currency
              </FieldLabelWithHelp>
              <select
                id="organization-currency"
                value={orgData.currency}
                onChange={(e) => setOrgData({ ...orgData, currency: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
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
              <FieldLabelWithHelp
                htmlFor="organization-language"
                helpTitle="Language"
                help={<p>Sets the default locale for customer-facing billing copy where localization is available.</p>}
                style={{ display: 'inline-flex', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
              >
                Language
              </FieldLabelWithHelp>
              <select
                id="organization-language"
                value={orgData.language}
                onChange={(e) => setOrgData({ ...orgData, language: e.target.value })}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  background: isEditing ? 'var(--color-surface-control)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-text-primary)',
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
                onClick={cancelEditing}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-default)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
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
                  background: 'var(--color-brand-gradient)',
                  color: 'var(--color-brand-on)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} style={{ color: 'var(--color-brand-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Team Members
            </h3>
            <span style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {teamMembers.length} members
            </span>
          </div>
          <button
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border-default)',
              background: 'transparent',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Invite Member
          </button>
        </div>

        <div style={{ background: 'var(--color-surface-card)', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
          {teamMembers.length === 0 && <p style={{ padding: '1rem' }}>No team members.</p>}
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: index < teamMembers.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar name={member.name} src={member.avatar} size="lg" />
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
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
                        ? 'var(--color-danger-bg)'
                        : member.role === 'member'
                        ? 'var(--color-info-bg)'
                        : 'var(--color-surface-subtle)',
                    border:
                      member.role === 'admin'
                        ? '1px solid var(--color-danger-border)'
                        : member.role === 'member'
                        ? '1px solid var(--color-info-border)'
                        : '1px solid var(--color-border-default)',
                    color:
                      member.role === 'admin'
                        ? 'var(--color-danger)'
                        : member.role === 'member'
                        ? 'var(--color-info)'
                        : 'var(--color-text-muted)',
                  }}
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
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
          description={`Permanently delete "${saved.name}" and all associated data. This action cannot be undone and will immediately cancel all active subscriptions.`}
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
            <strong> "{saved.name}" </strong>
            and all associated data, including:
            {deleteError && <span role="alert" style={{ display: 'block' }}>{deleteError}</span>}
          </>
        }
        consequences={[
          'All subscription plans and configurations',
          'Customer data and subscription history',
          'Billing information and payment methods',
          'API keys and tokens',
          'Team member access',
        ]}
        confirmPhrase={saved.name}
        isLoading={isDeleting}
        confirmLabel="Delete organization"
        loadingLabel="Deleting..."
        cancelLabel="Cancel"
        onClose={() => { if (!isDeleting) { setShowDeleteConfirmation(false); setDeleteError('') } }}
        onConfirm={handleDeleteOrganization}
      />
    </fieldset>
  )
}
