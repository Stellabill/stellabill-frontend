import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import OrganizationSettings from './OrganizationSettings'

describe('OrganizationSettings', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    vi.restoreAllMocks()
  })

  // ── Edit mode and profile fields ──────────────────────────────────────

  describe('edit mode and profile fields', () => {
    it('starts in read mode with all profile inputs disabled', () => {
      render(<OrganizationSettings />)

      expect(screen.getByLabelText(/^organization name$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^domain$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^contact email$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^timezone$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^currency$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^language$/i)).toBeDisabled()

      expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument()
    })

    it('toggles input fields when clicking Edit and returns to read mode on Save Changes', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettings />)

      await user.click(screen.getByRole('button', { name: /^edit$/i }))

      expect(screen.getByLabelText(/^organization name$/i)).toBeEnabled()
      expect(screen.getByLabelText(/^domain$/i)).toBeEnabled()
      expect(screen.getByLabelText(/^contact email$/i)).toBeEnabled()
      expect(screen.getByLabelText(/^timezone$/i)).toBeEnabled()
      expect(screen.getByLabelText(/^currency$/i)).toBeEnabled()
      expect(screen.getByLabelText(/^language$/i)).toBeEnabled()
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      expect(screen.getByLabelText(/^organization name$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^domain$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^contact email$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^timezone$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^currency$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^language$/i)).toBeDisabled()
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument()
    })

    it('exits edit mode when clicking Cancel', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettings />)

      await user.click(screen.getByRole('button', { name: /^edit$/i }))
      expect(screen.getByLabelText(/^organization name$/i)).toBeEnabled()

      const cancelButtons = screen.getAllByRole('button', { name: /^cancel$/i })
      await user.click(cancelButtons[0])

      expect(screen.getByLabelText(/^organization name$/i)).toBeDisabled()
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument()
    })

    it('reflects edited organization fields in the rendered values and logs them on save', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettings />)

      await user.click(screen.getByRole('button', { name: /^edit$/i }))

      const nameInput = screen.getByLabelText(/^organization name$/i)
      const domainInput = screen.getByLabelText(/^domain$/i)
      const emailInput = screen.getByLabelText(/^contact email$/i)
      const timezoneSelect = screen.getByLabelText(/^timezone$/i)
      const currencySelect = screen.getByLabelText(/^currency$/i)
      const languageSelect = screen.getByLabelText(/^language$/i)

      await user.clear(nameInput)
      await user.type(nameInput, 'Stellar Labs')
      await user.clear(domainInput)
      await user.type(domainInput, 'stellarlabs.io')
      await user.clear(emailInput)
      await user.type(emailInput, 'ops@stellarlabs.io')
      await user.selectOptions(timezoneSelect, 'Europe/London')
      await user.selectOptions(currencySelect, 'EUR')
      await user.selectOptions(languageSelect, 'en-GB')

      expect(nameInput).toHaveValue('Stellar Labs')
      expect(domainInput).toHaveValue('stellarlabs.io')
      expect(emailInput).toHaveValue('ops@stellarlabs.io')
      expect(timezoneSelect).toHaveValue('Europe/London')
      expect(currencySelect).toHaveValue('EUR')
      expect(languageSelect).toHaveValue('en-GB')

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      expect(consoleLogSpy).toHaveBeenCalledWith('Saving organization data:', {
        name: 'Stellar Labs',
        domain: 'stellarlabs.io',
        email: 'ops@stellarlabs.io',
        timezone: 'Europe/London',
        currency: 'EUR',
        language: 'en-GB',
        avatar: null,
      })

      // Values remain reflected after returning to read mode
      expect(screen.getByLabelText(/^organization name$/i)).toHaveValue('Stellar Labs')
      expect(screen.getByLabelText(/^domain$/i)).toHaveValue('stellarlabs.io')
      expect(screen.getByLabelText(/^contact email$/i)).toHaveValue('ops@stellarlabs.io')
      expect(screen.getByLabelText(/^timezone$/i)).toHaveValue('Europe/London')
      expect(screen.getByLabelText(/^currency$/i)).toHaveValue('EUR')
      expect(screen.getByLabelText(/^language$/i)).toHaveValue('en-GB')
      expect(screen.getByText(/permanently delete "Stellar Labs"/i)).toBeInTheDocument()
    })
  })

  // ── Team members ──────────────────────────────────────────────────────

  describe('team members', () => {
    it('displays member rows with name, email, role and join date', () => {
      render(<OrganizationSettings />)

      expect(screen.getByText('2 members')).toBeInTheDocument()

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@acme.com')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(
        screen.getByText('Joined ' + new Date('2024-01-15').toLocaleDateString()),
      ).toBeInTheDocument()

      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('jane@acme.com')).toBeInTheDocument()
      expect(screen.getByText('Member')).toBeInTheDocument()
      expect(
        screen.getByText('Joined ' + new Date('2024-02-01').toLocaleDateString()),
      ).toBeInTheDocument()
    })
  })

  // ── Delete organization flow ──────────────────────────────────────────

  describe('delete organization flow', () => {
    it('opens confirmation dialog, hides it on cancel, and calls handleDeleteOrganization on confirm', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettings />)

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      // Open confirmation dialog
      await user.click(screen.getByRole('button', { name: /delete organization/i }))
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toBeInTheDocument()
      expect(
        within(dialog).getByRole('heading', { name: /confirm organization deletion/i }),
      ).toBeInTheDocument()

      // Cancel hides the dialog without deleting
      await user.click(within(dialog).getByRole('button', { name: /^cancel$/i }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Deleting organization...')

      // Re-open, type confirmation phrase, and confirm
      await user.click(screen.getByRole('button', { name: /delete organization/i }))
      const reopenedDialog = screen.getByRole('alertdialog')
      const confirmButton = within(reopenedDialog).getByRole('button', {
        name: /^delete organization$/i,
      })
      expect(confirmButton).toBeDisabled()

      const phraseInput = within(reopenedDialog).getByPlaceholderText('DELETE')
      await user.type(phraseInput, 'DELETE')
      expect(confirmButton).toBeEnabled()

      await user.click(confirmButton)

      expect(consoleLogSpy).toHaveBeenCalledWith('Deleting organization...')
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  // ── Avatar upload and removal ─────────────────────────────────────────

  describe('avatar upload and removal', () => {
    it('creates an object URL on upload and revokes it on remove', async () => {
      const user = userEvent.setup()
      const mockObjectUrl = 'blob:http://localhost/org-avatar-123'
      const originalCreateObjectURL = URL.createObjectURL
      const originalRevokeObjectURL = URL.revokeObjectURL
      const createObjectURLMock = vi.fn(() => mockObjectUrl)
      const revokeObjectURLMock = vi.fn()

      Object.defineProperty(URL, 'createObjectURL', {
        value: createObjectURLMock,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: revokeObjectURLMock,
        writable: true,
        configurable: true,
      })

      try {
        render(<OrganizationSettings />)

        expect(
          screen.getByText(/click or drag an image to upload/i),
        ).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /^remove avatar$/i })).not.toBeInTheDocument()

        const file = new File(['avatar-bytes'], 'logo.png', { type: 'image/png' })
        const fileInput = screen.getByTestId('avatar-uploader-input')
        await user.upload(fileInput, file)

        expect(createObjectURLMock).toHaveBeenCalledWith(file)
        expect(consoleLogSpy).toHaveBeenCalledWith('Avatar uploaded:', 'logo.png')
        expect(
          screen.getByText(/hover over the avatar to change or remove the photo/i),
        ).toBeInTheDocument()

        const avatarImg = screen.getByRole('img', { name: /acme corporation/i })
        expect(avatarImg.tagName).toBe('IMG')
        expect(avatarImg).toHaveAttribute('src', mockObjectUrl)

        const removeButton = screen.getByRole('button', { name: /^remove avatar$/i })
        await user.click(removeButton)

        expect(revokeObjectURLMock).toHaveBeenCalledWith(mockObjectUrl)
        expect(screen.queryByRole('button', { name: /^remove avatar$/i })).not.toBeInTheDocument()
        expect(document.querySelector('img[src="blob:http://localhost/org-avatar-123"]')).toBeNull()
        expect(
          screen.getByText(/click or drag an image to upload/i),
        ).toBeInTheDocument()
      } finally {
        Object.defineProperty(URL, 'createObjectURL', {
          value: originalCreateObjectURL,
          writable: true,
          configurable: true,
        })
        Object.defineProperty(URL, 'revokeObjectURL', {
          value: originalRevokeObjectURL,
          writable: true,
          configurable: true,
        })
      }
    })
  })
})
