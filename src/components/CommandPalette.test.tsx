import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette, { CommandItem } from './CommandPalette';

const noop = () => {};

/**
 * Regression suite for CommandPalette result grouping and its failure/empty
 * paths. The component owns the closed-state early return
 * (`if (!isOpen) return null;`) that every consumer relies on, plus the
 * empty-result and no-match contracts for each `CommandGroup`.
 */
function makeItems(): CommandItem[] {
  return [
    {
      id: 'page-dashboard',
      label: 'Dashboard',
      group: 'Pages',
      keywords: 'home overview',
      perform: vi.fn(),
    },
    {
      id: 'page-settings',
      label: 'Settings',
      group: 'Pages',
      hint: 'Preferences',
      perform: vi.fn(),
    },
    {
      id: 'action-create-plan',
      label: 'Create plan',
      group: 'Actions',
      hint: 'Start a new billing plan',
      keywords: 'add new plan',
      perform: vi.fn(),
    },
  ];
}

function renderPalette(overrides: Partial<ComponentProps<typeof CommandPalette>> = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  const onTogglePin = vi.fn();
  const items = overrides.items ?? makeItems();
  const utils = render(
    <CommandPalette
      isOpen
      onClose={onClose}
      items={items}
      onSelect={onSelect}
      onTogglePin={onTogglePin}
      {...overrides}
    />,
  );
  // The palette focuses its input via useModalFocus's 50ms timer; focus it
  // explicitly so keyboard events land on the combobox deterministically.
  (screen.getByRole('combobox') as HTMLInputElement).focus();
  return { ...utils, items, onClose, onSelect, onTogglePin };
}

/** Visible label text of each option, in DOM/order-of-render order. */
function optionLabels(): string[] {
  return screen
    .getAllByRole('option')
    .map((option) => option.querySelector('.cmdk-option__label')?.textContent ?? '');
}

