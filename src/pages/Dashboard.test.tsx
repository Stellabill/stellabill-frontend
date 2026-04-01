import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Speed up time to bypass loading
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Check for KPIs
    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('Failed Charges')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Renewals')).toBeInTheDocument();

    // Check for mock data
    expect(screen.getByText('1,284')).toBeInTheDocument();
    expect(screen.getByText('$42,500')).toBeInTheDocument();

    // Check for Activity List
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Payment succeeded from John Doe')).toBeInTheDocument();

    // Check for Chart
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
  });

  it('renders action buttons with correct links', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const viewPlansBtn = screen.getByText('View Plans').closest('a');
      const createPlanBtn = screen.getByText('Create Plan').closest('a');
      
      expect(viewPlansBtn).toHaveAttribute('href', '/plans');
      expect(createPlanBtn).toHaveAttribute('href', '/plans?create=true');
    });
  });
});
