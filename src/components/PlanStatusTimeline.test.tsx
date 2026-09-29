import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanStatusTimeline, { TimelineEvent, TimelineEventType } from './PlanStatusTimeline';

const EVENT_TYPES: TimelineEventType[] = [
  'Created',
  'Activated',
  'Paused',
  'Resumed',
  'Cancelled',
  'Payment',
];

function makeEvent(overrides: Partial<TimelineEvent> & { id: string }): TimelineEvent {
  return {
    type: 'Created',
    status: 'Status for ' + overrides.id,
    actor: 'Ada',
    timestamp: 'Mar 02, 2026, 10:00 AM',
    ...overrides,
  };
}

describe('PlanStatusTimeline', () => {
  it('renders the timeline header and filter group', () => {
    render(<PlanStatusTimeline />);

    expect(screen.getByRole('heading', { name: /subscription activity timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /filter timeline events/i })).toBeInTheDocument();
  });

  it('shows day groups and only the initial events before expanding', () => {
    const { container } = render(<PlanStatusTimeline />);

    // Newest-first: Mar 20 / Mar 15 / Mar 10 are visible, oldest Feb 10 is collapsed.
    expect(screen.getByText(/march 20, 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load older activity/i })).toBeInTheDocument();
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    expect(screen.queryByText('Subscription created')).not.toBeInTheDocument();
  });

  it('expands to show older activity when load older is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanStatusTimeline />);

    const loadOlderButton = screen.getByRole('button', { name: /load older activity/i });
    await user.click(loadOlderButton);

    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    expect(screen.getAllByText(/payment successful/i)).toHaveLength(2);
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

  it.each(EVENT_TYPES)('renders TimelineEventType badge and icon for %s', (type) => {
    const { container } = render(
      <PlanStatusTimeline
        events={[
          makeEvent({
            id: 'type-' + type,
            type,
            status: 'Status for ' + type,
            actor: 'Ada',
            timestamp: 'Mar 02, 2026, 10:00 AM',
          }),
        ]}
      />
    );

    expect(screen.getByText('Status for ' + type)).toBeInTheDocument();
    // Type badge rendered per event.
    expect(screen.getByText(type)).toBeInTheDocument();
    // EventIcon renders a lucide svg inside the list item.
    const item = container.querySelector('[role="listitem"]');
    expect(item).toBeInTheDocument();
    expect(item && within(item as HTMLElement).getByText(type)).toBeInTheDocument();
    expect(item && (item as HTMLElement).querySelector('svg')).toBeInTheDocument();
  });

  it('falls back to System actor when actor is undefined', () => {
    render(
      <PlanStatusTimeline
        events={[
          makeEvent({
            id: 'no-actor',
            status: 'Actor fallback check',
            actor: undefined,
            timestamp: 'Mar 02, 2026, 10:00 AM',
          }),
        ]}
      />
    );

    expect(screen.getByText('Actor fallback check')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders a custom actor string when provided', () => {
    render(
      <PlanStatusTimeline
        events={[
          makeEvent({
            id: 'custom-actor',
            status: 'Custom actor check',
            actor: 'Chukwuemeka',
            timestamp: 'Mar 02, 2026, 10:00 AM',
          }),
        ]}
      />
    );

    expect(screen.getByText('Chukwuemeka')).toBeInTheDocument();
  });

  it('renders details when present and omits cleanly when absent', () => {
    const withDetails: TimelineEvent = makeEvent({
      id: 'with-details',
      status: 'Details present check',
      timestamp: 'Mar 02, 2026, 10:00 AM',
      details: '10 USDC - Period: Mar 02 - Apr 02',
    });
    const withoutDetails: TimelineEvent = makeEvent({
      id: 'without-details',
      status: 'Details absent check',
      timestamp: 'Mar 03, 2026, 10:00 AM',
      details: undefined,
    });

    const { container } = render(<PlanStatusTimeline events={[withDetails, withoutDetails]} />);

    expect(screen.getByText('10 USDC - Period: Mar 02 - Apr 02')).toBeInTheDocument();
    expect(screen.getByText('Details absent check')).toBeInTheDocument();
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(2);
  });

  it('classifies All, Payment, User actions, and System events filters with aria-pressed', async () => {
    const user = userEvent.setup();
    const events: TimelineEvent[] = [
      makeEvent({
        id: 'user-1',
        type: 'Created',
        status: 'User created workspace',
        actor: 'Ada',
        timestamp: 'Mar 02, 2026, 10:00 AM',
      }),
      makeEvent({
        id: 'system-1',
        type: 'Activated',
        status: 'Plan activated by system',
        actor: 'System',
        timestamp: 'Mar 03, 2026, 10:00 AM',
      }),
      makeEvent({
        id: 'payment-1',
        type: 'Payment',
        status: 'Payment successful',
        actor: 'System',
        timestamp: 'Mar 04, 2026, 10:00 AM',
        details: '10 USDC',
      }),
    ];
    render(<PlanStatusTimeline events={events} />);

    const allChip = screen.getByRole('button', { name: /all activity/i });
    const paymentsChip = screen.getByRole('button', { name: /payments/i });
    const userChip = screen.getByRole('button', { name: /user actions/i });
    const systemChip = screen.getByRole('button', { name: /system events/i });

    expect(allChip).toHaveAttribute('aria-pressed', 'true');

    await user.click(paymentsChip);
    expect(paymentsChip).toHaveAttribute('aria-pressed', 'true');
    expect(allChip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Payment successful')).toBeInTheDocument();
    expect(screen.queryByText('User created workspace')).not.toBeInTheDocument();
    expect(screen.queryByText('Plan activated by system')).not.toBeInTheDocument();

    await user.click(userChip);
    expect(userChip).toHaveAttribute('aria-pressed', 'true');
    expect(paymentsChip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('User created workspace')).toBeInTheDocument();
    expect(screen.queryByText('Payment successful')).not.toBeInTheDocument();

    await user.click(systemChip);
    expect(systemChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Plan activated by system')).toBeInTheDocument();
    expect(screen.queryByText('Payment successful')).not.toBeInTheDocument();
    expect(screen.queryByText('User created workspace')).not.toBeInTheDocument();

    await user.click(allChip);
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('User created workspace')).toBeInTheDocument();
    expect(screen.getByText('Plan activated by system')).toBeInTheDocument();
    expect(screen.getByText('Payment successful')).toBeInTheDocument();
  });

  it('completes the expand and collapse cycle from 3 items to all and back', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanStatusTimeline />);

    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /load older activity/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /load older activity/i }));
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(7);
    expect(screen.getByRole('button', { name: /show less/i })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: /show less/i }));
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /load older activity/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show less/i })).not.toBeInTheDocument();
  });

  it('resets to collapsed state when the active filter changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanStatusTimeline />);

    await user.click(screen.getByRole('button', { name: /load older activity/i }));
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(7);

    await user.click(screen.getByRole('button', { name: /user actions/i }));
    expect(screen.getByRole('button', { name: /user actions/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    // User bucket has 4 events, so collapsed view shows 3 plus the expand control.
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /load older activity/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show less/i })).not.toBeInTheDocument();
  });

  it('sorts unsorted timestamps in descending order in the rendered DOM', () => {
    const events: TimelineEvent[] = [
      makeEvent({
        id: 'oldest',
        status: 'Oldest event status',
        timestamp: 'Mar 02, 2026, 10:00 AM',
      }),
      makeEvent({
        id: 'newest',
        status: 'Newest event status',
        timestamp: 'Mar 04, 2026, 10:00 AM',
      }),
      makeEvent({
        id: 'middle',
        status: 'Middle event status',
        timestamp: 'Mar 03, 2026, 10:00 AM',
      }),
    ];
    render(<PlanStatusTimeline events={events} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toMatch(/newest event status/i);
    expect(items[1].textContent).toMatch(/middle event status/i);
    expect(items[2].textContent).toMatch(/oldest event status/i);
  });

  it('renders an empty timeline container deterministically for an empty events array', () => {
    const { container } = render(<PlanStatusTimeline events={[]} />);

    expect(screen.getByText(/no events found for this filter/i)).toBeInTheDocument();
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(0);
  });
});
