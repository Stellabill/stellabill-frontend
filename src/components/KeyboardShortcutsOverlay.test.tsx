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

  it('can enter recording mode and edit shortcut', async () => {
    renderOverlay();
    
    const editBtn = screen.getByLabelText(/Edit shortcut for Close dialog/i);
    fireEvent.click(editBtn);

    expect(screen.getByLabelText(/Stop recording for Close dialog/i)).toBeInTheDocument();
    expect(screen.getByText('Press keys...')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    
    // Check if the DOM updated
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  it('detects conflict with other custom shortcut', async () => {
    renderOverlay();
    
    const editBtn = screen.getByLabelText(/Edit shortcut for Close dialog/i);
    fireEvent.click(editBtn);

    // Press mod+K which conflicts with "Open command palette"
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByText(/Conflicts with "Open command palette"/i)).toBeInTheDocument();
    });
  });

  it('detects conflict with reserved OS shortcuts', async () => {
    renderOverlay();
    
    const editBtn = screen.getByLabelText(/Edit shortcut for Close dialog/i);
    fireEvent.click(editBtn);

    // Press mod+T which is reserved
    fireEvent.keyDown(window, { key: 't', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByText(/reserved browser\/OS shortcut/i)).toBeInTheDocument();
    });
  });

  it('allows resetting a custom shortcut to default', async () => {
    renderOverlay();
    
    // Edit "Close dialog"
    const editBtn = screen.getByLabelText(/Edit shortcut for Close dialog/i);
    fireEvent.click(editBtn);

    // Record Alt+C
    fireEvent.keyDown(window, { key: 'c', altKey: true });
    
    // Alt+C shouldn't conflict, it should save and clear recording id
    await waitFor(() => {
      expect(screen.getByLabelText(/Edit shortcut for Close dialog/i)).toBeInTheDocument();
    });

    // Reset button should now be visible
    const resetBtn = screen.getByRole('button', { name: /Reset Close dialog shortcut to default/i });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);

    // Should return to default Esc
    await waitFor(() => {
      expect(screen.getByText('Esc')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Reset Close dialog shortcut to default/i })).not.toBeInTheDocument();
    });
  });

  it('displays modifiers properly while recording', async () => {
    renderOverlay();
    
    const editBtn = screen.getByLabelText(/Edit shortcut for Close dialog/i);
    fireEvent.click(editBtn);

    fireEvent.keyDown(window, { key: 'Shift', shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Shift')).toBeInTheDocument();
    });
    
    // It remains in recording mode
    expect(screen.getByLabelText(/Stop recording for Close dialog/i)).toBeInTheDocument();
  });

  it('aborts recording when pressing Escape', async () => {
    renderOverlay();
    
    const editBtn = screen.getByLabelText(/Edit shortcut for Open command palette/i);
    fireEvent.click(editBtn);

    fireEvent.keyDown(window, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Edit shortcut for Open command palette/i)).toBeInTheDocument();
    });
  });

  it('records Space key properly', async () => {
    renderOverlay();
    
    const editBtn = screen.getByLabelText(/Edit shortcut for Close dialog/i);
    fireEvent.click(editBtn);

    fireEvent.keyDown(window, { key: ' ', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Space')).toBeInTheDocument();
    });
  });
});
