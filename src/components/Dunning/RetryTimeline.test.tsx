import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('shows attempt metadata and opens the explanation popover', async () => {
    const user = userEvent.setup();
    const attempts = [
      {
        id: 'a1',
        when: 'Mar 20',
        status: 'past' as const,
        delta: '2 days ago',
        method: 'Automatic retry',
        successProbability: '92%',
      },
      {
        id: 'a2',
        when: 'Mar 22',
        status: 'upcoming' as const,
        delta: 'Next in 2 days',
        method: 'Smart retry',
        successProbability: '68%',
      },
    ];

    render(<RetryTimeline attempts={attempts} />);

    expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatic retry/i)).toBeInTheDocument();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
    expect(screen.getByText(/Next retry scheduled for Mar 22/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /why these times/i }));

    expect(screen.getByRole('dialog', { name: /why these times/i })).toHaveTextContent(/we use a simple heuristic/i);
  });
});
