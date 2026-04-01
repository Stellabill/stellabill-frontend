import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityList, { ActivityType } from './ActivityList';

describe('ActivityList', () => {
  const mockActivities = [
    {
      id: '1',
      type: 'payment.succeeded' as ActivityType,
      description: 'Payment succeeded from John Doe',
      timestamp: '2 minutes ago',
      amount: '$29.00',
      status: 'success'
    },
    {
      id: '2',
      type: 'payment.failed' as ActivityType,
      description: 'Payment failed for Sarah Smith',
      timestamp: '2 hours ago',
      amount: '$49.00',
      status: 'failed'
    }
  ];

  it('renders activities correctly', () => {
    const { getByText } = render(<ActivityList activities={mockActivities} />);
    expect(getByText('Payment succeeded from John Doe')).toBeInTheDocument();
    expect(getByText('$29.00')).toBeInTheDocument();
    expect(getByText('Payment failed for Sarah Smith')).toBeInTheDocument();
    expect(getByText('$49.00')).toBeInTheDocument();
  });

  it('renders empty state when no activities are provided', () => {
    const { getByText } = render(<ActivityList activities={[]} />);
    expect(getByText('No activity yet')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    const { container } = render(<ActivityList loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders activity statuses correctly', () => {
    const { getByText } = render(<ActivityList activities={mockActivities} />);
    expect(getByText('success')).toBeInTheDocument();
    expect(getByText('failed')).toBeInTheDocument();
  });
});
