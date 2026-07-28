import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanStatusTimeline, { TimelineEvent } from './PlanStatusTimeline';

describe('PlanStatusTimeline', () => {
  it('renders the timeline header and filter group', () => {
    render(<PlanStatusTimeline />);

    expect(screen.getByRole('heading', { name: /subscription activity timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /filter timeline events/i })).toBeInTheDocument();
  });

  it('shows day groups and only the initial events before expanding', () => {
    render(<PlanStatusTimeline />);

    expect(screen.getByText(/monday, february 10, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/wednesday, february 15, 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load older activity/i })).toBeInTheDocument();
  });

  it('expands to show older activity when load older is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanStatusTimeline />);

    const loadOlderButton = screen.getByRole('button', { name: /load older activity/i });
    await user.click(loadOlderButton);

    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
    expect(screen.getByText(/subscription cancelled/i)).toBeInTheDocument();
  });

  it('filters to payment events only', async () => {
    const user = userEvent.setup();
    render(<PlanStatusTimeline />);

    const paymentsChip = screen.getByRole('button', { name: /payments/i });
    await user.click(paymentsChip);

    expect(paymentsChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText(/payment successful/i)).toHaveLength(2);
    expect(screen.queryByText(/subscription created/i)).not.toBeInTheDocument();
  });

  it('shows no results state when a filter matches no events', async () => {
    const user = userEvent.setup();
    const events: TimelineEvent[] = [
      {
        id: '1',
        type: 'Created',
        status: 'Subscription created',
        actor: 'System',
        timestamp: 'Feb 10, 2026, 10:30 AM'
      }
    ];

    render(<PlanStatusTimeline events={events} />);

    const paymentsChip = screen.getByRole('button', { name: /payments/i });
    await user.click(paymentsChip);

    expect(screen.getByText(/no events found for this filter/i)).toBeInTheDocument();
  });
});
