import { describe, it, expect } from 'vitest';
import {
  buildFailureSummary,
  filterActivities,
  filterPlanRevenue,
  MOCK_ACTIVITIES,
  MOCK_PLAN_REVENUE,
} from './dashboardData';

describe('filterActivities', () => {
  it('returns every activity when no filters are active', () => {
    expect(filterActivities(MOCK_ACTIVITIES, {})).toHaveLength(
      MOCK_ACTIVITIES.length,
    );
  });

  it('filters by subscription status', () => {
    const active = filterActivities(MOCK_ACTIVITIES, { status: 'active' });
    expect(active).toHaveLength(4);
    expect(active.every((activity) => activity.id !== '5')).toBe(true);
  });

  it('filters by plan id', () => {
    const result = filterActivities(MOCK_ACTIVITIES, { planId: 'enterprise' });
    expect(result.map((activity) => activity.id)).toEqual(['3', '4']);
  });

  it('filters by age in days', () => {
    const result = filterActivities(MOCK_ACTIVITIES, { range: 'last30Days' });
    expect(result.map((activity) => activity.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('drops internal-only fields from the returned activities', () => {
    const [first] = filterActivities(MOCK_ACTIVITIES, { planId: 'pro' });
    expect(first).toEqual({
      id: '1',
      type: 'payment.succeeded',
      description: 'Payment succeeded from John Doe',
      timestamp: '2 minutes ago',
      amount: '$29.00',
      status: 'success',
    });
    expect(first).not.toHaveProperty('ageInDays');
    expect(first).not.toHaveProperty('subscriptionStatus');
  });
});

describe('filterPlanRevenue', () => {
  it('returns every plan when no plan filter is active', () => {
    expect(filterPlanRevenue(MOCK_PLAN_REVENUE, {})).toEqual(MOCK_PLAN_REVENUE);
  });

  it('keeps only the matching plan', () => {
    expect(filterPlanRevenue(MOCK_PLAN_REVENUE, { planId: 'business' })).toEqual([
      { planId: 'business', planName: 'Business', revenue: 9800, previousRevenue: 10200 },
    ]);
  });

  it('returns an empty list for an unknown plan', () => {
    expect(filterPlanRevenue(MOCK_PLAN_REVENUE, { planId: 'unknown' })).toEqual([]);
  });
});

describe('buildFailureSummary', () => {
  it('returns an empty string when nothing failed', () => {
    expect(buildFailureSummary([])).toBe('');
  });

  it('names a single failed widget', () => {
    expect(buildFailureSummary(['kpi_mrr'])).toBe(
      '1 section failed to load: Monthly Recurring Revenue. Use the Retry buttons to reload individual sections.',
    );
  });

  it('pluralises and lists every failed widget', () => {
    expect(buildFailureSummary(['kpi_mrr', 'chart_revenue'])).toBe(
      '2 sections failed to load: Monthly Recurring Revenue, Revenue Growth chart. Use the Retry buttons to reload individual sections.',
    );
  });
});
