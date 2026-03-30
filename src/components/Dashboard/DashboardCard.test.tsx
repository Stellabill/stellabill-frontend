import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardCard from './DashboardCard';
import { Users } from 'lucide-react';

describe('DashboardCard', () => {
  it('renders title and value correctly', () => {
    render(<DashboardCard title="Total Users" value="1,000" />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('renders trend and change when provided', () => {
    render(<DashboardCard title="Revenue" value="$5,000" change={10} trend="up" />);
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('vs last 30 days')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    const { container } = render(<DashboardCard title="Loading" value="0" loading={true} />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders icon when provided', () => {
    render(<DashboardCard title="Users" value="100" icon={<Users data-testid="user-icon" />} />);
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('renders help text tooltip icon when provided', () => {
    render(<DashboardCard title="Users" value="100" helpText="Help info" />);
    expect(screen.getByTitle('Help info')).toBeInTheDocument();
  });
});
