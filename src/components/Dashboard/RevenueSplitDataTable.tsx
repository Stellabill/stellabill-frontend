import Amount from "../common/Amount";
import {
  formatDeltaPercent,
  formatSharePercent,
  type ComputedPlanShare,
} from "./revenueSplitUtils";
import styles from "./RevenueSplitByPlanPanel.module.css";

export interface DataTableProps {
  shares: ComputedPlanShare[];
  previousPeriodLabel: string;
}

export function DataTable({ shares, previousPeriodLabel }: DataTableProps) {
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
