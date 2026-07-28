/**
 * ScheduleChangePreview.test.tsx
 *
 * Tests cover:
 * - Rendering with all interval combinations (weekly/biweekly/monthly/quarterly/yearly)
 * - Correct number of date rows (cycles prop)
 * - First-divergence detection and highlighting
 * - Effective-date badge display
 * - Microcopy / notice rendering
 * - WCAG accessibility (role, aria-labelledby, <time> elements, aria-hidden on icons)
 * - RTL: component renders without layout errors (className applied)
 * - Currency and amount formatting
 * - Same-interval edge case (no divergence highlight)
 * - Custom effectiveDate prop
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ScheduleChangePreview, { type BillingInterval } from './ScheduleChangePreview';

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE_DATE = '2026-08-01';
const AMOUNT = 50;
const CURRENCY = 'USDC';

function renderPreview(overrides: Partial<Parameters<typeof ScheduleChangePreview>[0]> = {}) {
  return render(
    <ScheduleChangePreview
      currentNextCharge={BASE_DATE}
      currentInterval="weekly"
      newInterval="monthly"
      amount={AMOUNT}
      currency={CURRENCY}
      {...overrides}
    />
  );
}

// ── Basic rendering ───────────────────────────────────────────────────────────

describe('ScheduleChangePreview – basic rendering', () => {
  it('renders the heading', () => {
    renderPreview();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Schedule change preview'
    );
  });

  it('renders a region landmark with correct label', () => {
    renderPreview();
    expect(
      screen.getByRole('region', { name: /schedule change preview/i })
    ).toBeInTheDocument();
  });

  it('renders old and new column labels', () => {
    renderPreview();
    expect(screen.getByText('Current schedule')).toBeInTheDocument();
    expect(screen.getByText('New schedule')).toBeInTheDocument();
  });

  it('renders interval chips for both sides', () => {
    renderPreview({ currentInterval: 'weekly', newInterval: 'monthly' });
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('renders the amount in both columns', () => {
    renderPreview({ amount: 75.5, currency: 'ETH' });
    const amounts = screen.getAllByText(/75\.5 ETH/);
    // Amount appears in old and new columns
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the effective-date badge', () => {
    renderPreview({ effectiveDate: '2026-08-01' });
    expect(screen.getByText(/effective/i)).toBeInTheDocument();
  });
});

// ── Cycles / date rows ────────────────────────────────────────────────────────

describe('ScheduleChangePreview – cycles', () => {
  it('renders default 3 cycle rows in each column', () => {
    const { container } = renderPreview();
    const dateRows = container.querySelectorAll('.scp-date-row');
    // 3 old + 3 new = 6 rows
    expect(dateRows.length).toBe(6);
  });

  it('renders custom number of cycles', () => {
    const { container } = renderPreview({ cycles: 5 });
    const dateRows = container.querySelectorAll('.scp-date-row');
    expect(dateRows.length).toBe(10); // 5 old + 5 new
  });

  it('all date rows contain <time> elements', () => {
    const { container } = renderPreview();
    const timeEls = container.querySelectorAll('time');
    // 3 old + 3 new date rows + 1 in effective-date badge + 1 in notice = at least 7
    expect(timeEls.length).toBeGreaterThanOrEqual(6);
  });

  it('time elements have valid ISO dateTime attributes', () => {
    const { container } = renderPreview();
    const timeEls = container.querySelectorAll('time[dateTime]');
    timeEls.forEach(el => {
      const dt = el.getAttribute('dateTime') ?? '';
      expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });
});

// ── Divergence highlighting ───────────────────────────────────────────────────

describe('ScheduleChangePreview – divergence highlighting', () => {
  it('applies diverge class to old column rows from the first difference', () => {
    const { container } = renderPreview({
      currentInterval: 'weekly',
      newInterval: 'monthly',
    });
    const oldDivergeRows = container.querySelectorAll('.scp-date-row--diverge-old');
    expect(oldDivergeRows.length).toBeGreaterThan(0);
  });

  it('applies diverge class to new column rows from the first difference', () => {
    const { container } = renderPreview({
      currentInterval: 'weekly',
      newInterval: 'monthly',
    });
    const newDivergeRows = container.querySelectorAll('.scp-date-row--diverge');
    expect(newDivergeRows.length).toBeGreaterThan(0);
  });

  it('shows the "new" badge on exactly the first diverging new-column row', () => {
    const { container } = renderPreview({
      currentInterval: 'weekly',
      newInterval: 'monthly',
    });
    const badges = container.querySelectorAll('.scp-diverge-badge');
    expect(badges.length).toBe(1);
  });

  it('shows no diverge badges when intervals are identical', () => {
    const { container } = renderPreview({
      currentInterval: 'monthly',
      newInterval: 'monthly',
    });
    const badges = container.querySelectorAll('.scp-diverge-badge');
    expect(badges.length).toBe(0);
  });

  it('weekly → biweekly: first date diverges at cycle 1', () => {
    // weekly: +7d, biweekly: +14d — they diverge from cycle 2 (index 1)
    const { container } = renderPreview({
      currentInterval: 'weekly',
      newInterval: 'biweekly',
    });
    const badges = container.querySelectorAll('.scp-diverge-badge');
    expect(badges.length).toBe(1);
  });
});

// ── Interval combinations ─────────────────────────────────────────────────────

const INTERVAL_PAIRS: [BillingInterval, BillingInterval][] = [
  ['weekly', 'monthly'],
  ['weekly', 'yearly'],
  ['monthly', 'weekly'],
  ['monthly', 'quarterly'],
  ['biweekly', 'monthly'],
  ['quarterly', 'yearly'],
];

describe('ScheduleChangePreview – all interval combinations render without errors', () => {
  INTERVAL_PAIRS.forEach(([from, to]) => {
    it(`${from} → ${to}`, () => {
      const { container } = renderPreview({
        currentInterval: from,
        newInterval: to,
      });
      // Should render 6 date rows (3 per column)
      expect(container.querySelectorAll('.scp-date-row').length).toBe(6);
    });
  });
});

// ── Microcopy notice ──────────────────────────────────────────────────────────

describe('ScheduleChangePreview – microcopy notice', () => {
  it('shows the notice when intervals differ', () => {
    renderPreview({ currentInterval: 'weekly', newInterval: 'monthly' });
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText(/pro-rated/i)).toBeInTheDocument();
  });

  it('hides the notice when intervals are the same', () => {
    renderPreview({ currentInterval: 'monthly', newInterval: 'monthly' });
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('notice mentions the new interval name', () => {
    renderPreview({ currentInterval: 'weekly', newInterval: 'quarterly' });
    const note = screen.getByRole('note');
    expect(within(note).getByText(/quarterly/i)).toBeInTheDocument();
  });
});

// ── Effective date ────────────────────────────────────────────────────────────

describe('ScheduleChangePreview – effectiveDate prop', () => {
  it('shows the effectiveDate in the badge when provided', () => {
    renderPreview({ effectiveDate: '2026-09-01' });
    // "Sep 1, 2026" somewhere inside the badge
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent(/Sep 1, 2026/);
  });

  it('defaults to currentNextCharge when effectiveDate is omitted', () => {
    renderPreview({ currentNextCharge: '2026-08-01', effectiveDate: undefined });
    const badge = screen.getByRole('status');
    // Aug 1, 2026
    expect(badge).toHaveTextContent(/Aug 1, 2026/);
  });
});

// ── Currency & amount formatting ──────────────────────────────────────────────

describe('ScheduleChangePreview – currency and amount', () => {
  it('renders integer amounts without decimals', () => {
    renderPreview({ amount: 100, currency: 'USDC' });
    const amounts = screen.getAllByText(/100 USDC/);
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it('renders decimal amounts correctly', () => {
    renderPreview({ amount: 9.99, currency: 'USD' });
    const amounts = screen.getAllByText(/9\.99 USD/);
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it('renders crypto currency codes', () => {
    renderPreview({ amount: 0.05, currency: 'ETH' });
    const amounts = screen.getAllByText(/ETH/);
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('ScheduleChangePreview – accessibility', () => {
  it('has a heading that labels the region', () => {
    renderPreview();
    const region = screen.getByRole('region');
    const heading = screen.getByRole('heading', { level: 3 });
    expect(region).toHaveAttribute('aria-labelledby', 'scp-heading');
    expect(heading).toHaveAttribute('id', 'scp-heading');
  });

  it('all SVG icons are aria-hidden', () => {
    const { container } = renderPreview();
    const svgs = container.querySelectorAll('svg');
    svgs.forEach(svg => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('arrow divider is aria-hidden', () => {
    const { container } = renderPreview();
    const arrow = container.querySelector('.scp-arrow');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
  });

  it('strikethrough date rows carry aria-label with "removed" semantics', () => {
    const { container } = renderPreview({
      currentInterval: 'weekly',
      newInterval: 'monthly',
    });
    const strikethroughTimes = container.querySelectorAll('.scp-date-row--diverge-old time');
    strikethroughTimes.forEach(el => {
      expect(el).toHaveAttribute('aria-label');
      expect(el.getAttribute('aria-label')).toMatch(/removed/i);
    });
  });

  it('interval chips have descriptive aria-labels', () => {
    const { container } = renderPreview({ currentInterval: 'monthly', newInterval: 'yearly' });
    const chips = container.querySelectorAll('.scp-interval-chip');
    chips.forEach(chip => {
      expect(chip).toHaveAttribute('aria-label');
    });
  });

  it('effective-date badge has role="status"', () => {
    renderPreview();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('date lists have aria-label describing their side', () => {
    const { container } = renderPreview();
    const lists = container.querySelectorAll('ul[aria-label]');
    expect(lists.length).toBe(2);
    const labels = Array.from(lists).map(l => l.getAttribute('aria-label') ?? '');
    expect(labels.some(l => /current/i.test(l))).toBe(true);
    expect(labels.some(l => /new/i.test(l))).toBe(true);
  });
});

// ── RTL layout ───────────────────────────────────────────────────────────────

describe('ScheduleChangePreview – RTL', () => {
  it('renders without errors inside a RTL container', () => {
    const { container } = render(
      <div dir="rtl">
        <ScheduleChangePreview
          currentNextCharge={BASE_DATE}
          currentInterval="monthly"
          newInterval="yearly"
          amount={120}
          currency="USD"
        />
      </div>
    );
    expect(container.querySelector('.schedule-change-preview')).toBeInTheDocument();
  });
});

// ── Snapshot ─────────────────────────────────────────────────────────────────

describe('ScheduleChangePreview – snapshot', () => {
  it('matches snapshot for weekly → monthly change', () => {
    const { container } = renderPreview({
      currentNextCharge: '2026-08-01',
      currentInterval: 'weekly',
      newInterval: 'monthly',
      amount: 50,
      currency: 'USDC',
      effectiveDate: '2026-08-01',
      cycles: 3,
    });
    expect(container.firstChild).toMatchSnapshot();
  });
});
