import { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette, { CommandItem } from './CommandPalette';

const perform = {
  dashboard: vi.fn(),
  subscriptions: vi.fn(),
  createPlan: vi.fn(),
  recent: vi.fn(),
};

const makeItems = (): CommandItem[] => [
  { id: 'dashboard', label: 'Dashboard', group: 'Pages', keywords: 'home overview', perform: perform.dashboard },
  { id: 'subscriptions', label: 'Subscriptions', group: 'Pages', keywords: 'customers', perform: perform.subscriptions },
  { id: 'create-plan', label: 'Create plan', group: 'Actions', hint: 'New billing plan', perform: perform.createPlan },
  { id: 'recent-dashboard', label: 'Dashboard', group: 'Recent', perform: perform.recent },
];

const onClose = vi.fn();
const onSelect = vi.fn();

function renderOpen(overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  return render(
    <CommandPalette
      isOpen
      onClose={onClose}
      onSelect={onSelect}
      items={makeItems()}
      {...overrides}
    />,
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    onClose.mockClear();
    onSelect.mockClear();
    Object.values(perform).forEach((fn) => fn.mockClear());
  });

  it('renders nothing when closed', () => {
    render(<CommandPalette isOpen={false} onClose={onClose} items={makeItems()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exposes the combobox + listbox ARIA pattern', () => {
    renderOpen();

    const dialog = screen.getByRole('dialog', { name: /command palette/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const combobox = screen.getByRole('combobox', { name: /search pages and actions/i });
    expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls', 'cmdk-listbox');
    // First visible option is active by default.
    expect(combobox).toHaveAttribute('aria-activedescendant', 'cmdk-option-dashboard');

    expect(screen.getByRole('listbox', { name: /search results/i })).toBeInTheDocument();
  });

  it('groups results into Pages, Actions and Recent', () => {
    renderOpen();
    const groups = screen.getAllByRole('group');
    const labels = groups.map((group) => within(group).getByText(/pages|actions|recent/i).textContent);
    expect(labels).toEqual(['Pages', 'Actions', 'Recent']);
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('focuses the input when opened', async () => {
    renderOpen();
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());
  });

  it('filters by label and by keyword, and announces the result count', () => {
    renderOpen();
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'customers' } });
    // Matches "Subscriptions" via its keyword only.
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Subscriptions');
    expect(screen.getByRole('status')).toHaveTextContent('1 result available.');

    fireEvent.change(input, { target: { value: 'dash' } });
    // "Dashboard" appears in both Pages and Recent.
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('2 results available.');
  });

  it('shows the empty state with no matches and collapses the combobox', () => {
    renderOpen();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzz' } });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText(/nothing matches/i)).toHaveTextContent('zzzz');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the slow-load state and ignores keyboard selection', () => {
    renderOpen({ isLoading: true });
    expect(screen.getByText('Searching…')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(perform.dashboard).not.toHaveBeenCalled();
  });

  it('moves the active option with Arrow keys and wraps around', () => {
    renderOpen();
    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-subscriptions');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-dashboard');

    // Wrap to the last item when going up from the first.
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-recent-dashboard');

    // End / Home jump to the extremes.
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-dashboard');
    fireEvent.keyDown(input, { key: 'End' });
    expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-recent-dashboard');
  });

  it('marks the active option with aria-selected', () => {
    renderOpen();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    const selected = screen
      .getAllByRole('option')
      .filter((option) => option.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Subscriptions');
  });

  it('selects the active item with Enter, running perform, onSelect and onClose', () => {
    renderOpen();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(perform.dashboard).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'dashboard' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selects an item on click', () => {
    renderOpen();
    fireEvent.click(screen.getByRole('option', { name: /create plan/i }));
    expect(perform.createPlan).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets the active option on mouse move', () => {
    renderOpen();
    fireEvent.mouseMove(screen.getByRole('option', { name: /create plan/i }));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', 'cmdk-option-create-plan');
  });

  it('ignores arrow navigation when there are no results', () => {
    renderOpen();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'zzzz' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // No active descendant remains because nothing is listed.
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('ignores unrelated keystrokes without selecting', () => {
    renderOpen();
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'a' });
    expect(perform.dashboard).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-dashboard');
  });

  it('renders an option icon when provided', () => {
    render(
      <CommandPalette
        isOpen
        onClose={onClose}
        items={[
          {
            id: 'with-icon',
            label: 'Iconed',
            group: 'Actions',
            icon: <svg data-testid="opt-icon" />,
            perform: vi.fn(),
          },
        ]}
      />,
    );
    expect(screen.getByTestId('opt-icon')).toBeInTheDocument();
  });

  it('closes when the overlay backdrop is clicked but not the panel', () => {
    renderOpen();
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(document.querySelector('.cmdk-overlay') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button data-testid="opener" onClick={() => setOpen(true)}>
            Open
          </button>
          <CommandPalette isOpen={open} onClose={() => setOpen(false)} items={makeItems()} />
        </>
      );
    }
    render(<Harness />);

    const opener = screen.getByTestId('opener');
    opener.focus();
    fireEvent.click(opener);

    const input = await screen.findByRole('combobox');
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
