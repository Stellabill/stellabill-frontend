import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  Plus,
  LayoutGrid,
  ExternalLink,
  ArrowRight,
  X,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import RevenueChart from '../components/RevenueChart';
import DashboardCard from '../components/Dashboard/DashboardCard';
import ActivityList, { ActivityType } from '../components/Dashboard/ActivityList';
import DashboardSkeleton from '../components/Dashboard/DashboardSkeleton';
import RevenueSplitByPlanPanel from '../components/Dashboard/RevenueSplitByPlanPanel';
import CardErrorSlot from '../components/Dashboard/CardErrorSlot';
import type { PlanRevenueSlice } from '../components/Dashboard/revenueSplitUtils';
import {
  useDashboardWidgets,
  type WidgetId,
} from '../hooks/useDashboardWidgets';
import './Dashboard.css';

/** Mock plan revenue until /api/merchant/revenue-by-plan is wired. */
const MOCK_PLAN_REVENUE: PlanRevenueSlice[] = [
  { planId: 'basic', planName: 'Basic', revenue: 8500, previousRevenue: 7800 },
  { planId: 'pro', planName: 'Pro', revenue: 19200, previousRevenue: 17600 },
  { planId: 'business', planName: 'Business', revenue: 9800, previousRevenue: 10200 },
  { planId: 'enterprise', planName: 'Enterprise', revenue: 5000, previousRevenue: 4200 },
];

