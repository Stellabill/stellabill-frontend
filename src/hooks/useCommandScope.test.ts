import { useState, type ReactNode } from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { CommandItem } from '../components/CommandPalette';
import type { LayoutContextType } from './useCommandScope';
import { useCommandScope } from './useCommandScope';

const initialItems: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'Pages', perform: vi.fn() },
];

const addedItem: CommandItem = {
  id: 'wallet',
  label: 'Wallet',
  group: 'Pages',
  perform: vi.fn(),
};

function ScopeHarness({ name, items }: { name: string; items: CommandItem[] }) {
  const [currentItems, setCurrentItems] = useState(items);
  useCommandScope(name, currentItems);

  return (
    <button type="button" onClick={() => setCurrentItems([...items, addedItem])}>
      Change items
    </button>
  );
}

function renderWithScope(context: LayoutContextType, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Outlet context={context} />}>
          <Route index element={element} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('useCommandScope', () => {
  it('registers the scope name and items on mount', () => {
    const context = {
      registerScope: vi.fn(),
      clearScope: vi.fn(),
    };

    renderWithScope(context, <ScopeHarness name="pricing" items={initialItems} />);

    expect(context.registerScope).toHaveBeenCalledWith('pricing', initialItems);
  });

  it('clears the scope on unmount', () => {
    const context = {
      registerScope: vi.fn(),
      clearScope: vi.fn(),
    };
    const { unmount } = renderWithScope(
      context,
      <ScopeHarness name="pricing" items={initialItems} />,
    );

    unmount();

    expect(context.clearScope).toHaveBeenCalledTimes(1);
  });

  it('re-registers when the items change', async () => {
    const user = userEvent.setup();
    const context = {
      registerScope: vi.fn(),
      clearScope: vi.fn(),
    };

    renderWithScope(context, <ScopeHarness name="pricing" items={initialItems} />);
    await user.click(screen.getByRole('button', { name: 'Change items' }));

    expect(context.registerScope).toHaveBeenNthCalledWith(1, 'pricing', initialItems);
    expect(context.registerScope).toHaveBeenNthCalledWith(2, 'pricing', [
      ...initialItems,
      addedItem,
    ]);
  });

  it('does not throw when there is no outlet context', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    expect(() =>
      renderHook(() => useCommandScope('pricing', initialItems), { wrapper }),
    ).not.toThrow();
  });
});
