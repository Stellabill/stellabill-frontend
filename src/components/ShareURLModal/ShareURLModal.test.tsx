/**
 * Tests for the ShareURLModal component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShareURLModal } from './ShareURLModal';

// ─── Default props ─────────────────────────────────────────────────────────────

function defaultProps(
  overrides: Partial<React.ComponentProps<typeof ShareURLModal>> = {},
): React.ComponentProps<typeof ShareURLModal> {
  return {
    isOpen: true,
    onClose: vi.fn(),
    url: 'https://app.stellabill.io/subscriptions?view=abc123',
    viewName: 'Active this month',
    ...overrides,
  };
}

function renderModal(
  overrides: Partial<React.ComponentProps<typeof ShareURLModal>> = {},
) {
  const props = defaultProps(overrides);
  return { ...render(<ShareURLModal {...props} />), props };
}

// ─── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Provide a default working clipboard mock
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ShareURLModal', () => {

  // ── 1. Does not render when isOpen=false ────────────────────────────────────

  it('does not render when isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── 2. Displays the URL ──────────────────────────────────────────────────────

  it('displays the share URL in the input', () => {
    const url = 'https://app.stellabill.io/subscriptions?view=xyz';
    renderModal({ url });

    const input = screen.getByRole('textbox', {
      name: /share url for view/i,
    }) as HTMLInputElement;
    expect(input.value).toBe(url);
    expect(input).toHaveAttribute('readonly');
  });

  // ── 3. Displays the view name in title / description ────────────────────────

  it('displays the view name in the modal description', () => {
    renderModal({ viewName: 'My special view' });
    // The description paragraph contains the view name in a <strong> element
    expect(screen.getByText('My special view')).toBeInTheDocument();
  });

  it('the dialog is labelled with "Share view"', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: /share view/i })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  // ── 4. Copy button copies to clipboard ───────────────────────────────────────

  it('Copy button calls navigator.clipboard.writeText with the URL', async () => {
    const url = 'https://app.stellabill.io/subscriptions?view=abc123';
    renderModal({ url });

    const copyBtn = screen.getByRole('button', { name: /copy url to clipboard/i });
    await userEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
  });

  // ── 5. Copy button shows 'Copied!' feedback after click ──────────────────────

  it('shows "Copied!" text on the Copy button after clicking', async () => {
    renderModal();

    const copyBtn = screen.getByRole('button', { name: /copy url to clipboard/i });
    await userEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /url copied to clipboard/i })).toBeInTheDocument();
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  // ── 6. 'Copied!' text resets after 2s ────────────────────────────────────────

  it('"Copied!" text resets back to "Copy" after 2 seconds', async () => {
    vi.useFakeTimers();

    renderModal();

    const copyBtn = screen.getByRole('button', { name: /copy url to clipboard/i });
    fireEvent.click(copyBtn);

    // The clipboard writeText is async but we can tick microtasks first
    await Promise.resolve();

    // Advance past the 2000ms reset timer
    vi.advanceTimersByTime(2100);

    await waitFor(() => {
      // Button should be back to "Copy"
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
  });

  // ── 7. Escape key calls onClose ──────────────────────────────────────────────

  it('pressing Escape calls onClose', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── 8. Backdrop click calls onClose ──────────────────────────────────────────

  it('clicking the backdrop overlay calls onClose', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    // The overlay is the element with role="dialog" (the outermost div)
    const overlay = screen.getByRole('dialog');
    // Simulate a click that has target === currentTarget (backdrop, not inner panel)
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
