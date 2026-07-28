import { useCallback, useEffect, useState } from 'react';

export type Density = 'compact' | 'comfortable' | 'spacious';
const STORAGE_KEY = 'stellabill-density-preference';
const DEFAULT_DENSITY: Density = 'comfortable';

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getStoredDensity(): Density {
  if (!canUseDOM()) return DEFAULT_DENSITY;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'compact' || stored === 'comfortable' || stored === 'spacious') {
      return stored;
    }
  } catch {
    // Ignore storage failures (private mode, disabled storage, etc.)
  }
  return DEFAULT_DENSITY;
}

function persistDensity(density: Density) {
  if (!canUseDOM()) return;

  try {
    if (density === DEFAULT_DENSITY) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, density);
    }
  } catch {
    // Ignore storage failures
  }
}

function applyDensity(density: Density) {
  if (!canUseDOM()) return;
  document.documentElement.dataset.density = density;
}

export function initializeDensity() {
  const density = getStoredDensity();
  applyDensity(density);
}

export function useDensity() {
  const [density, setDensityState] = useState<Density>(() => getStoredDensity());

  useEffect(() => {
    applyDensity(density);
    persistDensity(density);
  }, [density]);

  const setDensity = useCallback((next: Density) => {
    setDensityState(next);
  }, []);

  const resetDensity = useCallback(() => {
    setDensityState(DEFAULT_DENSITY);
  }, []);

  return {
    density,
    setDensity,
    resetDensity,
    isDefault: density === DEFAULT_DENSITY,
  };
}
