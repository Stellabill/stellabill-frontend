import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlanStatusTimeline, { type TimelineEvent, TimelineEventType } from './PlanStatusTimeline'

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

/**
 * Regression suite for `PlanStatusTimeline` and its `Default` story inputs.
 *
 * Named evidence from the issue:
 *   - `src/components/PlanStatusTimeline.stories.tsx:7` → `tags: ['autodocs'],`
 *
 * The story renders the component with the seven-event `Default` fixture, so the
 * same fixture is used here. The story's "failure" surface is the empty-result
 * branch — when the active filter matches nothing the component must render the
 * `No events found for this filter.` message instead of an empty timeline.
 */

/** Fixture copied from `PlanStatusTimeline.stories.tsx` (`events` / `Default`). */
const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    type: 'Created',
    status: 'Subscription created',
    actor: 'Chukwuemeka',
    timestamp: 'Feb 10, 2026, 10:30 AM',
  },
  {
    id: '2',
    type: 'Activated',
    status: 'Plan activated',
    actor: 'System',
    timestamp: 'Feb 10, 2026, 10:31 AM',
  },
  {
    id: '3',
    type: 'Payment',
    status: 'Payment successful',
    actor: 'System',
    timestamp: 'Feb 15, 2026, 09:00 AM',
    details: '10 USDC - Period: Feb 15 - Mar 15',
  },
  {
    id: '4',
    type: 'Paused',
    status: 'Subscription paused',
    actor: 'Chukwuemeka',
    timestamp: 'Mar 01, 2026, 02:45 PM',
    details: 'User requested pause due to travel',
  },
  {
    id: '5',
    type: 'Resumed',
    status: 'Subscription resumed',
    actor: 'Chukwuemeka',
    timestamp: 'Mar 10, 2026, 11:20 AM',
  },
  {
    id: '6',
    type: 'Payment',
    status: 'Payment successful',
    actor: 'System',
    timestamp: 'Mar 15, 2026, 09:00 AM',
    details: '10 USDC - Period: Mar 15 - Apr 15',
  },
  {
    id: '7',
    type: 'Cancelled',
    status: 'Subscription cancelled',
    actor: 'Chukwuemeka',
    timestamp: 'Mar 20, 2026, 04:15 PM',
    details: 'End of contract',
  },
]

it('shows day groups and only the initial events before expanding', () => {
    const { container } = render(<PlanStatusTimeline />);

// Newest-first: Mar 20 / Mar 15 / Mar 10 are visible, oldest Feb 10 is collapsed.
    expect(screen.getByText(/march 20, 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load older activity/i })).toBeInTheDocument();
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    expect(screen.queryByText('Subscription created')).not.toBeInTheDocument();
  });

