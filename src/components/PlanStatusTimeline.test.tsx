import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlanStatusTimeline, { type TimelineEvent } from './PlanStatusTimeline'

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

const INITIAL_COUNT = 3

function renderTimeline(events: TimelineEvent[] = DEFAULT_EVENTS) {
  return render(<PlanStatusTimeline events={events} />)
}

describe('PlanStatusTimeline - header and filters', () => {
  it('renders the panel heading and supporting copy', () => {
    renderTimeline()

    expect(screen.getByRole('heading', { name: 'Subscription activity timeline' })).toBeInTheDocument()
    expect(
      screen.getByText('Grouped by day with event type filters and older activity loading.'),
    ).toBeInTheDocument()
  })

  it('renders the labelled filter chip group with the active chip pressed', () => {
    renderTimeline()

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
})
