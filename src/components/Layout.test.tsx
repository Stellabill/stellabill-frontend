import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';

function renderLayout(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<div>Dashboard page</div>} />
          <Route path="plans" element={<div>Plans page</div>} />
          <Route path="wallet" element={<div>Wallet page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the sidebar navigation with a Wallet destination', () => {
    renderLayout();

    const nav = screen.getByRole('navigation', { name: /^main$/i });
    const links = within(nav).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard',
      '/subscriptions',
      '/plans',
      '/browse-plans',
      '/wallet',
      '/settings',
    ]);

    const walletLink = within(nav).getByRole('link', { name: /wallet/i });
    expect(walletLink).toHaveAttribute('href', '/wallet');
    expect(walletLink.querySelector('svg')).toBeInTheDocument();

    const devNav = screen.getByRole('navigation', { name: /developer/i });
    expect(within(devNav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/brand',
      '/design-tokens',
    ]);
  });

  it('marks the currently active sidebar item with aria-current', () => {
    renderLayout('/plans');

    expect(screen.getByRole('link', { name: /^plans$/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /^dashboard$/i })).not.toHaveAttribute('aria-current');
  });

  it('opens the command palette with Ctrl+K and jumps to the wallet page', async () => {
    const user = userEvent.setup();
    renderLayout();

    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();

    await user.keyboard('{Control>}k{/Control}');

    const dialog = await screen.findByRole('dialog', { name: 'Command palette' });
    const combobox = within(dialog).getByRole('combobox');

    for (const term of ['transactions', 'history', 'stellar']) {
      await user.clear(combobox);
      await user.type(combobox, term);

      const options = within(dialog).getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Wallet');
    }

    await user.click(within(dialog).getAllByRole('option')[0]);

    expect(await screen.findByText('Wallet page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });

  it('opens the command palette with Cmd+K', () => {
    renderLayout();

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });
});
