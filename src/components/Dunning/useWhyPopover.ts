/**
 * useWhyPopover
 * -------------
 * Manages the open/position state for the WhyPopover dialog.
 * Extracted into its own module so WhyPopover.tsx only exports a component,
 * satisfying the react-refresh/only-export-components lint rule.
 */
import { useCallback, useState } from 'react';

export interface UseWhyPopoverReturn {
  isOpen: boolean;
  positionBelow: boolean;
  setPositionBelow: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
  close: () => void;
}

export function useWhyPopover(): UseWhyPopoverReturn {
  const [isOpen, setIsOpen]               = useState(false);
  const [positionBelow, setPositionBelow] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close  = useCallback(() => setIsOpen(false), []);

  return { isOpen, positionBelow, setPositionBelow, toggle, close };
}
