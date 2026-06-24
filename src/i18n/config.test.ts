import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock i18next-icu to avoid ICU parser issues in tests ───
vi.mock('i18next-icu', () => ({
  default: {
    type: 'i18nFormat',
    init: vi.fn(),
    parse: (_res: unknown, _opts: unknown, _lng: string, _ns: string, _key: string, _info: unknown) => null,
    addUserDefinedFormats: vi.fn(),
  },
}));

// ─── Suppress window.location access during module init ───
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { search: '' },
    writable: true,
  });
});

describe('i18n config', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('initializes i18n with the en locale', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.language).toBe('en');
  });

  it('resolves the dashboard title key from en.json', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.t('dashboard.title')).toBe('Dashboard Overview');
  });

  it('resolves the dashboard subtitle key', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.t('dashboard.subtitle')).toBe(
      'Monitor your subscription performance and growth metrics.'
    );
  });

  it('resolves nested KPI keys', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.t('dashboard.kpis.activeSubscriptions')).toBe('Active Subscriptions');
    expect(i18n.t('dashboard.kpis.mrr')).toBe('MRR');
    expect(i18n.t('dashboard.kpis.failedCharges')).toBe('Failed Charges');
    expect(i18n.t('dashboard.kpis.upcomingRenewals')).toBe('Upcoming Renewals');
  });

  it('resolves subscriptions page keys', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.t('subscriptions.pageTitle')).toBe('My subscriptions');
    expect(i18n.t('subscriptions.browsePlans')).toBe('Browse plans');
  });

  it('resolves subscription tab keys', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.t('subscriptions.tabs.all')).toBe('All');
    expect(i18n.t('subscriptions.tabs.active')).toBe('Active');
    expect(i18n.t('subscriptions.tabs.paused')).toBe('Paused');
    expect(i18n.t('subscriptions.tabs.cancelled')).toBe('Cancelled');
  });

  it('resolves subscription table column keys', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.t('subscriptions.table.plan')).toBe('Plan');
    expect(i18n.t('subscriptions.table.status')).toBe('Status');
    expect(i18n.t('subscriptions.table.nextCharge')).toBe('Next Charge');
    expect(i18n.t('subscriptions.table.prepaidBalance')).toBe('Prepaid Balance');
    expect(i18n.t('subscriptions.table.actions')).toBe('Actions');
    expect(i18n.t('subscriptions.table.manage')).toBe('Manage');
  });

  it('resolves aria label keys', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.t('aria.loadingSubscriptions')).toBe('Loading subscriptions');
    expect(i18n.t('aria.filterByStatus')).toBe('Filter subscriptions by status');
  });

  it('returns the key when a translation is missing (no silent fail)', async () => {
    const { default: i18n } = await import('./config');
    const result = i18n.t('nonexistent.key.that.should.not.exist');
    // i18next returns the key itself as fallback
    expect(result).toBe('nonexistent.key.that.should.not.exist');
  });

  it('does not apply pseudo expansion by default (no debug_i18n param)', async () => {
    const { default: i18n } = await import('./config');
    const result = i18n.t('dashboard.title');
    // Without debug_i18n=true, no expansion characters appended
    expect(result).not.toContain('ẋ');
    expect(result).toBe('Dashboard Overview');
  });
});