/** Human-readable widget labels for the live-region summary banner. */
const WIDGET_LABELS: Record<WidgetId, string> = {
  kpi_active_subscriptions: 'Active Subscriptions',
  kpi_mrr: 'Monthly Recurring Revenue',
  kpi_failed_charges: 'Failed Charges',
  kpi_upcoming_renewals: 'Upcoming Renewals',
  chart_revenue: 'Revenue Growth chart',
  activity_feed: 'Recent Activity',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const summaryRegionId = useId();

  const { widgets, loadAll, retryWidget, isInitialLoading, failedWidgetIds } =
    useDashboardWidgets();

  const [activeFilters, setActiveFilters] = useState([
    { id: 'status', label: 'Status: Active' },
    { id: 'plan', label: 'Plan: Pro' },
    { id: 'date', label: 'Date: Last 30 Days' },
  ]);
  const [filterAnnouncement, setFilterAnnouncement] = useState('');

  // Kick off the initial parallel widget loads
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Filter chip helpers ────────────────────────────────────────────
  const removeFilter = (id: string) => {
    setActiveFilters((prev) => {
      const filter = prev.find((f) => f.id === id);
      if (filter) setFilterAnnouncement(`Filter ${filter.label} removed.`);
      return prev.filter((f) => f.id !== id);
    });
  };

  const resetFilters = () => {
    setActiveFilters([]);
    setFilterAnnouncement('All filters reset.');
  };

  const saveView = () => {
    setFilterAnnouncement('Filter view saved successfully.');
  };

  // ─── Initial skeleton ───────────────────────────────────────────────
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  // ─── Per-widget helpers ─────────────────────────────────────────────
  const w = widgets;

  const kpiError = (id: WidgetId) =>
    w[id].status === 'error' ? w[id].error?.message ?? 'Failed to load data' : null;

  const kpiOffline = (id: WidgetId) =>
    w[id].status === 'error' && !!w[id].error?.isOffline;

  const kpiRetrying = (id: WidgetId) => w[id].status === 'loading';

  // Polite live-region summary: list all failed widget names
  const failureSummary =
    failedWidgetIds.length > 0
      ? `${failedWidgetIds.length} section${failedWidgetIds.length > 1 ? 's' : ''} failed to load: ${failedWidgetIds.map((id) => WIDGET_LABELS[id]).join(', ')}. Use the Retry buttons to reload individual sections.`
      : '';

  // ─── Mock activities ────────────────────────────────────────────────
  const mockActivities = [
    {
      id: '1',
      type: 'payment.succeeded' as ActivityType,
      description: 'Payment succeeded from John Doe',
      timestamp: '2 minutes ago',
      amount: '$29.00',
      status: 'success',
    },
    {
      id: '2',
      type: 'subscription.created' as ActivityType,
      description: 'New subscription: Pro Plan',
      timestamp: '45 minutes ago',
      status: 'success',
    },
    {
      id: '3',
      type: 'payment.failed' as ActivityType,
      description: 'Payment failed for Sarah Smith',
      timestamp: '2 hours ago',
      amount: '$49.00',
      status: 'failed',
    },
    {
      id: '4',
      type: 'renewal.upcoming' as ActivityType,
      description: 'Subscription renewing: Enterprise 10',
      timestamp: 'Tomorrow',
      status: 'pending',
    },
    {
      id: '5',
      type: 'subscription.cancelled' as ActivityType,
      description: 'Subscription cancelled: Basic Plan',
      timestamp: 'Yesterday',
      status: 'cancelled',
    },
  ];

  return (
    <div className="dashboard-page">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="dashboard-header">
        <div>
          <div className="dashboard-heading-row">
            <LayoutGrid size={20} aria-hidden="true" />
            <h1>Dashboard Overview</h1>
          </div>
          <p className="dashboard-description">
            Monitor your subscription performance and growth metrics.
          </p>
        </div>
        <div className="dashboard-actions">
          <Link
            to="/plans"
            className="dashboard-action dashboard-action--secondary"
          >
            <ExternalLink size={16} />
            {t('dashboard.viewPlans')}
          </Link>
          <Link
            to="/plans?create=true"
            className="dashboard-action dashboard-action--primary"
          >
            <Plus size={16} />
            {t('dashboard.createPlan')}
          </Link>
        </div>
      </header>

      {/*
       * ── Polite live region ─────────────────────────────────────────
       * Announces the failure summary when widgets finish loading and
       * clears when all widgets succeed.  Uses aria-atomic so the whole
       * message is read, not just the changed portion.
       */}
      <div
        id={summaryRegionId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {failureSummary}
      </div>

      {/* Filter-action announcements (separate region to avoid conflicts) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {filterAnnouncement}
      </div>

      {/*
       * ── Partial-error banner ───────────────────────────────────────
       * Visible summary bar shown when ≥1 widget failed but the page is
       * otherwise functional.  Dismisses naturally once all retries succeed.
       */}
      {failedWidgetIds.length > 0 && (
        <div className="dashboard-partial-error-banner" role="status" aria-describedby={summaryRegionId}>
          <AlertCircle size={16} aria-hidden="true" className="dashboard-partial-error-banner__icon" />
          <span>
            <strong>{failedWidgetIds.length} section{failedWidgetIds.length > 1 ? 's' : ''} failed to load.</strong>{' '}
            The rest of the dashboard is still available. Use the individual Retry buttons to reload failed sections.
          </span>
          <button
            type="button"
            className="dashboard-partial-error-banner__retry-all"
            onClick={loadAll}
          >
            <RotateCcw size={13} aria-hidden="true" />
            Retry all
          </button>
        </div>
      )}

      {/* ── Filter Chip Bar ─────────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="dashboard-filter-bar" aria-label="Active filters">
          <div className="dashboard-filter-chips">
            <span className="dashboard-filter-label" id="active-filters-label">
              Active Filters:
            </span>
            <ul
              className="dashboard-filter-list"
              aria-labelledby="active-filters-label"
            >
              {activeFilters.map((filter) => (
                <li key={filter.id} className="dashboard-filter-chip">
                  <span>{filter.label}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter(filter.id)}
                    aria-label={`Remove filter ${filter.label}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="dashboard-filter-actions">
            <button
              type="button"
              className="dashboard-filter-action dashboard-filter-action--reset"
              onClick={resetFilters}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
            <button
              type="button"
              className="dashboard-filter-action dashboard-filter-action--save"
              onClick={saveView}
            >
              <Save size={14} aria-hidden="true" />
              Save View
            </button>
          </div>
        </div>
      )}

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
            <h2 className="dashboard-section-title">Revenue Growth</h2>
            <Link to="/reports" className="dashboard-link">
              View Detailed Report <ArrowRight size={12} />
            </Link>
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
                activities={mockActivities}
                loading={w.activity_feed.status === 'loading'}
              />
              <button className="dashboard-load-more">See all activity</button>
            </>
          )}
        </div>
      </div>

      {/* ── Revenue Split By Plan ───────────────────────────────────── */}
      <div className="dashboard-revenue-split">
        <RevenueSplitByPlanPanel plans={MOCK_PLAN_REVENUE} />
      </div>
    </div>
  );
}
