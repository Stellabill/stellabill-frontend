import { useState } from 'react'
import { CreditCard, Key, Settings as SettingsIcon, Shield, SlidersHorizontal, Tags, Users } from 'lucide-react'
import OrganizationSettings from '../components/settings/OrganizationSettings'
import BillingSettings from '../components/settings/BillingSettings'
import ApiKeysSettings from '../components/settings/ApiKeysSettings'
import DensityPreview from '../components/settings/DensityPreview'
import './Settings.css'

type SettingsTab = 'organization' | 'billing' | 'api-keys' | 'tags' | 'appearance'

// Wrapper component for ManageTagsSettings with state
function ManageTagsWrapper() {
  const [tags, setTags] = useState<TagData[]>([
    { id: '1', label: 'Enterprise', color: 'blue', usageCount: 5 },
    { id: '2', label: 'Popular', color: 'green', usageCount: 12 },
    { id: '3', label: 'Beta', color: 'yellow', usageCount: 3 },
  ]);

  const handleRenameTag = (id: string, newLabel: string) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, label: newLabel } : t));
  };

  const handleDeleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const handleChangeColor = (id: string, newColor: TagProps['color']) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, color: newColor } : t));
  };

  return (
    <ManageTagsSettings
      tags={tags}
      onRenameTag={handleRenameTag}
      onDeleteTag={handleDeleteTag}
      onChangeColor={handleChangeColor}
    />
  );
}

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
  {
    id: 'tags',
    label: 'Tags',
    icon: Tags,
    description: 'Create and manage tags for organizing plans and subscriptions',
    component: ManageTagsWrapper,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: SlidersHorizontal,
    description: 'Customize interface density and visual preferences',
    component: DensityPreview,
  },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization')

  const ActiveComponent = settingsSections.find((section) => section.id === activeTab)?.component

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-header__title-row">
          <SettingsIcon className="settings-header__icon" size={24} aria-hidden="true" />
          <h1>Settings</h1>
        </div>
        <p>Manage your organization, billing, and security preferences</p>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          <div className="settings-nav__eyebrow">
            <p>Settings</p>
          </div>

          <div className="settings-nav__list">
            {settingsSections.map((section) => {
              const Icon = section.icon
              const isActive = activeTab === section.id

              return (
                <button
                  key={section.id}
                  type="button"
                  className="settings-nav__tab"
                  onClick={() => setActiveTab(section.id)}
                  aria-pressed={isActive}
                  style={{
                    background: isActive ? '#2d2d44' : 'transparent',
                    color: isActive ? '#e2e8f0' : '#94a3b8',
                  }}
                  onMouseEnter={(event) => {
                    if (!isActive) {
                      event.currentTarget.style.background = '#252538'
                      event.currentTarget.style.color = '#e2e8f0'
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!isActive) {
                      event.currentTarget.style.background = 'transparent'
                      event.currentTarget.style.color = '#94a3b8'
                    }
                  }}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    <span className="settings-nav__tab-title">{section.label}</span>
                    <span className="settings-nav__tab-description">{section.description}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="settings-security-note">
            <div className="settings-security-note__badge">
              <Shield size={14} aria-hidden="true" />
              <span>Security Notice</span>
            </div>
            <p>
              Some actions in these settings are irreversible. Please review carefully before making changes.
            </p>
          </div>
        </nav>

        <main className="settings-content">
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  )
}
