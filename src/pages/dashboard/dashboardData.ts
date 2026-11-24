import type { ActivityType } from '../../components/Dashboard/ActivityList';
import type { PlanRevenueSlice } from '../../components/Dashboard/revenueSplitUtils';
import type {
  DashboardFilters,
  WidgetId,
} from '../../hooks/useDashboardWidgets';

/** Mock plan revenue until /api/merchant/revenue-by-plan is wired. */
export const MOCK_PLAN_REVENUE: PlanRevenueSlice[] = [
  { planId: 'basic', planName: 'Basic', revenue: 8500, previousRevenue: 7800 },
  { planId: 'pro', planName: 'Pro', revenue: 19200, previousRevenue: 17600 },
  { planId: 'business', planName: 'Business', revenue: 9800, previousRevenue: 10200 },
  { planId: 'enterprise', planName: 'Enterprise', revenue: 5000, previousRevenue: 4200 },
];

/** Mock 30-day series for KPI sparklines until /api/merchant/metrics is wired. */
export const MOCK_MRR_SERIES = [
  39.1, 39.4, 39.2, 39.8, 40.1, 40.0, 40.5, 40.3, 40.9, 41.2, 41.0, 41.6,
  41.4, 41.9, 42.2, 42.0, 42.5, 42.3, 42.8, 42.6, 43.1, 42.9, 43.4, 43.2,
  43.7, 43.5, 44.0, 44.2, 44.0, 44.5,
].map((k) => Math.round(k * 1000));

export const MOCK_ACTIVE_SUBS_SERIES = [
  1.18, 1.19, 1.19, 1.2, 1.21, 1.2, 1.22, 1.22, 1.23, 1.24, 1.23, 1.25,
  1.25, 1.26, 1.26, 1.27, 1.28, 1.27, 1.28, 1.29, 1.29, 1.3, 1.3, 1.31,
  1.31, 1.32, 1.32, 1.33, 1.33, 1.34,
].map((k) => Math.round(k * 1000));

/** Human-readable widget labels for the live-region summary banner. */
export const WIDGET_LABELS: Record<WidgetId, string> = {
  kpi_active_subscriptions: 'Active Subscriptions',
  kpi_mrr: 'Monthly Recurring Revenue',
  kpi_failed_charges: 'Failed Charges',
  kpi_upcoming_renewals: 'Upcoming Renewals',
  chart_revenue: 'Revenue Growth chart',
  activity_feed: 'Recent Activity',
  revenue_split: 'Revenue by Plan',
};

export interface MockActivity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  amount?: string;
  status: string;
  planId: string;
  subscriptionStatus: string;
  ageInDays: number;
}

/** Mock activities until the activity feed endpoint is wired. */
export const MOCK_ACTIVITIES: MockActivity[] = [
  {
    id: '1',
    type: 'payment.succeeded',
    description: 'Payment succeeded from John Doe',
    timestamp: '2 minutes ago',
    amount: '$29.00',
    status: 'success',
    planId: 'pro',
    subscriptionStatus: 'active',
    ageInDays: 0,
  },
  {
    id: '2',
    type: 'subscription.created',
    description: 'New subscription: Pro Plan',
    timestamp: '45 minutes ago',
    status: 'success',
    planId: 'pro',
    subscriptionStatus: 'active',
    ageInDays: 0,
  },
  {
    id: '3',
    type: 'payment.failed',
    description: 'Payment failed for Sarah Smith',
    timestamp: '2 hours ago',
    amount: '$49.00',
    status: 'failed',
    planId: 'enterprise',
    subscriptionStatus: 'active',
    ageInDays: 0,
  },
  {
    id: '4',
    type: 'renewal.upcoming',
    description: 'Subscription renewing: Enterprise 10',
    timestamp: 'Tomorrow',
    status: 'pending',
    planId: 'enterprise',
    subscriptionStatus: 'active',
    ageInDays: 0,
  },
  {
    id: '5',
    type: 'subscription.cancelled',
    description: 'Subscription cancelled: Basic Plan',
    timestamp: 'Yesterday',
    status: 'cancelled',
    planId: 'basic',
    subscriptionStatus: 'inactive',
    ageInDays: 1,
  },
];

/** Apply the active filters to the mock activity feed. */
export function filterActivities(
  activities: ReadonlyArray<MockActivity>,
  filters: DashboardFilters,
) {
  return activities
    .filter((activity) =>
      (!filters.status || activity.subscriptionStatus === filters.status) &&
      (!filters.planId || activity.planId === filters.planId) &&
      (!filters.range || activity.ageInDays <= 30),
    )
    .map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp,
      amount: activity.amount,
      status: activity.status,
    }));
}

/** Apply the plan filter to the mock revenue split. */
export function filterPlanRevenue(
  plans: ReadonlyArray<PlanRevenueSlice>,
  filters: DashboardFilters,
): PlanRevenueSlice[] {
  return plans.filter((plan) => !filters.planId || plan.planId === filters.planId);
}

/** Polite live-region summary listing every failed widget name. */
export function buildFailureSummary(failedWidgetIds: ReadonlyArray<WidgetId>): string {
  return failedWidgetIds.length > 0
    ? `${failedWidgetIds.length} section${failedWidgetIds.length > 1 ? 's' : ''} failed to load: ${failedWidgetIds.map((id) => WIDGET_LABELS[id]).join(', ')}. Use the Retry buttons to reload individual sections.`
    : '';
}
