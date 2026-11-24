import {
  formatSharePercent,
  type ComputedPlanShare,
} from "./revenueSplitUtils";
import {
  PATTERN_CLASS,
  segmentAnnouncement,
  SERIES_CLASS,
} from "./revenueSplitHelpers";
import { DeltaChip } from "./RevenueSplitDeltaChip";
import styles from "./RevenueSplitByPlanPanel.module.css";

export interface StackedBarProps {
  shares: ComputedPlanShare[];
  labelledBy: string;
  previousPeriodLabel: string;
  onFocusShare: (summary: string) => void;
}

export function StackedBar({
  shares,
  labelledBy,
  previousPeriodLabel,
  onFocusShare,
}: StackedBarProps) {
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

export interface PlanLegendProps {
  shares: ComputedPlanShare[];
  previousPeriodLabel: string;
}

export function PlanLegend({ shares, previousPeriodLabel }: PlanLegendProps) {
  return (
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
  );
}
