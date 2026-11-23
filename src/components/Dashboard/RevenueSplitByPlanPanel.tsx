import { useId, useMemo } from "react";
import Amount from "../common/Amount";
import {
  buildScreenReaderSummary,
  computePlanShares,
  type PlanRevenueSlice,
} from "./revenueSplitUtils";
import type { RevenueSplitView } from "./revenueSplitHelpers";
import { useRevenueSplitState } from "./useRevenueSplitState";
import { PlanLegend, StackedBar } from "./RevenueSplitStackedBar";
import { RankedList } from "./RevenueSplitRankedList";
import { DataTable } from "./RevenueSplitDataTable";
import styles from "./RevenueSplitByPlanPanel.module.css";

export type { PlanRevenueSlice, RevenueSplitView };

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

const VIEW_OPTIONS = [
  ["stacked", "Stacked bar"],
  ["ranked", "Ranked list"],
  ["table", "Data table"],
] as const;

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

  const shares = useMemo(() => computePlanShares(plans), [plans]);
  const totalRevenue = useMemo(
    () => shares.reduce((sum, s) => sum + s.revenue, 0),
    [shares],
  );
  const summary = useMemo(
    () => buildScreenReaderSummary(shares, totalRevenue, periodLabel),
    [shares, totalRevenue, periodLabel],
  );

  const { view, setView, effectiveView, liveMessage, announce } =
    useRevenueSplitState(defaultView, summary);

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
          {VIEW_OPTIONS.map(([value, label]) => (
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
                <PlanLegend
                  shares={shares}
                  previousPeriodLabel={previousPeriodLabel}
                />
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
