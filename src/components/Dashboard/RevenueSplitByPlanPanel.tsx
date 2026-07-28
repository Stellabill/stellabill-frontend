import { useEffect, useId, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Amount from "../common/Amount";
import {
  buildScreenReaderSummary,
  computePlanShares,
  formatDeltaPercent,
  formatSharePercent,
  resolveDeltaTone,
  type ComputedPlanShare,
  type DeltaTone,
  type PlanRevenueSlice,
} from "./revenueSplitUtils";
import styles from "./RevenueSplitByPlanPanel.module.css";

export type { PlanRevenueSlice };
export type RevenueSplitView = "stacked" | "ranked" | "table";

export interface RevenueSplitByPlanPanelProps {
  plans: PlanRevenueSlice[];
  title?: string;
  subtitle?: string;
  periodLabel?: string;
  previousPeriodLabel?: string;
  /** Initial view. Defaults to stacked; ranked is the narrow-viewport fallback via CSS. */
  defaultView?: RevenueSplitView;
  className?: string;
}

const SERIES_CLASS = [
  styles.series0,
  styles.series1,
  styles.series2,
  styles.series3,
  styles.series4,
  styles.series5,
  styles.series6,
  styles.series7,
] as const;

const PATTERN_CLASS = [
  styles.patternStripes,
  styles.patternDots,
  styles.patternCross,
  styles.patternHorizontal,
  styles.patternDiagonalAlt,
  styles.patternGrid,
  styles.patternWaves,
  styles.patternChecks,
] as const;

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  positive: styles.deltaPositive,
  negative: styles.deltaNegative,
  neutral: styles.deltaNeutral,
};

const NARROW_QUERY = "(max-width: 639px)";

