/**
 * Static command definitions for the command palette.
 *
 * Each entry is a plain object — no React imports, no navigate call.
 * Layout passes its guardedNavigate function so each `perform` callback
 * goes through the UnsavedChangesGuard before navigating.
 */
import type { CommandItem } from '../CommandPalette';

type GuardedNavigate = (to: string) => void;

interface CommandDef {
  id: string;
  label: string;
  group: 'Pages' | 'Actions';
  hint?: string;
  keywords?: string;
  buildPerform: (guardedNavigate: GuardedNavigate) => () => void;
}

export const COMMAND_DEFS: CommandDef[] = [
  // ── Pages ────────────────────────────────────────────────────────────
  {
    id: 'page-dashboard',
    label: 'Dashboard',
    group: 'Pages',
    keywords: 'home overview',
    buildPerform: (nav) => () => nav('/dashboard'),
  },
  {
    id: 'page-subscriptions',
    label: 'Subscriptions',
    group: 'Pages',
    keywords: 'subscribers customers',
    buildPerform: (nav) => () => nav('/subscriptions'),
  },
  {
    id: 'page-plans',
    label: 'Plans',
    group: 'Pages',
    keywords: 'pricing billing',
    buildPerform: (nav) => () => nav('/plans'),
  },
  {
    id: 'page-browse-plans',
    label: 'Browse Plans',
    group: 'Pages',
    keywords: 'catalog explore',
    buildPerform: (nav) => () => nav('/browse-plans'),
  },
  {
    id: 'page-wallet',
    label: 'Wallet',
    group: 'Pages',
    keywords: 'transactions history stellar',
    buildPerform: (nav) => () => nav('/wallet'),
  },
  {
    id: 'page-settings',
    label: 'Settings',
    group: 'Pages',
    keywords: 'preferences account',
    buildPerform: (nav) => () => nav('/settings'),
  },
  {
    id: 'page-brand',
    label: 'Brand',
    group: 'Pages',
    keywords: 'design tokens',
    buildPerform: (nav) => () => nav('/brand'),
  },
  {
    id: 'page-design-tokens',
    label: 'Design Tokens',
    group: 'Pages',
    keywords: 'css variables colors spacing typography motion',
    buildPerform: (nav) => () => nav('/design-tokens'),
  },

  // ── Actions ──────────────────────────────────────────────────────────
  {
    id: 'action-create-plan',
    label: 'Create plan',
    group: 'Actions',
    hint: 'Start a new billing plan',
    keywords: 'add new plan',
    buildPerform: (nav) => () => nav('/plans/create'),
  },
  {
    id: 'action-refund',
    label: 'Issue refund',
    group: 'Actions',
    hint: 'Refund a subscription payment',
    keywords: 'money back return reverse',
    buildPerform: (nav) => () => nav('/subscriptions'),
  },
  {
    id: 'action-pause',
    label: 'Pause subscription',
    group: 'Actions',
    hint: 'Temporarily stop billing',
    keywords: 'hold suspend freeze',
    buildPerform: (nav) => () => nav('/subscriptions'),
  },
  {
    id: 'action-tour',
    label: 'Start product tour',
    group: 'Actions',
    hint: 'Take a guided tour of the dashboard',
    keywords: 'help guide tutorial onboarding walkthrough',
    buildPerform: () => () => {
      localStorage.removeItem('sb:tour-completed');
      localStorage.removeItem('sb:tour-dismissed');
      window.location.reload();
    },
  },
];

/**
 * Build the full command catalog with live `perform` callbacks.
 * Call inside a `useMemo` keyed on `guardedNavigate`.
 */
export function buildCatalog(guardedNavigate: GuardedNavigate): CommandItem[] {
  return COMMAND_DEFS.map(({ buildPerform, ...rest }) => ({
    ...rest,
    group: rest.group as CommandItem['group'],
    perform: buildPerform(guardedNavigate),
  }));
}
