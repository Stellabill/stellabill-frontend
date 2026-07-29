/**
 * RetryScheduleViz tests
 * ----------------------
 * Coverage target: ≥ 95 %
 *
 * Covers:
 *  - Basic rendering of chips, labels, delta, method badges, probability bars
 *  - Status variants: past / upcoming / failed / succeeded
 *  - "Next" chip pulsing ring (aria-current)
 *  - Empty-schedule state
 *  - All-failed state
 *  - "Why these times?" popover (open, close via button / Escape / outside-click)
 *  - Focus management inside the popover
 *  - Show-more / show-less overflow toggle
 *  - SR live-region messages
 *  - RTL direction (data-dir attribute propagation)
 *  - Label overrides
 *  - Custom whyContent slot
 *  - RetryTimeline backward-compatibility wrapper
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import RetryScheduleViz, {
  type RetryAttempt,
  type RetryScheduleVizProps,
} from './RetryScheduleViz';
import RetryTimeline from './RetryTimeline';

// ─── Fixtures ───────────────────────────────────────────────

const NOW_ISO = '2026-03-22T10:00:00.000Z';

/** Freezes Date.now / new Date() so delta computations are stable */
function freezeDate(iso = NOW_ISO) {
  const fixed = new Date(iso);
  vi.useFakeTimers();
  vi.setSystemTime(fixed);
}

/** Restore real timers after every test so fake timers don't leak */
afterEach(() => {
  vi.useRealTimers();
});

const attempt = (
  overrides: Partial<RetryAttempt> & Pick<RetryAttempt, 'id' | 'when' | 'status'>,
): RetryAttempt => ({
  scheduledAt: new Date().toISOString(),
  ...overrides,
});

/** A typical 4-attempt schedule (1 failed, 1 past, 1 upcoming, 1 future) */
const TYPICAL_ATTEMPTS: RetryAttempt[] = [
  {
    id: 'a1',
    when: 'Mar 20, 08:00',
    scheduledAt: '2026-03-20T08:00:00Z',
    status: 'failed',
    method: 'card',
    successProbability: 0.1,
  },
  {
    id: 'a2',
    when: 'Mar 21, 08:00',
    scheduledAt: '2026-03-21T08:00:00Z',
    status: 'past',
    method: 'card',
    successProbability: 0.3,
  },
  {
    id: 'a3',
    when: 'Mar 22, 14:00',
    scheduledAt: '2026-03-22T14:00:00Z',
    status: 'upcoming',
    method: 'usdc',
    successProbability: 0.7,
  },
  {
    id: 'a4',
    when: 'Mar 23, 06:00',
    scheduledAt: '2026-03-23T06:00:00Z',
    status: 'upcoming',
    method: 'prepaid',
    successProbability: 0.45,
  },
];

function renderViz(props: RetryScheduleVizProps) {
  return render(<RetryScheduleViz {...props} />);
}

// ─── Basic rendering ────────────────────────────────────────

describe('RetryScheduleViz – basic rendering', () => {
  beforeEach(() => { freezeDate(); });

  it('renders the outer wrapper with data-testid', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(screen.getByTestId('retry-schedule-viz')).toBeInTheDocument();
  });

  it('renders a title heading', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(screen.getByRole('heading', { name: /retry schedule/i })).toBeInTheDocument();
  });

  it('renders one list item per visible attempt', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    // Default maxVisible = 5, all 4 attempts are shown
    const list = screen.getByRole('list', { name: /retry schedule/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders the scheduled date for each attempt', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(screen.getByText('Mar 20, 08:00')).toBeInTheDocument();
    expect(screen.getByText('Mar 22, 14:00')).toBeInTheDocument();
  });

  it('renders <time> elements with correct dateTime attribute', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    const times = document.querySelectorAll('time');
    const dateTimes = Array.from(times).map((t) => t.getAttribute('dateTime'));
    expect(dateTimes).toContain('2026-03-20T08:00:00Z');
    expect(dateTimes).toContain('2026-03-22T14:00:00Z');
  });
});

// ─── Method badges ───────────────────────────────────────────

