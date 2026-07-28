export interface PlanRevenueSlice {
  planId: string;
  planName: string;
  /** Revenue in the current period (major currency units). */
  revenue: number;
  /** Revenue in the previous period (major currency units). */
  previousRevenue: number;
  currency?: string;
}

export interface ComputedPlanShare {
  planId: string;
  planName: string;
  revenue: number;
  previousRevenue: number;
  currency: string;
  sharePercent: number;
  previousSharePercent: number;
  /** Share change in percentage points vs previous period. */
  shareDeltaPoints: number;
  /** Revenue % change vs previous period; null when previous was 0 and current > 0. */
  revenueDeltaPercent: number | null;
  seriesIndex: number;
}

export type DeltaTone = "positive" | "negative" | "neutral";

export function revenueDeltaPercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function resolveDeltaTone(
  value: number | null | undefined,
): DeltaTone {
  if (value === null || value === undefined || value === 0) return "neutral";
  return value > 0 ? "positive" : "negative";
}

export function formatDeltaPercent(delta: number): string {
  const abs = Math.abs(delta);
  if (abs >= 1000) return `${(abs / 1000).toFixed(1)}K`;
  if (Number.isInteger(abs)) return String(abs);
  return abs.toFixed(1);
}

export function formatSharePercent(share: number): string {
  if (Number.isInteger(share)) return String(share);
  return share.toFixed(1);
}

export function computePlanShares(
  plans: PlanRevenueSlice[],
): ComputedPlanShare[] {
  const total = plans.reduce((sum, p) => sum + Math.max(0, p.revenue), 0);
  const previousTotal = plans.reduce(
    (sum, p) => sum + Math.max(0, p.previousRevenue),
    0,
  );

  const ranked = [...plans].sort((a, b) => b.revenue - a.revenue);

  return ranked.map((plan, index) => {
    const revenue = Math.max(0, plan.revenue);
    const previousRevenue = Math.max(0, plan.previousRevenue);
    const sharePercent = total > 0 ? (revenue / total) * 100 : 0;
    const previousSharePercent =
      previousTotal > 0 ? (previousRevenue / previousTotal) * 100 : 0;

    return {
      planId: plan.planId,
      planName: plan.planName,
      revenue,
      previousRevenue,
      currency: plan.currency ?? "USDC",
      sharePercent,
      previousSharePercent,
      shareDeltaPoints: sharePercent - previousSharePercent,
      revenueDeltaPercent: revenueDeltaPercent(revenue, previousRevenue),
      seriesIndex: index % 8,
    };
  });
}

export function buildScreenReaderSummary(
  shares: ComputedPlanShare[],
  totalRevenue: number,
  periodLabel: string,
): string {
  if (shares.length === 0) {
    return `No plan revenue for ${periodLabel}.`;
  }

  const parts = shares.map((s) => {
    const delta =
      s.revenueDeltaPercent === null
        ? "new this period"
        : `${s.revenueDeltaPercent >= 0 ? "+" : "−"}${formatDeltaPercent(s.revenueDeltaPercent)}% versus previous period`;
    return `${s.planName} ${formatSharePercent(s.sharePercent)} percent (${delta})`;
  });

  return `Revenue split by plan for ${periodLabel}. Total ${totalRevenue.toLocaleString()} ${shares[0].currency}. ${parts.join(". ")}.`;
}