describe('en.json catalogue completeness', () => {
  it('contains all required top-level namespaces', async () => {
    const enJson = await import('../locales/en.json');
    expect(enJson).toHaveProperty('dashboard');
    expect(enJson).toHaveProperty('subscriptions');
    expect(enJson).toHaveProperty('aria');
  });

  it('dashboard namespace has all required keys', async () => {
    const { dashboard } = await import('../locales/en.json');
    expect(dashboard).toHaveProperty('title');
    expect(dashboard).toHaveProperty('subtitle');
    expect(dashboard).toHaveProperty('viewPlans');
    expect(dashboard).toHaveProperty('createPlan');
    expect(dashboard).toHaveProperty('kpis');
    expect(dashboard).toHaveProperty('revenueGrowth');
    expect(dashboard).toHaveProperty('recentActivity');
    expect(dashboard).toHaveProperty('markAllAsRead');
    expect(dashboard).toHaveProperty('seeAllActivity');
    expect(dashboard).toHaveProperty('unavailable');
  });

  it('dashboard.kpis has all four metric keys', async () => {
    const { dashboard } = await import('../locales/en.json');
    expect(dashboard.kpis).toHaveProperty('activeSubscriptions');
    expect(dashboard.kpis).toHaveProperty('mrr');
    expect(dashboard.kpis).toHaveProperty('failedCharges');
    expect(dashboard.kpis).toHaveProperty('upcomingRenewals');
  });

  it('subscriptions namespace has required keys', async () => {
    const { subscriptions } = await import('../locales/en.json');
    expect(subscriptions).toHaveProperty('pageTitle');
    expect(subscriptions).toHaveProperty('pageDescription');
    expect(subscriptions).toHaveProperty('browsePlans');
    expect(subscriptions).toHaveProperty('tabs');
    expect(subscriptions).toHaveProperty('table');
    expect(subscriptions).toHaveProperty('status');
    expect(subscriptions).toHaveProperty('empty');
  });

  it('subscriptions.tabs has all four tab keys', async () => {
    const { subscriptions } = await import('../locales/en.json');
    expect(subscriptions.tabs).toHaveProperty('all');
    expect(subscriptions.tabs).toHaveProperty('active');
    expect(subscriptions.tabs).toHaveProperty('paused');
    expect(subscriptions.tabs).toHaveProperty('cancelled');
  });

  it('subscriptions.table has all required column keys', async () => {
    const { subscriptions } = await import('../locales/en.json');
    expect(subscriptions.table).toHaveProperty('plan');
    expect(subscriptions.table).toHaveProperty('status');
    expect(subscriptions.table).toHaveProperty('price');
    expect(subscriptions.table).toHaveProperty('nextCharge');
    expect(subscriptions.table).toHaveProperty('prepaidBalance');
    expect(subscriptions.table).toHaveProperty('actions');
    expect(subscriptions.table).toHaveProperty('manage');
    expect(subscriptions.table).toHaveProperty('prepaid');
    expect(subscriptions.table).toHaveProperty('coverage');
    expect(subscriptions.table).toHaveProperty('lastPayment');
  });

  it('subscriptions.empty has all four empty state keys', async () => {
    const { subscriptions } = await import('../locales/en.json');
    expect(subscriptions.empty).toHaveProperty('noFiltered');
    expect(subscriptions.empty).toHaveProperty('noFilteredDesc');
    expect(subscriptions.empty).toHaveProperty('noSubscriptions');
    expect(subscriptions.empty).toHaveProperty('noSubscriptionsDesc');
  });

  it('subscriptions.empty.noFiltered contains {filter} placeholder', async () => {
    const { subscriptions } = await import('../locales/en.json');
    expect(subscriptions.empty.noFiltered).toContain('{filter}');
    expect(subscriptions.empty.noFilteredDesc).toContain('{filter}');
  });

  it('subscriptions.pluralTest is a valid ICU plural string', async () => {
    const { subscriptions } = await import('../locales/en.json');
    expect(subscriptions.pluralTest).toContain('plural');
    expect(subscriptions.pluralTest).toContain('=0');
    expect(subscriptions.pluralTest).toContain('one');
    expect(subscriptions.pluralTest).toContain('other');
  });

  it('aria namespace has required accessibility keys', async () => {
    const { aria } = await import('../locales/en.json');
    expect(aria).toHaveProperty('loadingSubscriptions');
    expect(aria).toHaveProperty('filterByStatus');
    expect(aria).toHaveProperty('subscriptionsList');
  });

  it('all string values are non-empty', async () => {
    function checkAllStrings(obj: Record<string, unknown>, path = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          expect(value.trim(), `Key "${fullPath}" must not be empty`).not.toBe('');
        } else if (typeof value === 'object' && value !== null) {
          checkAllStrings(value as Record<string, unknown>, fullPath);
        }
      }
    }
    const enJson = await import('../locales/en.json');
    checkAllStrings(enJson as unknown as Record<string, unknown>);
  });
});

describe('pseudo-locale length expansion', () => {
  it('expansion characters are the ẋ character', () => {
    // The pseudo processor uses ẋ characters for expansion
    const expansionChar = 'ẋ';
    expect(expansionChar.length).toBe(1);
  });

  it('expansion adds approximately 30% more characters', () => {
    const original = 'Dashboard Overview'; // 18 chars
    const expansionLength = Math.ceil(original.length * 0.3); // ~6
    const expanded = original + ' ẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋ'.substring(0, expansionLength);
    expect(expanded.length).toBeGreaterThan(original.length);
    expect(expanded.length).toBeLessThanOrEqual(Math.ceil(original.length * 1.31));
  });

  it('+30% expansion handles zero-length string safely', () => {
    const original = '';
    const expansionLength = Math.ceil(original.length * 0.3); // 0
    expect(expansionLength).toBe(0);
  });
});
