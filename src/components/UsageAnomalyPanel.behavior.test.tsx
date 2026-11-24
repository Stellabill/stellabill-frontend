import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsageAnomalyPanel, {
  type AnomalySeverity,
  type AnomalyPeriod,
  type UsageAnomaly,
} from './UsageAnomalyPanel';

/**
 * Focused behavior suite for the public contract exported by
 * `src/components/UsageAnomalyPanel.tsx`:
 *
 * - `AnomalySeverity` — the closed set of severity levels a row can carry.
 * - `AnomalyPeriod` — the closed set of comparison windows.
 * - `UsageAnomaly` — the shape of a single detection instance.
 *
 * The types are compile-time only, so behavior is asserted through how the
 * component renders each legal value of the union (the observable part of the
 * contract). State transitions cover the mute/unmute/reset lifecycle,
 * including invalid persisted state and the transitions between every
 * empty/active/all-muted configuration.
 */

const SEVERITIES: AnomalySeverity[] = ['critical', 'warning', 'info'];
const PERIODS: AnomalyPeriod[] = ['day', 'week'];

const SEVERITY_VISUAL_MARKER: Record<AnomalySeverity, RegExp> = {
  critical: /critical alert:/i,
  warning: /warning alert:/i,
  info: /info alert:/i,
};

const SEVERITY_DOT_CLASS: Record<AnomalySeverity, string> = {
  critical: 'anomaly-severity-dot--critical',
  warning: 'anomaly-severity-dot--warning',
  info: 'anomaly-severity-dot--info',
};

const PERIOD_LABEL: Record<AnomalyPeriod, string> = {
  day: 'Day-over-day',
  week: 'Week-over-week',
};

/** Build a minimal, fully valid anomaly for the given contract values. */
function makeAnomaly(
  overrides: Partial<UsageAnomaly> & { id: string; severity: AnomalySeverity; period: AnomalyPeriod },
): UsageAnomaly {
  return {
    typeId: `type-${overrides.id}`,
    metricLabel: `Metric ${overrides.id}`,
    deltaPercent: 120,
    currentValue: 250,
    previousValue: 100,
    unit: 'requests',
    reason: 'Usage deviated from the trailing average.',
    detectedAt: '2026-09-01T12:00:00Z',
    ...overrides,
  };
}

function makeAnomalyFor(severity: AnomalySeverity, period: AnomalyPeriod): UsageAnomaly {
  return makeAnomaly({
    id: `${severity}-${period}`,
    severity,
    period,
  });
}

describe('UsageAnomalyPanel contract (AnomalySeverity / AnomalyPeriod / UsageAnomaly)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe.each(SEVERITIES)('AnomalySeverity = "%s"', (severity) => {
    it('renders the severity as a screen-reader announcement, not color alone', () => {
      render(<UsageAnomalyPanel anomalies={[makeAnomalyFor(severity, 'day')]} />);

      expect(screen.getByText(SEVERITY_VISUAL_MARKER[severity])).toBeInTheDocument();
    });

    it('applies the severity-specific visual marker class', () => {
      const { container } = render(
        <UsageAnomalyPanel anomalies={[makeAnomalyFor(severity, 'day')]} />,
      );

      expect(
        container.querySelector(`.anomaly-severity-dot.${SEVERITY_DOT_CLASS[severity]}`),
      ).not.toBeNull();
      expect(container.querySelector(`.anomaly-row--${severity}`)).not.toBeNull();
    });

    it('still renders the full row content for that severity', () => {
      render(<UsageAnomalyPanel anomalies={[makeAnomalyFor(severity, 'day')]} />);

      const row = screen.getByRole('listitem');
      expect(within(row).getByText('Day-over-day')).toBeInTheDocument();
      expect(within(row).getByText('+120%')).toBeInTheDocument();
      expect(within(row).getByText(/trailing average/i)).toBeInTheDocument();
    });
  });

  describe.each(PERIODS)('AnomalyPeriod = "%s"', (period) => {
    it('renders the human-readable period badge', () => {
      render(<UsageAnomalyPanel anomalies={[makeAnomalyFor('warning', period)]} />);

      expect(screen.getByText(PERIOD_LABEL[period])).toBeInTheDocument();
    });
  });

  describe('UsageAnomaly rendering of each field', () => {
    it('renders the full contract of a single anomaly', () => {
      const anomaly = makeAnomaly({
        id: 'full-contract',
        severity: 'critical',
        period: 'day',
        metricLabel: 'Webhook deliveries',
        deltaPercent: 340,
        currentValue: 8820,
        previousValue: 2005,
        unit: 'deliveries',
        reason: 'Usage jumped well beyond your typical daily pattern.',
        detectedAt: '2026-09-01T12:00:00Z',
      });
      render(<UsageAnomalyPanel anomalies={[anomaly]} />);

      const row = screen.getByRole('listitem');
      expect(within(row).getByText('Webhook deliveries')).toBeInTheDocument();
      expect(within(row).getByText('Day-over-day')).toBeInTheDocument();
      expect(within(row).getByText('+340%')).toBeInTheDocument();
      expect(within(row).getByText(anomaly.reason)).toBeInTheDocument();
      // Values are locale-formatted with their unit.
      expect(within(row).getByText('8,820 deliveries vs 2,005 deliveries previously')).toBeInTheDocument();
      // Delta chip exposes direction to assistive tech.
      expect(screen.getByLabelText('Up 340 percent')).toBeInTheDocument();
    });

    it('rounds fractional deltas and signs zero-negative values deterministically', () => {
      const anomaly = makeAnomaly({
        id: 'rounding',
        severity: 'info',
        period: 'week',
        deltaPercent: -62.49,
      });
      render(<UsageAnomalyPanel anomalies={[anomaly]} />);

      expect(screen.getByText('-62%')).toBeInTheDocument();
      expect(screen.getByLabelText('Down 62 percent')).toBeInTheDocument();
    });

    it('treats a zero delta as "No change" without a direction icon label', () => {
      const anomaly = makeAnomaly({
        id: 'flat',
        severity: 'info',
        period: 'week',
        deltaPercent: 0,
      });
      render(<UsageAnomalyPanel anomalies={[anomaly]} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByLabelText('No change')).toBeInTheDocument();
    });

    it('keeps duplicate typeIds as independent rows keyed by id', () => {
      const first = makeAnomaly({ id: 'dup-1', severity: 'warning', period: 'day' });
      const second = makeAnomaly({ id: 'dup-2', severity: 'warning', period: 'week' });
      render(<UsageAnomalyPanel anomalies={[first, second]} />);

      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });
});

