import { describe, it, expect } from 'vitest';
import {
  helpArticles,
  routeHelpContexts,
  findRouteContext,
  getTopArticles,
  searchArticles,
  SUPPORT_URL,
  SUPPORT_HOURS,
} from './helpData';

describe('helpData', () => {
  describe('data integrity', () => {
    it('has unique ids for all helpArticles', () => {
      const ids = helpArticles.map((article) => article.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('resolves every topAnswerIds entry in routeHelpContexts to an existing helpArticles id', () => {
      const articleIds = new Set(helpArticles.map((article) => article.id));

      for (const context of routeHelpContexts) {
        expect(context.topAnswerIds.length).toBeGreaterThan(0);
        for (const answerId of context.topAnswerIds) {
          expect(articleIds.has(answerId)).toBe(true);
        }
      }
    });

    it('exports non-empty support metadata', () => {
      expect(SUPPORT_URL).toMatch(/^https?:\/\//);
      expect(SUPPORT_HOURS.trim().length).toBeGreaterThan(0);
    });
  });

  describe('findRouteContext', () => {
    it('matches an exact static route path', () => {
      const ctx = findRouteContext('/dashboard');

      expect(ctx).toBeDefined();
      expect(ctx?.routePattern).toBe('/dashboard');
      expect(ctx?.pageTitle).toBe('Dashboard');
    });

    it('matches a route path containing a :param segment', () => {
      const detailCtx = findRouteContext('/subscriptions/sub_123');
      expect(detailCtx).toBeDefined();
      expect(detailCtx?.routePattern).toBe('/subscriptions/:id');
      expect(detailCtx?.pageTitle).toBe('Subscription detail');

      const usageCtx = findRouteContext('/subscriptions/sub_456/usage');
      expect(usageCtx).toBeDefined();
      expect(usageCtx?.routePattern).toBe('/subscriptions/:id/usage');
      expect(usageCtx?.pageTitle).toBe('Usage billing');
    });

    it('returns undefined for paths with different segment counts', () => {
      expect(findRouteContext('/dashboard/extra')).toBeUndefined();
      expect(findRouteContext('/subscriptions/sub_123/usage/extra')).toBeUndefined();
      expect(findRouteContext('/')).toBeUndefined();
    });

    it('returns undefined for unknown routes with matching segment counts', () => {
      expect(findRouteContext('/unknown')).toBeUndefined();
      expect(findRouteContext('/subscriptions/sub_123/invoices')).toBeUndefined();
    });
  });

  describe('getTopArticles', () => {
    it('returns the articles named in topAnswerIds in order for a matched route', () => {
      const ctx = findRouteContext('/dashboard');
      const articles = getTopArticles('/dashboard');

      expect(ctx).toBeDefined();
      expect(articles.map((a) => a.id)).toEqual(ctx?.topAnswerIds);
    });

    it('returns the articles named in topAnswerIds for a parameterized route', () => {
      const ctx = findRouteContext('/subscriptions/sub_789');
      const articles = getTopArticles('/subscriptions/sub_789');

      expect(ctx).toBeDefined();
      expect(articles.map((a) => a.id)).toEqual(ctx?.topAnswerIds);
    });

    it('returns an empty array for unknown routes', () => {
      expect(getTopArticles('/non-existent-route')).toEqual([]);
      expect(getTopArticles('/dashboard/nested/unknown')).toEqual([]);
    });
  });

  describe('searchArticles', () => {
    it('returns an empty array for blank or whitespace-only queries', () => {
      expect(searchArticles('')).toEqual([]);
      expect(searchArticles('   ')).toEqual([]);
      expect(searchArticles('\t\n  ')).toEqual([]);
    });

    it('matches against article title', () => {
      const results = searchArticles('Welcome to Stellabill');

      expect(results.map((a) => a.id)).toEqual(['gs-welcome']);
    });

    it('matches against article content', () => {
      const results = searchArticles('WCAG 2.1 AA');

      expect(results.map((a) => a.id)).toEqual(['tr-accessibility']);
    });

    it('matches against article category', () => {
      const results = searchArticles('Troubleshooting');
      const troubleshootingIds = helpArticles
        .filter((a) => a.category === 'Troubleshooting')
        .map((a) => a.id);

      expect(results.map((a) => a.id)).toEqual(troubleshootingIds);
    });

    it('matches against article keywords', () => {
      const results = searchArticles('a11y');

      expect(results.map((a) => a.id)).toEqual(['tr-accessibility']);
    });

    it('is case-insensitive and trims leading/trailing whitespace', () => {
      const lower = searchArticles('a11y');
      const upperPadded = searchArticles('  A11Y \t\n');

      expect(upperPadded).toEqual(lower);
      expect(upperPadded.map((a) => a.id)).toEqual(['tr-accessibility']);
    });

    it('returns an empty array when no article matches', () => {
      expect(searchArticles('zzzz-no-such-term-12345')).toEqual([]);
    });
  });
});
