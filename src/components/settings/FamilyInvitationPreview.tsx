import { useState, useId, useCallback } from 'react'
import { Send, Mail, Users, Edit3, Eye } from 'lucide-react'
import './FamilyInvitationPreview.css'

const NOTE_MAX_LENGTH = 200

interface FamilyInvitationPreviewProps {
  merchantName: string
  memberCount: number
  onSendTest: (email: string) => void
}

interface FamilyMember {
  id: string
  name: string
  email: string
}

const MOCK_MEMBERS: FamilyMember[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
  { id: '3', name: 'Charlie Lee', email: 'charlie@example.com' },
]

function resolveTokens(template: string, merchantName: string, memberCount: number, recipientName: string): string {
  return template
    .replace(/\{merchant_name\}/g, merchantName)
    .replace(/\{member_count\}/g, String(memberCount))
    .replace(/\{recipient_name\}/g, recipientName)
}

export default function FamilyInvitationPreview({
  merchantName,
  memberCount,
  onSendTest,
}: FamilyInvitationPreviewProps) {
  const headingId = useId()
  const editorTabId = useId()
  const previewTabId = useId()
  const noteId = useId()
  const testEmailId = useId()

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [note, setNote] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState(MOCK_MEMBERS[0]?.id ?? '')
  const [testEmail, setTestEmail] = useState('')
  const [testSent, setTestSent] = useState(false)

  const selectedMember = MOCK_MEMBERS.find((m) => m.id === selectedMemberId) ?? MOCK_MEMBERS[0]

  const charsRemaining = NOTE_MAX_LENGTH - note.length
  const isOverLimit = note.length > NOTE_MAX_LENGTH

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.length <= NOTE_MAX_LENGTH) {
      setNote(val)
    }
  }, [])

  const handleSendTest = useCallback(() => {
    const email = testEmail.trim()
    if (!email) return
    onSendTest(email)
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }, [testEmail, onSendTest])

  const previewSubject = `You're invited to ${merchantName} family plan`
  const previewBody = resolveTokens(
    note || `Hi {recipient_name},\n\nYou've been invited to join the {merchant_name} family plan, which covers {member_count} members. Click the link below to accept your invitation.`,
    merchantName,
    memberCount,
    selectedMember?.name ?? 'there',
  )

  return (
    <div
      className="fip-root"
      role="region"
      aria-labelledby={headingId}
    >
      <div className="fip-header">
        <div className="fip-header-icon" aria-hidden="true">
          <Mail size={18} />
        </div>
        <h2 id={headingId} className="fip-heading">Family Plan Invitation</h2>
      </div>

      {/* Tab bar */}
      <div className="fip-tabs" role="tablist" aria-label="Invitation editor mode">
        <button
          id={editorTabId}
          role="tab"
          aria-selected={activeTab === 'edit'}
          aria-controls="fip-editor-panel"
          className={`fip-tab ${activeTab === 'edit' ? 'fip-tab--active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          <Edit3 size={14} aria-hidden="true" />
          Edit
        </button>
        <button
          id={previewTabId}
          role="tab"
          aria-selected={activeTab === 'preview'}
          aria-controls="fip-preview-panel"
          className={`fip-tab ${activeTab === 'preview' ? 'fip-tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={14} aria-hidden="true" />
          Preview
        </button>
      </div>

      {/* Editor panel */}
      {activeTab === 'edit' && (
        <div
          id="fip-editor-panel"
          role="tabpanel"
          aria-labelledby={editorTabId}
          className="fip-panel"
        >
          {/* Note field */}
          <div className="fip-field">
            <label htmlFor={noteId} className="fip-label">
              Personal note
              <span className="fip-optional">(optional)</span>
            </label>
            <textarea
              id={noteId}
              className={`fip-textarea ${isOverLimit ? 'fip-textarea--error' : ''}`}
              rows={4}
              placeholder="Add a personal message to the invitation..."
              value={note}
              onChange={handleNoteChange}
              aria-describedby={`${noteId}-counter`}
              aria-invalid={isOverLimit}
            />
            <div
              id={`${noteId}-counter`}
              className={`fip-counter ${isOverLimit ? 'fip-counter--error' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {charsRemaining} / {NOTE_MAX_LENGTH} characters remaining
            </div>
          </div>

          {/* Token help */}
          <div className="fip-tokens" role="note">
            <div className="fip-tokens-label">Available tokens:</div>
            <div className="fip-token-chips">
              <code className="fip-token-chip">{'{recipient_name}'}</code>
              <code className="fip-token-chip">{'{merchant_name}'}</code>
              <code className="fip-token-chip">{'{member_count}'}</code>
            </div>
          </div>

          {/* Send test */}
          <div className="fip-test">
            <label htmlFor={testEmailId} className="fip-label">
              Send test invitation
            </label>
            <div className="fip-test-row">
              <input
                id={testEmailId}
                type="email"
                className="fip-test-input"
                placeholder="Enter recipient email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendTest() }}
              />
              <button
                type="button"
                className="fip-test-btn"
                onClick={handleSendTest}
                disabled={!testEmail.trim()}
                aria-label={`Send test invitation to ${testEmail.trim() || 'no recipient'}`}
              >
                <Send size={14} aria-hidden="true" />
                Send Test
              </button>
            </div>
            {testSent && (
              <div className="fip-test-sent" role="status" aria-live="polite">
                Test invitation sent to {testEmail}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview panel */}
      {activeTab === 'preview' && (
        <div
          id="fip-preview-panel"
          role="tabpanel"
          aria-labelledby={previewTabId}
          className="fip-panel"
        >
          {/* Member selector */}
          <div className="fip-field">
            <label className="fip-label" id="fip-member-label">
              <Users size={14} aria-hidden="true" />
              Preview for member
            </label>
            <select
              className="fip-select"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              aria-labelledby="fip-member-label"
            >
              {MOCK_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          {/* Email preview card */}
          <div className="fip-email-preview" role="article" aria-label="Invitation email preview">
            <div className="fip-email-header">
              <div className="fip-email-header-row">
                <span className="fip-email-header-label">To:</span>
                <span className="fip-email-header-value">{selectedMember?.email}</span>
              </div>
              <div className="fip-email-header-row">
                <span className="fip-email-header-label">Subject:</span>
                <span className="fip-email-header-value fip-email-subject">{previewSubject}</span>
              </div>
            </div>
            <div className="fip-email-body">
              {previewBody.split('\n').map((line, i) => (
                <p key={i} className="fip-email-paragraph">{line || '\u00A0'}</p>
              ))}
              <div className="fip-email-cta">
                <span className="fip-email-cta-text">Accept Invitation</span>
              </div>
              <p className="fip-email-footer-text">
                This invitation was sent by {merchantName}. You are receiving this because
                a family plan organizer invited you to join their plan covering {memberCount} members.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
