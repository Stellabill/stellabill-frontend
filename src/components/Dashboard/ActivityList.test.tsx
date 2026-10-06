import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityList, { ActivityType } from './ActivityList';

describe('ActivityList Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders loading state correctly', () => {
    render(<ActivityList loading={true} />);
    
    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer).toHaveAttribute('aria-busy', 'true');
    expect(loadingContainer).toHaveAttribute('aria-label', 'Loading recent activity');
    // Should render 5 skeleton items
    const skeletons = loadingContainer.querySelectorAll('.activity-list__skeleton-item');
    expect(skeletons.length).toBe(5);
  });

  it('renders empty state when no activities are provided', () => {
    render(<ActivityList activities={[]} loading={false} />);
    
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('Transactions and events will appear here as they happen.')).toBeInTheDocument();
  });

  it('renders a list of valid activities correctly', () => {
    const mockActivities = [
      {
        id: '1',
        type: 'subscription.created' as ActivityType,
        description: 'Subscription created for Basic Plan',
        timestamp: '2 mins ago',
      },
      {
        id: '2',
        type: 'payment.succeeded' as ActivityType,
        description: 'Payment successful',
        timestamp: '1 hour ago',
        amount: '$10.00',
        status: 'success',
      },
      {
        id: '3',
        type: 'payment.failed' as ActivityType,
        description: 'Payment failed',
        timestamp: '2 hours ago',
        amount: '$10.00',
        status: 'failed',
      },
      {
        id: '4',
        type: 'subscription.cancelled' as ActivityType,
        description: 'Subscription cancelled',
        timestamp: '1 day ago',
      },
      {
        id: '5',
        type: 'renewal.upcoming' as ActivityType,
        description: 'Renewal upcoming',
        timestamp: '2 days ago',
      },
    ];

    render(<ActivityList activities={mockActivities} loading={false} />);

    // Descriptions
    expect(screen.getByText('Subscription created for Basic Plan')).toBeInTheDocument();
    expect(screen.getByText('Payment successful')).toBeInTheDocument();
    expect(screen.getByText('Payment failed')).toBeInTheDocument();
    expect(screen.getByText('Subscription cancelled')).toBeInTheDocument();
    expect(screen.getByText('Renewal upcoming')).toBeInTheDocument();

    // Timestamps
    expect(screen.getByText('2 mins ago')).toBeInTheDocument();
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();

    // Amounts
    const amounts = screen.getAllByText('$10.00');
    expect(amounts).toHaveLength(2);

    // Statuses
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('success')).toHaveClass('activity-list__status--success');
    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(screen.getByText('failed')).toHaveClass('activity-list__status--failed');
  });

  it('handles invalid activity types gracefully', () => {
    const invalidActivities = [
      {
        id: 'unknown-1',
        type: 'invalid.type' as ActivityType,
        description: 'This is an unknown activity type',
        timestamp: 'Just now',
      }
    ];

    const { container } = render(<ActivityList activities={invalidActivities} loading={false} />);
    
    // It should render the description
    expect(screen.getByText('This is an unknown activity type')).toBeInTheDocument();
    
    // It should fallback to 'subscription.cancelled' icon and class (activity-list__icon--muted)
    const iconContainer = container.querySelector('.activity-list__icon');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('activity-list__icon--muted');
  });
});
