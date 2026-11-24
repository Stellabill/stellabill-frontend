import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsageThisPeriod from './UsageThisPeriod';

describe('UsageThisPeriod', () => {
  it('renders billing period, usage, and estimated charge when provided', () => {
    render(
      <UsageThisPeriod
        billingPeriod="Nov 1 – Nov 30, 2026"
        usage="14,250 requests"
        estimatedCharge="12.50 USDC"
        onViewFullUsage={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Usage this period' })).toBeInTheDocument();
    expect(screen.getByText('Billing period')).toBeInTheDocument();
    expect(screen.getByText('Nov 1 – Nov 30, 2026')).toBeInTheDocument();
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('14,250 requests')).toBeInTheDocument();
    expect(screen.getByText('Estimated charge')).toBeInTheDocument();
    expect(screen.getByText('12.50 USDC')).toBeInTheDocument();
    expect(screen.queryByText('No usage this period')).not.toBeInTheDocument();
  });

  it('shows empty state instead of metric panels when all values are undefined', () => {
    render(<UsageThisPeriod />);

    expect(screen.getByText('No usage this period')).toBeInTheDocument();
    expect(screen.queryByText('Billing period')).not.toBeInTheDocument();
    expect(screen.queryByText('Usage')).not.toBeInTheDocument();
    expect(screen.queryByText('Estimated charge')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View full usage details' })).not.toBeInTheDocument();
  });

  it('shows empty state instead of metric panels when all values are null', () => {
    render(
      <UsageThisPeriod
        billingPeriod={null}
        usage={null}
        estimatedCharge={null}
        onViewFullUsage={vi.fn()}
      />,
    );

    expect(screen.getByText('No usage this period')).toBeInTheDocument();
    expect(screen.queryByText('Billing period')).not.toBeInTheDocument();
    expect(screen.queryByText('Usage')).not.toBeInTheDocument();
    expect(screen.queryByText('Estimated charge')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View full usage details' })).not.toBeInTheDocument();
  });

  it('renders fallback em-dash for missing fields when partial usage data is provided', () => {
    render(
      <UsageThisPeriod
        billingPeriod="Nov 1 – Nov 30, 2026"
        usage={null}
        estimatedCharge={undefined}
      />,
    );

    expect(screen.queryByText('No usage this period')).not.toBeInTheDocument();
    expect(screen.getByText('Nov 1 – Nov 30, 2026')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('calls onViewFullUsage when the View full usage details button is clicked', async () => {
    const user = userEvent.setup();
    const onViewFullUsage = vi.fn();

    render(
      <UsageThisPeriod
        billingPeriod="Nov 1 – Nov 30, 2026"
        usage="14,250 requests"
        estimatedCharge="12.50 USDC"
        onViewFullUsage={onViewFullUsage}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'View full usage details' }));
    expect(onViewFullUsage).toHaveBeenCalledTimes(1);
  });

  it('still renders the View full usage details button when usage data exists and onViewFullUsage is omitted', async () => {
    const user = userEvent.setup();

    render(
      <UsageThisPeriod
        billingPeriod="Nov 1 – Nov 30, 2026"
        usage="14,250 requests"
        estimatedCharge="12.50 USDC"
      />,
    );

    const button = screen.getByRole('button', { name: 'View full usage details' });
    expect(button).toBeInTheDocument();
    await expect(user.click(button)).resolves.toBeUndefined();
  });
});
