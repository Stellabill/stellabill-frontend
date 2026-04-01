import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardCard from './DashboardCard';
import { Users } from 'lucide-react';

describe('DashboardCard', () => {
  it('renders title and value correctly', () => {
    const { getByText } = render(<DashboardCard title="Total Users" value="1,000" />);
    expect(getByText('Total Users')).toBeInTheDocument();
    expect(getByText('1,000')).toBeInTheDocument();
  });

  it('renders trend and change when provided', () => {
    const { getByText } = render(<DashboardCard title="Revenue" value="$5,000" change={10} trend="up" />);
    expect(getByText('10%')).toBeInTheDocument();
    expect(getByText('vs last 30 days')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    const { container } = render(<DashboardCard title="Loading" value="0" loading={true} />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders icon when provided', () => {
    const { getByTestId } = render(<DashboardCard title="Users" value="100" icon={<Users data-testid="user-icon" />} />);
    expect(getByTestId('user-icon')).toBeInTheDocument();
  });

  it('renders help text tooltip icon when provided', () => {
    const { getByTitle } = render(<DashboardCard title="Users" value="100" helpText="Help info" />);
    const tooltipIcon = getByTitle('Help info');
    expect(tooltipIcon).toBeInTheDocument();
  });
});
