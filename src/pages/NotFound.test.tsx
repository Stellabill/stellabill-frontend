import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NotFound />
    </MemoryRouter>
  );
}

describe('NotFound page', () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the 404 heading', () => {
    renderAt('/some/unknown/path');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('displays the attempted pathname in the description', () => {
    renderAt('/deep/invalid/route');
    expect(screen.getByText(/\/deep\/invalid\/route/)).toBeInTheDocument();
  });

  it('has a main landmark with an accessible label', () => {
    renderAt('/unknown');
    expect(screen.getByRole('main', { name: /page not found/i })).toBeInTheDocument();
  });

  it('has a recovery nav landmark', () => {
    renderAt('/unknown');
    expect(screen.getByRole('navigation', { name: /recovery links/i })).toBeInTheDocument();
  });

  // ── Public path CTAs ─────────────────────────────────────────────────────

  it('shows "Go to Home" and "View Pricing" for public paths', () => {
    renderAt('/some-public-page');
    expect(screen.getByRole('link', { name: /go to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /view pricing/i })).toHaveAttribute('href', '/pricing');
  });

  it('shows "Contact Support" link for public paths', () => {
    renderAt('/unknown');
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      'mailto:support@stellabill.com'
    );
  });

  // ── Shell / authenticated path CTAs ──────────────────────────────────────

  it('shows "Go to Dashboard" for /dashboard/* paths', () => {
    renderAt('/dashboard/nonexistent');
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });

  it('shows "Browse Plans" for /plans/* paths', () => {
    renderAt('/plans/nonexistent');
    expect(screen.getByRole('link', { name: /browse plans/i })).toHaveAttribute('href', '/plans');
  });

  it('shows "Contact Support" for shell paths', () => {
    renderAt('/subscriptions/bad-id');
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      'mailto:support@stellabill.com'
    );
  });

  it('does NOT show "Go to Home" for shell paths', () => {
    renderAt('/dashboard/missing');
    expect(screen.queryByRole('link', { name: /go to home/i })).not.toBeInTheDocument();
  });

  it('does NOT show "Go to Dashboard" for public paths', () => {
    renderAt('/unknown-public');
    expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument();
  });

  // ── Shell prefix detection ────────────────────────────────────────────────

  it.each([
    '/subscriptions',
    '/subscriptions/abc123',
    '/plans',
    '/plans/create',
    '/browse-plans',
    '/settings',
    '/ui-kit',
    '/brand',
  ])('treats %s as a shell path', (path) => {
    renderAt(path);
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it.each(['/', '/pricing', '/about-prepaid-balances', '/totally-unknown'])(
    'treats %s as a public path',
    (path) => {
      renderAt(path);
      expect(screen.getByRole('link', { name: /go to home/i })).toBeInTheDocument();
    }
  );

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('heading has tabIndex -1 to receive programmatic focus', () => {
    renderAt('/unknown');
    const heading = screen.getByRole('heading', { name: /page not found/i });
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('primary CTA has a visible focus-visible class', () => {
    renderAt('/unknown');
    const primaryLink = screen.getByRole('link', { name: /go to home/i });
    expect(primaryLink.className).toMatch(/focus-visible/);
  });

  it('decorative 404 number is hidden from assistive technology', () => {
    renderAt('/unknown');
    // The decorative div carries aria-hidden="true"
    const decorative = document.querySelector('[aria-hidden="true"]');
    expect(decorative).toBeInTheDocument();
    expect(decorative?.textContent).toBe('404');
  });
});
