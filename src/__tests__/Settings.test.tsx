import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { Link, MemoryRouter, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Settings from '../pages/Settings'

// Mock the settings components
vi.mock('../components/settings/OrganizationSettings', () => ({
  default: () => <div data-testid="organization-settings">Organization Settings Component</div>
}))

vi.mock('../components/settings/BillingSettings', () => ({
  default: () => <div data-testid="billing-settings">Billing Settings Component</div>
}))

vi.mock('../components/settings/ApiKeysSettings', () => ({
  default: () => <div data-testid="api-keys-settings">API Keys Settings Component</div>
}))

vi.mock('../components/settings/DensityPreview', () => ({
  default: () => <div data-testid="density-preview">Density Preview Component</div>
}))

function SettingsLocation() {
  const { search, hash } = useLocation()
  return <output data-testid="settings-location">{search}{hash}</output>
}

const renderWithRouter = (component: React.ReactElement, initialPath = '/settings') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      {component}
      <SettingsLocation />
    </MemoryRouter>
  )
}

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the settings page with correct title', () => {
    renderWithRouter(<Settings />)
    
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByText(/manage your organization, billing, and security preferences/i)).toBeInTheDocument()
  })

  it('displays all sections in navigation', () => {
    renderWithRouter(<Settings />)
    
    expect(screen.getByRole('button', { name: /organization/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /billing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /api keys/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tags/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /appearance/i })).toBeInTheDocument()
  })

  it('shows organization settings by default', () => {
    renderWithRouter(<Settings />)
    
    expect(screen.getByTestId('organization-settings')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-settings')).not.toBeInTheDocument()
    expect(screen.queryByTestId('api-keys-settings')).not.toBeInTheDocument()
  })

  it('switches to billing settings when billing tab is clicked', async () => {
    renderWithRouter(<Settings />)
    
    const billingTab = screen.getByRole('button', { name: /billing/i })
    fireEvent.click(billingTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('billing-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('organization-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('api-keys-settings')).not.toBeInTheDocument()
    })
  })

  it('switches to API keys settings when API keys tab is clicked', async () => {
    renderWithRouter(<Settings />)
    
    const apiKeysTab = screen.getByRole('button', { name: /api keys/i })
    fireEvent.click(apiKeysTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('api-keys-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('organization-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('billing-settings')).not.toBeInTheDocument()
    })
  })

  it('displays security notice in navigation', () => {
    renderWithRouter(<Settings />)
    
    expect(screen.getByText(/security notice/i)).toBeInTheDocument()
    expect(screen.getByText(/some actions in these settings are irreversible/i)).toBeInTheDocument()
  })

  it('shows descriptions for each settings section', () => {
    renderWithRouter(<Settings />)
    
    expect(screen.getByText(/manage your organization profile, team members, and preferences/i)).toBeInTheDocument()
    expect(screen.getByText(/configure payment methods, billing cycles, and invoices/i)).toBeInTheDocument()
    expect(screen.getByText(/manage api keys, tokens, and security settings/i)).toBeInTheDocument()
  })

  it('highlights active tab correctly', () => {
    renderWithRouter(<Settings />)
    
    // Initially organization tab should be active
    const organizationTab = screen.getByRole('button', { name: /organization/i })
    expect(organizationTab).toHaveStyle('background: #2d2d44')
    
    // Click billing tab
    const billingTab = screen.getByRole('button', { name: /billing/i })
    fireEvent.click(billingTab)
    
    // Organization tab should no longer be active, billing tab should be
    expect(organizationTab).not.toHaveStyle('background: #2d2d44')
    expect(billingTab).toHaveStyle('background: #2d2d44')
  })

  it('has proper accessibility attributes', () => {
    renderWithRouter(<Settings />)
    
    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
    
    // Check for button roles
    const navigation = screen.getByRole('navigation', { name: 'Settings sections' })
    expect(within(navigation).getAllByRole('button')).toHaveLength(6)
  })
})

describe('Settings Navigation', () => {
  it('opens Billing from the tab query even when a different tab is in the hash', () => {
    renderWithRouter(<Settings />, '/settings?tab=billing#appearance')

    expect(screen.getByTestId('billing-settings')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /billing/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('falls back to Organization when navigation supplies an invalid tab', () => {
    renderWithRouter(
      <>
        <Settings />
        <Link to="/settings?tab=unknown">Open invalid tab</Link>
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: /billing/i }))
    expect(screen.getByTestId('billing-settings')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Open invalid tab' }))

    expect(screen.getByTestId('organization-settings')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-settings')).not.toBeInTheDocument()
  })

  it('opens settings from a tab hash and replaces it when another tab is selected', () => {
    renderWithRouter(<Settings />, '/settings?source=notification#appearance')
    expect(screen.getByTestId('density-preview')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /api keys/i }))

    expect(screen.getByTestId('api-keys-settings')).toBeInTheDocument()
    expect(screen.getByTestId('settings-location').textContent).toBe('?source=notification&tab=api-keys')
  })

  it('updates the tab query while keeping unrelated query values and anchors', () => {
    renderWithRouter(<Settings />, '/settings?tab=billing&source=notification#invoice-history')

    fireEvent.click(screen.getByRole('button', { name: /api keys/i }))

    expect(screen.getByTestId('settings-location').textContent).toBe('?tab=api-keys&source=notification#invoice-history')
  })

  it('navigates between sections maintaining state', async () => {
    renderWithRouter(<Settings />)
    
    // Start with organization
    expect(screen.getByTestId('organization-settings')).toBeInTheDocument()
    
    // Go to billing
    fireEvent.click(screen.getByRole('button', { name: /billing/i }))
    await waitFor(() => {
      expect(screen.getByTestId('billing-settings')).toBeInTheDocument()
    })
    
    // Go to API keys
    fireEvent.click(screen.getByRole('button', { name: /api keys/i }))
    await waitFor(() => {
      expect(screen.getByTestId('api-keys-settings')).toBeInTheDocument()
    })
    
    // Back to organization
    fireEvent.click(screen.getByRole('button', { name: /organization/i }))
    await waitFor(() => {
      expect(screen.getByTestId('organization-settings')).toBeInTheDocument()
    })
  })

  it('handles hover states on navigation items', () => {
    renderWithRouter(<Settings />)
    
    const billingTab = screen.getByRole('button', { name: /billing/i })
    
    // Mouse enter
    fireEvent.mouseEnter(billingTab)
    expect(billingTab).toHaveStyle('background: #252538')
    
    // Mouse leave
    fireEvent.mouseLeave(billingTab)
    expect(billingTab).toHaveStyle('background: transparent')
  })

  it('switches to appearance settings when appearance tab is clicked', async () => {
    renderWithRouter(<Settings />)
    
    const appearanceTab = screen.getByRole('button', { name: /appearance/i })
    fireEvent.click(appearanceTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('density-preview')).toBeInTheDocument()
      expect(screen.queryByTestId('organization-settings')).not.toBeInTheDocument()
    })
  })
})
