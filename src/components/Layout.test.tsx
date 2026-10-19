import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import type { CommandItem } from './CommandPalette';
import { useCommandScope } from '../hooks/useCommandScope';

describe('Layout', () => {
  it('renders the mobile bottom navigation with primary destinations', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/*" element={<Layout />}>
            <Route path="/dashboard" element={<div>Dashboard page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const bottomNav = screen.getByRole('navigation', { name: /primary bottom navigation/i });
    expect(bottomNav).toBeInTheDocument();

    const links = within(bottomNav).getAllByRole('link');
    expect(links).toHaveLength(5);
    expect(within(bottomNav).getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(within(bottomNav).getByRole('link', { name: /subscriptions/i })).toHaveAttribute('href', '/subscriptions');
    expect(within(bottomNav).getByRole('link', { name: /plans/i })).toHaveAttribute('href', '/plans');
    expect(within(bottomNav).getByRole('link', { name: /browse plans/i })).toHaveAttribute('href', '/browse-plans');
    expect(within(bottomNav).getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/settings');
  });

  it('marks the currently active bottom nav item with aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/plans']}>
        <Routes>
          <Route path="/*" element={<Layout />}>
            <Route path="/plans" element={<div>Plans page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const activeLink = screen.getByRole('link', { name: /plans/i });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current');
  });

  describe('keyboard shortcuts', () => {
    const scopedItems: CommandItem[] = [
      { id: 'detail-cancel', label: 'Cancel this subscription', group: 'Actions', perform: () => {} },
    ];

    function DetailPage() {
      useCommandScope('Subscription', scopedItems);
      return <div>Detail page</div>;
    }

    const renderAt = (path: string) =>
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/*" element={<Layout />}>
              <Route path="subscriptions/:id" element={<DetailPage />} />
              <Route path="dashboard" element={<div>Dashboard page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

    beforeEach(() => {
      localStorage.clear();
    });

    it('opens the palette in scoped mode on Cmd+Shift+K after a scope registers', () => {
      renderAt('/subscriptions/42');
      fireEvent.keyDown(document, { key: 'K', metaKey: true, shiftKey: true });

      const dialog = screen.getByRole('dialog', { name: /command palette/i });
      expect(within(dialog).getByText('Subscription')).toBeInTheDocument();
      expect(within(dialog).getByText('Cancel this subscription')).toBeInTheDocument();
    });

    it('pins an item from Recent using the unprefixed id and allows unpinning', () => {
      localStorage.setItem('sb:recent-commands', JSON.stringify(['page-plans']));
      renderAt('/dashboard');
      fireEvent.keyDown(document, { key: 'k', metaKey: true });

      const pinButtons = screen.getAllByRole('button', { name: 'Pin Plans' });
      fireEvent.click(pinButtons[pinButtons.length - 1]);

      expect(JSON.parse(localStorage.getItem('sb:pinned-commands') ?? '[]')).toEqual(['page-plans']);
      expect(screen.getByRole('button', { name: 'Unpin Plans' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Unpin Plans' }));
      expect(JSON.parse(localStorage.getItem('sb:pinned-commands') ?? '[]')).toEqual([]);
    });

    it('lets a non-chord key after "g" through to its normal handler', () => {
      renderAt('/dashboard');
      fireEvent.keyDown(document.body, { key: 'g' });
      fireEvent.keyDown(document.body, { key: '?' });

      expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument();
    });
  });
});
