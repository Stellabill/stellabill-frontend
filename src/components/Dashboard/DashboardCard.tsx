import { ReactNode, HTMLAttributes } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import CardErrorSlot from './CardErrorSlot';
import HelpHint from '../help/HelpHint';
import './DashboardCard.css';

interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  icon?: ReactNode;
  /** Short definition shown inside the contextual help popover. */
  helpText?: string;
  /** Popover title; defaults to the card title. */
  helpTitle?: string;
  /** Optional worked example shown in the popover. */
  helpExample?: string;
  /** Optional "Learn more" destination rendered as an external link. */
  helpLearnMoreUrl?: string;
  /** When set, glossary-backed title, example, and link are applied. */
  helpTermId?: string;
  /** When set the card body is replaced with an in-card error slot. */
  error?: string | null;
  /** True when the error is an offline / no-network condition. */
  isOfflineError?: boolean;
  /** Called when the user presses the in-card Retry button. */
  onRetry?: () => void;
  /** True while a retry request is in-flight. */
  retrying?: boolean;
}

export default function DashboardCard({
  title,
  value,
  change,
  trend,
  loading = false,
  icon,
  helpText,
  helpTitle,
  helpExample,
  helpLearnMoreUrl,
  helpTermId,
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

  const trendConfig = {
    up: { icon: ArrowUpRight, className: 'dashboard-card__trend--up' },
    down: { icon: ArrowDownRight, className: 'dashboard-card__trend--down' },
    neutral: { icon: Minus, className: 'dashboard-card__trend--neutral' },
  };

  const trendMeta = trend ? trendConfig[trend] : undefined;
  const TrendIcon = trendMeta?.icon;

  return (
    <div className={`dashboard-card${error ? ' dashboard-card--error' : ''}`} {...rest}>
      <div className="dashboard-card__header">
        <div>
          <h3 className="dashboard-card__title">
            {title}
            {helpText && (
              <HelpHint
                title={helpTitle ?? (helpTermId ? undefined : title)}
                triggerLabel={
                  helpTermId && !helpTitle ? `Learn more about ${title}` : undefined
                }
                definition={helpText}
                example={helpExample}
                learnMoreUrl={helpLearnMoreUrl}
                termId={helpTermId}
              />
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
            {change !== undefined && TrendIcon && trendMeta && (
              <div className={`dashboard-card__trend ${trendMeta.className}`}>
                <TrendIcon size={12} aria-hidden="true" />
                {Math.abs(change)}%
              </div>
            )}
          </div>

          {change !== undefined && (
            <p className="dashboard-card__caption">
              vs last 30 days
            </p>
          )}
        </>
      )}
    </div>
  );
}