describe('PlanStatusTimeline - header and filters', () => {
  it('renders the panel heading and supporting copy', () => {
    renderTimeline()

    expect(screen.getByRole('heading', { name: 'Subscription activity timeline' })).toBeInTheDocument()
    expect(
      screen.getByText('Grouped by day with event type filters and older activity loading.'),
    ).toBeInTheDocument()
  })

expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    expect(screen.getAllByText(/payment successful/i)).toHaveLength(2);
    expect(screen.getByText(/subscription cancelled/i)).toBeInTheDocument();
  });

    const group = screen.getByRole('group', { name: 'Filter timeline events' })
    expect(within(group).getAllByRole('button')).toHaveLength(4)

    expect(within(group).getByRole('button', { name: 'All activity' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(group).getByRole('button', { name: 'Payments' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('exposes an accessible name on the timeline container', () => {
    renderTimeline()
    expect(screen.getByLabelText('Subscription activity timeline')).toBeInTheDocument()
  })
})

describe('PlanStatusTimeline - Default story behaviour', () => {
  it('shows only the most recent events until older activity is loaded', () => {
    renderTimeline()

    expect(screen.getAllByRole('listitem')).toHaveLength(INITIAL_COUNT)
    // Newest first: Mar 20 (Cancelled), Mar 15 (Payment), Mar 10 (Resumed).
    expect(screen.getByText('Subscription cancelled')).toBeInTheDocument()
    expect(screen.getByText('Payment successful')).toBeInTheDocument()
    expect(screen.getByText('Subscription resumed')).toBeInTheDocument()
    // Everything older than the newest three is paginated away.
    expect(screen.queryByText('Subscription paused')).not.toBeInTheDocument()
    expect(screen.queryByText('Subscription created')).not.toBeInTheDocument()
    expect(screen.queryByText('Plan activated')).not.toBeInTheDocument()
  })

  it('sorts events newest first', () => {
    renderTimeline()

    const statuses = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('p')?.textContent)

    expect(statuses).toEqual([
      'Subscription cancelled',
      'Payment successful',
      'Subscription resumed',
    ])
  })

  it('loads older activity and swaps the control to Show less', async () => {
    const user = userEvent.setup()
    renderTimeline()

    const loadOlder = screen.getByRole('button', { name: 'Load older activity' })
    expect(loadOlder).toHaveAttribute('aria-expanded', 'false')

    await user.click(loadOlder)

    expect(screen.getAllByRole('listitem')).toHaveLength(DEFAULT_EVENTS.length)
    expect(screen.getByText('Subscription created')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load older activity' })).not.toBeInTheDocument()

    const showLess = screen.getByRole('button', { name: 'Show less' })
    expect(showLess).toHaveAttribute('aria-expanded', 'true')

    await user.click(showLess)
    expect(screen.getAllByRole('listitem')).toHaveLength(INITIAL_COUNT)
    expect(screen.getByRole('button', { name: 'Load older activity' })).toBeInTheDocument()
  })

  it('renders event details when a row provides them', () => {
    renderTimeline()

    // The Cancelled row (Mar 20) is visible and carries a detail line.
    expect(screen.getByText('End of contract')).toBeInTheDocument()
    expect(screen.getByText('10 USDC - Period: Mar 15 - Apr 15')).toBeInTheDocument()
    // The Paused row is paginated away, so its detail must not be rendered yet.
    expect(screen.queryByText('User requested pause due to travel')).not.toBeInTheDocument()
  })

  it('groups events by day and labels each group with its event count', async () => {
    const user = userEvent.setup()
    renderTimeline()

    await user.click(screen.getByRole('button', { name: 'Load older activity' }))

    // Mar 20, Mar 15, Mar 10, Mar 01, Feb 15 and Feb 10 (two events).
    expect(screen.getAllByRole('region')).toHaveLength(6)
    expect(screen.getByText('2 events')).toBeInTheDocument()
    expect(screen.getAllByText('1 event')).toHaveLength(5)
  })
})

describe('PlanStatusTimeline - filters', () => {
  it('restricts the timeline to payments', async () => {
    const user = userEvent.setup()
    renderTimeline()

    await user.click(screen.getByRole('button', { name: 'Payments' }))

    expect(screen.getAllByText('Payment successful')).toHaveLength(2)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByText('Subscription cancelled')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load older activity' })).not.toBeInTheDocument()
  })

  it('restricts the timeline to non-payment system events', async () => {
    const user = userEvent.setup()
    renderTimeline()

    await user.click(screen.getByRole('button', { name: 'System events' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Plan activated')).toBeInTheDocument()
  })

  it('restricts the timeline to user actions', async () => {
    const user = userEvent.setup()
    renderTimeline()

    await user.click(screen.getByRole('button', { name: 'User actions' }))

    // Created, Paused, Resumed and Cancelled — every non-System actor.
    expect(screen.getAllByRole('listitem')).toHaveLength(INITIAL_COUNT)
    expect(screen.getByText('Subscription cancelled')).toBeInTheDocument()
    expect(screen.getByText('Subscription paused')).toBeInTheDocument()
    expect(screen.queryByText('Plan activated')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load older activity' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('collapses an expanded timeline when the filter changes', async () => {
    const user = userEvent.setup()
    renderTimeline()

    await user.click(screen.getByRole('button', { name: 'Load older activity' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(DEFAULT_EVENTS.length)

    await user.click(screen.getByRole('button', { name: 'User actions' }))

    expect(screen.getByRole('button', { name: 'Load older activity' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(INITIAL_COUNT)
  })

  it('supports returning to the unfiltered timeline', async () => {
    const user = userEvent.setup()
    renderTimeline()

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'All activity' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(INITIAL_COUNT)
  })
})

describe('PlanStatusTimeline - empty-result branch', () => {
  it('shows the no-events message when the filter matches nothing', async () => {
    const user = userEvent.setup()
    // Only payment/system rows: the "System events" filter excludes payments,
    // so the filter matches zero rows.
    renderTimeline([
      {
        id: 'only-payment',
        type: 'Payment',
        status: 'Payment successful',
        actor: 'System',
        timestamp: 'Feb 15, 2026, 09:00 AM',
      },
    ])

    await user.click(screen.getByRole('button', { name: 'System events' }))

    expect(screen.getByText('No events found for this filter.')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows the no-events message immediately for an empty event list', () => {
    renderTimeline([])

    expect(screen.getByText('No events found for this filter.')).toBeInTheDocument()
  })

  it('honours an empty list without rendering list or load controls', () => {
    renderTimeline([])

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Load older activity' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show less' })).not.toBeInTheDocument()
  })
})

describe('PlanStatusTimeline - boundary inputs', () => {
  it('defaults a missing actor to System', () => {
    renderTimeline([
      {
        id: 'no-actor',
        type: 'Activated',
        status: 'Plan activated',
        timestamp: 'Feb 10, 2026, 10:31 AM',
      },
    ])

    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('renders a single event without load controls', () => {
    renderTimeline([
      {
        id: 'single',
        type: 'Created',
        status: 'Subscription created',
        actor: 'Chukwuemeka',
        timestamp: 'Feb 10, 2026, 10:30 AM',
      },
    ])

expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Load older activity' })).not.toBeInTheDocument()
  })

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
