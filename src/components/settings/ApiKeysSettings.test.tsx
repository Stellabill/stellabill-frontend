import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import ApiKeysSettings from './ApiKeysSettings'

describe('ApiKeysSettings', () => {
  beforeEach(() => {
    // Reset any clipboard mocks if necessary, we can mock it here
    Object.assign(navigator, {
      clipboard: {
        writeText: vitest.fn(),
      },
    })
  })

  it('renders the api keys list with columns', () => {
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
  })

  it('can open and close the create modal', () => {
    render(<ApiKeysSettings />)
    fireEvent.click(screen.getByText('Create API Key'))
    expect(screen.getByRole('heading', { name: 'Create API Key' })).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByRole('heading', { name: 'Create API Key' })).not.toBeInTheDocument()
  })

  it('can toggle key visibility and copy to clipboard', () => {
    render(<ApiKeysSettings />)
    
    // Hide initially -> Show
    const showBtns = screen.getAllByText('Show')
    fireEvent.click(showBtns[0])
    expect(screen.getByText('Hide')).toBeInTheDocument()

    // Copy
    const copyBtns = screen.getAllByText('Copy')
    fireEvent.click(copyBtns[0])
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sk_live_51H2K3a...')
  })

  it('handles the revocation flow with typed confirmation', () => {
    render(<ApiKeysSettings />)
    
    // Open revoke modal for Development Key
    const revokeBtns = screen.getAllByText('Revoke')
    fireEvent.click(revokeBtns[1]) // Second key
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to revoke/i)).toBeInTheDocument()
    expect(screen.getAllByText('Development Key').length).toBeGreaterThan(0) // strong tag
    
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

  it('handles the revoke and rotate flow', () => {
    render(<ApiKeysSettings />)
    
    // Open revoke modal for Production API Key
    const revokeBtns = screen.getAllByText('Revoke')
    fireEvent.click(revokeBtns[0])
    
    const input = screen.getByLabelText(/Please type/i)
    fireEvent.change(input, { target: { value: 'Production API Key' } })
    
    const rotateBtn = screen.getByRole('button', { name: 'Revoke & Rotate' })
    expect(rotateBtn).not.toBeDisabled()
    
    // Submit rotate
    fireEvent.click(rotateBtn)
    
    // Key should still be there but with new metadata
    expect(screen.getByText('Production API Key')).toBeInTheDocument()
    // It should say "Never used" because we reset lastUsed
    expect(screen.getByText('Never used')).toBeInTheDocument()
  })

  it('displays a warning for the only-key case', () => {
    render(<ApiKeysSettings />)
    
    // Revoke the first key to leave only one
    fireEvent.click(screen.getAllByText('Revoke')[0])
    fireEvent.change(screen.getByLabelText(/Please type/i), { target: { value: 'Production API Key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Revoke Key' }))
    
    // Now there is only one active key left. Let's try to revoke it.
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
    expect(input).toHaveAttribute('dir', 'auto') // Supports RTL like Arabic seamlessly
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
})
