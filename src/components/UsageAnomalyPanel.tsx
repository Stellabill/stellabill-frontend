import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Bell, BellOff, RotateCcw } from 'lucide-react';
import './UsageAnomalyPanel.css';

export type AnomalySeverity = 'critical' | 'warning' | 'info';
export type AnomalyPeriod = 'day' | 'week';

export interface UsageAnomaly {
  /** Stable id for this specific detection instance. */
  id: string;
  /** Stable id for the kind of anomaly (e.g. "api_calls_spike"). Mute is scoped to this. */
  typeId: string;
  /** Human readable metric name, e.g. "API calls". */
  metricLabel: string;
  period: AnomalyPeriod;
  /** Signed percentage change vs the comparison window (e.g. 340, -62). */
  deltaPercent: number;
  currentValue: number;
  previousValue: number;
  unit: string;
  severity: AnomalySeverity;
  /** Short plain-language explanation of why this was flagged. */
  reason: string;
  /** ISO 8601 timestamp. */
  detectedAt: string;
}

interface UsageAnomalyPanelProps {
  anomalies: UsageAnomaly[];
  /** Namespaces mute persistence per user. Defaults to a shared key. */
  userId?: string;
}

const STORAGE_PREFIX = 'stellabill.usageBilling.mutedAnomalyTypes';

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}.${userId}`;
}

function loadMutedTypes(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((value): value is string => typeof value === 'string'));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function saveMutedTypes(userId: string, muted: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(muted)));
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.) — mute state
    // simply won't persist across reloads in that case.
  }
}

const PERIOD_LABEL: Record<AnomalyPeriod, string> = {
  day: 'Day-over-day',
  week: 'Week-over-week',
};

const SEVERITY_LABEL: Record<AnomalySeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

function formatDelta(deltaPercent: number): string {
  const rounded = Math.round(deltaPercent);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

function deltaDirection(deltaPercent: number): 'up' | 'down' | 'unchanged' {
  if (deltaPercent > 0) return 'up';
  if (deltaPercent < 0) return 'down';
  return 'unchanged';
}

export default function UsageAnomalyPanel({ anomalies, userId = 'default' }: UsageAnomalyPanelProps) {
  const [mutedTypes, setMutedTypes] = useState<Set<string>>(() => loadMutedTypes(userId));
  const [showMuted, setShowMuted] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Re-sync if the panel is reused for a different user within the same session.
  useEffect(() => {
    setMutedTypes(loadMutedTypes(userId));
  }, [userId]);

  const activeAnomalies = useMemo(
    () => anomalies.filter((anomaly) => !mutedTypes.has(anomaly.typeId)),
    [anomalies, mutedTypes],
  );

  const mutedTypeSummary = useMemo(() => {
    const seen = new Map<string, string>();
    for (const anomaly of anomalies) {
      if (mutedTypes.has(anomaly.typeId) && !seen.has(anomaly.typeId)) {
        seen.set(anomaly.typeId, anomaly.metricLabel);
      }
    }
    return Array.from(seen.entries()).map(([typeId, label]) => ({ typeId, label }));
  }, [anomalies, mutedTypes]);

  const muteType = useCallback(
    (typeId: string, label: string) => {
      setMutedTypes((prev) => {
        const next = new Set(prev);
        next.add(typeId);
        saveMutedTypes(userId, next);
        return next;
      });
      setAnnouncement(`Muted future ${label} alerts.`);
    },
    [userId],
  );

  const unmuteType = useCallback(
    (typeId: string, label: string) => {
      setMutedTypes((prev) => {
        const next = new Set(prev);
        next.delete(typeId);
        saveMutedTypes(userId, next);
        return next;
      });
      setAnnouncement(`Unmuted ${label} alerts.`);
    },
    [userId],
  );

  const resetMutes = useCallback(() => {
    setMutedTypes(() => {
      const next = new Set<string>();
      saveMutedTypes(userId, next);
      return next;
    });
    setAnnouncement('All muted anomaly types have been reset.');
  }, [userId]);

  const hasAnomalies = anomalies.length > 0;
  const hasActive = activeAnomalies.length > 0;
  const hasMuted = mutedTypeSummary.length > 0;

  return (
    <section className="anomaly-panel" aria-label="Usage anomaly alerts">
      <div className="anomaly-panel-header">
        <div>
          <h2>Anomaly alerts</h2>
          <p className="anomaly-panel-subtitle">
            We flag usage changes greater than 50% day-over-day or 100% week-over-week compared to
            your trailing 7-day average.
          </p>
        </div>
        {hasMuted && (
          <button type="button" className="anomaly-reset-button" onClick={resetMutes}>
            <RotateCcw size={14} aria-hidden="true" />
            Reset all mutes
          </button>
        )}
      </div>

      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>

      {!hasAnomalies && (
        <p className="anomaly-empty" role="status">
          No usage anomalies detected for this period.
        </p>
      )}

      {hasAnomalies && !hasActive && (
        <p className="anomaly-empty" role="status">
          All anomaly types are currently muted.{' '}
          <button type="button" className="anomaly-inline-link" onClick={resetMutes}>
            Reset mutes
          </button>
        </p>
      )}

      {hasActive && (
        <ul className="anomaly-list">
          {activeAnomalies.map((anomaly) => (
            <AnomalyRow
              key={anomaly.id}
              anomaly={anomaly}
              onMute={() => muteType(anomaly.typeId, anomaly.metricLabel)}
            />
          ))}
        </ul>
      )}

      {hasMuted && (
        <div className="anomaly-muted-section">
          <button
            type="button"
            className="anomaly-muted-toggle"
            aria-expanded={showMuted}
            onClick={() => setShowMuted((value) => !value)}
          >
            Muted alert types ({mutedTypeSummary.length})
          </button>
          {showMuted && (
            <ul className="anomaly-muted-list">
              {mutedTypeSummary.map(({ typeId, label }) => (
                <li key={typeId} className="anomaly-muted-item">
                  <span>{label}</span>
                  <button
                    type="button"
                    className="anomaly-unmute-button"
                    onClick={() => unmuteType(typeId, label)}
                  >
                    <Bell size={14} aria-hidden="true" />
                    Unmute
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function AnomalyRow({ anomaly, onMute }: { anomaly: UsageAnomaly; onMute: () => void }) {
  const direction = deltaDirection(anomaly.deltaPercent);
  const DeltaIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : null;
  const deltaText = formatDelta(anomaly.deltaPercent);
  const deltaAriaLabel =
    direction === 'unchanged'
      ? 'No change'
      : `${direction === 'up' ? 'Up' : 'Down'} ${Math.abs(Math.round(anomaly.deltaPercent))} percent`;

  return (
    <li className={`anomaly-row anomaly-row--${anomaly.severity}`}>
      <div className="anomaly-row-main">
        <span
          className={`anomaly-severity-dot anomaly-severity-dot--${anomaly.severity}`}
          aria-hidden="true"
        />
        <div className="anomaly-row-content">
          <div className="anomaly-row-heading">
            <span className="visually-hidden">{SEVERITY_LABEL[anomaly.severity]} alert: </span>
            <span className="anomaly-metric-label">{anomaly.metricLabel}</span>
            <span className="anomaly-period-badge">{PERIOD_LABEL[anomaly.period]}</span>
            <span
              className={`anomaly-delta-chip anomaly-delta-chip--${direction}`}
              aria-label={deltaAriaLabel}
            >
              {DeltaIcon && <DeltaIcon size={12} aria-hidden="true" />}
              {deltaText}
            </span>
          </div>
          <p className="anomaly-reason">{anomaly.reason}</p>
          <p className="anomaly-values">
            {anomaly.currentValue.toLocaleString()} {anomaly.unit} vs{' '}
            {anomaly.previousValue.toLocaleString()} {anomaly.unit} previously
          </p>
        </div>
      </div>
      <button
        type="button"
        className="anomaly-mute-button"
        onClick={onMute}
        aria-label={`Mute alerts for ${anomaly.metricLabel}`}
      >
        <BellOff size={14} aria-hidden="true" />
        Mute
      </button>
    </li>
  );
}
