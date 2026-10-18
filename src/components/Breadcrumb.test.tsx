import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb';

function renderBreadcrumb(items: BreadcrumbItem[]): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <Breadcrumb items={items} />
    </MemoryRouter>
  );
}

function separators(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('.breadcrumb__separator'));
}

describe('Breadcrumb', () => {
  it('exposes nav landmark labelled Breadcrumb', () => {
    renderBreadcrumb([{ label: 'Home', to: '/' }]);

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('renders single item as current page span, not a link', () => {
    const { container } = renderBreadcrumb([{ label: 'Browse plans' }]);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    const inner = within(nav).getByText('Browse plans');

    expect(inner.tagName).toBe('SPAN');
    const current = inner.closest('[aria-current="page"]');
    expect(current).toBeInTheDocument();
    expect(current?.textContent).toContain('Browse plans');
    expect(within(nav).queryByRole('link')).not.toBeInTheDocument();
    expect(separators(container)).toHaveLength(0);
  });

  it('renders non-terminal items with `to` as links with expected href', () => {
    renderBreadcrumb([
      { label: 'Home', to: '/' },
      { label: 'Plans', to: '/plans' },
      { label: 'Pro Plan' },
    ]);

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const plansLink = screen.getByRole('link', { name: 'Plans' });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(plansLink).toHaveAttribute('href', '/plans');
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
  });

  it('renders non-terminal item without `to` as plain span without aria-current', () => {
    renderBreadcrumb([{ label: 'Section' }, { label: 'Current' }]);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    const section = within(nav).getByText('Section');

    expect(section.tagName).toBe('SPAN');
    expect(section).not.toHaveAttribute('aria-current');
    expect(within(nav).queryByRole('link', { name: 'Section' })).not.toBeInTheDocument();
  });

  it('renders terminal item as span with aria-current even when `to` is provided', () => {
    renderBreadcrumb([
      { label: 'Home', to: '/' },
      { label: 'Browse plans', to: '/plans' },
    ]);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    const inner = within(nav).getByText('Browse plans');

    expect(inner.tagName).toBe('SPAN');
    const terminal = inner.closest('[aria-current="page"]');
    expect(terminal).toBeInTheDocument();
    expect(terminal?.textContent).toContain('Browse plans');
    expect(within(nav).queryByRole('link', { name: 'Browse plans' })).not.toBeInTheDocument();
    // Only Home remains a link.
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('renders custom icon ReactNode for link and current items', () => {
    const linkIcon = <span data-testid="link-icon">★</span>;
    const currentIcon = <span data-testid="current-icon">◆</span>;

    renderBreadcrumb([
      { label: 'Home', to: '/', icon: linkIcon },
      { label: 'Browse plans', icon: currentIcon },
    ]);

    expect(screen.getByTestId('link-icon')).toBeInTheDocument();
    expect(screen.getByTestId('current-icon')).toBeInTheDocument();
  });

  it('renders empty items array as empty ordered list', () => {
    const { container } = renderBreadcrumb([]);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByRole('list')).toBeInTheDocument();
    expect(container.querySelectorAll('.breadcrumb__item')).toHaveLength(0);
    expect(separators(container)).toHaveLength(0);
  });

  it('renders empty string label deterministically', () => {
    const { container } = renderBreadcrumb([{ label: '' }]);

    const items = container.querySelectorAll('.breadcrumb__item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('');
  });

  it('renders duplicate labels without key collision', () => {
    const { container } = renderBreadcrumb([
      { label: 'Same', to: '/' },
      { label: 'Same' },
    ]);

    // Both labels are present: first as link, last as current.
    expect(screen.getAllByText('Same')).toHaveLength(2);
    expect(container.querySelectorAll('.breadcrumb__item')).toHaveLength(2);
  });

  it('transitions single span to multi-item link plus span via rerender', () => {
    const single: BreadcrumbItem[] = [{ label: 'Browse plans' }];
    const multi: BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Browse plans' },
    ];

    const { container, rerender } = render(
      <MemoryRouter>
        <Breadcrumb items={single} />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).queryByRole('link')).not.toBeInTheDocument();
    expect(separators(container)).toHaveLength(0);

    rerender(
      <MemoryRouter>
        <Breadcrumb items={multi} />
      </MemoryRouter>
    );

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const inner = within(nav).getByText('Browse plans');
    expect(inner.tagName).toBe('SPAN');
    const terminal = inner.closest('[aria-current="page"]');
    expect(terminal).toBeInTheDocument();
    expect(terminal?.textContent).toContain('Browse plans');
    expect(separators(container)).toHaveLength(1);
  });

  it('updates separator count dynamically across rerenders', () => {
    const two: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Plans' }];
    const three: BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Plans', to: '/plans' },
      { label: 'Pro' },
    ];

    const { container, rerender } = render(
      <MemoryRouter>
        <Breadcrumb items={two} />
      </MemoryRouter>
    );

    expect(separators(container)).toHaveLength(1);

    rerender(
      <MemoryRouter>
        <Breadcrumb items={three} />
      </MemoryRouter>
    );

    expect(separators(container)).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Plans' })).toHaveAttribute('href', '/plans');
  });

  it('keeps an accessible list structure for assistive technology', () => {
    const { container } = renderBreadcrumb([
      { label: 'Home', to: '/' },
      { label: 'Browse plans' },
    ]);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByRole('list')).toBeInTheDocument();
    expect(container.querySelectorAll('li.breadcrumb__item')).toHaveLength(2);
  });
});
