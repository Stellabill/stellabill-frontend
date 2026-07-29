/**
 * ChangelogPanel — "What's new" side panel with grouped entries, area filter
 * chips, unread indicator, and subscribe-to-email footer (Issue #390).
 *
 * Features:
 * - Grouped by date with area chips (Billing, UI, API, Security, etc.)
 * - Unread indicator persisted in localStorage, resets on panel close
 * - Filter by area chip
 * - Focus trap and Escape dismiss
 * - Slide-in animation with prefers-reduced-motion support
 * - RTL-aware layout
 * - Subscribe-to-email footer link
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { X, Sparkles, Mail } from 'lucide-react';
import './ChangelogPanel.css';

/* ─── Types ────────────────────────────────────────────────────────── */

export type ChangelogArea = 'billing' | 'ui' | 'api' | 'security' | 'performance' | 'general';

export interface ChangelogEntry {
  id: string;
  date: string;       // ISO date string (YYYY-MM-DD)
  title: string;
  description: string;
  area: ChangelogArea;
}

interface ChangelogPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ─── Data ─────────────────────────────────────────────────────────── */

const ALL_AREAS: ChangelogArea[] = ['billing', 'ui', 'api', 'security', 'performance', 'general'];

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: 'cl-001',
    date: '2026-07-29',
    title: 'Usage anomaly alerts',
    description: 'New panel highlights day-over-day and week-over-week usage spikes with severity dots and delta chips.',
    area: 'ui',
  },
  {
    id: 'cl-002',
    date: '2026-07-29',
    title: 'Per-plan rate limit tracking',
    description: 'Each plan now shows current usage vs. rate-limit capacity at a glance in the subscription detail view.',
    area: 'billing',
  },
  {
    id: 'cl-003',
    date: '2026-07-22',
    title: 'API key rotation endpoint',
    description: 'POST /api-keys/:id/rotate expires the current key and returns a new one in a single atomic operation.',
    area: 'api',
  },
  {
    id: 'cl-004',
    date: '2026-07-22',
    title: 'Session expiry hardening',
    description: 'Idle sessions are now terminated after 30 minutes. Active sessions are re-verified every 15 minutes.',
    area: 'security',
  },
  {
    id: 'cl-005',
    date: '2026-07-15',
    title: 'Command palette pinned commands',
    description: 'Pin frequently used commands to the top of the palette. Pins sync across tabs via localStorage.',
    area: 'ui',
  },
  {
    id: 'cl-006',
    date: '2026-07-15',
    title: 'Dashboard load time -40%',
    description: 'Optimised aggregate queries and added edge caching for dashboard metrics. Full-page TTFB reduced from 1.8 s to 1.1 s.',
    area: 'performance',
  },
  {
    id: 'cl-007',
    date: '2026-07-08',
    title: 'Subscription pause flow',
    description: 'Subscribers can pause billing for 7, 14, or 30 days. Paused subscriptions retain their plan slot and data.',
    area: 'billing',
  },
  {
    id: 'cl-008',
    date: '2026-07-01',
    title: 'Help sidebar launched',
    description: 'Search and browse help articles directly from the sidebar. Access via Shift+? or the Help & support button.',
    area: 'general',
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────── */

const UNREAD_STORAGE_KEY = 'sb:changelog-unread';

function readUnreadIds(): string[] {
  try {
    const raw = localStorage.getItem(UNREAD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : CHANGELOG_ENTRIES.map((e) => e.id);
  } catch {
    return CHANGELOG_ENTRIES.map((e) => e.id);
  }
}

function persistUnreadIds(ids: string[]) {
  try {
    if (ids.length === 0) {
      localStorage.removeItem(UNREAD_STORAGE_KEY);
    } else {
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // storage unavailable
  }
}

function groupByDate(entries: ChangelogEntry[]): Map<string, ChangelogEntry[]> {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.date) ?? [];
    existing.push(entry);
    groups.set(entry.date, existing);
  }
  return groups;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const AREA_LABELS: Record<ChangelogArea, string> = {
  billing: 'Billing',
  ui: 'UI',
  api: 'API',
  security: 'Security',
  performance: 'Performance',
  general: 'General',
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function ChangelogPanel({ isOpen, onOpenChange }: ChangelogPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeArea, setActiveArea] = useState<ChangelogArea | null>(null);
  const [unreadIds, setUnreadIds] = useState<string[]>(() => readUnreadIds());

  // Focus trap: focus the panel when it opens
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  // Escape dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [isOpen, onOpenChange]);

  // Mark all as read when panel closes
  useEffect(() => {
    if (!isOpen && unreadIds.length > 0) {
      persistUnreadIds([]);
      setUnreadIds([]);
    }
    // Only run on close
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filteredEntries = useMemo(() => {
    if (!activeArea) return CHANGELOG_ENTRIES;
    return CHANGELOG_ENTRIES.filter((e) => e.area === activeArea);
  }, [activeArea]);

  const groupedEntries = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);
  const sortedDates = useMemo(
    () => Array.from(groupedEntries.keys()).sort((a, b) => b.localeCompare(a)),
    [groupedEntries]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="changelog-overlay"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="changelog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="changelog-header">
          <h2 id={titleId} className="changelog-header__title">
            <Sparkles size={18} aria-hidden="true" />
            What's new
            {unreadIds.length > 0 && (
              <span className="changelog-header__unread-badge" aria-label={`${unreadIds.length} unread updates`}>
                {unreadIds.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            className="changelog-close-btn"
            onClick={() => onOpenChange(false)}
            aria-label="Close what's new panel"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Area filter chips */}
        <div className="changelog-filters" role="group" aria-label="Filter by area">
          <button
            type="button"
            className={`changelog-filter-chip${!activeArea ? ' changelog-filter-chip--active' : ''}`}
            onClick={() => setActiveArea(null)}
            aria-pressed={!activeArea}
          >
            All
          </button>
          {ALL_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              className={`changelog-filter-chip${activeArea === area ? ' changelog-filter-chip--active' : ''}`}
              onClick={() => setActiveArea(area)}
              aria-pressed={activeArea === area}
            >
              {AREA_LABELS[area]}
            </button>
          ))}
        </div>

    
