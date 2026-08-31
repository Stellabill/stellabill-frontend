import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardCard, { formatDelta, clampTargetProgress } from './DashboardCard';

vi.mock('../common/Sparkline', () => ({
  default: ({ data, 'aria-label': ariaLabel }: { data: number[]; 'aria-label'?: string }) => (
    <svg data-testid="sparkline" data-points={data.length} aria-label={ariaLabel ?? 'Sparkline chart'} />
  ),
}));

describe('formatDelta', () => {
  it('keeps integers as-is', () => {
    expect(formatDelta(12)).toBe('12');
    expect(formatDelta(0)).toBe('0');
  });

  it('rounds fractional values to one decimal place', () => {
    expect(formatDelta(12.5)).toBe('12.5');
    expect(formatDelta(8.24)).toBe('8.2');
  });

  it('compacts thousands into K notation', () => {
    expect(formatDelta(1250)).toBe('1.3K');
    expect(formatDelta(12000)).toBe('12K');
  });

  it('handles negative deltas by magnitude', () => {
    expect(formatDelta(-4.1)).toBe('4.1');
    expect(formatDelta(-1200)).toBe('1.2K');
  });
});

describe('clampTargetProgress', () => {
  it('clamps values to the 0-100 bar range', () => {
    expect(clampTargetProgress(50)).toBe(50);
    expect(clampTargetProgress(-20)).toBe(0);
    expect(clampTargetProgress(150)).toBe(100);
  });

  it('returns 0 for non-finite input', () => {
    expect(clampTargetProgress(Number.NaN)).toBe(0);
    expect(clampTargetProgress(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('DashboardCard variants', () => {
  it('renders the value-only variant', () => {
    render(<DashboardCard title="Upcoming Renewals" value="48" />);
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.queryByText(/vs last 30 days/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
    expect(screen.queryByText(/Goal:/)).not.toBeInTheDocument();
  });

  it('renders the value + delta variant with sign, icon, and color', () => {
    render(<DashboardCard title="MRR" value="$42,500" change={8.2} trend="up" />);
    expect(screen.getByText('$42,500')).toBeInTheDocument();
    expect(screen.getByText('+8.2')).toBeInTheDocument();
    expect(screen.getByText('vs last 30 days')).toBeInTheDocument();
    const trend = screen.getByRole('status');
    expect(trend).toHaveClass('dashboard-card__trend--up');
    expect(trend.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a down delta with a minus sign', () => {
    render(<DashboardCard title="Failed Charges" value="12" change={-4.1} trend="down" />);
    expect(screen.getByText('-4.1')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('dashboard-card__trend--down');
  });

  it('shows a neutral zero delta without a sign', () => {
    render(<DashboardCard title="Flat" value="10" change={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('dashboard-card__trend--neutral');
  });

  it('infers the direction from the sign of the change', () => {
    render(<DashboardCard title="MRR" value="10" change={5} />);
    expect(screen.getByRole('status')).toHaveClass('dashboard-card__trend--up');
  });

  it('uses a custom delta label when provided', () => {
    render(
      <DashboardCard title="MRR" value="10" change={2} trend="up" deltaLabel="vs last month" />
    );
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('renders the value + sparkline variant', () => {
    render(
      <DashboardCard title="MRR" value="$42,500" sparklineData={[10, 20, 30, 40]} />
    );
    const sparkline = screen.getByTestId('sparkline');
    expect(sparkline).toBeInTheDocument();
    expect(sparkline).toHaveAttribute('data-points', '4');
    expect(sparkline).toHaveAttribute('aria-label', 'MRR trend');
  });

  it('does not render a sparkline for fewer than two points', () => {
    render(<DashboardCard title="MRR" value="$42,500" sparklineData={[10]} />);
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
  });

  it('renders the value + target variant with goal text', () => {
    render(<DashboardCard title="Active Subscriptions" value="1,284" target={1500} />);
    expect(screen.getByText('Goal: 1500')).toBeInTheDocument();
    expect(screen.getByText('Goal: 1500').closest('.dashboard-card')).toHaveClass(
      'dashboard-card--with-target'
    );
  });

  it('supports a custom target label', () => {
    render(<DashboardCard title="MRR" value="$42,500" target={50000} targetLabel="Annual Goal" />);
    expect(screen.getByText('Annual Goal: 50000')).toBeInTheDocument();
  });

  it('renders target progress percentage and bar', () => {
    render(<DashboardCard title="MRR" value="$42,500" target={50000} targetProgress={85} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    const fill = document.querySelector('.dashboard-card__target-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('85%');
    expect(screen.getByText('85 percent of target')).toBeInTheDocument();
  });

  it('renders negative target progress with danger styling and empty bar', () => {
    render(<DashboardCard title="MRR" value="$30,000" target={50000} targetProgress={-20} />);
    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(document.querySelector('.dashboard-card__target-progress')).toHaveClass(
      'dashboard-card__target-progress--negative'
    );
    const fill = document.querySelector('.dashboard-card__target-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
    expect(screen.getByText('Behind target by 20 percent')).toBeInTheDocument();
  });

  it('clamps over-100% target progress to a full bar', () => {
    render(<DashboardCard title="MRR" value="$60,000" target={50000} targetProgress={120} />);
    const fill = document.querySelector('.dashboard-card__target-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });
});

describe('DashboardCard chrome', () => {
  it('renders the title, icon, and help tooltip', () => {
    const { container } = render(
      <DashboardCard title="MRR" value="$42,500" icon={<span>i</span>} helpText="Some help." />
    );
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(container.querySelector('.dashboard-card__icon')).toBeInTheDocument();
    expect(container.querySelector('.dashboard-card__help')).toHaveAttribute('title', 'Some help.');
  });

  it('renders the loading skeleton instead of content', () => {
    render(<DashboardCard title="MRR" value="$42,500" loading />);
    expect(document.querySelector('.dashboard-card--loading')).toBeInTheDocument();
    expect(screen.queryByText('$42,500')).not.toBeInTheDocument();
  });

  it('renders the error slot and forwards retry', () => {
    const onRetry = vi.fn();
    render(
      <DashboardCard
        title="MRR"
        value="$42,500"
        error="Failed to load"
        onRetry={onRetry}
        retrying={false}
      />
    );
    expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('applies custom root attributes through rest props', () => {
    render(<DashboardCard title="MRR" value="$42,500" data-testid="card" />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
