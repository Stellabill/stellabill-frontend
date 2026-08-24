import { useState } from 'react'
import { Users, Plus } from 'lucide-react'
import FamilyInvitationPreview from './FamilyInvitationPreview'

interface FamilyMember {
  id: string
  name: string
  email: string
  status: 'pending' | 'active' | 'removed'
  joinedAt?: string
}

export default function FamilyPlanSettings() {
  const [familyMembers] = useState<FamilyMember[]>([
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'active', joinedAt: '2026-06-15' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'pending' },
    { id: '3', name: 'Charlie Lee', email: 'charlie@example.com', status: 'pending' },
  ])

  const activeCount = familyMembers.filter((m) => m.status === 'active').length + 1 // +1 for the admin
  const pendingCount = familyMembers.filter((m) => m.status === 'pending').length

  const handleSendTest = (email: string) => {
    console.log('Sending test invitation to:', email)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
          Family Plan Settings
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Manage your family plan members and invitation preferences
        </p>
      </div>

      {/* Members overview */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} style={{ color: '#67d5f0' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Family Members
            </h3>
            <span style={{ background: '#2d2d44', color: '#94a3b8', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {activeCount} active
            </span>
            {pendingCount > 0 && (
              <span style={{ background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          <button
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
            Add Member
          </button>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: '6px', border: '1px solid #2d2d44', overflow: 'hidden' }}>
          {/* Admin row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #2d2d44', background: 'rgba(34, 211, 238, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #22d3ee, #2dd4bf)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#02131a', fontWeight: 700, fontSize: '0.875rem' }}>
                A
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 500, color: '#e2e8f0' }}>You (Admin)</span>
                  <span style={{ background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                    Owner
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>admin@acme.com</div>
              </div>
            </div>
          </div>

          {familyMembers.map((member, index) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: index < familyMembers.length - 1 ? '1px solid #2d2d44' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2d2d44', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 700, fontSize: '0.875rem' }}>
                  {member.name.charAt(0)}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background:
                      member.status === 'active'
                        ? 'rgba(16, 185, 129, 0.16)'
                        : member.status === 'pending'
                        ? 'rgba(245, 158, 11, 0.16)'
                        : 'rgba(100, 116, 139, 0.16)',
                    color:
                      member.status === 'active'
                        ? '#34d399'
                        : member.status === 'pending'
                        ? '#fbbf24'
                        : '#94a3b8',
                  }}
                >
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </span>
                {member.joinedAt && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitation preview */}
      <div style={{ marginBottom: '2rem' }}>
        <FamilyInvitationPreview
          merchantName="Acme Corporation"
          memberCount={activeCount + pendingCount}
          onSendTest={handleSendTest}
        />
      </div>
    </div>
  )
}
