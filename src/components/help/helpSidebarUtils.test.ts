import { describe, it, expect } from 'vitest';
import { HelpArticle } from './helpData';
import {
  countArticlesInCategory,
  getArticlesByCategory,
  getHelpSubtitle,
  getRelatedArticles,
} from './helpSidebarUtils';

const sampleArticles: HelpArticle[] = [
  {
    id: 'a1',
    title: 'Billing 1',
    content: 'Content 1',
    keywords: ['billing'],
    category: 'Billing',
  },
  {
    id: 'a2',
    title: 'Billing 2',
    content: 'Content 2',
    keywords: ['billing'],
    category: 'Billing',
  },
  {
    id: 'a3',
    title: 'Billing 3',
    content: 'Content 3',
    keywords: ['billing'],
    category: 'Billing',
  },
  {
    id: 'a4',
    title: 'Billing 4',
    content: 'Content 4',
    keywords: ['billing'],
    category: 'Billing',
  },
  {
    id: 'a5',
    title: 'Settings 1',
    content: 'Content 5',
    keywords: ['settings'],
    category: 'Settings',
  },
];

describe('helpSidebarUtils', () => {
  describe('getArticlesByCategory', () => {
    it('returns empty array when category is null', () => {
      expect(getArticlesByCategory(sampleArticles, null)).toEqual([]);
    });

    it('filters articles matching the given category', () => {
      const result = getArticlesByCategory(sampleArticles, 'Settings');
      expect(result.map((a) => a.id)).toEqual(['a5']);
    });
  });

  describe('countArticlesInCategory', () => {
    it('counts articles in the given category', () => {
      expect(countArticlesInCategory(sampleArticles, 'Billing')).toBe(4);
      expect(countArticlesInCategory(sampleArticles, 'Plans')).toBe(0);
    });
  });

  describe('getRelatedArticles', () => {
    it('returns up to limit same-category articles excluding the active article', () => {
      const related = getRelatedArticles(sampleArticles, sampleArticles[0], 2);
      expect(related.map((a) => a.id)).toEqual(['a2', 'a3']);
    });

    it('defaults limit to 3', () => {
      const related = getRelatedArticles(sampleArticles, sampleArticles[0]);
      expect(related.map((a) => a.id)).toEqual(['a2', 'a3', 'a4']);
    });
  });

  describe('getHelpSubtitle', () => {
    it('returns route-specific subtitle when routeContext is provided', () => {
      expect(
        getHelpSubtitle({
          routePattern: '/dashboard',
          pageTitle: 'Dashboard',
          topAnswerIds: [],
        })
      ).toBe("You're on the Dashboard page — answers tailored for you.");
    });

    it('returns default subtitle when routeContext is null or undefined', () => {
      expect(getHelpSubtitle(null)).toBe('Search help articles or browse categories.');
    });
  });
});
