/**
 * Supplementary coverage for src/components/ScheduleChangePreview.tsx (issue #824).
 *
 * The pre-existing src/components/ScheduleChangePreview.test.tsx is left
 * untouched; this file adds the cases it does not pin: the BillingInterval
 * union as a typed table (label + aria-label), the effectiveDate/cycles prop
 * defaults, the same -> changed interval transition, the date rollover and
 * malformed-input behaviour, the amount/currency boundary values, and the exact
 * <time> contract of each list plus the effective date rendered twice.
 *
 * Deterministic: every input is a fixed ISO date string in 2026 and no test
 * reads the wall clock (`new Date()` / `Date.now()` are never called). All
 * assertions are on real rendered output: the region/aria-labelledby wiring,
 * `<time dateTime>` values, text content, divergence classes, the diverge
 * badge and the `.scp-notice` microcopy.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScheduleChangePreview, {
  type BillingInterval,
  type ScheduleChangePreviewProps,
} from './ScheduleChangePreview';

/** All five members of the BillingInterval union, with the label the component renders. */
const INTERVALS: Array<[BillingInterval, string]> = [
  ['weekly', 'Weekly'],
  ['biweekly', 'Every 2 weeks'],
  ['monthly', 'Monthly'],
  ['quarterly', 'Quarterly'],
  ['yearly', 'Yearly'],
];

/** Representative amount boundary values and the exact string Intl renders for them. */
const AMOUNTS: Array<[number, string]> = [
  [0, '0'],
  [-25, '-25'],
  [0.1234567, '0.123457'],
  [1234567.891, '1,234,567.891'],
  [NaN, 'NaN'],
];

function renderPreview(overrides: Partial<ScheduleChangePreviewProps> = {}) {
  return render(
    <ScheduleChangePreview
      currentNextCharge="2026-08-01"
      currentInterval="weekly"
      newInterval="monthly"
      amount={50}
      currency="USDC"
      {...overrides}
    />
  );
}

/** The rendered cycle rows for one side of the comparison. */
function rows(container: HTMLElement, side: 'old' | 'new'): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(`.scp-column--${side} .scp-date-row`)
  );
}

/** The machine-readable dateTime of each cycle row. */
function dateTimes(list: HTMLElement[]): Array<string | null> {
  return list.map((row) => row.querySelector('time')?.getAttribute('dateTime') ?? null);
}

