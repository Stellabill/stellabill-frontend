import { render, act, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import Dashboard from './Dashboard';

const dashboardWidgetsMock = vi.hoisted(() => ({
  filters: [] as Array<{ status?: 'active'; planId?: string; range?: 'last30Days' }>,
  loads: [] as Array<{ status?: 'active'; planId?: string; range?: 'last30Days' }>,
  initialLoading: false,
}));

vi.mock('../hooks/useDashboardWidgets', async () => {
  const { useCallback } = await import('react');
  const widgets = {
    kpi_active_subscriptions: { status: 'success', error: null },
    kpi_mrr: { status: 'success', error: null },
    kpi_failed_charges: { status: 'success', error: null },
    kpi_upcoming_renewals: { status: 'success', error: null },
    chart_revenue: { status: 'success', error: null },
    activity_feed: { status: 'success', error: null },
  };

  return {
    useDashboardWidgets: (filters: {
      status?: 'active';
      planId?: string;
      range?: 'last30Days';
    }) => {
      dashboardWidgetsMock.filters.push({ ...filters });
      const loadAll = useCallback(() => {
        dashboardWidgetsMock.loads.push({ ...filters });
      }, [filters.status, filters.planId, filters.range]);

      return {
        widgets,
        loadAll,
        retryWidget: () => {},
        isInitialLoading: dashboardWidgetsMock.initialLoading,
        failedWidgetIds: [],
      };
    },
  };
});

// Mock components
vi.mock('../components/RevenueChart', () => ({
  default: () => <div data-testid="revenue-chart">Mock Chart</div>
}));

vi.mock('../components/Dashboard/RevenueSplitByPlanPanel', () => ({
  default: ({ plans }: { plans: Array<{ planId: string; planName: string }> }) => (
    <div data-testid="revenue-split-by-plan">
      {plans.map((plan) => <span key={plan.planId}>{plan.planName}</span>)}
    </div>
}));

// Mock Link from react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        Link: ({ children, to, className }: Record<string, unknown>) => <a href={to as string} className={className as string}>{children as React.ReactNode}</a>
    };
});

function SearchParamsProbe() {
  const [searchParams] = useSearchParams();
  return <output data-testid="dashboard-search-params">{searchParams.toString()}</output>;
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem('stellabill.dashboard.savedFilters');
    dashboardWidgetsMock.filters = [];
    dashboardWidgetsMock.loads = [];
    dashboardWidgetsMock.initialLoading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.removeItem('stellabill.dashboard.savedFilters');
  });

  it('shows skeleton loader initially', () => {
    dashboardWidgetsMock.initialLoading = true;
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(document.querySelector('.dashboard-skeleton')).toBeInTheDocument();
    dashboardWidgetsMock.initialLoading = false;
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

  it('reloads widgets with updated filters and applies them to mock data and the URL', () => {
    render(
      <MemoryRouter>
        <Dashboard />
        <SearchParamsProbe />
      </MemoryRouter>
    );

    expect(dashboardWidgetsMock.loads[dashboardWidgetsMock.loads.length - 1]).toEqual({
      status: 'active',
      planId: 'pro',
      range: 'last30Days',
    });
    expect(screen.getByText('Pro', { selector: '[data-testid="revenue-split-by-plan"] span' })).toBeInTheDocument();
    expect(screen.queryByText('Enterprise 10')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Plan: Pro' }));

    expect(dashboardWidgetsMock.loads[dashboardWidgetsMock.loads.length - 1]).toEqual({
      status: 'active',
      range: 'last30Days',
    });
    expect(screen.getByText('Enterprise 10')).toBeInTheDocument();
    expect(screen.getByText('Business', { selector: '[data-testid="revenue-split-by-plan"] span' })).toBeInTheDocument();
    expect(new URLSearchParams(screen.getByTestId('dashboard-search-params').textContent ?? '').has('planId')).toBe(false);
  });

  it('saves and restores the selected filters and announces storage failures', () => {
    const firstRender = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Plan: Pro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save View' }));

    expect(localStorage.getItem('stellabill.dashboard.savedFilters')).toBe(
      JSON.stringify({ status: 'active', range: 'last30Days' }),
    );
    expect(screen.getByText('Filter view saved successfully.')).toBeInTheDocument();

    firstRender.unmount();
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: 'Remove filter Plan: Pro' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove filter Status: Active' })).toBeInTheDocument();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save View' }));
    expect(screen.getByText(/Unable to save the filter view/i)).toBeInTheDocument();
  });
});
