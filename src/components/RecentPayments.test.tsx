import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecentPayments, { type Payment } from './RecentPayments';

const SAMPLE_PAYMENTS: Payment[] = [
  { id: '1', date: 'Feb 15, 2026', amount: '10 USDC', status: 'success', hash: '0xabc...def123' },
  { id: '2', date: 'Jan 15, 2026', amount: '10 USDC', status: 'success', hash: '0x123...abc456' },
  { id: '3', date: 'Dec 15, 2025', amount: '10 USDC', status: 'success', hash: '0x456...def789' },
  { id: '4', date: 'Dec 1, 2025', amount: '10 USDC', status: 'failed', hash: '' },
  { id: '5', date: 'Nov 15, 2025', amount: '10 USDC', status: 'success', hash: '0x789...ghi012' },
];

describe('RecentPayments', () => {
  it('renders loading skeleton rows when isLoading is true', () => {
    const { container } = render(
      <MemoryRouter>
        <RecentPayments subscriptionId="sub_1" isLoading={true} />
      </MemoryRouter>,
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(5);
    expect(screen.queryByText('No recent payments found.')).not.toBeInTheDocument();
    expect(screen.queryByText('Feb 15, 2026')).not.toBeInTheDocument();
  });

  it('renders empty state when payments is empty and not loading', () => {
    render(
      <MemoryRouter>
        <RecentPayments subscriptionId="sub_1" payments={[]} isLoading={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('No recent payments found.')).toBeInTheDocument();
    expect(screen.queryByText('Feb 15, 2026')).not.toBeInTheDocument();
  });

  it('renders error state when error prop is provided', () => {
    render(
      <MemoryRouter>
        <RecentPayments
          subscriptionId="sub_1"
          payments={[]}
          isLoading={false}
          error="Failed to load recent payments."
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load recent payments.');
    expect(screen.queryByText('No recent payments found.')).not.toBeInTheDocument();
  });

  it('renders populated payment rows from props', () => {
    render(
      <MemoryRouter>
        <RecentPayments subscriptionId="sub_1" payments={SAMPLE_PAYMENTS} isLoading={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Feb 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('0xabc...def123')).toBeInTheDocument();
    expect(screen.getAllByText('Success')).toHaveLength(4);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
