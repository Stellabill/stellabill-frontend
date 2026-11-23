import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import ApiKeysSettings from './ApiKeysSettings'
import { defaultGenerateApiKey, maskApiKey } from '../../utils/apiKey'

describe('ApiKeysSettings', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  it('renders the api keys list with columns and masked secrets without show/hide toggle', () => {
    render(<ApiKeysSettings />)

    // Check headers
    expect(screen.getByText('Key Name')).toBeInTheDocument()
    expect(screen.getByText('Secret Key')).toBeInTheDocument()
    expect(screen.getByText('Scopes')).toBeInTheDocument()
    expect(screen.getByText('Metadata')).toBeInTheDocument()

    // Check data
    expect(screen.getByText('Production API Key')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Development Key')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()

    // Show/Hide toggle should not exist
    expect(screen.queryByText('Show')).not.toBeInTheDocument()
    expect(screen.queryByText('Hide')).not.toBeInTheDocument()

    // Copy button copies the masked key
    const copyBtns = screen.getAllByText('Copy')
    fireEvent.click(copyBtns[0])
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sk_live_••••••••••••••••3a8f')
  })

  it('can open and close the create modal', () => {
    render(<ApiKeysSettings />)
    fireEvent.click(screen.getByText('Create API Key'))
    expect(screen.getByRole('heading', { name: 'Create API Key' })).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByRole('heading', { name: 'Create API Key' })).not.toBeInTheDocument()
  })

  it('shows validation errors when submitting invalid inputs', () => {
    render(<ApiKeysSettings />)
    fireEvent.click(screen.getByText('Create API Key'))

    // Submitting with empty name and no scopes
    fireEvent.click(screen.getByRole('button', { name: /create key/i }))
    expect(screen.getByText('Key name is required')).toBeInTheDocument()
    expect(screen.getByText('At least one scope must be selected')).toBeInTheDocument()

    // Fill name and scope, but enter past expiry date
    fireEvent.change(screen.getByLabelText(/key name/i), { target: { value: 'Test Key' } })
    fireEvent.click(screen.getByLabelText(/read/i))
    fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '2020-01-01' } })

    fireEvent.click(screen.getByRole('button', { name: /create key/i }))
    expect(screen.getByText('Expiry date must be in the future')).toBeInTheDocument()
    // Still in modal
    expect(screen.getByRole('heading', { name: 'Create API Key' })).toBeInTheDocument()
  })

  it('creates key with valid input, shows secret once, and leaves only masked key after dismissal', () => {
    const mockSecret = 'mock_key_customsecret_abcdef1234567890'
    render(<ApiKeysSettings generateApiKey={() => mockSecret} />)

    fireEvent.click(screen.getByText('Create API Key'))

    // Fill valid form
    fireEvent.change(screen.getByLabelText(/key name/i), { target: { value: 'Payment Service' } })
    fireEvent.click(screen.getByLabelText(/read/i))
    fireEvent.click(screen.getByLabelText(/write/i))
    fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '2030-12-31' } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create key/i }))

    // Create modal should be closed
    expect(screen.queryByRole('heading', { name: 'Create API Key' })).not.toBeInTheDocument()

    // Show-once panel is displayed
    expect(screen.getByRole('heading', { name: 'API Key Created' })).toBeInTheDocument()
    expect(screen.getByText(/copy now — you won't see it again/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockSecret)).toBeInTheDocument()

    // Copy button inside secret modal copies full secret
    const modal = screen.getByRole('dialog')
    const modalCopyBtn = within(modal).getByRole('button', { name: /copy/i })
    fireEvent.click(modalCopyBtn)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSecret)

    // Table now has the new key with its masked representation
    expect(screen.getAllByText('Payment Service').length).toBeGreaterThan(0)
    const masked = maskApiKey(mockSecret)
    expect(screen.getByText(masked)).toBeInTheDocument()

    // Dismiss the secret panel
    fireEvent.click(screen.getByRole('button', { name: /done/i }))

    // Show-once panel is closed
    expect(screen.queryByRole('heading', { name: 'API Key Created' })).not.toBeInTheDocument()

    // Full secret is nowhere in document/DOM
    expect(screen.queryByText(mockSecret)).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue(mockSecret)).not.toBeInTheDocument()

    // Key and masked value remain in table
    expect(screen.getByText('Payment Service')).toBeInTheDocument()
    expect(screen.getByText(masked)).toBeInTheDocument()
  })

  it('handles the revoke and rotate flow, shows secret once, and list never contains full secret after dismissal', () => {
    const mockRotateSecret = 'mock_key_rotatedsecret_9876543210fedc'
    render(<ApiKeysSettings generateApiKey={() => mockRotateSecret} />)

    // Open revoke modal for Production API Key
    const revokeBtns = screen.getAllByText('Revoke')
    fireEvent.click(revokeBtns[0])

    const input = screen.getByLabelText(/Please type/i)
    fireEvent.change(input, { target: { value: 'Production API Key' } })

    const rotateBtn = screen.getByRole('button', { name: 'Revoke & Rotate' })
    expect(rotateBtn).not.toBeDisabled()

    // Submit rotate
    fireEvent.click(rotateBtn)

    // Revoke modal is closed
    expect(screen.queryByRole('heading', { name: 'Revoke API Key' })).not.toBeInTheDocument()

    // Show-once panel is displayed with rotated secret
    expect(screen.getByRole('heading', { name: 'API Key Rotated' })).toBeInTheDocument()
    expect(screen.getByText(/copy now — you won't see it again/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockRotateSecret)).toBeInTheDocument()

    // Table shows "Never used"
    expect(screen.getAllByText('Production API Key').length).toBeGreaterThan(0)
    expect(screen.getByText('Never used')).toBeInTheDocument()

    // Dismiss the show-once panel
    fireEvent.click(screen.getByRole('button', { name: /done/i }))
    expect(screen.queryByRole('heading', { name: 'API Key Rotated' })).not.toBeInTheDocument()

    // Key is in table
    expect(screen.getByText('Production API Key')).toBeInTheDocument()

    // Full secret is nowhere in document/DOM
    expect(screen.queryByText(mockRotateSecret)).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue(mockRotateSecret)).not.toBeInTheDocument()

    // Masked secret remains in the table
    const masked = maskApiKey(mockRotateSecret)
    expect(screen.getByText(masked)).toBeInTheDocument()
  })

  it('handles the revocation flow with typed confirmation', () => {
    render(<ApiKeysSettings />)

    // Open revoke modal for Development Key
    const revokeBtns = screen.getAllByText('Revoke')
    fireEvent.click(revokeBtns[1]) // Second key

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to revoke/i)).toBeInTheDocument()
    expect(screen.getAllByText('Development Key').length).toBeGreaterThan(0)

    // The "Revoke Key" button should be disabled initially
    const confirmBtn = screen.getByRole('button', { name: 'Revoke Key' })
    expect(confirmBtn).toBeDisabled()

    // Type incorrect confirmation
    const input = screen.getByLabelText(/Please type/i)
    fireEvent.change(input, { target: { value: 'Wrong Key Name' } })
    expect(confirmBtn).toBeDisabled()

    // Type correct confirmation
    fireEvent.change(input, { target: { value: 'Development Key' } })
    expect(confirmBtn).not.toBeDisabled()

    // Submit
    fireEvent.click(confirmBtn)

    // Modal closes and key is removed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Development Key')).not.toBeInTheDocument()
  })

  it('displays a warning for the only-key case', () => {
    render(<ApiKeysSettings />)

    // Revoke the first key to leave only one
    fireEvent.click(screen.getAllByText('Revoke')[0])
    fireEvent.change(screen.getByLabelText(/Please type/i), { target: { value: 'Production API Key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Revoke Key' }))

    // Now there is only one active key left. Try to revoke it.
    fireEvent.click(screen.getByText('Revoke'))

    // It should display the special warning
    expect(screen.getByText('This is your only active key. API access will be completely disabled.')).toBeInTheDocument()
  })

  it('has accessible screen-reader step descriptions and RTL support', () => {
    render(<ApiKeysSettings />)
    fireEvent.click(screen.getAllByText('Revoke')[0])

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'revoke-modal-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'revoke-modal-desc')

    const input = screen.getByLabelText(/Please type/i)
    expect(input).toHaveAttribute('dir', 'auto')
  })

  it('displays empty state when no keys exist', () => {
    render(<ApiKeysSettings />)

    // Revoke both keys
    fireEvent.click(screen.getAllByText('Revoke')[0])
    fireEvent.change(screen.getByLabelText(/Please type/i), { target: { value: 'Production API Key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Revoke Key' }))

    fireEvent.click(screen.getByText('Revoke'))
    fireEvent.change(screen.getByLabelText(/Please type/i), { target: { value: 'Development Key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Revoke Key' }))

    expect(screen.getByText('No API keys found. Create one to get started.')).toBeInTheDocument()
  })

  it('generates secure keys using crypto.getRandomValues without Math.random', () => {
    const mathRandomSpy = vi.spyOn(Math, 'random')

    const key = defaultGenerateApiKey()
    expect(key).toMatch(/^sk_live_[0-9a-f]{48}$/)
    expect(mathRandomSpy).not.toHaveBeenCalled()

    mathRandomSpy.mockRestore()
  })

  it('masks api keys properly preserving prefix and last 4 characters', () => {
    const masked = maskApiKey('mock_key_1234567890abcdef12345678')
    expect(masked).toBe('mock_key_••••••••••••••••5678')
    expect(masked.startsWith('mock_key_')).toBe(true)
    expect(masked.endsWith('5678')).toBe(true)
  })
})