describe('UsageAnomalyPanel state transitions', () => {
  const active = makeAnomaly({ id: 'active', severity: 'critical', period: 'day' });
  const other = makeAnomaly({ id: 'other', severity: 'info', period: 'week' });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('transitions empty -> active when anomalies arrive', () => {
    const { rerender } = render(<UsageAnomalyPanel anomalies={[]} />);

    expect(screen.getByText(/no usage anomalies detected/i)).toBeInTheDocument();

    rerender(<UsageAnomalyPanel anomalies={[active]} />);

    expect(screen.queryByText(/no usage anomalies detected/i)).not.toBeInTheDocument();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('transitions active -> all-muted -> unmuted back to active', async () => {
    const user = userEvent.setup();
    render(<UsageAnomalyPanel anomalies={[active]} />);

    await user.click(screen.getByRole('button', { name: /mute alerts for metric active/i }));
    expect(screen.getByText(/all anomaly types are currently muted/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset mutes/i }));
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('keeps mixed state: muting one type only hides that type', async () => {
    const user = userEvent.setup();
    render(<UsageAnomalyPanel anomalies={[active, other]} />);

    await user.click(screen.getByRole('button', { name: /mute alerts for metric active/i }));

    expect(screen.queryByText('Metric active')).not.toBeInTheDocument();
    expect(screen.getByText('Metric other')).toBeInTheDocument();
    expect(screen.queryByText(/all anomaly types are currently muted/i)).not.toBeInTheDocument();
  });

  it('persists mutes under a namespaced per-user storage key', async () => {
    const user = userEvent.setup();
    render(<UsageAnomalyPanel anomalies={[active]} userId="user-42" />);

    await user.click(screen.getByRole('button', { name: /mute alerts for metric active/i }));

    const stored = window.localStorage.getItem(
      'stellabill.usageBilling.mutedAnomalyTypes.user-42',
    );
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual(['type-active']);
  });

  it('re-syncs mutes when the userId prop changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<UsageAnomalyPanel anomalies={[active]} userId="user-a" />);

    await user.click(screen.getByRole('button', { name: /mute alerts for metric active/i }));
    expect(screen.queryByText('Metric active')).not.toBeInTheDocument();

    rerender(<UsageAnomalyPanel anomalies={[active]} userId="user-b" />);

    expect(screen.getByText('Metric active')).toBeInTheDocument();
  });

  it('recovers to an empty mute set from malformed persisted JSON', () => {
    window.localStorage.setItem(
      'stellabill.usageBilling.mutedAnomalyTypes.default',
      '{not valid json',
    );

    expect(() => render(<UsageAnomalyPanel anomalies={[active]} />)).not.toThrow();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('ignores non-string entries in persisted mute arrays', () => {
    window.localStorage.setItem(
      'stellabill.usageBilling.mutedAnomalyTypes.default',
      JSON.stringify(['type-active', 42, null, { nested: true }]),
    );

    render(<UsageAnomalyPanel anomalies={[active, other]} />);

    // Only the valid string entry was applied.
    expect(screen.queryByText('Metric active')).not.toBeInTheDocument();
    expect(screen.getByText('Metric other')).toBeInTheDocument();
  });

  it('treats persisted JSON that is not an array as an empty mute set', () => {
    window.localStorage.setItem(
      'stellabill.usageBilling.mutedAnomalyTypes.default',
      JSON.stringify({ muted: ['type-active'] }),
    );

    render(<UsageAnomalyPanel anomalies={[active]} />);

    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('announces unmute to the live region with the metric label', async () => {
    const user = userEvent.setup();
    render(<UsageAnomalyPanel anomalies={[active]} />);

    await user.click(screen.getByRole('button', { name: /mute alerts for metric active/i }));
    await user.click(screen.getByRole('button', { name: /muted alert types \(1\)/i }));
    await user.click(screen.getByRole('button', { name: /unmute/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/unmuted metric active alerts/i);
  });

  it('announces a full reset to the live region', async () => {
    const user = userEvent.setup();
    render(<UsageAnomalyPanel anomalies={[active]} />);

    await user.click(screen.getByRole('button', { name: /mute alerts for metric active/i }));
    await user.click(screen.getByRole('button', { name: /reset all mutes/i }));

    expect(screen.getByRole('status')).toHaveTextContent(
      /all muted anomaly types have been reset/i,
    );
  });

  it('keeps the muted section collapsed until explicitly expanded', async () => {
    const user = userEvent.setup();
    render(<UsageAnomalyPanel anomalies={[active]} />);

    await user.click(screen.getByRole('button', { name: /mute alerts for metric active/i }));

    const toggle = screen.getByRole('button', { name: /muted alert types \(1\)/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /unmute/i })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument();
  });
});
