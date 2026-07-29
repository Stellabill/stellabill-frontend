import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';

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
});
