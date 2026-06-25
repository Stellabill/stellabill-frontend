import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showArea?: boolean;
  areaOpacity?: number;
  className?: string;
  "aria-label"?: string;
}

export default function Sparkline({
  data,
  width = 120,
  height = 40,
  color = "#6366f1",
  strokeWidth = 2,
  showArea = true,
  areaOpacity = 0.15,
  className = "",
  "aria-label": ariaLabel,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        className={className}
        role="img"
        aria-label={ariaLabel || "Sparkline chart"}
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          fill="#64748b"
          fontSize="10"
        >
          No data
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const pathD = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={ariaLabel || `Sparkline showing ${data.length} data points`}
    >
      {showArea && <path d={areaD} fill={color} fillOpacity={areaOpacity} />}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
