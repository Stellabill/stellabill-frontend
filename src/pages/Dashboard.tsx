import { useState, useEffect, useCallback } from 'react';
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
  RotateCcw
} from 'lucide-react';
import RevenueChart from '../components/RevenueChart';
import DashboardCard from '../components/Dashboard/DashboardCard';
import ActivityList, { ActivityType } from '../components/Dashboard/ActivityList';
import DashboardSkeleton from '../components/Dashboard/DashboardSkeleton';
import RevenueSplitByPlanPanel from '../components/Dashboard/RevenueSplitByPlanPanel';
import type { PlanRevenueSlice } from '../components/Dashboard/revenueSplitUtils';
import ErrorState from '../components/ErrorState';
import { ApiError } from '../api/client';
import './Dashboard.css';

/** Mock plan revenue until /api/merchant/revenue-by-plan is wired. */
const MOCK_PLAN_REVENUE: PlanRevenueSlice[] = [
  { planId: 'basic', planName: 'Basic', revenue: 8500, previousRevenue: 7800 },
  { planId: 'pro', planName: 'Pro', revenue: 19200, previousRevenue: 17600 },
  { planId: 'business', planName: 'Business', revenue: 9800, previousRevenue: 10200 },
  { planId: 'enterprise', planName: 'Enterprise', revenue: 5000, previousRevenue: 4200 },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [activeFilters, setActiveFilters] = useState([
    { id: 'status', label: 'Status: Active' },
    { id: 'plan', label: 'Plan: Pro' },
    { id: 'date', label: 'Date: Last 30 Days' },
  ]);
  const [announcement, setAnnouncement] = useState('');

  const removeFilter = (id: string) => {
    setActiveFilters((prev) => {
      const filter = prev.find((f) => f.id === id);
      if (filter) {
        setAnnouncement(`Filter ${filter.label} removed.`);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const resetFilters = () => {
    setActiveFilters([]);
    setAnnouncement('All filters reset.');
  };

  const saveView = () => {
    setAnnouncement('Filter view saved successfully.');
  };

  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    setError(null);

    window.setTimeout(() => {
      try {
        if (window.location.search.includes('simulate_error')) {
          const err: ApiError = new Error('Failed to fetch dashboard metrics');
          err.status = 500;
          err.technicalDetails = 'The metrics service is currently unavailable. [Error Code: MET-500]';
          setError(err);
        } else if (window.location.search.includes('simulate_offline')) {
          const err: ApiError = new Error('No internet connection');
          err.isOffline = true;
          setError(err);
        }

        setLoading(false);
      } catch (err: unknown) {
        setError(err as Error);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
        <div className="dashboard-error-shell">
          <ErrorState
              title={t('dashboard.unavailable')}
              message={error.message}
              technicalDetails={error.technicalDetails}
              onRetry={fetchDashboardData}
              isRetrying={loading}
              type={error.isOffline ? 'offline' : 'error'}
          />
        </div>
    );
  }

  const mockActivities = [
    {
      id: '1',
      type: 'payment.succeeded' as ActivityType,
      description: 'Payment succeeded from John Doe',
      timestamp: '2 minutes ago',
      amount: '$29.00',
      status: 'success'
    },
    {
      id: '2',
      type: 'subscription.created' as ActivityType,
      description: 'New subscription: Pro Plan',
      timestamp: '45 minutes ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'payment.failed' as ActivityType,
      description: 'Payment failed for Sarah Smith',
      timestamp: '2 hours ago',
      amount: '$49.00',
      status: 'failed'
    },
    {
      id: '4',
      type: 'renewal.upcoming' as ActivityType,
      description: 'Subscription renewing: Enterprise 10',
      timestamp: 'Tomorrow',
      status: 'pending'
    },
    {
      id: '5',
      type: 'subscription.cancelled' as ActivityType,
      description: 'Subscription cancelled: Basic Plan',
      timestamp: 'Yesterday',
      status: 'cancelled'
    }
  ];

  return (
      <div className="dashboard-page">
        {/* Header */}
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

        {/* Live Region for Screen Readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        {/* Filter Chip Bar */}
        {activeFilters.length > 0 && (
          <div className="dashboard-filter-bar" aria-label="Active filters">
            <div className="dashboard-filter-chips">
              <span className="dashboard-filter-label" id="active-filters-label">
                Active Filters:
              </span>
              <ul className="dashboard-filter-list" aria-labelledby="active-filters-label">
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

        {/* KPI Grid */}
        <div className="dashboard-kpi-grid" data-help="Overview of your key performance indicators.">
          <DashboardCard
              title={t('dashboard.kpis.activeSubscriptions')}
              value="1,284"
              change={12.5}
              trend="up"
              icon={<Users size={20} />}
              helpText={t('dashboard.kpis.activeSubscriptionsHelp')}
              data-help="Total number of active subscribers currently on a plan."
          />
          <DashboardCard
              title={t('dashboard.kpis.mrr')}
              value="$42,500"
              change={8.2}
              trend="up"
              icon={<TrendingUp size={20} />}
              helpText={t('dashboard.kpis.mrrHelp')}
          />
          <DashboardCard
              title={t('dashboard.kpis.failedCharges')}
              value="12"
              change={-4.1}
              trend="down"
              icon={<AlertCircle size={20} />}
              helpText={t('dashboard.kpis.failedChargesHelp')}
          />
          <DashboardCard
              title={t('dashboard.kpis.upcomingRenewals')}
              value="48"
              trend="neutral"
              icon={<Calendar size={20} />}
              helpText={t('dashboard.kpis.upcomingRenewalsHelp')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-main-grid">
          {/* Chart Section */}
          <div className="dashboard-panel dashboard-panel--chart" data-help="A visual representation of your revenue over time. Use the detailed report for a breakdown.">
            <div className="dashboard-panel__header">
              <h2 className="dashboard-section-title">Revenue Growth</h2>
              <Link to="/reports" className="dashboard-link">
                View Detailed Report <ArrowRight size={12} />
              </Link>
            </div>
            <div className="dashboard-chart-wrapper">
              <RevenueChart />
            </div>
          </div>

          {/* Activity Section */}
          <div className="dashboard-activity-column" data-help="A feed of recent events like payments, new subscriptions, and cancellations.">
            <div className="dashboard-activity-header">
              <h2 className="dashboard-section-title">Recent Activity</h2>
              <button className="dashboard-muted-button">
                Mark all as read
              </button>
            </div>
            <ActivityList activities={mockActivities} />
            <button className="dashboard-load-more">
              See all activity
            </button>
          </div>
        </div>
      </div>
  );
}
