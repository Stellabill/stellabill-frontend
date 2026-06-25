import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KeyboardShortcutsOverlay, { ShortcutGroup } from './KeyboardShortcutsOverlay';

const mockShortcuts: ShortcutGroup[] = [
  {
    name: 'navigation',
    title: 'Navigation',
    shortcuts: [
      {
        id: 'command-palette',
        label: 'Open command palette',
        keys: ['mod', 'K'],
        description: 'Quick access',
        hiddenOnMobile: true,
      },
      {
        id: 'close',
        label: 'Close dialog',
        keys: ['Esc'],
      },
    ],
  },
  {
    name: 'help',
    title: 'Help',
    shortcuts: [
      {
        id: 'show-shortcuts',
        label: 'Show shortcuts',
        keys: ['?'],
      },
    ],
  },
];

function renderOverlay(overrides: Partial<React.ComponentProps<typeof KeyboardShortcutsOverlay>> = {}) {
  const onClose = vi.fn();
  return {
    ...render(
      <KeyboardShortcutsOverlay
        isOpen
        onClose={onClose}
        shortcuts={mockShortcuts}
        {...overrides}
      />
    ),
    onClose,
  };
}

describe('KeyboardShortcutsOverlay', () => {
  beforeEach(() => {
    // Mock navigator.platform for consistent test behavior
    Object.defineProperty(globalThis.navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });
  });

  it('renders nothing when closed', () => {
    render(<KeyboardShortcutsOverlay isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exposes ARIA dialog pattern', () => {
    renderOverlay();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'kb-shortcuts-title');
    expect(screen.getByText('Keyboard Shortcuts')).toHaveAttribute('id', 'kb-shortcuts-title');
  });

  it('renders all shortcut groups and items', () => {
    renderOverlay();

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Close dialog')).toBeInTheDocument();
    expect(screen.getByText('Show shortcuts')).toBeInTheDocument();
  });

  it('renders shortcut descriptions when provided', () => {
    renderOverlay();
    expect(screen.getByText('Quick access')).toBeInTheDocument();
  });

  it('renders platform-aware modifier keys (macOS)', () => {
    Object.defineProperty(globalThis.navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    renderOverlay();

    // Look for ⌘ symbol on Mac
    const kbdElements = screen.getAllByText('⌘');
    expect(kbdElements.length).toBeGreaterThan(0);
  });

  it('renders platform-aware modifier keys (Windows)', () => {
    Object.defineProperty(globalThis.navigator, 'platform', {
      value: 'Win32',
      writable: true,
      configurable: true,
    });

    renderOverlay();

    // Look for Ctrl on Windows
    const kbdElements = screen.getAllByText('Ctrl');
    expect(kbdElements.length).toBeGreaterThan(0);
  });

  it('uses semantic <kbd> elements for key display', () => {
    renderOverlay();

    // Query by class to find <kbd> elements
    const kbdElements = document.querySelectorAll('.kb-shortcuts-key');
    expect(kbdElements.length).toBeGreaterThan(0);

    // Check that they are actually <kbd> elements
    kbdElements.forEach((el) => {
      expect(el.tagName).toBe('KBD');
    });
  });

  it('focuses the close button when opened', async () => {
    renderOverlay();

    const closeButton = screen.getByRole('button', { name: /close keyboard shortcuts/i });
    await waitFor(() => expect(closeButton).toHaveFocus());
  });

  it('closes when the close button is clicked', () => {
    const { onClose } = renderOverlay();

    const closeButton = screen.getByRole('button', { name: /close keyboard shortcuts/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', async () => {
    const { onClose } = renderOverlay();

    const closeButton = screen.getByRole('button', { name: /close keyboard shortcuts/i });
    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent.keyDown(closeButton, { key: 'Escape' });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('closes when backdrop is clicked', () => {
    const { onClose } = renderOverlay();

    const overlay = document.querySelector('.kb-shortcuts-overlay');
    expect(overlay).toBeInTheDocument();

    fireEvent.mouseDown(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the panel', () => {
    const { onClose } = renderOverlay();

    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps focus within the dialog', async () => {
    renderOverlay();

    const closeButton = screen.getByRole('button', { name: /close keyboard shortcuts/i });
    const printButton = screen.getByRole('button', { name: /print keyboard shortcuts/i });

    await waitFor(() => expect(closeButton).toHaveFocus());

    // Tab forward should cycle within dialog
    fireEvent.keyDown(closeButton, { key: 'Tab' });
    await waitFor(() => expect(printButton).toHaveFocus());

    // Shift+Tab backward from close button should go to last element
    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    // The useModalFocus hook manages this — we verify it doesn't escape
    expect(document.activeElement).not.toBe(document.body);
  });

  it('restores focus to trigger on close', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button data-testid="opener" onClick={() => setOpen(true)}>
            Open Shortcuts
          </button>
          <KeyboardShortcutsOverlay isOpen={open} onClose={() => setOpen(false)} />
        </>
      );
    }

    render(<Harness />);

    const opener = screen.getByTestId('opener');
    opener.focus();
    fireEvent.click(opener);

    const closeButton = await screen.findByRole('button', { name: /close keyboard shortcuts/i });
    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent.keyDown(closeButton, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('renders the print button with correct label', () => {
    renderOverlay();

    const printButton = screen.getByRole('button', { name: /print keyboard shortcuts cheatsheet/i });
    expect(printButton).toBeInTheDocument();
    expect(printButton).toHaveTextContent('Print Cheatsheet');
  });

  it('calls window.print when print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    renderOverlay();

    const printButton = screen.getByRole('button', { name: /print keyboard shortcuts cheatsheet/i });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it('applies desktop-only class to shortcuts marked hiddenOnMobile', () => {
    renderOverlay();

    // Find the shortcut item with hiddenOnMobile: true
    const commandPaletteLabel = screen.getByText('Open command palette');
    const item = commandPaletteLabel.closest('.kb-shortcuts-item');

    expect(item).toHaveClass('kb-shortcuts-item--desktop-only');
  });

  it('does not apply desktop-only class to normal shortcuts', () => {
    renderOverlay();

    const closeLabel = screen.getByText('Close dialog');
    const item = closeLabel.closest('.kb-shortcuts-item');

    expect(item).not.toHaveClass('kb-shortcuts-item--desktop-only');
  });

  it('uses default shortcuts when none provided', () => {
    render(<KeyboardShortcutsOverlay isOpen onClose={vi.fn()} />);

    // Should render default Navigation and Help groups
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
  });

  it('has accessible close button with SVG icon', () => {
    renderOverlay();

    const closeButton = screen.getByRole('button', { name: /close keyboard shortcuts/i });
    const svg = closeButton.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('has accessible print button with SVG icon', () => {
    renderOverlay();

    const printButton = screen.getByRole('button', { name: /print keyboard shortcuts cheatsheet/i });
    const svg = printButton.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('displays Esc hint in footer', () => {
    renderOverlay();

    expect(screen.getByText(/press/i)).toBeInTheDocument();
    expect(screen.getByText(/to close/i)).toBeInTheDocument();

    const escKbd = screen.getByText('Esc');
    expect(escKbd.tagName).toBe('KBD');
  });

  it('renders multiple keys with plus separators', () => {
    const multiKeyShortcuts: ShortcutGroup[] = [
      {
        name: 'test',
        title: 'Test',
        shortcuts: [
          {
            id: 'multi',
            label: 'Multi-key shortcut',
            keys: ['mod', 'Shift', 'P'],
          },
        ],
      },
    ];

    render(
      <KeyboardShortcutsOverlay isOpen onClose={vi.fn()} shortcuts={multiKeyShortcuts} />
    );

    // Should render three separate <kbd> elements
    const kbdElements = document.querySelectorAll('.kb-shortcuts-key');
    expect(kbdElements.length).toBeGreaterThanOrEqual(3);
  });
});
