import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import SortBySelect, { type SortOption } from './SortBySelect';

// ---------------------------------------------------------------------------
// jsdom shims
//
// Radix UI Select drives its trigger and content with Pointer Events APIs and
// layout methods that jsdom does not implement. Without these shims opening the
// select throws before any assertion can run.
// ---------------------------------------------------------------------------

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

// ---------------------------------------------------------------------------
// Fixtures / helpers
// ---------------------------------------------------------------------------

/** The three options exported by the component as its default set. */
const DEFAULT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price (low to high)' },
  { value: 'price-high', label: 'Price (high to low)' },
];

const CUSTOM_OPTIONS: SortOption[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'alphabetical', label: 'A → Z' },
  { value: 'recently-updated', label: 'Recently updated' },
];

function getTrigger(): HTMLElement {
  return screen.getByRole('combobox');
}

/** Render the select with a spy for `onValueChange` and a sensible default value. */
function renderSelect(props: Partial<React.ComponentProps<typeof SortBySelect>> = {}) {
  const onValueChange = vi.fn();
  const result = render(
    <SortBySelect value="newest" onValueChange={onValueChange} {...props} />,
  );
  return { onValueChange, ...result };
}

/** Open the select by clicking the trigger. */
async function openSelect(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getTrigger());
}

// ===========================================================================
// Rendering & public contract
// ===========================================================================

