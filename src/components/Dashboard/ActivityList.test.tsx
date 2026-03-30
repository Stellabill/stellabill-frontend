import { render, screen } from '@testing-library/react';
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
    render(<ActivityList activities={mockActivities} />);
    expect(screen.getByText('Payment succeeded from John Doe')).toBeInTheDocument();
    expect(screen.getByText('$29.00')).toBeInTheDocument();
    expect(screen.getByText('Payment failed for Sarah Smith')).toBeInTheDocument();
    expect(screen.getByText('$49.00')).toBeInTheDocument();
  });

  it('renders empty state when no activities are provided', () => {
    render(<ActivityList activities={[]} />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    const { container } = render(<ActivityList loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders activity statuses correctly', () => {
    render(<ActivityList activities={mockActivities} />);
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });
});
