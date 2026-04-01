import { CheckCircle2, XCircle, AlertCircle, RefreshCcw, UserPlus, CreditCard } from 'lucide-react';

export type ActivityType = 'subscription.created' | 'payment.succeeded' | 'payment.failed' | 'subscription.cancelled' | 'renewal.upcoming';

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  amount?: string;
  status?: string;
}

interface ActivityListProps {
  activities?: ActivityItem[];
  loading?: boolean;
}

const icons = {
  'subscription.created': { icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'payment.succeeded': { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  'payment.failed': { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  'subscription.cancelled': { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  'renewal.upcoming': { icon: RefreshCcw, color: 'text-amber-400', bg: 'bg-amber-400/10' },
};

export default function ActivityList({ activities = [], loading = false }: ActivityListProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 p-4 border border-slate-800/50 rounded-xl">
            <div className="w-10 h-10 bg-slate-800 rounded-full shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0a0f16] border border-dashed border-slate-800 rounded-2xl text-center">
        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-500">
          <CreditCard size={24} />
        </div>
        <h3 className="text-slate-200 font-medium mb-1">No activity yet</h3>
        <p className="text-slate-500 text-sm max-w-[240px]">
          Transactions and events will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = icons[activity.type] || icons['subscription.cancelled'];
        const Icon = config.icon;

        return (
          <div
            key={activity.id}
            className="group flex gap-4 p-4 bg-[#0a0f16] border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-black/20"
          >
            <div className={`w-10 h-10 ${config.bg} ${config.color} rounded-full flex items-center justify-center shrink-0`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-0.5">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {activity.description}
                </p>
                {activity.amount && (
                  <span className="text-xs font-semibold text-slate-100">
                    {activity.amount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{activity.timestamp}</span>
                {activity.status && (
                  <>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className={activity.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}>
                      {activity.status}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
