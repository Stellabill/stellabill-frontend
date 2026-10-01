import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Minimal mocks for nested components and hooks used by Dashboard.
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('../../components/RevenueChart', () => ({ default: () => <div data-testid="revenue-chart" /> }));
vi.mock('../../components/Dashboard/DashboardCard', () => ({ default: (props: any) => <div data-testid="dashboard-card">{props.title}</div> }));
vi.mock('../../components/Dashboard/ActivityList', () => ({ default: () => <div data-testid="activity-list" /> }));
vi.mock('../../components/Dashboard/DashboardSkeleton', () => ({ default: () => <div data-testid="dashboard-skeleton" /> }));
vi.mock('../../components/Dashboard/RevenueSplitByPlanPanel', () => ({ default: () => <div data-testid="revenue-split" /> }));
vi.mock('../../components/Dashboard/CardErrorSlot', () => ({ default: () => <div data-testid="card-error" /> }));
vi.mock('../../components/Dashboard/OnboardingChecklistWidget', () => ({ default: () => <div data-testid="onboarding" /> }));
vi.mock('../../components/help/HelpHint', () => ({ default: () => <div data-testid="help-hint" /> }));
vi.mock('../../components/ProductTour/ProductTour', () => ({ default: () => null }));
vi.mock('../../components/ProductTour/TourCompletion', () => ({ default: () => null }));
vi.mock('../../components/ProductTour/tourSteps', () => ({ dashboardTourSteps: [] }));

vi.mock('../../hooks/useProductTour', () => ({
  useProductTour: () => ({
    isOpen: false,
    showCompletion: false,
    closeTour: () => {},
    completeTour: () => {},
    dismissTour: () => {},
    closeCompletion: () => {},
  }),
}));

vi.mock('../../hooks/useDashboardWidgets', () => ({
  useDashboardWidgets: () => ({
    widgets: {
      kpi_active_subscriptions: { status: 'success', error: null },
      kpi_mrr: { status: 'success', error: null },
      kpi_failed_charges: { status: 'success', error: null },
      kpi_upcoming_renewals: { status: 'success', error: null },
      chart_revenue: { status: 'success', error: null },
      activity_feed: { status: 'success', error: null },
    },
    loadAll: () => {},
    retryWidget: () => {},
    isInitialLoading: false,
    failedWidgetIds: [],
  }),
}));

vi.mock('../../api/dashboard', () => ({
  dashboardApi: {
    metrics: () => Promise.resolve({ activeSubscriptions: 1284, mrr: 42500, failedCharges: 12, upcomingRenewals: 48 }),
    revenueByPlan: () => Promise.resolve([]),
  },
}));

import Dashboard from '../Dashboard';

describe('Dashboard page', () => {
  it('renders header and KPI titles', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Dashboard Overview/i })).toBeInTheDocument();
    expect(screen.getByText('dashboard.kpis.activeSubscriptions')).toBeInTheDocument();
    expect(screen.getByTestId('revenue-split')).toBeInTheDocument();
  });
});
