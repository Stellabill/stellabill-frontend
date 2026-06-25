import { useState, useMemo, useRef } from "react";
import styles from "./CohortRetentionChart.module.css";

interface Cohort {
  cohortMonth: string;
  totalUsers: number;
  retention: (number | null)[]; // % retention for month 0, 1, 2...
}

interface CohortRetentionChartProps {
  data: Cohort[];
}

const MAX_MONTHS = 12;

const getHeatmapColor = (percentage: number | null): React.CSSProperties => {
  if (percentage === null || percentage < 0) {
    return { backgroundColor: "#f1f5f9" }; // Empty or invalid
  }
  const p = Math.min(percentage, 100);
  // Simple blue scale
  if (p > 80) return { backgroundColor: "#2563eb" };
  if (p > 60) return { backgroundColor: "#3b82f6" };
  if (p > 40) return { backgroundColor: "#60a5fa" };
  if (p > 20) return { backgroundColor: "#93c5fd" };
  if (p > 0) return { backgroundColor: "#bfdbfe" };
  return { backgroundColor: "#eff6ff" };
};

export default function CohortRetentionChart({
  data,
}: CohortRetentionChartProps) {
  const [view, setView] = useState<"heatmap" | "table">("heatmap");
  const [hoveredCell, setHoveredCell] = useState<{
    cohort: Cohort;
    monthIndex: number;
    rect: DOMRect;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const numMonths = useMemo(
    () =>
      data.length > 0
        ? Math.min(
            Math.max(...data.map((c) => c.retention.length)),
            MAX_MONTHS
          )
        : 0,
    [data]
  );

  const handleCellInteraction = (
    e: React.MouseEvent | React.FocusEvent,
    cohort: Cohort,
    monthIndex: number
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredCell({ cohort, monthIndex, rect });
  };

  const renderTooltip = () => {
    if (!hoveredCell || !containerRef.current) return null;

    const { cohort, monthIndex, rect } = hoveredCell;
    const percentage = cohort.retention[monthIndex];
    if (percentage === null) return null;

    const retainedUsers = Math.round((cohort.totalUsers * percentage) / 100);
    const containerRect = containerRef.current.getBoundingClientRect();

    const top = rect.top - containerRect.top - 60;
    const left = rect.left - containerRect.left + rect.width / 2;

    return (
      <div
        className={styles.tooltip}
        style={{ top: `${top}px`, left: `${left}px`, transform: "translateX(-50%)" }}
        role="tooltip"
      >
        <div className={styles.tooltipCohort}>{cohort.cohortMonth}</div>
        <div>
          Month {monthIndex}:{" "}
          <span className={styles.tooltipValue}>{percentage.toFixed(1)}%</span>
        </div>
        <div>
          ({retainedUsers} / {cohort.totalUsers} users)
        </div>
      </div>
    );
  };

  const renderHeatmap = () => (
    <div
      className={styles.heatmap}
      style={{ gridTemplateColumns: `auto repeat(${numMonths}, 1fr)` }}
    >
      {/* Header */}
      <div />
      {Array.from({ length: numMonths }).map((_, i) => (
        <div key={i} className={styles.heatmapHeader}>
          M{i}
        </div>
      ))}

      {/* Rows */}
      {data.map((cohort) => (
        <React.Fragment key={cohort.cohortMonth}>
          <div className={styles.cohortLabel}>{cohort.cohortMonth}</div>
          {Array.from({ length: numMonths }).map((_, monthIndex) => {
            if (monthIndex > cohort.retention.length - 1) {
              return <div key={monthIndex} className={styles.emptyCell} />;
            }
            const percentage = cohort.retention[monthIndex];
            return (
              <div
                key={monthIndex}
                className={styles.heatmapCell}
                style={getHeatmapColor(percentage)}
                tabIndex={0}
                onMouseEnter={(e) => handleCellInteraction(e, cohort, monthIndex)}
                onMouseLeave={() => setHoveredCell(null)}
                onFocus={(e) => handleCellInteraction(e, cohort, monthIndex)}
                onBlur={() => setHoveredCell(null)}
                aria-label={`${cohort.cohortMonth}, Month ${monthIndex}: ${
                  percentage !== null ? `${percentage.toFixed(1)}% retention` : "No data"
                }`}
              />
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );

  const renderTable = () => (
    <table className={styles.table}>
      <caption className={styles.srOnly}>
        Cohort retention data table
      </caption>
      <thead>
        <tr>
          <th scope="col">Cohort</th>
          {Array.from({ length: numMonths }).map((_, i) => (
            <th scope="col" key={i}>
              Month {i}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((cohort) => (
          <tr key={cohort.cohortMonth}>
            <th scope="row">{cohort.cohortMonth}</th>
            {Array.from({ length: numMonths }).map((_, monthIndex) => {
              const percentage =
                monthIndex < cohort.retention.length
                  ? cohort.retention[monthIndex]
                  : null;
              return (
                <td key={monthIndex}>
                  {percentage !== null ? `${percentage.toFixed(1)}%` : "–"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Subscriber Retention by Cohort</h3>
          <p className={styles.subtitle}>
            Percentage of subscribers who remain active over time.
          </p>
        </div>
        <button
          className={styles.viewToggle}
          onClick={() => setView(view === "heatmap" ? "table" : "heatmap")}
          aria-live="polite"
        >
          {view === "heatmap"
            ? "View as Table"
            : "View as Heatmap"}
        </button>
      </div>

      <div className={styles.chartWrapper} ref={containerRef}>
        {view === "heatmap" ? renderHeatmap() : renderTable()}
        {view === "heatmap" && renderTooltip()}
      </div>

      {view === "heatmap" && (
        <div className={styles.legend}>
          <span>Less</span>
          <div
            className={styles.legendColorBox}
            style={getHeatmapColor(10)}
          />
          <div
            className={styles.legendColorBox}
            style={getHeatmapColor(30)}
          />
          <div
            className={styles.legendColorBox}
            style={getHeatmapColor(50)}
          />
          <div
            className={styles.legendColorBox}
            style={getHeatmapColor(70)}
          />
          <div
            className={styles.legendColorBox}
            style={getHeatmapColor(90)}
          />
          <span>More</span>
        </div>
      )}
    </div>
  );
}