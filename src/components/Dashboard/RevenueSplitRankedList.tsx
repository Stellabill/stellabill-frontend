import Amount from "../common/Amount";
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

export interface RankedListProps {
  shares: ComputedPlanShare[];
  previousPeriodLabel: string;
  onFocusShare: (summary: string) => void;
}

export function RankedList({
  shares,
  previousPeriodLabel,
  onFocusShare,
}: RankedListProps) {
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
