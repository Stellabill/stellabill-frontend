import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type UnsavedChangesGuard = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  /**
   * Registers a handler that is invoked when a navigation attempt is blocked.
   * The handler should return `true` to allow the navigation or `false` to cancel it.
   */
  registerBlocker: (blocker: () => boolean | Promise<boolean>) => () => void;
  /**
   * Attempts to run the registered blocker. Returns `true` if navigation may proceed.
   */
  confirmNavigation: () => Promise<boolean>;
};

const UnsavedChangesContext = createContext<UnsavedChangesGuard | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setDirtyState] = useState(false);
  const blockerRef = useRef<(() => boolean | Promise<boolean>) | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    setDirtyState(dirty);
  }, []);

  const registerBlocker = useCallback(
    (blocker: () => boolean | Promise<boolean>) => {
      blockerRef.current = blocker;
      return () => {
        if (blockerRef.current === blocker) {
          blockerRef.current = null;
        }
      };
    },
    [],
  );

  const confirmNavigation = useCallback(async () => {
    if (!blockerRef.current) {
      return true;
    }
    return Boolean(await blockerRef.current());
  }, []);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers require returnValue to be set.
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const value = useMemo<UnsavedChangesGuard>(
    () => ({ isDirty, setDirty, registerBlocker, confirmNavigation }),
    [isDirty, setDirty, registerBlocker, confirmNavigation],
  );

  return createElement(UnsavedChangesContext.Provider, { value }, children);
}

export function useUnsavedChangesGuard(): UnsavedChangesGuard {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error('useUnsavedChangesGuard must be used within an UnsavedChangesProvider');
  }
  return ctx;
}