describe('SortBySelect — rendering and public contract', () => {
  it('renders a combobox trigger labelled "Sort by" by default', () => {
    renderSelect();

    const trigger = getTrigger();
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-label', 'Sort by');
  });

  it('accepts a custom ariaLabel without changing the rest of the contract', () => {
    renderSelect({ ariaLabel: 'Order plans by' });

    expect(getTrigger()).toHaveAttribute('aria-label', 'Order plans by');
  });

  it('forwards labelId to aria-labelledby and keeps the default aria-label', () => {
    renderSelect({ labelId: 'sort-label' });

    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('aria-labelledby', 'sort-label');
    expect(trigger).toHaveAttribute('aria-label', 'Sort by');
  });

  it('starts collapsed and renders no options until opened', () => {
    renderSelect();

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('reflects the controlled value in the trigger label', () => {
    renderSelect({ value: 'price-low' });

    expect(getTrigger()).toHaveTextContent('Price (low to high)');
  });

  it('does not call onValueChange on mount', () => {
    const { onValueChange } = renderSelect();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('does not mutate the options array it is given', () => {
    const options = [...CUSTOM_OPTIONS];
    renderSelect({ options, value: options[0].value });

    expect(options).toEqual(CUSTOM_OPTIONS);
  });
});

// ===========================================================================
// Default options
// ===========================================================================

describe('SortBySelect — default options', () => {
  it('exposes all three default sort options once opened', async () => {
    const user = userEvent.setup();
    renderSelect();
    await openSelect(user);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(DEFAULT_OPTIONS.length);
    expect(options.map((option) => option.textContent)).toEqual(
      DEFAULT_OPTIONS.map((option) => option.label),
    );
  });

  it('links the open listbox to the trigger via aria-controls', async () => {
    const user = userEvent.setup();
    renderSelect();
    // Capture the trigger before opening: while open Radix marks it aria-hidden.
    const trigger = getTrigger();
    await openSelect(user);

    const listbox = screen.getByRole('listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', listbox.id);
  });

  it('marks only the option matching the current value as selected', async () => {
    const user = userEvent.setup();
    renderSelect({ value: 'price-high' });
    await openSelect(user);

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'true',
    ]);

    // The check indicator is only mounted for the selected option.
    expect(options[2].querySelector('.sort-select__item-indicator')).not.toBeNull();
    expect(options[0].querySelector('.sort-select__item-indicator')).toBeNull();
  });

  it('keeps the selection stable across close/re-open cycles', async () => {
    const user = userEvent.setup();
    renderSelect({ value: 'newest' });

    await openSelect(user);
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Escape}');

    await openSelect(user);
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
  });
});

// ===========================================================================
// SortOption — custom option data
// ===========================================================================

describe('SortBySelect — SortOption inputs', () => {
  it('renders caller-supplied SortOption[] instead of the defaults', async () => {
    const user = userEvent.setup();
    renderSelect({ options: CUSTOM_OPTIONS, value: CUSTOM_OPTIONS[0].value });
    await openSelect(user);

    const labels = screen.getAllByRole('option').map((option) => option.textContent);
    expect(labels).toEqual(CUSTOM_OPTIONS.map((option) => option.label));
    expect(screen.queryByText('Newest')).not.toBeInTheDocument();
  });

  it('displays the option label while selecting by its value', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({
      options: CUSTOM_OPTIONS,
      value: CUSTOM_OPTIONS[0].value,
    });
    await openSelect(user);

    await user.click(screen.getByRole('option', { name: /recently updated/i }));

    expect(onValueChange).toHaveBeenCalledWith('recently-updated');
    expect(onValueChange).not.toHaveBeenCalledWith('Recently updated');
  });

  it('preserves labels containing symbols and non-ASCII text', async () => {
    const user = userEvent.setup();
    renderSelect({
      options: [{ value: 'alpha', label: 'A → Z' }],
      value: 'alpha',
    });
    await openSelect(user);

    expect(screen.getByRole('option', { name: 'A → Z' })).toBeInTheDocument();
  });

  it('handles a single-option list deterministically', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({
      options: [{ value: 'only', label: 'Only choice' }],
      value: 'newest',
    });
    await openSelect(user);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    await user.click(options[0]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('only');
  });

  it('renders an empty option layer for an empty option list without throwing', async () => {
    const user = userEvent.setup();
    renderSelect({ options: [], value: 'newest' });

    const trigger = getTrigger();
    expect(trigger).toBeInTheDocument();

    await openSelect(user);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});

// ===========================================================================
// State transitions
// ===========================================================================

describe('SortBySelect — state transitions', () => {
  it('calls onValueChange exactly once with the clicked value and closes', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({ value: 'newest' });
    await openSelect(user);

    await user.click(screen.getByRole('option', { name: 'Price (low to high)' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('price-low');
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('treats re-selecting the active option as a no-op', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({ value: 'newest' });
    await openSelect(user);

    await user.click(screen.getByRole('option', { name: 'Newest' }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports keyboard selection with ArrowDown + Enter', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({ value: 'newest' });
    await openSelect(user);

    await user.keyboard('{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('price-low');
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape without changing the value', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({ value: 'newest' });
    await openSelect(user);

    await user.keyboard('{Escape}');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('can be opened and dismissed repeatedly without leaking option nodes', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({ value: 'newest' });

    await openSelect(user);
    await user.keyboard('{Escape}');
    await openSelect(user);
    await user.keyboard('{Escape}');

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Invalid inputs & boundary behavior
// ===========================================================================

describe('SortBySelect — invalid inputs and boundaries', () => {
  it('renders an empty trigger when the value matches no option', async () => {
    const user = userEvent.setup();
    renderSelect({ value: 'does-not-exist' });

    expect(getTrigger().textContent).toBe('');

    // The list still opens and exposes the canonical options.
    await openSelect(user);
    expect(screen.getAllByRole('option')).toHaveLength(DEFAULT_OPTIONS.length);
  });

  it('accepts an arbitrary empty string as the controlled value', () => {
    renderSelect({ value: '' });

    expect(getTrigger()).toHaveTextContent('');
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders an option with an empty label and still selects by its value', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({
      options: [{ value: 'blank', label: '' }],
      value: 'newest',
    });
    await openSelect(user);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    await user.click(options[0]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('blank');
  });

  it('emits the value unchanged, including values with whitespace or punctuation', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderSelect({
      options: [{ value: '  spaced/value?x=1  ', label: 'Odd value' }],
      value: 'newest',
    });
    await openSelect(user);

    await user.click(screen.getByRole('option', { name: 'Odd value' }));

    expect(onValueChange).toHaveBeenCalledWith('  spaced/value?x=1  ');
  });
});

// ===========================================================================
// Accessibility affordances
// ===========================================================================

describe('SortBySelect — accessibility affordances', () => {
  it('hides the decorative chevrons from assistive technology', () => {
    renderSelect();

    const icon = getTrigger().querySelector('.sort-select__icon');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the default "Sort by" label even when custom options are supplied', () => {
    renderSelect({ options: CUSTOM_OPTIONS });

    expect(getTrigger()).toHaveAttribute('aria-label', 'Sort by');
  });
});
