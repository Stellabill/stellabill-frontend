import './DashboardSkeleton.css';

export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton animate-pulse">
      <div className="dashboard-skeleton__header">
        <div className="dashboard-skeleton__stack">
          <div className="dashboard-skeleton__line dashboard-skeleton__line--title" />
          <div className="dashboard-skeleton__line dashboard-skeleton__line--subtitle" />
        </div>
        <div className="dashboard-skeleton__actions">
          <div className="dashboard-skeleton__button" />
          <div className="dashboard-skeleton__button" />
        </div>
      </div>

      <div className="dashboard-skeleton__kpis">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="dashboard-skeleton__card" />
        ))}
      </div>

      <div className="dashboard-skeleton__main">
        <div className="dashboard-skeleton__chart-column dashboard-skeleton__stack">
          <div className="dashboard-skeleton__line dashboard-skeleton__line--section" />
          <div className="dashboard-skeleton__chart" />
        </div>
        <div className="dashboard-skeleton__side">
          <div className="dashboard-skeleton__line dashboard-skeleton__line--section" />
          <div className="dashboard-skeleton__list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dashboard-skeleton__activity" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
