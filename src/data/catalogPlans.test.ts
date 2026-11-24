import { describe, it, expect } from 'vitest';
import { catalogPlans, findCatalogPlan } from './catalogPlans';

describe('catalogPlans', () => {
  it('has unique plan ids', () => {
    const ids = catalogPlans.map((plan) => plan.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a positive price and valid interval (Monthly or Yearly) for every plan', () => {
    expect(catalogPlans.length).toBeGreaterThan(0);
    for (const plan of catalogPlans) {
      expect(typeof plan.price).toBe('number');
      expect(Number.isFinite(plan.price)).toBe(true);
      expect(plan.price).toBeGreaterThan(0);
      expect(['Monthly', 'Yearly']).toContain(plan.interval);
    }
  });
});

describe('findCatalogPlan', () => {
  it("returns Premium Access for id '1'", () => {
    const plan = findCatalogPlan('1');
    expect(plan).toBeDefined();
    expect(plan?.name).toBe('Premium Access');
  });

  it('returns undefined for an unknown id', () => {
    expect(findCatalogPlan('non-existent-id')).toBeUndefined();
    expect(findCatalogPlan('')).toBeUndefined();
  });
});
