import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import UsageAnomalyPanel from './UsageAnomalyPanel';
import type { UsageAnomaly } from './UsageAnomalyPanel';

const spikeAnomaly: UsageAnomaly = {
  id: 'a1',
  typeId: 'api_calls_spike',
  metricLabel: 'API calls',
  period: 'day',
  deltaPercent: 340,
  currentValue: 8820,
  previousValue: 2005,
  unit: 'calls',
  severity: 'critical',
  reason: 'Usage jumped well beyond your typical daily pattern.',
  detectedAt: '2026-03-30T09:00:00Z',
};

const dropAnomaly: UsageAnomaly = {
  id: 'a2',
  typeId: 'storage_growth',
  metricLabel: 'Storage',
  period: 'week',
  deltaPercent: -62,
  currentValue: 4.2,
  previousValue: 11.1,
  unit: 'GB',
  severity: 'info',
  reason: 'Storage usage dropped sharply compared to last week.',
  detectedAt: '2026-03-29T09:00:00Z',
};

function renderPanel(anomalies: UsageAnomaly[], userId?: string) {
  return render(<UsageAnomalyPanel anomalies={anomalies} userId={userId} />);
}

describe('UsageAnomalyPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the panel heading and threshold microcopy', () => {
    renderPanel([spikeAnomaly]);
    expect(screen.getByRole('heading', { name: /anomaly alerts/i })).toBeInTheDocument();
    expect(screen.getByText(/greater than 50% day-over-day/i)).toBeInTheDocument();
  });

  it('shows an empty state when there are no anomalies', () => {
    renderPanel([]);
    expect(screen.getByText(/no usage anomalies detected/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders each anomaly with metric, period, delta and reason', () => {
    renderPanel([spikeAnomaly, dropAnomaly]);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);

    const [row1, row2] = rows;
    expect(within(row1).getByText('API calls')).toBeInTheDocument();
    expect(within(row1).getByText('Day-over-day')).toBeInTheDocument();
    expect(within(row1).getByText('+340%')).toBeInTheDocument();
    expect(within(row1).getByText(spikeAnomaly.reason)).toBeInTheDocument();

    expect(within(row2).getByText('Storage')).toBeInTheDocument();
    expect(within(row2).getByText('Week-over-week')).toBeInTheDocument();
    expect(within(row2).getByText('-62%')).toBeInTheDocument();
  });

  it('gives the delta chip an accessible label describing direction, not just the symbol', () => {
    renderPanel([spikeAnomaly, dropAnomaly]);
    expect(screen.getByLabelText('Up 340 percent')).toBeInTheDocument();
    expect(screen.getByLabelText('Down 62 percent')).toBeInTheDocument();
  });

  it('conveys severity via text for screen readers, not color alone', () => {
    renderPanel([spikeAnomaly]);
    expect(screen.getByText(/critical alert:/i)).toBeInTheDocument();
  });

  it('mutes an anomaly type, hides its rows, and announces the change', async () => {
    const user = userEvent.setup();
    renderPanel([spikeAnomaly, dropAnomaly]);

    await user.click(screen.getByRole('button', { name: /mute alerts for api calls/i }));

    expect(screen.queryByText('API calls')).not.toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/muted future api calls alerts/i);

    // Muted type is listed and can be unmuted individually.
    await user.click(screen.getByRole('button', { name: /muted alert types \(1\)/i }));
    const mutedItem = screen.getByText('API calls').closest('li');
    expect(mutedItem).not.toBeNull();
    await user.click(within(mutedItem as HTMLElement).getByRole('button', { name: /unmute/i }));

    expect(screen.getAllByText('API calls')).toHaveLength(1); // back in the active list
  });

  it('shows an "all muted" message with a reset affordance when every anomaly is muted', async () => {
    const user = userEvent.setup();
    renderPanel([spikeAnomaly]);

    await user.click(screen.getByRole('button', { name: /mute alerts for api calls/i }));

    expect(screen.getByText(/all anomaly types are currently muted/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset mutes/i }));
    expect(screen.getByText('API calls')).toBeInTheDocument();
  });

  it('resets all mutes via the header reset control', async () => {
    const user = userEvent.setup();
    renderPanel([spikeAnomaly, dropAnomaly]);

    await user.click(screen.getByRole('button', { name: /mute alerts for api calls/i }));
    await user.click(screen.getByRole('button', { name: /mute alerts for storage/i }));
    expect(screen.getByRole('button', { name: /reset all mutes/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset all mutes/i }));

    expect(screen.getByText('API calls')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reset all mutes/i })).not.toBeInTheDocument();
  });

  it('does not render the reset control or muted section when nothing is muted', () => {
    renderPanel([spikeAnomaly]);
    expect(screen.queryByRole('button', { name: /reset all mutes/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/muted alert types/i)).not.toBeInTheDocument();
  });

  it('persists mute state across remounts for the same user', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPanel([spikeAnomaly], 'user-1');
    await user.click(screen.getByRole('button', { name: /mute alerts for api calls/i }));
    unmount();

    renderPanel([spikeAnomaly], 'user-1');
    expect(screen.getByText(/all anomaly types are currently muted/i)).toBeInTheDocument();
  });

  it('scopes mute persistence per user id', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPanel([spikeAnomaly], 'user-1');
    await user.click(screen.getByRole('button', { name: /mute alerts for api calls/i }));
    unmount();

    renderPanel([spikeAnomaly], 'user-2');
    expect(screen.getByText('API calls')).toBeInTheDocument();
  });

  it('recovers gracefully when localStorage contains malformed data', () => {
    window.localStorage.setItem('stellabill.usageBilling.mutedAnomalyTypes.default', 'not-json');
    expect(() => renderPanel([spikeAnomaly])).not.toThrow();
    expect(screen.getByText('API calls')).toBeInTheDocument();
  });

  it('renders correctly under an RTL document direction', () => {
    const { container } = render(
      <div dir="rtl">
        <UsageAnomalyPanel anomalies={[spikeAnomaly, dropAnomaly]} />
      </div>,
    );

    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
    // Delta values must stay intact (not mirrored/reformatted) regardless of direction.
    expect(screen.getByText('+340%')).toBeInTheDocument();
    expect(screen.getByText('-62%')).toBeInTheDocument();
    expect(screen.getByLabelText('Up 340 percent')).toBeInTheDocument();
  });
});