describe('CommandPalette — closed state', () => {
  it('returns null (renders nothing) when isOpen is false', () => {
    const { container } = render(
      <CommandPalette isOpen={false} onClose={noop} items={makeItems()} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('unmounts its whole subtree when isOpen flips from true to false', () => {
    const { container, rerender } = renderPalette();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<CommandPalette isOpen={false} onClose={noop} items={makeItems()} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('CommandPalette — open normal path', () => {
  it('renders the dialog, combobox and listbox and exposes all matching options', () => {
    renderPalette();

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    const combobox = screen.getByRole('combobox', { name: 'Search pages and actions' });
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls', 'cmdk-listbox');
    expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument();

    expect(optionLabels()).toEqual(['Dashboard', 'Settings', 'Create plan']);
  });

  it('orders groups by Pages, Pinned, Actions, Recent and keeps the empty Recent bucket', () => {
    renderPalette();

    const listbox = screen.getByRole('listbox', { name: 'Search results' });
    const groups = within(listbox).getAllByRole('group');
    const labels = groups.map((group) => group.getAttribute('aria-labelledby'));

    expect(labels).toEqual(['cmdk-group-pages', 'cmdk-group-actions', 'cmdk-group-recent']);

    // An empty Recent bucket is still rendered (with its empty-state hint)
    // while the query is blank, but the other empty groups are dropped.
    expect(screen.getByText('No recent actions yet.')).toBeInTheDocument();
  });

  it('points aria-activedescendant at the first option and announces the result count', () => {
    renderPalette();

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-activedescendant', 'cmdk-option-page-dashboard');

    expect(
      screen.getByRole('status').textContent,
    ).toContain('3 results available.');
  });

  it('selects the active item on Enter and closes the palette', async () => {
    const { items, onClose, onSelect } = renderPalette();

    await userEvent.keyboard('{Enter}');

    expect(items[0].perform).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'page-dashboard' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves the active option with ArrowDown/ArrowUp and wraps at both ends', async () => {
    const { items, onClose, onSelect } = renderPalette();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      'cmdk-option-page-settings',
    );

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      'cmdk-option-action-create-plan',
    );

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      'cmdk-option-page-dashboard',
    );

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      'cmdk-option-action-create-plan',
    );

    await userEvent.keyboard('{Enter}');
    expect(items[2].perform).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'action-create-plan' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('filters by label, hint and keywords, and reports no match for an unknown query', async () => {
    renderPalette();

    const combobox = screen.getByRole('combobox');

    await userEvent.type(combobox, 'Preferences');
    expect(optionLabels()).toEqual(['Settings']);
    expect(screen.getByRole('status').textContent).toContain('1 result available.');

    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'overview');
    expect(optionLabels()).toEqual(['Dashboard']);

    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'zzz-does-not-exist');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toContain(
      'No results for zzz-does-not-exist.',
    );
  });
});

describe('CommandPalette — empty and boundary inputs', () => {
  it('renders the empty state (not a listbox) when there are zero items', () => {
    renderPalette({ items: [] });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toContain('No results for your search.');
  });

  it('treats missing hint/keywords as empty strings without breaking filtering', async () => {
    const perform = vi.fn();
    const sparseItems: CommandItem[] = [
      { id: 'sparse', label: 'Sparse command', group: 'Actions', perform },
    ];
    renderPalette({ items: sparseItems });

    const combobox = screen.getByRole('combobox');
    await userEvent.type(combobox, 'nope');
    expect(screen.queryAllByRole('option')).toHaveLength(0);

    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'sparse');
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('drops the empty Recent bucket once a query is entered', async () => {
    renderPalette();

    expect(screen.getByText('No recent actions yet.')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('combobox'), 'Dashboard');

    expect(screen.queryByText('No recent actions yet.')).not.toBeInTheDocument();
  });

  it('does not throw when optional callbacks are omitted', async () => {
    const items = makeItems();
    const onClose = vi.fn();
    render(<CommandPalette isOpen onClose={onClose} items={items} />);
    (screen.getByRole('combobox') as HTMLInputElement).focus();

    await userEvent.keyboard('{Enter}');

    expect(items[0].perform).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('short-circuits keyboard navigation while there are no results', async () => {
    renderPalette({ items: [] });

    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Home}{End}{Enter}');

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');
  });

  it('shows the loading state instead of results when isLoading is true', () => {
    renderPalette({ isLoading: true });

    expect(screen.getByText('Searching…')).toBeInTheDocument();
    expect(screen.getByText('Searching…').closest('[aria-busy]')).not.toBeNull();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

describe('CommandPalette — pin and overlay boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onTogglePin without selecting the row when the pin button is clicked', async () => {
    const { onClose, onSelect, onTogglePin } = renderPalette();

    const pinButton = screen.getByRole('button', { name: 'Pin Dashboard' });
    await userEvent.click(pinButton);

    expect(onTogglePin).toHaveBeenCalledWith('page-dashboard');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('labels the pin action as "Unpin" for items already in the Pinned group', () => {
    renderPalette({
      items: [{ id: 'pinned-1', label: 'Pinned item', group: 'Pinned', perform: vi.fn() }],
    });

    expect(screen.getByRole('button', { name: 'Unpin Pinned item' })).toBeInTheDocument();
  });

  it('closes when the overlay itself is pressed but not when the panel is pressed', () => {
    const { container, onClose } = renderPalette();

    const panel = screen.getByRole('dialog');
    fireEvent.mouseDown(panel);
    expect(onClose).not.toHaveBeenCalled();

    const overlay = container.firstElementChild as HTMLElement;
    fireEvent.mouseDown(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CommandPalette — scoped mode boundaries', () => {
  it('shows the scope badge and clears scope via Backspace and the clear button', async () => {
    const onModeChange = vi.fn();
    renderPalette({ mode: 'scoped', scopeName: 'Subscriptions', onModeChange });

    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear scope and search globally' }));
    expect(onModeChange).toHaveBeenCalledWith('global');

    onModeChange.mockClear();
    (screen.getByRole('combobox') as HTMLInputElement).focus();
    await userEvent.keyboard('{Backspace}');
    expect(onModeChange).toHaveBeenCalledWith('global');
  });

  it('falls back to the search icon when scoped mode has no scopeName', () => {
    renderPalette({ mode: 'scoped', scopeName: null, onModeChange: vi.fn() });

    expect(screen.queryByText('Clear scope and search globally')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not clear scope on Backspace in global mode', async () => {
    const onModeChange = vi.fn();
    renderPalette({ mode: 'global', onModeChange });

    await userEvent.keyboard('{Backspace}');

    expect(onModeChange).not.toHaveBeenCalled();
  });
});
