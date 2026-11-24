import { useTranslation } from 'react-i18next';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import RevenueChart from '../../components/RevenueChart';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import ActivityList from '../../components/Dashboard/ActivityList';
import RevenueSplitByPlanPanel from '../../components/Dashboard/RevenueSplitByPlanPanel';
import CardErrorSlot from '../../components/Dashboard/CardErrorSlot';
import HelpHint from '../../components/help/HelpHint';
import type {
  DashboardFilters,
  UseDashboardWidgetsReturn,
  WidgetId,
} from '../../hooks/useDashboardWidgets';
import {
  filterActivities,
  filterPlanRevenue,
  MOCK_ACTIVE_SUBS_SERIES,
  MOCK_ACTIVITIES,
  MOCK_MRR_SERIES,
  MOCK_PLAN_REVENUE,
} from './dashboardData';

interface DashboardWidgetGridProps {
  widgets: UseDashboardWidgetsReturn['widgets'];
  retryWidget: UseDashboardWidgetsReturn['retryWidget'];
  filters: DashboardFilters;
}

/** KPI cards, chart, activity feed and revenue split. */
export default function DashboardWidgetGrid({
  widgets,
  retryWidget,
  filters,
}: DashboardWidgetGridProps) {
  const { t } = useTranslation();

  const w = widgets;

  const kpiError = (id: WidgetId) =>
    w[id].status === 'error' ? w[id].error?.message ?? 'Failed to load data' : null;

  const kpiOffline = (id: WidgetId) =>
    w[id].status === 'error' && !!w[id].error?.isOffline;

  const kpiRetrying = (id: WidgetId) => w[id].status === 'loading';

  const filteredActivities = filterActivities(MOCK_ACTIVITIES, filters);
  const filteredPlanRevenue = filterPlanRevenue(MOCK_PLAN_REVENUE, filters);

  return (
    <>
      {/* ── KPI Grid ────────────────────────────────────────────────── */}
      <div
        className="dashboard-kpi-grid"
        aria-label="Key performance indicators"
      >
        <DashboardCard
          title={t('dashboard.kpis.activeSubscriptions')}
          value="1,284"
          change={12.5}
          trend="up"
          icon={<Users size={20} />}
          helpText={t('dashboard.kpis.activeSubscriptionsHelp')}
          sparklineData={MOCK_ACTIVE_SUBS_SERIES}
          target={1500}
          targetLabel={t('dashboard.kpis.targetLabel')}
          targetProgress={86}
          loading={w.kpi_active_subscriptions.status === 'loading'}
          error={kpiError('kpi_active_subscriptions')}
          isOfflineError={kpiOffline('kpi_active_subscriptions')}
          onRetry={() => retryWidget('kpi_active_subscriptions')}
          retrying={kpiRetrying('kpi_active_subscriptions')}
        />
        <DashboardCard
          title={t('dashboard.kpis.mrr')}
          value="$42,500"
          change={8.2}
          trend="up"
          icon={<TrendingUp size={20} />}
          helpText={t('dashboard.kpis.mrrHelp')}
          sparklineData={MOCK_MRR_SERIES}
          target={50000}
          targetLabel={t('dashboard.kpis.targetLabel')}
          targetProgress={85}
          loading={w.kpi_mrr.status === 'loading'}
          error={kpiError('kpi_mrr')}
          isOfflineError={kpiOffline('kpi_mrr')}
          onRetry={() => retryWidget('kpi_mrr')}
          retrying={kpiRetrying('kpi_mrr')}
        />
        <DashboardCard
          title={t('dashboard.kpis.failedCharges')}
          value="12"
          change={-4.1}
          trend="down"
          icon={<AlertCircle size={20} />}
          helpText={t('dashboard.kpis.failedChargesHelp')}
          loading={w.kpi_failed_charges.status === 'loading'}
          error={kpiError('kpi_failed_charges')}
          isOfflineError={kpiOffline('kpi_failed_charges')}
          onRetry={() => retryWidget('kpi_failed_charges')}
          retrying={kpiRetrying('kpi_failed_charges')}
        />
        <DashboardCard
          title={t('dashboard.kpis.upcomingRenewals')}
          value="48"
          trend="neutral"
          icon={<Calendar size={20} />}
          helpText={t('dashboard.kpis.upcomingRenewalsHelp')}
          loading={w.kpi_upcoming_renewals.status === 'loading'}
          error={kpiError('kpi_upcoming_renewals')}
          isOfflineError={kpiOffline('kpi_upcoming_renewals')}
          onRetry={() => retryWidget('kpi_upcoming_renewals')}
          retrying={kpiRetrying('kpi_upcoming_renewals')}
        />
      </div>

      {/* ── Main Content Grid ───────────────────────────────────────── */}
      <div className="dashboard-main-grid">
        {/* Chart Section */}
        <div className="dashboard-panel dashboard-panel--chart">
          <div className="dashboard-panel__header">
            <h2 className="dashboard-section-title">
              Revenue Growth
              <HelpHint
                title="Revenue Growth"
                definition="Total billed revenue per month across all active subscriptions. Use the trend to spot growth or contraction early."
                example="A spike in February often reflects annual renewals rather than new customer growth."
                learnMoreUrl="https://github.com/Stellabill/stellabill-frontend/tree/main/docs"
              />
            </h2>
          </div>

          {w.chart_revenue.status === 'error' ? (
            <CardErrorSlot
              widgetLabel="Revenue Growth chart"
              message={w.chart_revenue.error?.message ?? undefined}
              isOffline={kpiOffline('chart_revenue')}
              onRetry={() => retryWidget('chart_revenue')}
              retrying={kpiRetrying('chart_revenue')}
              className="card-error-slot--chart"
            />
          ) : (
            <div className="dashboard-chart-wrapper">
              <RevenueChart />
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="dashboard-activity-column">
          <div className="dashboard-activity-header">
            <h2 className="dashboard-section-title">Recent Activity</h2>
            <button className="dashboard-muted-button">
              Mark all as read
            </button>
          </div>

          {w.activity_feed.status === 'error' ? (
            <CardErrorSlot
              widgetLabel="Recent Activity"
              message={w.activity_feed.error?.message ?? undefined}
              isOffline={kpiOffline('activity_feed')}
              onRetry={() => retryWidget('activity_feed')}
              retrying={kpiRetrying('activity_feed')}
            />
          ) : (
            <>
              <ActivityList
                activities={filteredActivities}
                loading={w.activity_feed.status === 'loading'}
              />
              <button className="dashboard-load-more">See all activity</button>
            </>
          )}
        </div>
      </div>

      {/* ── Revenue Split By Plan ───────────────────────────────────── */}
      <div className="dashboard-revenue-split">
        <RevenueSplitByPlanPanel plans={filteredPlanRevenue} />
      </div>
    </>
  );
}
