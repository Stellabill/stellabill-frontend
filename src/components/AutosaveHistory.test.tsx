import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import AutosaveHistory from './AutosaveHistory';
import type { AutosaveEntry } from '../hooks/useAutosave';

// Mock relativeTime to return a predictable string
vi.mock('../hooks/useAutosave', async () => {
  const actual = await vi.importActual<any>('../hooks/useAutosave');
  return {
    ...actual,
    relativeTime: (iso: string) => `Mocked time for ${iso}`,
  };
});

describe('AutosaveHistory', () => {
  const mockOnRestore = vi.fn();
  const mockOnClear = vi.fn();

  const mockHistory: AutosaveEntry[] = [
    { savedAt: '2026-09-28T10:00:00Z', data: '{"test":"1"}', label: 'Save 1' },
    { savedAt: '2026-09-28T09:00:00Z', data: '{"test":"2"}', label: 'Save 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (history = mockHistory) => {
    const user = userEvent.setup();
    const result = render(
      <AutosaveHistory
        history={history}
        onRestore={mockOnRestore}
        onClear={mockOnClear}
      />
    );
    return { ...result, user };
  };

  it('renders trigger button correctly', () => {
    setup();
    const trigger = screen.getByRole('button', { name: /Autosave history \(2 entries\)/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens popover when trigger is clicked', async () => {
    const { user } = setup();
    const trigger = screen.getByRole('button', { name: /Autosave history \(2 entries\)/i });
    
    await user.click(trigger);
    
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dialog = screen.getByRole('dialog', { name: 'Autosave history' });
    expect(dialog).toBeInTheDocument();
    
    // History items should be rendered
    expect(screen.getByText('Mocked time for 2026-09-28T10:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('Mocked time for 2026-09-28T09:00:00Z')).toBeInTheDocument();
  });

  it('displays empty state when history is empty', async () => {
    const { user } = setup([]);
    await user.click(screen.getByRole('button', { name: /Autosave history \(0 entries\)/i }));
    
    expect(screen.getByText(/No autosaves yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Clear all/i })).not.toBeInTheDocument();
  });

  it('calls onClear when "Clear all" is clicked', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    
    const clearBtn = screen.getByRole('button', { name: 'Clear all autosave history' });
    await user.click(clearBtn);
    
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('opens confirmation dialog when "Restore" is clicked on an item', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    
    const restoreBtns = screen.getAllByRole('button', { name: /Restore autosave from/i });
    await user.click(restoreBtns[0]);
    
    // Check confirmation dialog opens
    const confirmDialog = screen.getByRole('dialog', { name: 'Confirm restore' });
    expect(confirmDialog).toBeInTheDocument();
    expect(screen.getByText(/Restore this autosave\?/i)).toBeInTheDocument();
  });

  it('cancels restore and closes confirmation dialog', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    
    const restoreBtns = screen.getAllByRole('button', { name: /Restore autosave from/i });
    await user.click(restoreBtns[0]);
    
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelBtn);
    
    expect(screen.queryByRole('dialog', { name: 'Confirm restore' })).not.toBeInTheDocument();
    // Due to the outside click listener, clicking cancel (which is outside the popover ref) also closes the main popover
    expect(screen.queryByRole('dialog', { name: 'Autosave history' })).not.toBeInTheDocument();
  });

  it('confirms restore, calls onRestore, and closes dialogs', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    
    const restoreBtns = screen.getAllByRole('button', { name: /Restore autosave from/i });
    await user.click(restoreBtns[0]);
    
    const confirmBtn = screen.getByRole('button', { name: 'Restore' });
    await user.click(confirmBtn);
    
    expect(mockOnRestore).toHaveBeenCalledTimes(1);
    expect(mockOnRestore).toHaveBeenCalledWith(mockHistory[0]);
    
    // Both dialogs should be closed
    expect(screen.queryByRole('dialog', { name: 'Confirm restore' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Autosave history' })).not.toBeInTheDocument();
  });

  it('closes popover on outside click', async () => {
    const { user } = setup();
    
    render(<div data-testid="outside">Outside Element</div>);
    
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    expect(screen.getByRole('dialog', { name: 'Autosave history' })).toBeInTheDocument();
    
    await user.click(screen.getByTestId('outside'));
    
    expect(screen.queryByRole('dialog', { name: 'Autosave history' })).not.toBeInTheDocument();
  });

  it('closes popover on Escape key', async () => {
    const { user } = setup();
    
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    expect(screen.getByRole('dialog', { name: 'Autosave history' })).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    
    expect(screen.queryByRole('dialog', { name: 'Autosave history' })).not.toBeInTheDocument();
  });

  it('focuses the first button when popover opens', async () => {
    const { user } = setup();
    
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    
    const clearBtn = screen.getByRole('button', { name: 'Clear all autosave history' });
    await waitFor(() => expect(clearBtn).toHaveFocus());
  });

  it('closes confirmation dialog on overlay click', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Autosave history/i }));
    
    const restoreBtns = screen.getAllByRole('button', { name: /Restore autosave from/i });
    await user.click(restoreBtns[0]);
    
    const confirmDialog = screen.getByRole('dialog', { name: 'Confirm restore' });
    
    // Click the overlay (which has the role="dialog")
    await user.click(confirmDialog);
    
    expect(screen.queryByRole('dialog', { name: 'Confirm restore' })).not.toBeInTheDocument();
  });
});
