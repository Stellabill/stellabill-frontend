import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  activeFiltersFor,
  DEFAULT_FILTERS,
  filtersFromSearchParams,
  initialFilterState,
  parseSavedFilters,
  SAVED_FILTERS_STORAGE_KEY,
  writeFiltersToSearchParams,
} from './dashboardFilters';

describe('filtersFromSearchParams', () => {
  it('returns null when no filter keys are present', () => {
    expect(filtersFromSearchParams(new URLSearchParams())).toBeNull();
    expect(filtersFromSearchParams(new URLSearchParams('page=2'))).toBeNull();
  });

  it('returns empty filters when filters=none is present', () => {
    expect(filtersFromSearchParams(new URLSearchParams('filters=none'))).toEqual({});
  });

  it('parses each recognised filter value', () => {
    const params = new URLSearchParams('status=active&planId=pro&range=last30Days');
    expect(filtersFromSearchParams(params)).toEqual({
      status: 'active',
      planId: 'pro',
      range: 'last30Days',
    });
  });

  it('drops unsupported values', () => {
    const params = new URLSearchParams('status=inactive&range=last7Days');
    expect(filtersFromSearchParams(params)).toEqual({});
  });
});

describe('parseSavedFilters', () => {
  it('keeps only valid saved values', () => {
    expect(
      parseSavedFilters({ status: 'active', planId: 'pro', range: 'last30Days' }),
    ).toEqual({ status: 'active', planId: 'pro', range: 'last30Days' });
  });

  it('accepts an empty object', () => {
    expect(parseSavedFilters({})).toEqual({});
  });

  it.each([null, undefined, 'active', 42, []])(
    'throws for non-object values (%s)',
    (value) => {
      expect(() => parseSavedFilters(value)).toThrow(/invalid/i);
    },
  );

  it.each([
    { status: 'inactive' },
    { planId: 7 },
    { range: 'last7Days' },
  ])('throws for invalid field values (%o)', (value) => {
    expect(() => parseSavedFilters(value)).toThrow(/invalid/i);
  });
});

describe('initialFilterState', () => {
  beforeEach(() => {
    localStorage.removeItem(SAVED_FILTERS_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(SAVED_FILTERS_STORAGE_KEY);
  });

  it('prefers URL filters over saved filters', () => {
    localStorage.setItem(
      SAVED_FILTERS_STORAGE_KEY,
      JSON.stringify({ planId: 'basic' }),
    );

    expect(
      initialFilterState(new URLSearchParams('planId=pro')),
    ).toEqual({ filters: { planId: 'pro' }, announcement: '' });
  });

  it('restores saved filters when the URL has none', () => {
    localStorage.setItem(
      SAVED_FILTERS_STORAGE_KEY,
      JSON.stringify({ status: 'active', range: 'last30Days' }),
    );

    expect(initialFilterState(new URLSearchParams())).toEqual({
      filters: { status: 'active', range: 'last30Days' },
      announcement: '',
    });
  });

  it('falls back to defaults when nothing is saved', () => {
    expect(initialFilterState(new URLSearchParams())).toEqual({
      filters: DEFAULT_FILTERS,
      announcement: '',
    });
  });

  it('falls back to defaults and announces corrupt saved filters', () => {
    localStorage.setItem(SAVED_FILTERS_STORAGE_KEY, '{not json');

    expect(initialFilterState(new URLSearchParams())).toEqual({
      filters: DEFAULT_FILTERS,
      announcement: 'Unable to restore the saved filter view.',
    });
  });
});

describe('writeFiltersToSearchParams', () => {
  it('writes every active filter and preserves unrelated params', () => {
    const next = writeFiltersToSearchParams(
      new URLSearchParams('page=2&planId=basic'),
      { status: 'active', planId: 'pro', range: 'last30Days' },
    );

    expect(next.get('page')).toBe('2');
    expect(next.get('status')).toBe('active');
    expect(next.get('planId')).toBe('pro');
    expect(next.get('range')).toBe('last30Days');
    expect(next.has('filters')).toBe(false);
  });

  it('removes omitted filters', () => {
    const next = writeFiltersToSearchParams(
      new URLSearchParams('status=active&planId=pro&range=last30Days'),
      { planId: 'pro' },
    );

    expect(next.has('status')).toBe(false);
    expect(next.has('range')).toBe(false);
    expect(next.get('planId')).toBe('pro');
  });

  it('marks an empty filter set with filters=none', () => {
    const next = writeFiltersToSearchParams(
      new URLSearchParams('status=active&planId=pro'),
      {},
    );

    expect(next.toString()).toBe('filters=none');
  });
});

describe('activeFiltersFor', () => {
  const plans = [
    { planId: 'basic', planName: 'Basic' },
    { planId: 'pro', planName: 'Pro' },
  ];

  it('builds readable chips for every active filter', () => {
    expect(
      activeFiltersFor({ status: 'active', planId: 'pro', range: 'last30Days' }, plans),
    ).toEqual([
      { id: 'status', label: 'Status: Active' },
      { id: 'planId', label: 'Plan: Pro' },
      { id: 'range', label: 'Date: Last 30 Days' },
    ]);
  });

  it('falls back to the raw plan id for unknown plans', () => {
    expect(activeFiltersFor({ planId: 'unknown' }, plans)).toEqual([
      { id: 'planId', label: 'Plan: unknown' },
    ]);
  });

  it('returns no chips when no filters are active', () => {
    expect(activeFiltersFor({}, plans)).toEqual([]);
  });
});