describe('RetryScheduleViz – method badges', () => {
  beforeEach(() => { freezeDate(); });

  it('renders method badge with correct label', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    // a3 has method=usdc
    expect(screen.getByText('USDC')).toBeInTheDocument();
    // a4 has method=prepaid
    expect(screen.getByText('Prepaid')).toBeInTheDocument();
  });

  it('does not render method badge when method is absent', () => {
    const noMethodAttempts: RetryAttempt[] = [
      { id: 'x', when: 'Apr 1', scheduledAt: '2026-04-01T00:00:00Z', status: 'upcoming' },
    ];
    renderViz({ attempts: noMethodAttempts });
    // No method badges
    expect(screen.queryByText('Card')).not.toBeInTheDocument();
    expect(screen.queryByText('USDC')).not.toBeInTheDocument();
  });

  it.each([
    ['card', 'Card'],
    ['usdc', 'USDC'],
    ['prepaid', 'Prepaid'],
    ['bank', 'Bank'],
    ['other', 'Other'],
  ] as const)('renders %s method badge as "%s"', (method, label) => {
    renderViz({
      attempts: [{ id: '1', when: 'Now', scheduledAt: NOW_ISO, status: 'upcoming', method }],
    });
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

// ─── Status variants ─────────────────────────────────────────

describe('RetryScheduleViz – status badges', () => {
  beforeEach(() => { freezeDate(); });

  it.each([
    ['past', 'Attempted'],
    ['upcoming', 'Upcoming'],
    ['succeeded', 'Succeeded'],
  ] as const)('renders "%s" status as "%s"', (status, label) => {
    renderViz({
      attempts: [{ id: '1', when: 'Now', scheduledAt: NOW_ISO, status }],
    });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders "failed" status badge when at least one non-failed attempt exists', () => {
    // A single failed attempt triggers the all-failed empty state.
    // Mix failed + upcoming so the timeline renders chips.
    renderViz({
      attempts: [
        { id: 'f1', when: 'Mar 20', scheduledAt: '2026-03-20T00:00:00Z', status: 'failed' },
        { id: 'u1', when: 'Mar 22', scheduledAt: NOW_ISO, status: 'upcoming' },
      ],
    });
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});

// ─── Success probability ────────────────────────────────────

describe('RetryScheduleViz – success probability', () => {
  beforeEach(() => { freezeDate(); });

  it('renders a meter for each attempt with successProbability', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    const meters = screen.getAllByRole('meter');
    // 4 attempts all have successProbability
    expect(meters).toHaveLength(4);
  });

  it('sets aria-valuenow correctly on probability meter', () => {
    renderViz({
      attempts: [
        { id: '1', when: 'Now', scheduledAt: NOW_ISO, status: 'upcoming', successProbability: 0.72 },
      ],
    });
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });

  it('hides probability bar when successProbability is absent', () => {
    renderViz({
      attempts: [{ id: '1', when: 'Now', scheduledAt: NOW_ISO, status: 'upcoming' }],
    });
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });
});

// ─── "Next" chip ─────────────────────────────────────────────

describe('RetryScheduleViz – "next" upcoming chip', () => {
  beforeEach(() => { freezeDate(); });

  it('marks the first upcoming item with aria-current', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    const list = screen.getByRole('list', { name: /retry schedule/i });
    const items = within(list).getAllByRole('listitem');
    // a3 is the first upcoming (index 2)
    expect(items[2]).toHaveAttribute('aria-current', 'true');
    // a4 is also upcoming but not "next"
    expect(items[3]).not.toHaveAttribute('aria-current');
  });

  it('does not set aria-current when there is no upcoming attempt', () => {
    const allPast: RetryAttempt[] = [
      { id: 'a1', when: 'Mar 20', scheduledAt: '2026-03-20T00:00:00Z', status: 'past' },
      { id: 'a2', when: 'Mar 21', scheduledAt: '2026-03-21T00:00:00Z', status: 'past' },
    ];
    renderViz({ attempts: allPast });
    const items = screen.getAllByRole('listitem');
    items.forEach((item) => expect(item).not.toHaveAttribute('aria-current'));
  });
});

// ─── Screen-reader live region ───────────────────────────────

describe('RetryScheduleViz – SR live region', () => {
  beforeEach(() => { freezeDate(); });

  it('announces next-attempt time when there is an upcoming attempt', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    const live = screen.getByRole('status');
    expect(live).toHaveTextContent('Next payment retry scheduled for Mar 22, 14:00');
  });

  it('announces all-failed message when every attempt is failed', () => {
    const allFailed: RetryAttempt[] = [
      { id: 'f1', when: 'Mar 20', scheduledAt: '2026-03-20T00:00:00Z', status: 'failed' },
      { id: 'f2', when: 'Mar 21', scheduledAt: '2026-03-21T00:00:00Z', status: 'failed' },
    ];
    renderViz({ attempts: allFailed });
    const live = screen.getByRole('status');
    expect(live).toHaveTextContent(/all retry attempts have failed/i);
  });

  it('announces no-schedule message when attempts array is empty', () => {
    renderViz({ attempts: [] });
    const live = screen.getByRole('status');
    expect(live).toHaveTextContent(/no retry schedule/i);
  });
});

// ─── Empty / all-failed state ────────────────────────────────

describe('RetryScheduleViz – empty and all-failed states', () => {
  beforeEach(() => { freezeDate(); });

  it('shows the empty callout when attempts array is empty', () => {
    renderViz({ attempts: [] });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/all retries exhausted/i)).toBeInTheDocument();
  });

  it('shows the empty callout when all attempts have failed', () => {
    const allFailed: RetryAttempt[] = [
      { id: 'f1', when: 'Mar 20', scheduledAt: '2026-03-20T00:00:00Z', status: 'failed' },
    ];
    renderViz({ attempts: allFailed });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does NOT show the timeline list in the all-failed state', () => {
    const allFailed: RetryAttempt[] = [
      { id: 'f1', when: 'Mar 20', scheduledAt: '2026-03-20T00:00:00Z', status: 'failed' },
    ];
    renderViz({ attempts: allFailed });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the timeline list when at least one attempt is not failed', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(screen.getByRole('list', { name: /retry schedule/i })).toBeInTheDocument();
  });
});

