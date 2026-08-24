/**
 * Tests for the SaveViewModal component.
 *
 * The modal uses the useModalFocus hook which sets focus via a 50ms setTimeout.
 * We use vi.useFakeTimers where needed to control that timer.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveViewModal } from './SaveViewModal';

// ─── Default props ─────────────────────────────────────────────────────────────

function defaultProps(
  overrides: Partial<React.ComponentProps<typeof SaveViewModal>> = {},
): React.ComponentProps<typeof SaveViewModal> {
  return {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    mode: 'save',
    initialName: '',
    existingNames: [],
    ...overrides,
  };
}

function renderModal(
  overrides: Partial<React.ComponentProps<typeof SaveViewModal>> = {},
) {
  const props = defaultProps(overrides);
  const result = render(<SaveViewModal {...props} />);
  return { ...result, props };
}

// ─── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SaveViewModal', () => {

  // ── 1. Does not render when isOpen=false ────────────────────────────────────

  it('does not render when isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── 2. Renders title 'Save view' in save mode ────────────────────────────────

  it('renders with title "Save view" in save mode', () => {
    renderModal({ mode: 'save' });
    expect(screen.getByRole('heading', { name: /save view/i })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
  });

  // ── 3. Renders title 'Rename view' in rename mode ────────────────────────────

  it('renders with title "Rename view" in rename mode', () => {
    renderModal({ mode: 'rename', initialName: 'Old name' });
    expect(screen.getByRole('heading', { name: /rename view/i })).toBeInTheDocument();
  });

  // ── 4. Input is focused on open ──────────────────────────────────────────────

  it('input receives focus when the modal opens', async () => {
    vi.useFakeTimers();
    renderModal();

    // Advance the 50ms timer used by useModalFocus
    vi.advanceTimersByTime(100);

    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: /view name/i });
      expect(document.activeElement).toBe(input);
    });
  });

  // ── 5. Shows pre-filled name in rename mode ───────────────────────────────────

  it('pre-fills the input with initialName in rename mode', () => {
    renderModal({ mode: 'rename', initialName: 'My saved view' });
    const input = screen.getByRole('textbox', { name: /view name/i });
    expect(input).toHaveValue('My saved view');
  });

  // ── 6. Calls onSave with input value on Save button click ──────────────────

  it('calls onSave with the entered name when Save button is clicked', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSave, onClose });

    const input = screen.getByRole('textbox', { name: /view name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'New view name');

    const saveBtn = screen.getByRole('button', { name: /save view/i });
    await userEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith('New view name');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── 7. Shows validation error for empty name ──────────────────────────────────

  it('shows a validation error when the name is empty and Save is clicked', async () => {
    renderModal();
    const saveBtn = screen.getByRole('button', { name: /save view/i });
    await userEvent.click(saveBtn);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
  });

  // ── 8. Shows validation error for duplicate name ──────────────────────────────

  it('shows a validation error when the name is a duplicate', async () => {
    renderModal({ existingNames: ['Active this month'] });

    const input = screen.getByRole('textbox', { name: /view name/i });
    await userEvent.type(input, 'Active this month');

    const saveBtn = screen.getByRole('button', { name: /save view/i });
    await userEvent.click(saveBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i);
  });

  // ── 9. Shows character count ──────────────────────────────────────────────────

  it('shows a character count reflecting the current input length', async () => {
    renderModal();

    const input = screen.getByRole('textbox', { name: /view name/i });
    await userEvent.type(input, 'Hello');

    // Character count e.g. "5/50"
    expect(screen.getByText('5/50')).toBeInTheDocument();
  });

  // ── 10. Does not allow more than 50 chars ─────────────────────────────────────

  it('input has maxLength of 50', () => {
    renderModal();
    const input = screen.getByRole('textbox', { name: /view name/i });
    expect(input).toHaveAttribute('maxlength', '50');
  });

  // ── 11. Enter key submits ─────────────────────────────────────────────────────

  it('pressing Enter in the input submits the form when the name is valid', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSave, onClose });

    const input = screen.getByRole('textbox', { name: /view name/i });
    await userEvent.type(input, 'Valid name');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSave).toHaveBeenCalledWith('Valid name');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── 12. Escape key calls onClose ─────────────────────────────────────────────

  it('pressing Escape calls onClose', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    // useModalFocus listens to document keydown for Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── 13. Cancel button calls onClose ──────────────────────────────────────────

  it('Cancel button calls onClose', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── 14. Clears error when input changes ──────────────────────────────────────

  it('clears the validation error when the user changes the input after a failed submit', async () => {
    renderModal();

    // Trigger the error
    const saveBtn = screen.getByRole('button', { name: /save view/i });
    await userEvent.click(saveBtn);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Start typing — error should clear
    const input = screen.getByRole('textbox', { name: /view name/i });
    await userEvent.type(input, 'a');

    // The error element might disappear or its text is updated; either way
    // there should be no "Name is required" error visible.
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });
});
