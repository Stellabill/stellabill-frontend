import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import './DashboardCard.css';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  icon?: ReactNode;
  helpText?: string;
}

export default function DashboardCard({
  title,
  value,
  change,
  trend,
  loading = false,
  icon,
  helpText,
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
    <div className="dashboard-card">
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
    </div>
  );
}