describe('ScheduleChangePreview', () => {
  describe('interval chips (BillingInterval)', () => {
    it.each(INTERVALS)(
      'renders the "%s" interval label and aria-label on the new-schedule chip',
      (interval, label) => {
        const { container } = renderPreview({
          currentInterval: 'monthly',
          newInterval: interval,
        });

        const newChip = container.querySelector<HTMLElement>('.scp-interval-chip--new');
        expect(newChip).toBeInTheDocument();
        expect(newChip).toHaveTextContent(label);
        expect(newChip).toHaveAttribute('aria-label', `New interval: ${label}`);

        const oldChip = container.querySelector<HTMLElement>('.scp-interval-chip--old');
        expect(oldChip).toBeInTheDocument();
        expect(oldChip).toHaveTextContent('Monthly');
        expect(oldChip).toHaveAttribute('aria-label', 'Current interval: Monthly');
      }
    );

    it('renders the current-interval chip with the label matching its BillingInterval value', () => {
      const { container } = renderPreview({
        currentInterval: 'biweekly',
        newInterval: 'biweekly',
      });

      const oldChip = container.querySelector<HTMLElement>('.scp-interval-chip--old');
      expect(oldChip).toHaveTextContent('Every 2 weeks');
      expect(oldChip).toHaveAttribute('aria-label', 'Current interval: Every 2 weeks');
    });
  });

  describe('prop defaults', () => {
    it('defaults effectiveDate to currentNextCharge and cycles to 3', () => {
      const { container } = renderPreview({
        currentInterval: 'monthly',
        newInterval: 'monthly',
      });

      expect(rows(container, 'old')).toHaveLength(3);
      expect(rows(container, 'new')).toHaveLength(3);

      const badgeTime = container.querySelector('.scp-effective-badge time');
      expect(badgeTime).toHaveAttribute('dateTime', '2026-08-01');
      expect(badgeTime).toHaveTextContent('Aug 1, 2026');

      // The new schedule is anchored on the defaulted effective date.
      expect(dateTimes(rows(container, 'new'))).toEqual([
        '2026-08-01',
        '2026-09-01',
        '2026-10-01',
      ]);
    });

    it('honours an explicit effectiveDate that differs from currentNextCharge', () => {
      const { container } = renderPreview({
        currentInterval: 'weekly',
        newInterval: 'monthly',
        effectiveDate: '2026-08-15',
      });

      const badgeTime = container.querySelector('.scp-effective-badge time');
      expect(badgeTime).toHaveAttribute('dateTime', '2026-08-15');
      expect(badgeTime).toHaveTextContent('Aug 15, 2026');

      expect(dateTimes(rows(container, 'new'))).toEqual([
        '2026-08-15',
        '2026-09-15',
        '2026-10-15',
      ]);
    });

    it('respects an explicit cycles value', () => {
      const { container } = renderPreview({
        currentInterval: 'monthly',
        newInterval: 'monthly',
        cycles: 2,
      });

      expect(rows(container, 'old')).toHaveLength(2);
      expect(rows(container, 'new')).toHaveLength(2);
      expect(dateTimes(rows(container, 'old'))).toEqual(['2026-08-01', '2026-09-01']);
    });
  });

  describe('state transitions', () => {
    it('same interval: no divergence, no diverge badge and no microcopy notice', () => {
      const { container } = renderPreview({
        currentInterval: 'monthly',
        newInterval: 'monthly',
      });

      expect(container.querySelector('.scp-notice')).toBeNull();
      expect(screen.queryByRole('note')).not.toBeInTheDocument();
      expect(container.querySelector('.scp-diverge-badge')).toBeNull();
      expect(container.querySelector('.scp-date-row--diverge')).toBeNull();
      expect(container.querySelector('.scp-date-row--diverge-old')).toBeNull();

      // Both columns show the identical monthly schedule.
      expect(dateTimes(rows(container, 'old'))).toEqual([
        '2026-08-01',
        '2026-09-01',
        '2026-10-01',
      ]);
      expect(dateTimes(rows(container, 'new'))).toEqual([
        '2026-08-01',
        '2026-09-01',
        '2026-10-01',
      ]);
    });

    it('changed interval: highlights the first divergent cycle and shows the notice', () => {
      const { container } = renderPreview({
        currentInterval: 'weekly',
        newInterval: 'monthly',
      });

      const oldRows = rows(container, 'old');
      const newRows = rows(container, 'new');

      expect(dateTimes(oldRows)).toEqual(['2026-08-01', '2026-08-08', '2026-08-15']);
      expect(dateTimes(newRows)).toEqual(['2026-08-01', '2026-09-01', '2026-10-01']);

      // Cycle 1 matches on both sides, so divergence starts at cycle 2 (index 1).
      expect(oldRows[0]).not.toHaveClass('scp-date-row--diverge-old');
      expect(oldRows[1]).toHaveClass('scp-date-row--diverge-old');
      expect(oldRows[2]).toHaveClass('scp-date-row--diverge-old');
      expect(newRows[0]).not.toHaveClass('scp-date-row--diverge');
      expect(newRows[1]).toHaveClass('scp-date-row--diverge');
      expect(newRows[2]).toHaveClass('scp-date-row--diverge');

      // The "new" badge is only on the first divergent new cycle.
      expect(newRows[0].querySelector('.scp-diverge-badge')).toBeNull();
      const badge = newRows[1].querySelector('.scp-diverge-badge');
      expect(badge).not.toBeNull();
      expect(badge).toHaveAttribute('aria-label', 'First changed date');
      expect(badge).toHaveTextContent('new');
      expect(newRows[2].querySelector('.scp-diverge-badge')).toBeNull();

      // Microcopy notice is keyed on the interval change.
      const notice = container.querySelector<HTMLElement>('.scp-notice');
      expect(notice).not.toBeNull();
      expect(notice).toHaveAttribute('role', 'note');
      expect(notice).toHaveTextContent(/Dates are rounded to your billing day/);
      expect(notice).toHaveTextContent(/The new monthly schedule starts on Aug 1, 2026/);
      expect(notice).toHaveTextContent(/Any partial period up to that date is pro-rated/);
      expect(screen.getByText('monthly')).toBeInTheDocument();
    });

    it('changed interval with an explicit effectiveDate: divergence starts at cycle 1', () => {
      const { container } = renderPreview({
        currentInterval: 'weekly',
        newInterval: 'monthly',
        effectiveDate: '2026-08-15',
      });

      const oldRows = rows(container, 'old');
      const newRows = rows(container, 'new');

      expect(dateTimes(oldRows)).toEqual(['2026-08-01', '2026-08-08', '2026-08-15']);
      expect(dateTimes(newRows)).toEqual(['2026-08-15', '2026-09-15', '2026-10-15']);

      oldRows.forEach((row) => expect(row).toHaveClass('scp-date-row--diverge-old'));
      newRows.forEach((row) => expect(row).toHaveClass('scp-date-row--diverge'));
      expect(newRows[0].querySelector('.scp-diverge-badge')).not.toBeNull();

      const removed = container.querySelectorAll<HTMLElement>(
        '.scp-column--old .scp-date-value[aria-label]'
      );
      expect(removed).toHaveLength(3);
      expect(removed[0]).toHaveAttribute('aria-label', 'Cycle 1: Aug 1, 2026, removed');
    });

    it('changed interval with identical previewed dates: notice without divergence', () => {
      // cycles=1 previews only the shared anchor, so nothing diverges even
      // though the intervals differ.
      const { container } = renderPreview({
        currentInterval: 'yearly',
        newInterval: 'quarterly',
        cycles: 1,
      });

      expect(rows(container, 'old')).toHaveLength(1);
      expect(rows(container, 'new')).toHaveLength(1);
      expect(dateTimes(rows(container, 'old'))).toEqual(['2026-08-01']);
      expect(dateTimes(rows(container, 'new'))).toEqual(['2026-08-01']);

      expect(container.querySelector('.scp-diverge-badge')).toBeNull();
      expect(container.querySelector('.scp-date-row--diverge')).toBeNull();
      expect(container.querySelector('.scp-notice')).not.toBeNull();
      expect(screen.getByText('quarterly')).toBeInTheDocument();
    });

    it('transitions from same-interval to changed-interval on rerender', () => {
      const { container, rerender } = renderPreview({
        currentInterval: 'monthly',
        newInterval: 'monthly',
      });

      expect(container.querySelector('.scp-notice')).toBeNull();
      expect(container.querySelector('.scp-diverge-badge')).toBeNull();

      rerender(
        <ScheduleChangePreview
          currentNextCharge="2026-08-01"
          currentInterval="monthly"
          newInterval="weekly"
          amount={50}
          currency="USDC"
        />
      );

      expect(container.querySelector('.scp-notice')).not.toBeNull();
      expect(container.querySelectorAll('.scp-diverge-badge')).toHaveLength(1);
      expect(dateTimes(rows(container, 'old'))).toEqual([
        '2026-08-01',
        '2026-09-01',
        '2026-10-01',
      ]);
      expect(dateTimes(rows(container, 'new'))).toEqual([
        '2026-08-01',
        '2026-08-08',
        '2026-08-15',
      ]);
    });
  });

  describe('date boundaries and invalid inputs', () => {
    it('cycles=1 renders a single cycle per schedule', () => {
      const { container } = renderPreview({
        currentInterval: 'monthly',
        newInterval: 'monthly',
        cycles: 1,
      });

      expect(rows(container, 'old')).toHaveLength(1);
      expect(rows(container, 'new')).toHaveLength(1);
      expect(dateTimes(rows(container, 'old'))).toEqual(['2026-08-01']);
    });

    it('cycles=0 still renders the anchor cycle (it does not produce empty lists)', () => {
      // buildSchedule always seeds the anchor, so a non-positive count yields
      // exactly one row per column rather than an empty list.
      const { container } = renderPreview({
        currentInterval: 'monthly',
        newInterval: 'monthly',
        cycles: 0,
      });

      expect(rows(container, 'old')).toHaveLength(1);
      expect(rows(container, 'new')).toHaveLength(1);
      expect(dateTimes(rows(container, 'old'))).toEqual(['2026-08-01']);
      expect(dateTimes(rows(container, 'new'))).toEqual(['2026-08-01']);
    });

    it('rolls a non-existent day forward (2026-02-30 -> 2026-03-02)', () => {
      const { container } = renderPreview({
        currentNextCharge: '2026-02-30',
        currentInterval: 'weekly',
        newInterval: 'weekly',
      });

      expect(dateTimes(rows(container, 'old'))).toEqual([
        '2026-03-02',
        '2026-03-09',
        '2026-03-16',
      ]);
      expect(screen.getAllByText('Mar 2, 2026')).toHaveLength(3);
      expect(screen.queryByText(/Feb/)).toBeNull();
    });

    it('rolls month-end monthly billing into the next month (2026-01-31 -> 2026-03-03)', () => {
      const { container } = renderPreview({
        currentNextCharge: '2026-01-31',
        currentInterval: 'monthly',
        newInterval: 'monthly',
      });

      expect(dateTimes(rows(container, 'old'))).toEqual([
        '2026-01-31',
        '2026-03-03',
        '2026-04-03',
      ]);
    });

    it('rolls a quarter-end date forward (2026-11-30 quarterly -> 2027-03-02)', () => {
      const { container } = renderPreview({
        currentNextCharge: '2026-11-30',
        currentInterval: 'quarterly',
        newInterval: 'quarterly',
      });

      expect(dateTimes(rows(container, 'old'))).toEqual([
        '2026-11-30',
        '2027-03-02',
        '2027-06-02',
      ]);
    });

    it('handles day-count intervals across the year boundary (2026-12-20 biweekly)', () => {
      const { container } = renderPreview({
        currentNextCharge: '2026-12-20',
        currentInterval: 'biweekly',
        newInterval: 'biweekly',
      });

      expect(dateTimes(rows(container, 'old'))).toEqual([
        '2026-12-20',
        '2027-01-03',
        '2027-01-17',
      ]);
    });

    it('renders "Invalid Date" for a malformed ISO string without throwing', () => {
      const { container } = renderPreview({
        currentNextCharge: 'not-a-date',
        currentInterval: 'weekly',
        newInterval: 'weekly',
        cycles: 1,
      });

      // 1 old cycle + 1 new cycle + the effective-date badge.
      expect(container.querySelectorAll('time')).toHaveLength(3);
      expect(container.querySelector('time[datetime="NaN-NaN-NaN"]')).not.toBeNull();
      expect(screen.getAllByText('Invalid Date')).toHaveLength(3);
    });
  });

  describe('amount and currency boundary inputs', () => {
    it.each(AMOUNTS)('formats amount %s as "%s" in both columns', (amount, formatted) => {
      const { container } = renderPreview({
        amount,
        currentInterval: 'monthly',
        newInterval: 'monthly',
      });

      const amounts = Array.from(
        container.querySelectorAll<HTMLElement>('.scp-amount')
      );
      expect(amounts).toHaveLength(2);
      amounts.forEach((el) => expect(el).toHaveTextContent(`${formatted} USDC`));
      expect(amounts[0]).toHaveAttribute(
        'aria-label',
        `Current charge amount: ${formatted} USDC`
      );
      expect(amounts[1]).toHaveAttribute(
        'aria-label',
        `New charge amount: ${formatted} USDC`
      );
    });

    it('renders the default amount in both columns', () => {
      renderPreview({ currentInterval: 'monthly', newInterval: 'monthly' });

      expect(screen.getAllByText('50 USDC')).toHaveLength(2);
    });

    it('renders an unknown currency string verbatim without validation', () => {
      const { container } = renderPreview({
        currency: 'XYZ',
        amount: 50,
        currentInterval: 'monthly',
        newInterval: 'monthly',
      });

      const amounts = Array.from(
        container.querySelectorAll<HTMLElement>('.scp-amount')
      );
      expect(amounts).toHaveLength(2);
      amounts.forEach((el) => expect(el).toHaveTextContent('50 XYZ'));
      expect(amounts[0]).toHaveAttribute('aria-label', 'Current charge amount: 50 XYZ');
      expect(amounts[1]).toHaveAttribute('aria-label', 'New charge amount: 50 XYZ');
    });
  });

  describe('accessibility contract', () => {
    it('exposes a labelled region pointing at the heading', () => {
      const { container } = renderPreview();

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'scp-heading');
      expect(container.querySelector('[role="region"]')).toBe(region);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveAttribute('id', 'scp-heading');
      expect(heading).toHaveTextContent('Schedule change preview');
    });

    it('labels both schedule lists and stamps every date with a machine-readable dateTime', () => {
      const { container } = renderPreview({
        currentInterval: 'weekly',
        newInterval: 'monthly',
      });

      expect(screen.getByRole('list', { name: 'Current schedule dates' })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: 'New schedule dates' })).toBeInTheDocument();

      // Each list stamps its own cycles, and the effective date is rendered
      // twice: once in the aria-live badge and once inside the rounding notice.
      const datesIn = (name: string) =>
        Array.from(screen.getByRole('list', { name }).querySelectorAll('time'));
      expect(datesIn('Current schedule dates')).toHaveLength(3);
      expect(datesIn('New schedule dates')).toHaveLength(3);

      const times = container.querySelectorAll('time');
      expect(times).toHaveLength(8);
      times.forEach((time) => {
        expect(time.getAttribute('dateTime')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('marks removed old cycles with a human-readable aria-label', () => {
      const { container } = renderPreview({
        currentInterval: 'weekly',
        newInterval: 'monthly',
      });

      const removed = container.querySelectorAll<HTMLElement>(
        '.scp-column--old time[aria-label]'
      );
      expect(removed).toHaveLength(2);
      expect(removed[0]).toHaveAttribute('aria-label', 'Cycle 2: Aug 8, 2026, removed');
      expect(removed[1]).toHaveAttribute('aria-label', 'Cycle 3: Aug 15, 2026, removed');

      // The matching first cycle carries no removal label.
      const firstCycle = container.querySelector(
        '.scp-column--old .scp-date-row:first-child time'
      );
      expect(firstCycle).not.toBeNull();
      expect(firstCycle).not.toHaveAttribute('aria-label');
    });

    it('exposes the effective date as a polite status', () => {
      renderPreview();

      const status = screen.getByRole('status');
      expect(status).toHaveClass('scp-effective-badge');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveTextContent('Effective Aug 1, 2026');
    });
  });
});
