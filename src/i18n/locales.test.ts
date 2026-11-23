import { describe, expect, it } from 'vitest';
import en from '../locales/en.json';

type Catalogue = { [key: string]: string | Catalogue };

function leaves(catalogue: Catalogue, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(catalogue).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? [[path, value]]
      : Object.entries(leaves(value, path));
  }));
}

// Discover new bundles automatically: adding a locale cannot bypass this check.
const catalogues = import.meta.glob<Catalogue>('../locales/*.json', {
  eager: true,
  import: 'default',
});

describe('locale catalogue parity', () => {
  const englishKeys = Object.keys(leaves(en)).sort();

  it.each(Object.entries(catalogues))('%s has every English key and no stale keys', (_path, catalogue) => {
    expect(Object.keys(leaves(catalogue)).sort()).toEqual(englishKeys);
  });

  it.each(Object.entries(catalogues))('%s has no empty translations', (_path, catalogue) => {
    expect(Object.entries(leaves(catalogue)).filter(([, value]) => !value.trim())).toEqual([]);
  });
});
