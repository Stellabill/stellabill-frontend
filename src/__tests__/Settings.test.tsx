import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
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

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
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

  it('displays all three main sections in navigation', () => {
    renderWithRouter(<Settings />)
    
    expect(screen.getByRole('button', { name: /organization/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /billing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /api keys/i })).toBeInTheDocument()
  })

  it('shows organization settings by default', () => {
    renderWithRouter(<Settings />)
    
    expect(screen.getByTestId('organization-settings')).toBeInTheDocument()
    expect(screen.getByTestId('billing-settings')).not.toBeInTheDocument()
    expect(screen.getByTestId('api-keys-settings')).not.toBeInTheDocument()
  })

  it('switches to billing settings when billing tab is clicked', async () => {
    renderWithRouter(<Settings />)
    
    const billingTab = screen.getByRole('button', { name: /billing/i })
    fireEvent.click(billingTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('billing-settings')).toBeInTheDocument()
      expect(screen.getByTestId('organization-settings')).not.toBeInTheDocument()
      expect(screen.getByTestId('api-keys-settings')).not.toBeInTheDocument()
    })
  })

  it('switches to API keys settings when API keys tab is clicked', async () => {
    renderWithRouter(<Settings />)
    
    const apiKeysTab = screen.getByRole('button', { name: /api keys/i })
    fireEvent.click(apiKeysTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('api-keys-settings')).toBeInTheDocument()
      expect(screen.getByTestId('organization-settings')).not.toBeInTheDocument()
      expect(screen.getByTestId('billing-settings')).not.toBeInTheDocument()
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
    expect(screen.getAllByRole('button')).toHaveLength(3) // Three navigation tabs
  })
})

describe('Settings Navigation', () => {
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
})
