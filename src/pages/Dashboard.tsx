import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Plus, 
  LayoutGrid,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import RevenueChart from '../components/RevenueChart';
import DashboardCard from '../components/Dashboard/DashboardCard';
import ActivityList, { ActivityType } from '../components/Dashboard/ActivityList';
import DashboardSkeleton from '../components/Dashboard/DashboardSkeleton';
import ErrorState from '../components/ErrorState';
import { ApiError } from '../api/client';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    setError(null);

    window.setTimeout(() => {
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
    }, 1000);
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
          title="Dashboard Unavailable"
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
            View Plans
          </Link>
          <Link
            to="/plans?create=true"
            className="dashboard-action dashboard-action--primary"
          >
            <Plus size={16} />
            Create Plan
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="dashboard-kpi-grid">
        <DashboardCard
          title="Active Subscriptions"
          value="1,284"
          change={12.5}
          trend="up"
          icon={<Users size={20} />}
          helpText="Total number of currently active paid subscriptions."
        />
        <DashboardCard
          title="MRR"
          value="$42,500"
          change={8.2}
          trend="up"
          icon={<TrendingUp size={20} />}
          helpText="Monthly Recurring Revenue across all active subscriptions."
        />
        <DashboardCard
          title="Failed Charges"
          value="12"
          change={-4.1}
          trend="down"
          icon={<AlertCircle size={20} />}
          helpText="Number of charges that failed in the last 30 days."
        />
        <DashboardCard
          title="Upcoming Renewals"
          value="48"
          trend="neutral"
          icon={<Calendar size={20} />}
          helpText="Subscriptions set to renew in the next 7 days."
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">
        {/* Chart Section */}
        <div className="dashboard-panel dashboard-panel--chart">
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
        <div className="dashboard-activity-column">
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
