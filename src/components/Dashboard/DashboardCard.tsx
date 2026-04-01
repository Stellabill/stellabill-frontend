import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  icon?: ReactNode;
  helpText?: string;
}

export default function DashboardCard({
  title,
  value,
  change,
  trend,
  loading = false,
  icon,
  helpText,
}: DashboardCardProps) {
  if (loading) {
    return (
      <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-2xl p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 w-24 bg-slate-700 rounded"></div>
          <div className="h-8 w-8 bg-slate-700 rounded-lg"></div>
        </div>
        <div className="h-8 w-32 bg-slate-700 rounded mb-2"></div>
        <div className="h-4 w-20 bg-slate-700 rounded"></div>
      </div>
    );
  }

  const trendConfig = {
    up: { icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    down: { icon: ArrowDownRight, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    neutral: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  };

  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <div className="bg-[#0a0f16] border border-[#1e293b] rounded-2xl p-6 hover:border-[#334155] transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-1.5">
            {title}
            {helpText && (
              <span className="cursor-help text-slate-500 hover:text-slate-300 transition-colors" title={helpText}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </span>
            )}
          </h3>
        </div>
        {icon && <div className="p-2 bg-slate-800/50 rounded-lg text-slate-300 group-hover:bg-slate-800 transition-colors">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-slate-50 tracking-tight">{value}</div>
        {change !== undefined && trend && (
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${trendConfig[trend].bg} ${trendConfig[trend].color}`}>
            <TrendIcon size={12} />
            {Math.abs(change)}%
          </div>
        )}
      </div>

      {change !== undefined && (
        <p className="mt-2 text-xs text-slate-500">
          vs last 30 days
        </p>
      )}
    </div>
  );
}
