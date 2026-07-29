import { CheckCircle2, XCircle, AlertCircle, RefreshCcw, UserPlus, CreditCard } from 'lucide-react';
import Shimmer from '../common/Shimmer';
import './ActivityList.css';

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
  'subscription.created': { icon: UserPlus, className: 'activity-list__icon--info' },
  'payment.succeeded': { icon: CheckCircle2, className: 'activity-list__icon--success' },
  'payment.failed': { icon: XCircle, className: 'activity-list__icon--danger' },
  'subscription.cancelled': { icon: AlertCircle, className: 'activity-list__icon--muted' },
  'renewal.upcoming': { icon: RefreshCcw, className: 'activity-list__icon--warning' },
};

export default function ActivityList({ activities = [], loading = false }: ActivityListProps) {
  if (loading) {
    return (
      <div
        className="activity-list__loading"
        role="status"
        aria-busy="true"
        aria-label="Loading recent activity"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="activity-list__skeleton-item">
            <Shimmer shape="circle" className="activity-list__skeleton-avatar" delay={`${i * 0.05}s`} />
            <div className="activity-list__skeleton-content">
              <Shimmer className="activity-list__skeleton-line" delay={`${i * 0.05}s`} />
              <Shimmer className="activity-list__skeleton-line" delay={`${i * 0.05 + 0.03}s`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activity-list__empty">
        <div className="activity-list__empty-icon">
          <CreditCard size={24} aria-hidden="true" />
        </div>
        <h3>No activity yet</h3>
        <p>
          Transactions and events will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {activities.map((activity) => {
        const config = icons[activity.type] || icons['subscription.cancelled'];
        const Icon = config.icon;
        const statusClassName = activity.status === 'success'
          ? 'activity-list__status--success'
          : 'activity-list__status--failed';

        return (
          <div key={activity.id} className="activity-list__item">
            <div className={`activity-list__icon ${config.className}`}>
              <Icon size={20} aria-hidden="true" />
            </div>
            <div className="activity-list__body">
              <div className="activity-list__row">
                <p className="activity-list__description">
                  {activity.description}
                </p>
                {activity.amount && (
                  <span className="activity-list__amount">
                    {activity.amount}
                  </span>
                )}
              </div>
              <div className="activity-list__meta">
                <span>{activity.timestamp}</span>
                {activity.status && (
                  <>
                    <span className="activity-list__dot-separator" />
                    <span className={statusClassName}>
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
