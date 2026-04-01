import { render, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock components
vi.mock('../components/RevenueChart', () => ({
  default: () => <div data-testid="revenue-chart">Mock Chart</div>
}));

// Mock Link from react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>
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
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders dashboard content after loading', async () => {
    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Speed up time to bypass loading
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Check for KPIs
    expect(getByText('Active Subscriptions')).toBeInTheDocument();
    expect(getByText('MRR')).toBeInTheDocument();
    expect(getByText('Failed Charges')).toBeInTheDocument();
    expect(getByText('Upcoming Renewals')).toBeInTheDocument();

    // Check for mock data
    expect(getByText('1,284')).toBeInTheDocument();
    expect(getByText('$42,500')).toBeInTheDocument();

    // Check for Activity List
    expect(getByText('Recent Activity')).toBeInTheDocument();
    expect(getByText('Payment succeeded from John Doe')).toBeInTheDocument();

    // Check for Chart
    expect(getByTestId('revenue-chart')).toBeInTheDocument();
  });

  it('renders action buttons with correct links', async () => {
    const { getByText } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const viewPlansBtn = getByText('View Plans').closest('a');
      const createPlanBtn = getByText('Create Plan').closest('a');
      
      expect(viewPlansBtn).toHaveAttribute('href', '/plans');
      expect(createPlanBtn).toHaveAttribute('href', '/plans?create=true');
    });
  });
});
