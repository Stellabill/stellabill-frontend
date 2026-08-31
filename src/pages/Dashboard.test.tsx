import { render, act, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock components
vi.mock('../components/RevenueChart', () => ({
  default: () => <div data-testid="revenue-chart">Mock Chart</div>
}));

vi.mock('../components/Dashboard/RevenueSplitByPlanPanel', () => ({
  default: () => <div data-testid="revenue-split-by-plan">Mock Revenue Split</div>
}));

// Mock Link from react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        Link: ({ children, to, className }: Record<string, unknown>) => <a href={to as string} className={className as string}>{children as React.ReactNode}</a>
    };
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows skeleton loader initially', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(document.querySelector('.dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders dashboard content after loading', async () => {
    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Speed up time to bypass loading and await outstanding microtasks
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(getByText('Dashboard Overview')).toBeInTheDocument();

    // Check for KPIs
    expect(getByText('Active Subscriptions', { selector: '.dashboard-card__title' })).toBeInTheDocument();
    expect(getByText('MRR', { selector: '.dashboard-card__title' })).toBeInTheDocument();
    expect(getByText('Failed Charges', { selector: '.dashboard-card__title' })).toBeInTheDocument();
    expect(getByText('Upcoming Renewals', { selector: '.dashboard-card__title' })).toBeInTheDocument();

    // Check for mock data
    expect(getByText('1,284')).toBeInTheDocument();
    expect(getByText('$42,500')).toBeInTheDocument();

    // Check for Activity List
    expect(getByText('Recent Activity')).toBeInTheDocument();
    expect(getByText('Payment succeeded from John Doe')).toBeInTheDocument();

    // Check for Chart
    expect(getByTestId('revenue-chart')).toBeInTheDocument();
    expect(getByTestId('revenue-split-by-plan')).toBeInTheDocument();
  });

  it('renders action buttons with correct links', async () => {
    const { getByText } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const viewPlansBtn = getByText('View Plans').closest('a');
    const createPlanBtn = getByText('Create Plan').closest('a');
    
    expect(viewPlansBtn).toHaveAttribute('href', '/plans');
    expect(createPlanBtn).toHaveAttribute('href', '/plans?create=true');
  });

  it('renders accessible help hints and opens glossary-backed popovers', async () => {
    const { getByRole } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const mrrHint = getByRole('button', { name: /learn more about mrr/i });
    expect(mrrHint).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(mrrHint);

    expect(mrrHint).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/100 customers pay \$50\/month/i)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      'https://docs.stellarbill.example/glossary/mrr'
    );
  });
});
