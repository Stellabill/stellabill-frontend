import { describe, it, expect } from 'vitest';
import { GLOSSARY, getTerm, DOCS_BASE_URL } from './glossary';

describe('glossary', () => {
  it('contains at least 10 billing terms', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(10);
  });

  it('every term has a non-empty id, name, definition, example, link, and keywords', () => {
    for (const term of GLOSSARY) {
      expect(term.id.trim()).not.toBe('');
      expect(term.term.trim()).not.toBe('');
      expect(term.definition.trim()).not.toBe('');
      expect(term.example.trim()).not.toBe('');
      expect(term.learnMoreUrl).toMatch(/^https:\/\/.+/);
      expect(term.keywords.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = GLOSSARY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers the billing terms called out in the issue (MRR, proration, dunning)', () => {
    for (const key of ['mrr', 'proration', 'dunning']) {
      expect(getTerm(key), `missing glossary term: ${key}`).toBeDefined();
    }
  });

  it('learn more links are rooted at the docs base URL', () => {
    for (const term of GLOSSARY) {
      expect(term.learnMoreUrl.startsWith(DOCS_BASE_URL)).toBe(true);
    }
  });

  it('getTerm returns undefined for unknown ids', () => {
    expect(getTerm('does-not-exist')).toBeUndefined();
  });
});
