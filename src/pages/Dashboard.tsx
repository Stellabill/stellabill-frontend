import { useState, useEffect } from 'react';
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
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
    <div className="min-h-screen bg-[#020617] text-slate-50 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="text-cyan-400" size={20} />
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Monitor your subscription performance and growth metrics.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link
            to="/plans"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={16} />
            View Plans
          </Link>
          <Link
            to="/plans?create=true"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-emerald-500 text-slate-950 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Create Plan
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-[#0a0f16] border border-slate-800/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-200">Revenue Growth</h2>
            <Link to="/reports" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium">
              View Detailed Report <ArrowRight size={12} />
            </Link>
          </div>
          <div className="h-[350px] w-full">
            <RevenueChart />
          </div>
        </div>

        {/* Activity Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">Recent Activity</h2>
            <button className="text-xs text-slate-400 hover:text-slate-300 font-medium">
              Mark all as read
            </button>
          </div>
          <ActivityList activities={mockActivities} />
          <button className="w-full py-3 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-900/30 border border-slate-800/50 rounded-xl transition-colors">
            See all activity
          </button>
        </div>
      </div>
    </div>
  );
}
