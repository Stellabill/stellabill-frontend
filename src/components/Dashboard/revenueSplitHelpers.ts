import {
  formatDeltaPercent,
  formatSharePercent,
  type ComputedPlanShare,
  type DeltaTone,
} from "./revenueSplitUtils";
import styles from "./RevenueSplitByPlanPanel.module.css";

export type RevenueSplitView = "stacked" | "ranked" | "table";

export const SERIES_CLASS = [
  styles.series0,
  styles.series1,
  styles.series2,
  styles.series3,
  styles.series4,
  styles.series5,
  styles.series6,
  styles.series7,
] as const;

export const PATTERN_CLASS = [
  styles.patternStripes,
  styles.patternDots,
  styles.patternCross,
  styles.patternHorizontal,
  styles.patternDiagonalAlt,
  styles.patternGrid,
  styles.patternWaves,
  styles.patternChecks,
] as const;

export const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  positive: styles.deltaPositive,
  negative: styles.deltaNegative,
  neutral: styles.deltaNeutral,
};

export function segmentAnnouncement(
  share: ComputedPlanShare,
  previousPeriodLabel: string,
): string {
  const delta =
    share.revenueDeltaPercent === null
      ? "new this period"
      : `${share.revenueDeltaPercent >= 0 ? "+" : "−"}${formatDeltaPercent(share.revenueDeltaPercent)}% ${previousPeriodLabel}`;
  return `${share.planName}, ${formatSharePercent(share.sharePercent)} percent, ${delta}`;
}

/** Stacked selection falls back to ranked list on narrow viewports. */
export function resolveEffectiveView(
  view: RevenueSplitView,
  isNarrow: boolean,
): RevenueSplitView {
  return view === "stacked" && isNarrow ? "ranked" : view;
}
