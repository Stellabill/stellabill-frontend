import Shimmer from '../common/Shimmer';
import './DashboardSkeleton.css';

export default function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="dashboard-skeleton__header">
        <div className="dashboard-skeleton__stack">
          <Shimmer className="dashboard-skeleton__line dashboard-skeleton__line--title" />
          <Shimmer className="dashboard-skeleton__line dashboard-skeleton__line--subtitle" delay="0.05s" />
        </div>
        <div className="dashboard-skeleton__actions">
          <Shimmer className="dashboard-skeleton__button" delay="0.1s" />
          <Shimmer className="dashboard-skeleton__button" delay="0.15s" />
        </div>
      </div>

      <div className="dashboard-skeleton__kpis">
        {[1, 2, 3, 4].map((i) => (
          <Shimmer key={i} className="dashboard-skeleton__card" delay={`${i * 0.05}s`} />
        ))}
      </div>

      <div className="dashboard-skeleton__main">
        <div className="dashboard-skeleton__chart-column dashboard-skeleton__stack">
          <Shimmer className="dashboard-skeleton__line dashboard-skeleton__line--section" />
          {/* Stands in for RevenueChart while dashboard metrics are loading. */}
          <Shimmer className="dashboard-skeleton__chart" delay="0.1s" />
        </div>
        <div className="dashboard-skeleton__side">
          <Shimmer className="dashboard-skeleton__line dashboard-skeleton__line--section" />
          <div className="dashboard-skeleton__list">
            {[1, 2, 3, 4].map((i) => (
              <Shimmer key={i} className="dashboard-skeleton__activity" delay={`${i * 0.05}s`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
