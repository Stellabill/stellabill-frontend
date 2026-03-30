import { useState } from 'react'
import { Settings, Users, CreditCard, Key, Shield, AlertTriangle } from 'lucide-react'
import OrganizationSettings from '../components/settings/OrganizationSettings'
import BillingSettings from '../components/settings/BillingSettings'
import ApiKeysSettings from '../components/settings/ApiKeysSettings'

type SettingsTab = 'organization' | 'billing' | 'api-keys'

interface SettingsSection {
  id: SettingsTab
  label: string
  icon: React.ElementType
  description: string
  component: React.ComponentType
}

const settingsSections: SettingsSection[] = [
  {
    id: 'organization',
    label: 'Organization',
    icon: Users,
    description: 'Manage your organization profile, team members, and preferences',
    component: OrganizationSettings,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Configure payment methods, billing cycles, and invoices',
    component: BillingSettings,
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    icon: Key,
    description: 'Manage API keys, tokens, and security settings',
    component: ApiKeysSettings,
  },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization')

  const ActiveComponent = settingsSections.find(section => section.id === activeTab)?.component

  return (
    <div style={{ padding: '1.5rem 2rem', background: '#0a0a0a', minHeight: '100vh' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Settings size={24} style={{ color: '#e2e8f0' }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>
            Settings
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Manage your organization, billing, and security preferences
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        {/* Settings Navigation */}
        <nav style={{ background: '#1a1a2e', borderRadius: '8px', padding: '1rem', height: 'fit-content' }}>
          <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Settings
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {settingsSections.map((section) => {
              const Icon = section.icon
              const isActive = activeTab === section.id
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? '#2d2d44' : 'transparent',
                    color: isActive ? '#e2e8f0' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#252538'
                      e.currentTarget.style.color = '#e2e8f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#94a3b8'
                    }
                  }}
                >
                  <Icon size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {section.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: '1.4', opacity: 0.8 }}>
                      {section.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem 0.5rem', borderTop: '1px solid #2d2d44' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#1e293b', borderRadius: '4px', marginBottom: '0.5rem' }}>
              <Shield size={14} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 500 }}>
                Security Notice
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
              Some actions in these settings are irreversible. Please review carefully before making changes.
            </p>
          </div>
        </nav>

        {/* Settings Content */}
        <main style={{ background: '#1a1a2e', borderRadius: '8px', padding: '1.5rem' }}>
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  )
}
