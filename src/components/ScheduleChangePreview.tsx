/**
 * ScheduleChangePreview
 *
 * Shows a side-by-side "old vs new" billing schedule comparison when a
 * subscriber is changing their billing interval (e.g. weekly → monthly).
 * Displays the next 3 charge dates under each schedule, highlights the
 * first date that diverges from the current schedule, and shows an
 * effective-date badge and rounding microcopy.
 *
 * Accessibility: WCAG 2.1 AA
 *   - role="region" with aria-labelledby pointing at the heading
 *   - All dates use <time> with dateTime ISO value
 *   - Strikethrough text has aria-label with human-readable equivalent
 *   - Icons are aria-hidden; text carries the semantic meaning
 *   - Focus-visible outline inherited from design-system tokens
 */

import './ScheduleChangePreview.css';

// ── Supported billing intervals ──────────────────────────────────────────────

export type BillingInterval = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

const INTERVAL_DAYS: Record<BillingInterval, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,   // approximation used for preview only; real billing uses calendar months
  quarterly: 91,
  yearly: 365,
};

const INTERVAL_LABEL: Record<BillingInterval, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

// ── Prop types ────────────────────────────────────────────────────────────────

export interface ScheduleChangePreviewProps {
  /** ISO date string of the current next charge date, e.g. "2026-08-01" */
  currentNextCharge: string;
  /** The existing billing interval */
  currentInterval: BillingInterval;
  /** The proposed new billing interval */
  newInterval: BillingInterval;
  /** Per-cycle charge amount as a number */
  amount: number;
  /** Currency code, e.g. "USDC", "USD", "ETH" */
  currency: string;
  /**
   * ISO date string for when the new schedule takes effect.
   * Defaults to currentNextCharge if omitted.
   */
  effectiveDate?: string;
  /** Number of upcoming cycles to preview. Defaults to 3. */
  cycles?: number;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseIso(isoDate: string): Date {
  // Parse without timezone shift by treating it as local date
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Advance a date by the given interval using calendar-accurate logic where
 * possible (calendar months/years), falling back to day-count otherwise.
 */
function addInterval(base: Date, interval: BillingInterval): Date {
  const next = new Date(base);
  if (interval === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (interval === 'quarterly') {
    next.setMonth(next.getMonth() + 3);
  } else if (interval === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setDate(next.getDate() + INTERVAL_DAYS[interval]);
  }
  return next;
}

/**
 * Build an ordered list of the next N charge dates starting from `anchor`.
 * The first entry IS the anchor (the "next" charge on that schedule).
 */
function buildSchedule(anchor: Date, interval: BillingInterval, count: number): Date[] {
  const dates: Date[] = [anchor];
  for (let i = 1; i < count; i++) {
    dates.push(addInterval(dates[i - 1], interval));
  }
  return dates;
}

/** Find the index of the first date that differs between two schedules. */
function findFirstDivergence(oldDates: Date[], newDates: Date[]): number {
  for (let i = 0; i < Math.min(oldDates.length, newDates.length); i++) {
    if (toIsoDate(oldDates[i]) !== toIsoDate(newDates[i])) return i;
  }
  return -1; // schedules are identical (same interval)
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface DateListProps {
  dates: Date[];
  divergeIndex: number;
  side: 'old' | 'new';
}

function DateList({ dates, divergeIndex, side }: DateListProps) {
  return (
    <ul className="scp-date-list" aria-label={`${side === 'old' ? 'Current' : 'New'} schedule dates`}>
      {dates.map((date, i) => {
        const isoVal = toIsoDate(date);
        const display = formatDisplay(date);
        const isDiverge = divergeIndex >= 0 && i >= divergeIndex;
        const isFirstDiverge = i === divergeIndex;

        const rowClass = [
          'scp-date-row',
          side === 'old' && isDiverge ? 'scp-date-row--diverge-old' : '',
          side === 'new' && isDiverge ? 'scp-date-row--diverge' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li key={isoVal} className={rowClass}>
            <span className="scp-cycle-num" aria-hidden="true">
              {i + 1}.
            </span>

            {side === 'old' && isDiverge ? (
              <time
                dateTime={isoVal}
                className="scp-date-value"
                aria-label={`Cycle ${i + 1}: ${display}, removed`}
              >
                {display}
              </time>
            ) : (
              <time dateTime={isoVal} className="scp-date-value">
                {display}
              </time>
            )}

            {side === 'new' && isFirstDiverge && (
              <span className="scp-diverge-badge" aria-label="First changed date">
                new
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScheduleChangePreview({
  currentNextCharge,
  currentInterval,
  newInterval,
  amount,
  currency,
  effectiveDate,
  cycles = 3,
}: ScheduleChangePreviewProps) {
  const anchor = parseIso(currentNextCharge);
  const effectiveDateObj = effectiveDate ? parseIso(effectiveDate) : anchor;

  // Build schedules
  const oldDates = buildSchedule(anchor, currentInterval, cycles);
  const newDates = buildSchedule(effectiveDateObj, newInterval, cycles);

  const divergeIndex = findFirstDivergence(oldDates, newDates);

  // Microcopy: explain that dates are rounded to the billing day
  const isIntervalChange = currentInterval !== newInterval;
  const effectiveDisplayDate = formatDisplay(effectiveDateObj);
  const effectiveIso = toIsoDate(effectiveDateObj);

  const amountFormatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(amount);

  return (
    <div
      className="schedule-change-preview"
      role="region"
      aria-labelledby="scp-heading"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="scp-header">
        <div className="scp-icon" aria-hidden="true">
          {/* Calendar-swap icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <polyline points="8 14 10 16 16 12" />
          </svg>
        </div>

        <h3 id="scp-heading" className="scp-title">
          Schedule change preview
        </h3>

        {/* Effective-date badge */}
        <span className="scp-effective-badge" role="status" aria-live="polite">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Effective{' '}
          <time dateTime={effectiveIso}>{effectiveDisplayDate}</time>
        </span>
      </div>

      {/* ── Two-column comparison ──────────────────────────────────────── */}
      <div className="scp-columns">
        {/* Old schedule column */}
        <div className="scp-column scp-column--old">
          <div className="scp-column-header">
            <span className="scp-column-label">Current schedule</span>
            <span className="scp-interval-chip scp-interval-chip--old" aria-label={`Current interval: ${INTERVAL_LABEL[currentInterval]}`}>
              {INTERVAL_LABEL[currentInterval]}
            </span>
          </div>

          <DateList dates={oldDates} divergeIndex={divergeIndex} side="old" />

          {/* Amount */}
          <div className="scp-amount scp-amount--old" aria-label={`Current charge amount: ${amountFormatted} ${currency}`}>
            {amountFormatted} {currency}
          </div>
        </div>

        {/* Arrow divider */}
        <div className="scp-arrow" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* New schedule column */}
        <div className="scp-column scp-column--new">
          <div className="scp-column-header">
            <span className="scp-column-label">New schedule</span>
            <span className="scp-interval-chip scp-interval-chip--new" aria-label={`New interval: ${INTERVAL_LABEL[newInterval]}`}>
              {INTERVAL_LABEL[newInterval]}
            </span>
          </div>

          <DateList dates={newDates} divergeIndex={divergeIndex} side="new" />

          {/* Amount */}
          <div className="scp-amount" aria-label={`New charge amount: ${amountFormatted} ${currency}`}>
            {amountFormatted} {currency}
          </div>
        </div>
      </div>

      {/* ── Microcopy notice ──────────────────────────────────────────── */}
      {isIntervalChange && (
        <div className="scp-notice" role="note">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>
            Dates are rounded to your billing day. The new{' '}
            <strong>{INTERVAL_LABEL[newInterval].toLowerCase()}</strong> schedule
            starts on{' '}
            <time dateTime={effectiveIso}>
              <strong>{effectiveDisplayDate}</strong>
            </time>
            . Any partial period up to that date is pro-rated.
          </p>
        </div>
      )}
    </div>
  );
}
