import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  formatDeltaPercent,
  resolveDeltaTone,
  type DeltaTone,
} from "./revenueSplitUtils";
import { DELTA_TONE_CLASS } from "./revenueSplitHelpers";
import styles from "./RevenueSplitByPlanPanel.module.css";

export interface DeltaChipProps {
  value: number | null;
  label: string;
}

export function DeltaChip({ value, label }: DeltaChipProps) {
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
