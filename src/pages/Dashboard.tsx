import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertCircle, Plus, LayoutGrid, ExternalLink, RotateCcw } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import DashboardSkeleton from '../components/Dashboard/DashboardSkeleton';
import OnboardingChecklistWidget from '../components/Dashboard/OnboardingChecklistWidget';
import { useDashboardWidgets } from '../hooks/useDashboardWidgets';
import DashboardFiltersBar from './dashboard/DashboardFiltersBar';
import DashboardTour from './dashboard/DashboardTour';
import DashboardWidgetGrid from './dashboard/DashboardWidgetGrid';
import { buildFailureSummary, MOCK_PLAN_REVENUE } from './dashboard/dashboardData';
import { useDashboardFilters } from './dashboard/useDashboardFilters';
import './Dashboard.css';

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { t } = useTranslation();
  const summaryRegionId = useId();

  const {
    filters,
    announcement: filterAnnouncement,
    activeFilters,
    removeFilter,
    resetFilters,
    saveView,
  } = useDashboardFilters(MOCK_PLAN_REVENUE);
  const { widgets, loadAll, retryWidget, isInitialLoading, failedWidgetIds } =
    useDashboardWidgets(filters);

  // Reload widgets whenever the active filter values change.
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Initial skeleton ───────────────────────────────────────────────
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  // Polite live-region summary: list all failed widget names
  const failureSummary = buildFailureSummary(failedWidgetIds);

  return (
    <>
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
      <DashboardFiltersBar
        activeFilters={activeFilters}
        onRemove={removeFilter}
        onReset={resetFilters}
        onSave={saveView}
      />

      {/* ── Onboarding Checklist ────────────────────────────────────── */}
      <OnboardingChecklistWidget />

      <DashboardWidgetGrid
        widgets={widgets}
        retryWidget={retryWidget}
        filters={filters}
      />
      </div>

      {/* Product Tour */}
      <DashboardTour />
    </>
  );
}
