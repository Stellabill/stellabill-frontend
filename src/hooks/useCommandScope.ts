import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { CommandItem } from '../components/CommandPalette';

export type LayoutContextType = {
  registerScope: (name: string, items: CommandItem[]) => void;
  clearScope: () => void;
};

export function useCommandScope(name: string, items: CommandItem[]) {
  const context = useOutletContext<LayoutContextType>();

  useEffect(() => {
    if (context && context.registerScope) {
      context.registerScope(name, items);
      return () => {
        context.clearScope();
      };
    }
  }, [name, items, context]);
}