function useIsNarrowViewport(): boolean {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(NARROW_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(NARROW_QUERY);
    const onChange = () => setIsNarrow(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isNarrow;
}

function DeltaChip({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  const tone: DeltaTone = resolveDeltaTone(value);
  const Icon =
    tone === "positive"
      ? ArrowUpRight
      : tone === "negative"
        ? ArrowDownRight
        : Minus;
  const sign = tone === "positive" ? "+" : tone === "negative" ? "−" : "";
  const display =
    value === null ? "New" : `${sign}${formatDeltaPercent(value)}%`;

  return (
    <span
      className={`${styles.deltaChip} ${DELTA_TONE_CLASS[tone]}`}
      role="status"
      aria-label={
        value === null
          ? `${label}: new this period`
          : `${sign}${formatDeltaPercent(value)}% ${label}`
      }
    >
      <Icon size={12} aria-hidden="true" />
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

function segmentAnnouncement(share: ComputedPlanShare, previousPeriodLabel: string) {
  const delta =
    share.revenueDeltaPercent === null
      ? "new this period"
      : `${share.revenueDeltaPercent >= 0 ? "+" : "−"}${formatDeltaPercent(share.revenueDeltaPercent)}% ${previousPeriodLabel}`;
  return `${share.planName}, ${formatSharePercent(share.sharePercent)} percent, ${delta}`;
}

function StackedBar({
  shares,
  labelledBy,
  previousPeriodLabel,
  onFocusShare,
}: {
  shares: ComputedPlanShare[];
  labelledBy: string;
  previousPeriodLabel: string;
  onFocusShare: (summary: string) => void;
}) {
  return (
    <div
      className={styles.stackedBar}
      role="group"
      aria-labelledby={labelledBy}
    >
      {shares.map((share) => {
        const width = Math.max(
          share.sharePercent,
          share.sharePercent > 0 ? 0.5 : 0,
        );
        return (
          <button
            key={share.planId}
            type="button"
            className={`${styles.segment} ${SERIES_CLASS[share.seriesIndex]} ${PATTERN_CLASS[share.seriesIndex]}`}
            style={{ flexGrow: width, flexBasis: 0 }}
            aria-label={`${share.planName}: ${formatSharePercent(share.sharePercent)} percent of revenue`}
            onFocus={() =>
              onFocusShare(segmentAnnouncement(share, previousPeriodLabel))
            }
          />
        );
      })}
    </div>
  );
}

function RankedList({
  shares,
  previousPeriodLabel,
  onFocusShare,
}: {
  shares: ComputedPlanShare[];
  previousPeriodLabel: string;
  onFocusShare: (summary: string) => void;
}) {
  return (
    <ol className={styles.rankedList}>
      {shares.map((share, index) => (
        <li key={share.planId} className={styles.rankedItem}>
          <span className={styles.rankIndex} aria-hidden="true">
            {index + 1}
          </span>
          <span
            className={`${styles.swatch} ${SERIES_CLASS[share.seriesIndex]} ${PATTERN_CLASS[share.seriesIndex]}`}
            aria-hidden="true"
          />
          <div className={styles.rankedBody}>
            <div className={styles.rankedTop}>
              <span className={styles.planName}>{share.planName}</span>
              <span className={styles.shareValue}>
                {formatSharePercent(share.sharePercent)}%
              </span>
            </div>
            <div className={styles.rankedMeta}>
              <Amount value={share.revenue} currency={share.currency} />
              <button
                type="button"
                className={styles.deltaFocusTarget}
                onFocus={() =>
                  onFocusShare(segmentAnnouncement(share, previousPeriodLabel))
                }
              >
                <DeltaChip
                  value={share.revenueDeltaPercent}
                  label={previousPeriodLabel}
                />
              </button>
            </div>
            <div className={styles.track} aria-hidden="true">
              <div
                className={`${styles.trackFill} ${SERIES_CLASS[share.seriesIndex]} ${PATTERN_CLASS[share.seriesIndex]}`}
                style={{ width: `${share.sharePercent}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DataTable({
  shares,
  previousPeriodLabel,
}: {
  shares: ComputedPlanShare[];
  previousPeriodLabel: string;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>
          Revenue split by plan data table with share and period deltas
        </caption>
        <thead>
          <tr>
            <th scope="col">Plan</th>
            <th scope="col">Revenue</th>
            <th scope="col">Share</th>
            <th scope="col">Δ revenue ({previousPeriodLabel})</th>
            <th scope="col">Δ share (pp)</th>
          </tr>
        </thead>
        <tbody>
          {shares.map((share) => (
            <tr key={share.planId}>
              <th scope="row">{share.planName}</th>
              <td>
                <Amount value={share.revenue} currency={share.currency} />
              </td>
              <td>{formatSharePercent(share.sharePercent)}%</td>
              <td>
                {share.revenueDeltaPercent === null
                  ? "New"
                  : `${share.revenueDeltaPercent >= 0 ? "+" : "−"}${formatDeltaPercent(share.revenueDeltaPercent)}%`}
              </td>
              <td>
                {`${share.shareDeltaPoints >= 0 ? "+" : "−"}${formatSharePercent(Math.abs(share.shareDeltaPoints))}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RevenueSplitByPlanPanel({
  plans,
  title = "Revenue by plan",
  subtitle = "Share of total revenue across subscription plans.",
  periodLabel = "this period",
  previousPeriodLabel = "vs previous period",
  defaultView = "stacked",
  className = "",
}: RevenueSplitByPlanPanelProps) {
  const titleId = useId();
  const summaryId = useId();
  const [view, setView] = useState<RevenueSplitView>(defaultView);
  const [liveMessage, setLiveMessage] = useState("");
  const isNarrow = useIsNarrowViewport();

  const shares = useMemo(() => computePlanShares(plans), [plans]);
  const totalRevenue = useMemo(
    () => shares.reduce((sum, s) => sum + s.revenue, 0),
    [shares],
  );

  const summary = useMemo(
    () => buildScreenReaderSummary(shares, totalRevenue, periodLabel),
    [shares, totalRevenue, periodLabel],
  );

  useEffect(() => {
    setLiveMessage(summary);
  }, [summary]);

  const announce = (message: string) => {
    setLiveMessage(message);
  };

  /** Stacked selection falls back to ranked list on narrow viewports. */
  const effectiveView: RevenueSplitView =
    view === "stacked" && isNarrow ? "ranked" : view;

  const viewBodyClass =
    effectiveView === "stacked"
      ? styles.viewStacked
      : effectiveView === "ranked"
        ? styles.viewRanked
        : styles.viewTable;

  return (
    <section
      className={`${styles.panel} ${className}`}
      aria-labelledby={titleId}
      data-testid="revenue-split-by-plan"
      data-effective-view={effectiveView}
    >
      <div className={styles.header}>
        <div>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div
          className={styles.viewToggle}
          role="group"
          aria-label="Revenue split display mode"
        >
          {(
            [
              ["stacked", "Stacked bar"],
              ["ranked", "Ranked list"],
              ["table", "Data table"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${styles.viewButton} ${view === value ? styles.viewButtonActive : ""}`}
              aria-pressed={view === value}
              onClick={() => {
                setView(value);
                announce(`Showing ${label.toLowerCase()} view.`);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p id={summaryId} className={styles.srOnly}>
        {summary}
      </p>
      <div className={styles.liveRegion} role="status" aria-live="polite">
        {liveMessage}
      </div>

      {shares.length === 0 ? (
        <p className={styles.empty} role="status">
          No plan revenue to display for {periodLabel}.
        </p>
      ) : (
        <>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total revenue</span>
            <Amount
              value={totalRevenue}
              currency={shares[0]?.currency ?? "USDC"}
              className={styles.totalValue}
            />
          </div>

          <div className={`${styles.viewBody} ${viewBodyClass}`}>
            {effectiveView === "stacked" && (
              <div className={styles.stackedRegion}>
                <StackedBar
                  shares={shares}
                  labelledBy={summaryId}
                  previousPeriodLabel={previousPeriodLabel}
                  onFocusShare={announce}
                />
                <ul className={styles.legend} aria-label="Plan color legend">
                  {shares.map((share) => (
                    <li key={share.planId} className={styles.legendItem}>
                      <span
                        className={`${styles.swatch} ${SERIES_CLASS[share.seriesIndex]} ${PATTERN_CLASS[share.seriesIndex]}`}
                        aria-hidden="true"
                      />
                      <span>{share.planName}</span>
                      <span className={styles.legendShare}>
                        {formatSharePercent(share.sharePercent)}%
                      </span>
                      <DeltaChip
                        value={share.revenueDeltaPercent}
                        label={previousPeriodLabel}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {effectiveView === "ranked" && (
              <div className={styles.rankedRegion}>
                <RankedList
                  shares={shares}
                  previousPeriodLabel={previousPeriodLabel}
                  onFocusShare={announce}
                />
              </div>
            )}
            {effectiveView === "table" && (
              <DataTable
                shares={shares}
                previousPeriodLabel={previousPeriodLabel}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}
