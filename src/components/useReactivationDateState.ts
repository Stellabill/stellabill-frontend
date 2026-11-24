import { useEffect, useState } from 'react';
import type { StartDateMode } from './reactivationDateHelpers';

export function useReactivationDateState(isOpen: boolean) {
  const [mode, setMode] = useState<StartDateMode>('today');
  const [customDate, setCustomDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('today');
      setCustomDate(null);
    }
  }, [isOpen]);

  return {
    mode,
    setMode,
    customDate,
    setCustomDate,
  };
}
