import { render, screen } from '@testing-library/react';
import RetryTimeline from './RetryTimeline';

describe('RetryTimeline', () => {
  it('renders list of attempts with statuses', () => {
    const attempts = [
      { id: 'a1', when: 'Mar 20', status: 'past' as const },
      { id: 'a2', when: 'Mar 22', status: 'upcoming' as const },
    ];

    render(<RetryTimeline attempts={attempts} />);

    const list = screen.getByRole('list', { name: /Retry schedule/i });
    expect(list).toBeInTheDocument();
    expect(screen.getByText(/Mar 20/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 22/)).toBeInTheDocument();
  });
});
