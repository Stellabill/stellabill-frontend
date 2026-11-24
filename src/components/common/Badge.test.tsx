import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Badge from './Badge';

describe('Badge', () => {
  it('uses the default variant when variant is omitted', () => {
    render(<Badge data-testid="badge">Standard</Badge>);
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveTextContent('Standard');
    expect(badge).toHaveClass(
      'inline-flex',
      'bg-slate-800',
      'text-slate-300',
      'border',
      'border-slate-700',
    );
    expect(badge.querySelector('span')).toBeNull();
  });

  it('renders the default variant explicitly with its class set', () => {
    render(
      <Badge variant="default" data-testid="badge">
        Default
      </Badge>,
    );
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveTextContent('Default');
    expect(badge).toHaveClass('bg-slate-800', 'text-slate-300', 'border-slate-700');
  });

  it('renders the active variant with its class set and status dot', () => {
    render(
      <Badge variant="active" data-testid="badge">
        Active
      </Badge>,
    );
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveTextContent('Active');
    expect(badge).toHaveClass('bg-green-500/10', 'text-green-400', 'border-green-500/30');
    const dot = badge.querySelector('span.bg-green-400');
    expect(dot).toBeInTheDocument();
  });

  it('renders the draft variant with its class set and without an active dot', () => {
    render(
      <Badge variant="draft" data-testid="badge">
        Draft
      </Badge>,
    );
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveTextContent('Draft');
    expect(badge).toHaveClass('bg-slate-700', 'text-slate-400', 'border-slate-600');
    expect(badge.querySelector('span')).toBeNull();
  });

  it('renders the recommended variant with cta-badge-recommended class and dot', () => {
    render(
      <Badge variant="recommended" data-testid="badge">
        Popular
      </Badge>,
    );
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveTextContent('Popular');
    expect(badge).toHaveClass('cta-badge-recommended');
    expect(badge).not.toHaveClass('bg-slate-800');
    expect(badge.querySelector('.cta-badge-dot')).toBeInTheDocument();
  });

  it('merges custom className for standard and recommended variants', () => {
    const { rerender } = render(
      <Badge variant="active" className="custom-badge" data-testid="badge">
        Active
      </Badge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-green-500/10', 'custom-badge');

    rerender(
      <Badge variant="recommended" className="promo-badge" data-testid="badge">
        Recommended
      </Badge>,
    );
    expect(screen.getByTestId('badge')).toHaveClass('cta-badge-recommended', 'promo-badge');
  });

  it('forwards extra span attributes and event handlers', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Badge
        data-testid="forwarded-badge"
        id="plan-status"
        aria-label="Plan status active"
        title="Currently active"
        onClick={handleClick}
      >
        Active
      </Badge>,
    );

    const badge = screen.getByTestId('forwarded-badge');
    expect(badge).toHaveAttribute('id', 'plan-status');
    expect(badge).toHaveAttribute('aria-label', 'Plan status active');
    expect(badge).toHaveAttribute('title', 'Currently active');

    await user.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
