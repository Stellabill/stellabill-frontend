import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
}

const containerStyles: Record<AlertVariant, string> = {
  info: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)] text-[var(--color-info)]',
  success: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-danger)]',
};

const icons: Record<AlertVariant, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const urgentVariants: AlertVariant[] = ['warning', 'danger'];

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  dismissLabel = 'Dismiss alert',
  className = '',
  ...props
}) => {
  const Icon = icons[variant];
  const isUrgent = urgentVariants.includes(variant);

  const combinedClassName = `flex items-start gap-3 rounded-[var(--radius-lg)] border p-[var(--space-4)] ${containerStyles[variant]} ${className}`.trim();

  return (
    <div
      className={combinedClassName}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      {...props}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0 text-[var(--color-text-primary)]">
        {title && <p className="font-semibold leading-tight mb-1">{title}</p>}
        {children && <div className="text-sm leading-snug">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 -m-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Alert;
