import { ReactNode, HTMLAttributes } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Target } from 'lucide-react';
import CardErrorSlot from './CardErrorSlot';
import Sparkline from '../common/Sparkline';
import './DashboardCard.css';

export type DeltaDirection = 'up' | 'down' | 'neutral';

/** Round a delta magnitude for display (e.g. 1250 -> "1.3K", 12.5 -> "12.5"). */
export function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}K`;
  }
  if (Number.isInteger(abs)) return String(abs);
  return abs.toFixed(1);
}

/** Clamp a target progress value to the 0-100 bar range (negative -> 0). */
export function clampTargetProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
}

interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  /** Percentage change vs previous period (e.g. 12.5 means +12.5%). */
  change?: number;
  /** Explicit direction; defaults to sign of `change`. */
  trend?: DeltaDirection;
  /** Comparison label shown under the delta. */
  deltaLabel?: string;
  /** Optional sparkline series. Rendered when it has at least 2 points. */
  sparklineData?: number[];
  /** Optional sparkline stroke color. Defaults to chart series 1. */
  sparklineColor?: string;
  /** Optional target/goal value shown with a target indicator. */
  target?: string | number;
  /** Label for the target indicator (defaults to "Goal"). */
  targetLabel?: string;
  /** Optional progress toward the target, as a percentage (0-100+). */
  targetProgress?: number;
  loading?: boolean;
  icon?: ReactNode;
  helpText?: string;
  /** When set the card body is replaced with an in-card error slot. */
  error?: string | null;
  /** True when the error is an offline / no-network condition. */
  isOfflineError?: boolean;
  /** Called when the user presses the in-card Retry button. */
  onRetry?: () => void;
  /** True while a retry request is in-flight. */
  retrying?: boolean;
}

const DEFAULT_DELTA_LABEL = 'vs last 30 days';

function resolveTrend(change: number | undefined, trend?: DeltaDirection): DeltaDirection {
  if (trend) return trend;
  if (change === undefined || change === 0) return 'neutral';
  return change > 0 ? 'up' : 'down';
}

export default function DashboardCard({
  title,
  value,
  change,
  trend,
  deltaLabel = DEFAULT_DELTA_LABEL,
  sparklineData,
  sparklineColor,
  target,
  targetLabel = 'Goal',
  targetProgress,
  loading = false,
  icon,
  helpText,
  error,
  isOfflineError = false,
  onRetry,
  retrying = false,
  ...rest
}: DashboardCardProps) {
  if (loading) {
    return (
      <div className="dashboard-card dashboard-card--loading animate-pulse">
        <div className="dashboard-card__header">
          <div className="dashboard-card__skeleton-line dashboard-card__skeleton-line--title" />
          <div className="dashboard-card__skeleton-icon" />
        </div>
        <div className="dashboard-card__skeleton-line dashboard-card__skeleton-line--value" />
        <div className="dashboard-card__skeleton-line dashboard-card__skeleton-line--caption" />
      </div>
    );
  }

  const direction = resolveTrend(change, trend);
  const trendConfig = {
    up: { icon: ArrowUpRight, className: 'dashboard-card__trend--up', sign: '+' },
    down: { icon: ArrowDownRight, className: 'dashboard-card__trend--down', sign: '-' },
    neutral: { icon: Minus, className: 'dashboard-card__trend--neutral', sign: '' },
  };
  const trendMeta = trendConfig[direction];
  const TrendIcon = trendMeta.icon;
  const showDelta = change !== undefined;
  const showSparkline = !!sparklineData && sparklineData.length >= 2;
  const showTarget = target !== undefined;
  const hasSparklineClass = showSparkline ? ' dashboard-card--with-sparkline' : '';
  const hasTargetClass = showTarget ? ' dashboard-card--with-target' : '';
  const clampedProgress = targetProgress !== undefined ? clampTargetProgress(targetProgress) : undefined;

  return (
    <div className={`dashboard-card${error ? ' dashboard-card--error' : ''}${hasSparklineClass}${hasTargetClass}`} {...rest}>
      <div className="dashboard-card__header">
        <div>
          <h3 className="dashboard-card__title">
            {title}
            {helpText && (
              <span className="dashboard-card__help" title={helpText}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </span>
            )}
          </h3>
        </div>
        {icon && <div className="dashboard-card__icon">{icon}</div>}
      </div>

      {error ? (
        <CardErrorSlot
          widgetLabel={title}
          message={error}
          isOffline={isOfflineError}
          onRetry={onRetry}
          retrying={retrying}
        />
      ) : (
        <>
          <div className="dashboard-card__metric">
            <div className="dashboard-card__value">{value}</div>
            {showDelta && (
              <div className={`dashboard-card__trend ${trendMeta.className}`} role="status" aria-live="polite">
                <TrendIcon size={12} aria-hidden="true" />
                <span aria-hidden="true">
                  {trendMeta.sign}
                  {formatDelta(change)}
                </span>
                <span className="sr-only">
                  {trendMeta.sign}
                  {formatDelta(change)} percent {deltaLabel}
                </span>
              </div>
            )}
          </div>

          {showDelta && (
            <p className="dashboard-card__caption">
              {deltaLabel}
            </p>
          )}

          {showSparkline && (
            <div className="dashboard-card__sparkline">
              <Sparkline
                data={sparklineData}
                width={160}
                height={40}
                color={sparklineColor}
                strokeWidth={2}
                showArea
                className="dashboard-card__sparkline-chart"
                aria-label={`${title} trend`}
              />
            </div>
          )}

          {showTarget && (
            <div className="dashboard-card__target">
              <Target size={12} aria-hidden="true" />
              <span>
                {targetLabel}: {target}
              </span>
              {targetProgress !== undefined && (
                <span className="dashboard-card__target-meta">
                  <span
                    className={`dashboard-card__target-progress${
                      targetProgress < 0 ? ' dashboard-card__target-progress--negative' : ''
                    }`}
                  >
                    {Math.round(targetProgress)}%
                  </span>
                  <span className="dashboard-card__target-bar" aria-hidden="true">
                    <span
                      className="dashboard-card__target-bar-fill"
                      style={{ width: `${clampedProgress}%` }}
                    />
                  </span>
                  <span className="sr-only">
                    {targetProgress < 0
                      ? `Behind target by ${Math.abs(Math.round(targetProgress))} percent`
                      : `${Math.round(targetProgress)} percent of target`}
                  </span>
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
