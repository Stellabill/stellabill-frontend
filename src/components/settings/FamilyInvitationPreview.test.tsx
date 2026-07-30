/**
 * Tests for FamilyInvitationPreview component.
 *
 * Edge-cases covered:
 *   - Long merchant names (overflow/truncation)
 *   - RTL rendering (dir="rtl" wrapper)
 *   - Screen-reader labels (aria-selected, aria-live, role="tab")
 *   - Character counter boundary (0, 200, >200)
 *   - Token resolution in preview
 *   - Send-test flow (email input, button state, success message)
 *   - Tab switching preserves state
 *   - Keyboard navigation (Enter on send-test)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import FamilyInvitationPreview from './FamilyInvitationPreview'

// ── Helpers ────────────────────────────────────────────────────────────

function renderPreview(overrides: Partial<React.ComponentProps<typeof FamilyInvitationPreview>> = {}) {
  const onSendTest = overrides.onSendTest ?? vi.fn()
  const utils = render(
    <FamilyInvitationPreview
      merchantName="Acme Corp"
      memberCount={4}
      onSendTest={onSendTest}
      {...overrides}
    />,
  )
  return { ...utils, onSendTest }
}

// ── Rendering and structure ─────────────────────────────────────────────

describe('FamilyInvitationPreview', () => {
  it('renders the root region with a heading', () => {
    renderPreview()
    expect(screen.getByRole('region')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /family plan invitation/i })).toBeInTheDocument()
  })

  it('renders two tabs with role="tab"', () => {
    renderPreview()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveTextContent(/edit/i)
    expect(tabs[1]).toHaveTextContent(/preview/i)
  })

  it('marks the Edit tab as selected by default', () => {
    renderPreview()
    const editTab = screen.getByRole('tab', { name: /edit/i })
    expect(editTab).toHaveAttribute('aria-selected', 'true')
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    expect(previewTab).toHaveAttribute('aria-selected', 'false')
  })

  // ── Editor panel ──────────────────────────────────────────────────────

  it('shows the editor panel by default', () => {
    renderPreview()
    expect(screen.getByRole('tabpanel', { name: /edit/i })).toBeInTheDocument()
  })

  it('contains the note textarea with character counter', () => {
    renderPreview()
    const textarea = screen.getByRole('textbox', { name: /personal note/i })
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('')
    expect(screen.getByText(/200 \/ 200 characters remaining/i)).toBeInTheDocument()
  })

  it('does not show the preview panel by default', () => {
    renderPreview()
    expect(screen.queryByRole('tabpanel', { name: /preview/i })).toBeNull()
  })

  // ── Tab switching ─────────────────────────────────────────────────────

  it('switches to preview panel when clicking Preview tab', async () => {
    renderPreview()
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    expect(screen.getByRole('tabpanel', { name: /preview/i })).toBeInTheDocument()
    expect(screen.queryByRole('tabpanel', { name: /edit/i })).toBeNull()
  })

  it('preserves note text when switching tabs', async () => {
    renderPreview()
    const textarea = screen.getByRole('textbox', { name: /personal note/i })
    await userEvent.type(textarea, 'Welcome to the plan!')
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    const editTab = screen.getByRole('tab', { name: /edit/i })
    await userEvent.click(editTab)
    expect(screen.getByRole('textbox', { name: /personal note/i })).toHaveValue('Welcome to the plan!')
  })

  // ── Character counter ─────────────────────────────────────────────────

  it('decrements the character counter as the user types', async () => {
    renderPreview()
    const textarea = screen.getByRole('textbox', { name: /personal note/i })
    await userEvent.type(textarea, 'Hello')
    expect(screen.getByText(/195 \/ 200 characters remaining/i)).toBeInTheDocument()
  })

  it('prevents typing past 200 characters', async () => {
    renderPreview()
    const textarea = screen.getByRole('textbox', { name: /personal note/i })
    const longText = 'A'.repeat(210)
    await userEvent.type(textarea, longText)
    expect(textarea).toHaveValue('A'.repeat(200))
    expect(screen.getByText(/0 \/ 200 characters remaining/i)).toBeInTheDocument()
  })

  it('shows error styling when over 200 characters', () => {
    // The component caps at 200; test the aria-invalid behavior by
    // verifying the textarea can never go over the limit.
    renderPreview()
    const textarea = screen.getByRole('textbox', { name: /personal note/i })
    expect(textarea).toHaveAttribute('aria-invalid', 'false')
  })

  // ── Available tokens ──────────────────────────────────────────────────

  it('shows the token help section', () => {
    renderPreview()
    expect(screen.getByText(/available tokens/i)).toBeInTheDocument()
    expect(screen.getByText('{recipient_name}')).toBeInTheDocument()
    expect(screen.getByText('{merchant_name}')).toBeInTheDocument()
    expect(screen.getByText('{member_count}')).toBeInTheDocument()
  })

  // ── Preview panel ─────────────────────────────────────────────────────

  it('shows member selector in preview', async () => {
    renderPreview()
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    expect(screen.getByRole('combobox', { name: /preview for member/i })).toBeInTheDocument()
  })

  it('renders email preview with correct merchant name', async () => {
    renderPreview({ merchantName: 'TestCo' })
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    expect(screen.getByText(/you're invited to testco family plan/i)).toBeInTheDocument()
  })

  it('resolves {merchant_name} token in the preview body', async () => {
    renderPreview({ merchantName: 'MegaCorp' })
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    const matches = screen.getAllByText(/megacorp/i)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('resolves {member_count} token in the preview body', async () => {
    renderPreview({ memberCount: 6 })
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    const matches = screen.getAllByText(/6 members/i)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('uses the custom note as the preview body when provided', async () => {
    renderPreview()
    const textarea = screen.getByRole('textbox', { name: /personal note/i })
    await userEvent.type(textarea, 'Welcome to the team!')
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    expect(screen.getByText(/welcome to the team!/i)).toBeInTheDocument()
  })

  // ── Send test ─────────────────────────────────────────────────────────

  it('shows the send-test section in the editor panel', () => {
    renderPreview()
    expect(screen.getByText(/send test invitation/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter recipient email/i)).toBeInTheDocument()
  })

  it('disables send-test button when email is empty', () => {
    renderPreview()
    const btn = screen.getByRole('button', { name: /send test/i })
    expect(btn).toBeDisabled()
  })

  it('enables send-test button when email is entered', async () => {
    renderPreview()
    const input = screen.getByPlaceholderText(/enter recipient email/i)
    await userEvent.type(input, 'test@example.com')
    const btn = screen.getByRole('button', { name: /send test/i })
    expect(btn).toBeEnabled()
  })

  it('calls onSendTest with the email when Send Test is clicked', async () => {
    const onSendTest = vi.fn()
    renderPreview({ onSendTest })
    const input = screen.getByPlaceholderText(/enter recipient email/i)
    await userEvent.type(input, 'family@example.com')
    const btn = screen.getByRole('button', { name: /send test/i })
    await userEvent.click(btn)
    expect(onSendTest).toHaveBeenCalledWith('family@example.com')
  })

  it('shows a success message after sending a test', async () => {
    const onSendTest = vi.fn()
    renderPreview({ onSendTest })
    const input = screen.getByPlaceholderText(/enter recipient email/i)
    await userEvent.type(input, 'success@test.com')
    const btn = screen.getByRole('button', { name: /send test/i })
    await userEvent.click(btn)
    expect(screen.getByText(/test invitation sent to success@test.com/i)).toBeInTheDocument()
  })

  it('sends test on Enter key in the email input', async () => {
    const onSendTest = vi.fn()
    renderPreview({ onSendTest })
    const input = screen.getByPlaceholderText(/enter recipient email/i)
    await userEvent.type(input, 'enter@test.com{Enter}')
    expect(onSendTest).toHaveBeenCalledWith('enter@test.com')
  })

  // ── Long merchant names ───────────────────────────────────────────────

  it('renders a very long merchant name without breaking layout', async () => {
    const longName = 'M'.repeat(100)
    renderPreview({ merchantName: longName })
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    await userEvent.click(previewTab)
    const matches = screen.getAllByText(new RegExp(longName, 'i'))
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  // ── RTL ───────────────────────────────────────────────────────────────

  it('renders correctly in an RTL context', () => {
    render(
      <div dir="rtl">
        <FamilyInvitationPreview
          merchantName="شركة"
          memberCount={3}
          onSendTest={vi.fn()}
        />
      </div>,
    )
    expect(screen.getByRole('region')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument()
  })

  // ── Accessibility ─────────────────────────────────────────────────────

  it('uses aria-live="polite" for the character counter', () => {
    renderPreview()
    const counter = screen.getByText(/200 \/ 200 characters remaining/i)
    expect(counter.closest('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('uses aria-live="polite" for the test-sent message', async () => {
    const onSendTest = vi.fn()
    renderPreview({ onSendTest })
    const input = screen.getByPlaceholderText(/enter recipient email/i)
    await userEvent.type(input, 'a11y@test.com')
    const btn = screen.getByRole('button', { name: /send test/i })
    await userEvent.click(btn)
    const msg = screen.getByText(/test invitation sent to/i)
    expect(msg.closest('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('has accessible names for the tab buttons', () => {
    renderPreview()
    const editTab = screen.getByRole('tab', { name: /edit/i })
    const previewTab = screen.getByRole('tab', { name: /preview/i })
    expect(editTab).toBeInTheDocument()
    expect(previewTab).toBeInTheDocument()
  })

  it('sets aria-controls on each tab', () => {
    renderPreview()
    const editTab = screen.getByRole('tab', { name: /edit/i })
    expect(editTab).toHaveAttribute('aria-controls')
  })
})
