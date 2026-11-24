import DatePickerCalendar from './DatePickerCalendar';
import {
  buildDateNotice,
  formatDate,
  toIso,
  type StartDateMode,
} from './reactivationDateHelpers';

export interface ReactivationDateSectionProps {
  mode: StartDateMode;
  onModeChange: (mode: StartDateMode) => void;
  customDate: Date | null;
  onCustomDateChange: (date: Date) => void;
  todayDate: Date;
  billingDay: number;
  billingDayDate: Date;
  maxDate: Date;
  disabled: boolean;
}

export default function ReactivationDateSection({
  mode,
  onModeChange,
  customDate,
  onCustomDateChange,
  todayDate,
  billingDay,
  billingDayDate,
  maxDate,
  disabled,
}: ReactivationDateSectionProps) {
  const isSameDayAsBillingDay = toIso(todayDate) === toIso(billingDayDate);
  const dateNotice = buildDateNotice(
    mode,
    billingDay,
    todayDate,
    billingDayDate,
    customDate,
  );

  return (
    <div className="reactivation-date-section">
      <p className="reactivation-section-label" id="reactivation-date-label">
        Start date
      </p>

      <div
        className="reactivation-date-options"
        role="group"
        aria-labelledby="reactivation-date-label"
      >
        <button
          className="reactivation-date-opt"
          aria-pressed={mode === 'today'}
          onClick={() => onModeChange('today')}
          disabled={disabled}
        >
          <span className="reactivation-date-opt-title">Start today</span>
          <span className="reactivation-date-opt-sub">
            <time dateTime={toIso(todayDate)}>{formatDate(todayDate)}</time>
          </span>
        </button>

        {!isSameDayAsBillingDay && (
          <button
            className="reactivation-date-opt"
            aria-pressed={mode === 'billing-day'}
            onClick={() => onModeChange('billing-day')}
            disabled={disabled}
          >
            <span className="reactivation-date-opt-title">
              Same billing day
            </span>
            <span className="reactivation-date-opt-sub">
              Day {billingDay} ·{' '}
              <time dateTime={toIso(billingDayDate)}>
                {formatDate(billingDayDate)}
              </time>
            </span>
          </button>
        )}

        <button
          className="reactivation-date-opt"
          aria-pressed={mode === 'custom'}
          onClick={() => onModeChange('custom')}
          disabled={disabled}
        >
          <span className="reactivation-date-opt-title">Custom date</span>
          <span className="reactivation-date-opt-sub">
            {customDate ? (
              <time dateTime={toIso(customDate)}>
                {formatDate(customDate)}
              </time>
            ) : (
              'Pick a date'
            )}
          </span>
        </button>
      </div>

      {mode === 'custom' && (
        <div className="reactivation-date-picker-wrapper">
          <DatePickerCalendar
            selectedDate={customDate}
            onDateSelect={(d) => onCustomDateChange(d)}
            minDate={todayDate}
            maxDate={maxDate}
          />
        </div>
      )}

      <div className="reactivation-date-notice" role="note">
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
        <p>{dateNotice}</p>
      </div>
    </div>
  );
}