// ─── Overflow / show-more ────────────────────────────────────

describe('RetryScheduleViz – overflow show-more toggle', () => {
  // No fake timers here — userEvent needs real timers to resolve

  const manyAttempts: RetryAttempt[] = Array.from({ length: 8 }, (_, i) => ({
    id: `a${i}`,
    when: `Mar ${20 + i}`,
    scheduledAt: new Date(Date.UTC(2026, 2, 20 + i)).toISOString(),
    status: i < 5 ? ('past' as const) : ('upcoming' as const),
  }));

  it('caps visible items at maxVisible', () => {
    renderViz({ attempts: manyAttempts, maxVisible: 3 });
    const list = screen.getByRole('list', { name: /retry schedule/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders the "show more" button with correct count', () => {
    renderViz({ attempts: manyAttempts, maxVisible: 5 });
    const btn = screen.getByRole('button', { name: /show all attempts/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('3 more');
  });

  it('shows all items after clicking "show more"', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: manyAttempts, maxVisible: 5 });
    await user.click(screen.getByRole('button', { name: /show all attempts/i }));
    const list = screen.getByRole('list', { name: /retry schedule/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(8);
  });

  it('renders "show less" button after expanding', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: manyAttempts, maxVisible: 5 });
    await user.click(screen.getByRole('button', { name: /show all attempts/i }));
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('collapses back to maxVisible when "show less" is clicked', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: manyAttempts, maxVisible: 5 });
    await user.click(screen.getByRole('button', { name: /show all attempts/i }));
    await user.click(screen.getByRole('button', { name: /show less/i }));
    const list = screen.getByRole('list', { name: /retry schedule/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
  });

  it('calls onShowMore callback when expanding', async () => {
    const spy = vi.fn();
    const user = userEvent.setup();
    renderViz({ attempts: manyAttempts, maxVisible: 5, onShowMore: spy });
    await user.click(screen.getByRole('button', { name: /show all attempts/i }));
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does not show the overflow button when attempts ≤ maxVisible', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS, maxVisible: 10 });
    expect(screen.queryByRole('button', { name: /show all attempts/i })).not.toBeInTheDocument();
  });
});

// ─── "Why these times?" popover ──────────────────────────────

describe('RetryScheduleViz – why-times popover', () => {
  // No fake timers here — userEvent needs real timers to resolve

  it('renders the "Why these times?" trigger button', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(
      screen.getByRole('button', { name: /how we schedule retries/i }),
    ).toBeInTheDocument();
  });

  it('opens the popover when the trigger is clicked', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    expect(screen.getByRole('dialog', { name: /how we schedule retries/i })).toBeInTheDocument();
  });

  it('shows the default heuristic items inside the popover', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    expect(screen.getByText(/off-peak window/i)).toBeInTheDocument();
    expect(screen.getByText(/exponential back-off/i)).toBeInTheDocument();
    expect(screen.getByText(/success-probability model/i)).toBeInTheDocument();
    expect(screen.getByText(/smart method rotation/i)).toBeInTheDocument();
  });

  it('closes the popover when "Got it" is clicked', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    await user.click(screen.getByRole('button', { name: /got it/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the popover on Escape key', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the popover when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <RetryScheduleViz attempts={TYPICAL_ATTEMPTS} />
        <button type="button">Outside</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses the "Got it" button when popover opens', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    const closeBtn = screen.getByRole('button', { name: /got it/i });
    expect(closeBtn).toHaveFocus();
  });

  it('restores focus to trigger button after closing', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    const trigger = screen.getByRole('button', { name: /how we schedule retries/i });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /got it/i }));
    expect(trigger).toHaveFocus();
  });

  it('traps focus within the popover (Tab stays inside)', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    const closeBtn = screen.getByRole('button', { name: /got it/i });
    // Tab from only focusable element stays on it
    await user.tab();
    expect(closeBtn).toHaveFocus();
  });

  it('renders custom whyContent when provided', async () => {
    const user = userEvent.setup();
    renderViz({
      attempts: TYPICAL_ATTEMPTS,
      whyContent: <p>Custom explanation text</p>,
    });
    await user.click(screen.getByRole('button', { name: /how we schedule retries/i }));
    expect(screen.getByText('Custom explanation text')).toBeInTheDocument();
    // Default items should NOT appear
    expect(screen.queryByText(/off-peak window/i)).not.toBeInTheDocument();
  });

  it('sets aria-expanded correctly on trigger', async () => {
    const user = userEvent.setup();
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    const trigger = screen.getByRole('button', { name: /how we schedule retries/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

// ─── Label overrides ─────────────────────────────────────────

describe('RetryScheduleViz – label overrides', () => {
  beforeEach(() => { freezeDate(); });

  it('uses custom title', () => {
    renderViz({
      attempts: TYPICAL_ATTEMPTS,
      labels: { title: 'Custom title' },
    });
    expect(screen.getByRole('heading', { name: 'Custom title' })).toBeInTheDocument();
  });

  it('uses custom why-button text', () => {
    renderViz({
      attempts: TYPICAL_ATTEMPTS,
      labels: { whyButton: 'Explain timing' },
    });
    expect(screen.getByText('Explain timing')).toBeInTheDocument();
  });

  it('uses custom SR next-attempt message', () => {
    renderViz({
      attempts: TYPICAL_ATTEMPTS,
      labels: { srNextAttempt: (w) => `Next retry: ${w}` },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Next retry: Mar 22, 14:00');
  });

  it('uses custom empty title', () => {
    renderViz({
      attempts: [],
      labels: { emptyTitle: 'No more retries' },
    });
    expect(screen.getByText('No more retries')).toBeInTheDocument();
  });
});

// ─── Relative delta ──────────────────────────────────────────

describe('RetryScheduleViz – relative delta computation', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('shows "+4 h" for an attempt 4 hours in the future', () => {
    freezeDate('2026-03-22T10:00:00Z');
    const futureAttempt: RetryAttempt[] = [
      {
        id: '1',
        when: 'Mar 22, 14:00',
        scheduledAt: '2026-03-22T14:00:00Z', // +4h
        status: 'upcoming',
      },
    ];
    renderViz({ attempts: futureAttempt });
    expect(screen.getByText('+4 h')).toBeInTheDocument();
  });

  it('shows "−2 d" for an attempt 2 days in the past', () => {
    freezeDate('2026-03-22T10:00:00Z');
    const pastAttempt: RetryAttempt[] = [
      {
        id: '1',
        when: 'Mar 20, 10:00',
        scheduledAt: '2026-03-20T10:00:00Z', // −2d
        status: 'past',
      },
    ];
    renderViz({ attempts: pastAttempt });
    expect(screen.getByText('−2 d')).toBeInTheDocument();
  });

  it('shows "now" for an attempt very close to the current time', () => {
    const close = new Date();
    close.setSeconds(close.getSeconds() + 5);
    freezeDate();
    const nowAttempt: RetryAttempt[] = [
      { id: '1', when: 'Now', scheduledAt: close.toISOString(), status: 'upcoming' },
    ];
    renderViz({ attempts: nowAttempt });
    expect(screen.getByText('now')).toBeInTheDocument();
  });
});

// ─── RTL ─────────────────────────────────────────────────────

describe('RetryScheduleViz – RTL layout', () => {
  it('renders without errors in an RTL document', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(screen.getByTestId('retry-schedule-viz')).toBeInTheDocument();
    document.documentElement.removeAttribute('dir');
  });
});

// ─── RetryTimeline wrapper (backward compat) ─────────────────

describe('RetryTimeline (backward-compat wrapper)', () => {
  it('renders using the original simple attempt shape', () => {
    const simpleAttempts = [
      { id: 'a1', when: 'Mar 20', status: 'past' as const },
      { id: 'a2', when: 'Mar 22', status: 'upcoming' as const },
    ];
    render(<RetryTimeline attempts={simpleAttempts} />);
    expect(screen.getByTestId('retry-schedule-viz')).toBeInTheDocument();
    expect(screen.getByText('Mar 20')).toBeInTheDocument();
    expect(screen.getByText('Mar 22')).toBeInTheDocument();
  });

  it('passes maxVisible through to RetryScheduleViz', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: `x${i}`,
      when: `Apr ${i + 1}`,
      status: 'upcoming' as const,
    }));
    render(<RetryTimeline attempts={many} maxVisible={3} />);
    const list = screen.getByRole('list', { name: /retry schedule/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('passes optional method and successProbability fields', () => {
    const attempts = [
      {
        id: 'r1',
        when: 'Mar 22',
        status: 'upcoming' as const,
        method: 'usdc' as const,
        successProbability: 0.8,
      },
    ];
    render(<RetryTimeline attempts={attempts} />);
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toBeInTheDocument();
  });

  it('renders legacy list with aria-label for the region', () => {
    const simpleAttempts = [
      { id: 'a1', when: 'Mar 20', status: 'past' as const },
    ];
    render(<RetryTimeline attempts={simpleAttempts} />);
    expect(screen.getByRole('list', { name: /retry schedule/i })).toBeInTheDocument();
  });
});

// ─── Accessibility: roles and attributes ────────────────────

describe('RetryScheduleViz – ARIA attributes', () => {
  beforeEach(() => { freezeDate(); });

  it('has a region with accessible name for the track', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(screen.getByRole('region', { name: /retry schedule/i })).toBeInTheDocument();
  });

  it('list has accessible name', () => {
    renderViz({ attempts: TYPICAL_ATTEMPTS });
    expect(screen.getByRole('list', { name: /retry schedule/i })).toBeInTheDocument();
  });

  it('probability meters have accessible name with percentage', () => {
    renderViz({ attempts: [
      { id: 'p1', when: 'Now', scheduledAt: NOW_ISO, status: 'upcoming', successProbability: 0.72 },
    ] });
    expect(screen.getByRole('meter', { name: /72%/i })).toBeInTheDocument();
  });
});
