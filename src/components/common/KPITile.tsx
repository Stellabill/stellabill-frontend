import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Target } from "lucide-react";
import Sparkline from "./Sparkline";

export type DeltaDirection = "positive" | "negative" | "neutral";

export interface KPITileProps {
  title: string;
  value: string | number;
  /** Absolute delta vs previous period (e.g. 12.5 means +12.5%). */
  delta?: number;
  /** Optional explicit direction override. Defaults to sign(delta). */
  deltaDirection?: DeltaDirection;
  /** Optional comparison label, e.g. "vs last 30 days". */
  deltaLabel?: string;
  /** Optional sparkline data. */
  sparklineData?: number[];
  /** Optional target/goal value. */
  target?: number | string;
  /** Optional target label, e.g. "Goal". */
  targetLabel?: string;
  /** Optional icon rendered in the tile header. */
  icon?: ReactNode;
  /** Optional help text shown as a tooltip icon. */
  helpText?: string;
  /** Loading skeleton state. */
  loading?: boolean;
  /** Additional class name for the tile root. */
  className?: string;
}

function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  if (abs >= 1000) {
    return `${(abs / 1000).toFixed(1)}K`;
  }
  if (Number.isInteger(abs)) return String(abs);
  return abs.toFixed(1);
}

function resolveDirection(
  delta: number,
  override?: DeltaDirection,
): DeltaDirection {
  if (override) return override;
  if (delta > 0) return "positive";
  if (delta < 0) return "negative";
  return "neutral";
}

export default function KPITile({
  title,
  value,
  delta,
  deltaDirection,
  deltaLabel = "vs previous period",
  sparklineData,
  target,
  targetLabel = "Goal",
  icon,
  helpText,
  loading = false,
  className = "",
}: KPITileProps) {
  if (loading) {
    return (
      <div
        className={`bg-[#0f172a]/50 border border-[#1e293b] rounded-2xl p-6 animate-pulse ${className}`}
        aria-busy="true"
        aria-label={`${title} loading`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 w-24 bg-slate-700 rounded" />
          <div className="h-8 w-8 bg-slate-700 rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-slate-700 rounded mb-2" />
        <div className="h-4 w-20 bg-slate-700 rounded" />
      </div>
    );
  }

  const direction =
    delta !== undefined ? resolveDirection(delta, deltaDirection) : "neutral";

  const trendConfig = {
    positive: {
      icon: ArrowUpRight,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      sign: "+",
    },
    negative: {
      icon: ArrowDownRight,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      sign: "-",
    },
    neutral: {
      icon: Minus,
      color: "text-slate-400",
      bg: "bg-slate-400/10",
      sign: "",
    },
  };

  const TrendIcon = trendConfig[direction].icon;

  const targetValue = typeof target === "number" ? target : target;

  return (
    <div
      className={`bg-[#0a0f16] border border-[#1e293b] rounded-2xl p-6 hover:border-[#334155] transition-colors group ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-1.5">
            {title}
            {helpText && (
              <span
                className="cursor-help text-slate-500 hover:text-slate-300 transition-colors"
                title={helpText}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
            )}
          </h3>
        </div>
        {icon && (
          <div className="p-2 bg-slate-800/50 rounded-lg text-slate-300 group-hover:bg-slate-800 transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="text-2xl font-bold text-slate-50 tracking-tight">
            {value}
          </div>
          {delta !== undefined && (
            <div
              role="status"
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${trendConfig[direction].bg} ${trendConfig[direction].color}`}
              aria-label={`${trendConfig[direction].sign}${formatDelta(delta)} percent ${deltaLabel}`}
            >
              <TrendIcon size={12} aria-hidden="true" />
              <span aria-hidden="true">
                {trendConfig[direction].sign}
                {formatDelta(delta)}%
              </span>
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length >= 2 && (
          <div className="w-full">
            <Sparkline
              data={sparklineData}
              width={240}
              height={48}
              color="#6366f1"
              strokeWidth={2}
              showArea
              areaOpacity={0.15}
              className="w-full h-12"
              aria-label={`${title} trend sparkline`}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {delta !== undefined && (
            <p className="text-xs text-slate-500">{deltaLabel}</p>
          )}
          {targetValue !== undefined && (
            <p
              className="text-xs text-slate-400 flex items-center gap-1"
              aria-label={`${targetLabel}: ${targetValue}`}
            >
              <Target size={12} aria-hidden="true" />
              <span>
                {targetLabel}: {targetValue}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
