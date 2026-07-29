import { useId, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, ChevronDown } from "lucide-react";
import Sparkline from "../common/Sparkline";
import "./PastPeriodsDrilldown.css";

export type DeltaDirection = "positive" | "negative" | "neutral";

export interface PeriodLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface PastPeriod {
  id: string;
  label: string;
  /** Inclusive start date for the billing period. */
  startDate: string;
  /** Inclusive end date for the billing period. */
  endDate: string;
  total: number;
  /** Optional sparkline samples for the period (e.g. daily spend). */
  sparklineData?: number[];
  lineItems: PeriodLineItem[];
}

export interface PastPeriodsDrilldownProps {
  periods?: PastPeriod[];
  currency?: string;
  className?: string;
}

function formatCurrency(amount: number, currency = "USDC"): string {
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  if (abs >= 1000) return `${(abs / 1000).toFixed(1)}K`;
  if (Number.isInteger(abs)) return String(abs);
  return abs.toFixed(1);
}

function resolveDirection(delta: number): DeltaDirection {
  if (delta > 0) return "positive";
  if (delta < 0) return "negative";
  return "neutral";
}

function computeDeltaPercent(
  current: number,
  previous: number | undefined,
): number | null {
  if (previous === undefined) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

const trendConfig = {
  positive: {
    icon: ArrowUpRight,
    sign: "+",
    className: "pp-delta--positive",
  },
  negative: {
    icon: ArrowDownRight,
    sign: "-",
    className: "pp-delta--negative",
  },
  neutral: {
    icon: Minus,
    sign: "",
    className: "pp-delta--neutral",
  },
} as const;

interface PeriodRowProps {
  period: PastPeriod;
  previousTotal?: number;
  currency: string;
  expanded: boolean;
  onToggle: () => void;
}

function PeriodRow({
  period,
  previousTotal,
  currency,
  expanded,
  onToggle,
}: PeriodRowProps) {
  const panelId = useId();
  const announceId = useId();
  const delta = computeDeltaPercent(period.total, previousTotal);
  const isFirstPeriod = previousTotal === undefined;
  const direction = delta === null ? "neutral" : resolveDirection(delta);
  const TrendIcon = trendConfig[direction].icon;
  const sparkline =
    period.sparklineData && period.sparklineData.length >= 2
      ? period.sparklineData
      : period.lineItems.map((item) => item.amount);

  const announcement =
    delta === null || isFirstPeriod
      ? `${period.label}. Total ${formatCurrency(period.total, currency)}. First period — no prior comparison.`
      : `${period.label}. Total ${formatCurrency(period.total, currency)}. ${trendConfig[direction].sign}${formatDelta(delta)} percent versus previous period.`;

  return (
    <li className="pp-row">
      <button
        type="button"
        className="pp-row__header"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="pp-row__main">
          <span className="pp-row__label">{period.label}</span>
          <span className="pp-row__range">
            {period.startDate} – {period.endDate}
          </span>
        </span>

        <span className="pp-row__metrics">
          <span className="pp-row__total" aria-hidden="true">
            {formatCurrency(period.total, currency)}
          </span>

          {isFirstPeriod || delta === null ? (
            <span
              role="status"
              className={`pp-delta ${trendConfig.neutral.className}`}
              aria-label="No prior period to compare"
              dir="auto"
            >
              <Minus size={12} aria-hidden="true" />
              <span aria-hidden="true">—</span>
            </span>
          ) : (
            <span
              role="status"
              className={`pp-delta ${trendConfig[direction].className}`}
              aria-label={`${trendConfig[direction].sign}${formatDelta(delta)} percent versus previous period`}
              dir="ltr"
            >
              <TrendIcon size={12} aria-hidden="true" />
              <span aria-hidden="true">
                {trendConfig[direction].sign}
                {formatDelta(delta)}%
              </span>
            </span>
          )}

          {sparkline.length >= 2 && (
            <span className="pp-row__sparkline" aria-hidden="true">
              <Sparkline
                data={sparkline}
                width={72}
                height={28}
                color="var(--color-brand-primary, #22d3ee)"
                strokeWidth={1.5}
                showArea
                areaOpacity={0.12}
                aria-label={`${period.label} spend sparkline`}
              />
            </span>
          )}

          <ChevronDown
            size={18}
            className={`pp-row__chevron${expanded ? " pp-row__chevron--open" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={`${period.label} line items`}
        hidden={!expanded}
        className="pp-row__panel"
      >
        {expanded && (
          <>
            <div id={announceId} className="pp-sr-only" aria-live="polite">
              {announcement}
            </div>
            <ul className="pp-line-items">
              {period.lineItems.map((item) => (
                <li key={item.id} className="pp-line-item">
                  <span>{item.label}</span>
                  <span>{formatCurrency(item.amount, currency)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </li>
  );
}

export const DEMO_PERIODS: PastPeriod[] = [
  {
    id: "p3",
    label: "Mar 2026",
    startDate: "Mar 1, 2026",
    endDate: "Mar 31, 2026",
    total: 42.5,
    sparklineData: [8, 10, 9, 12, 11, 14, 12],
    lineItems: [
      { id: "p3-a", label: "Pro plan", amount: 30 },
      { id: "p3-b", label: "Usage overage", amount: 12.5 },
    ],
  },
  {
    id: "p2",
    label: "Feb 2026",
    startDate: "Feb 1, 2026",
    endDate: "Feb 28, 2026",
    total: 38,
    sparklineData: [6, 8, 7, 9, 10, 11, 9],
    lineItems: [
      { id: "p2-a", label: "Pro plan", amount: 30 },
      { id: "p2-b", label: "Usage overage", amount: 8 },
    ],
  },
  {
    id: "p1",
    label: "Jan 2026",
    startDate: "Jan 1, 2026",
    endDate: "Jan 31, 2026",
    total: 30,
    sparklineData: [5, 5, 5, 5, 5, 5, 5],
    lineItems: [{ id: "p1-a", label: "Pro plan", amount: 30 }],
  },
];

/**
 * Expandable past-periods list with period totals, KPI-style delta chips,
 * sparklines, and polite aria-live announcements on expand.
 */
export default function PastPeriodsDrilldown({
  periods = DEMO_PERIODS,
  currency = "USDC",
  className = "",
}: PastPeriodsDrilldownProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section
      className={`pp-drilldown ${className}`.trim()}
      aria-labelledby="past-periods-heading"
    >
      <header className="pp-drilldown__header">
        <h2 id="past-periods-heading" className="pp-drilldown__title">
          Past periods
        </h2>
        <p className="pp-drilldown__subtitle">
          Expand a period to see line-item charges and compare against the prior
          cycle.
        </p>
      </header>

      {periods.length === 0 ? (
        <p className="pp-drilldown__empty" role="status">
          No past periods yet.
        </p>
      ) : (
        <ul className="pp-drilldown__list" role="list">
          {periods.map((period, index) => {
            const older = periods[index + 1];
            return (
              <PeriodRow
                key={period.id}
                period={period}
                previousTotal={older?.total}
                currency={currency}
                expanded={expandedId === period.id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === period.id ? null : period.id,
                  )
                }
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
