/**
 * TokenDiffViewer
 *
 * Top-level component that lets users compare design-token palettes across
 * two releases.  Provides version selectors, filter tabs, search, a
 * copy-changelog action, and renders the diff row list.
 *
 * Accessibility: WCAG 2.1 AA — keyboard navigable, ARIA labels, focus rings.
 */

import { useState, useMemo, useCallback } from 'react';
import { TOKEN_VERSIONS, getVersion } from './tokenVersions';
import { computeTokenDiff, formatChangelog } from './diffEngine';
import type { DiffEntry } from './diffEngine';
import TokenDiffRow from './TokenDiffRow';
import './TokenDiffViewer.css';

type FilterType = 'all' | 'added' | 'removed' | 'changed';

export default function TokenDiffViewer() {
  /* ── State ──────────────────────────────── */
  const [fromId, setFromId] = useState(TOKEN_VERSIONS[0]?.id ?? '');
  const [toId, setToId] = useState(TOKEN_VERSIONS[TOKEN_VERSIONS.length - 1]?.id ?? '');
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  /* ── Derived ────────────────────────────── */
  const fromVersion = useMemo(() => getVersion(fromId), [fromId]);
  const toVersion = useMemo(() => getVersion(toId), [toId]);

  const diff = useMemo(
    () => computeTokenDiff(fromVersion, toVersion),
    [fromVersion, toVersion],
  );

  /** Entries visible after filter + search */
  const visibleEntries: DiffEntry[] = useMemo(() => {
    let entries: DiffEntry[];
    switch (filter) {
      case 'added':   entries = diff.added;     break;
      case 'removed': entries = diff.removed;   break;
      case 'changed': entries = diff.changed;   break;
      default:        entries = diff.all;        break;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      entries = entries.filter((e) => e.name.toLowerCase().includes(q));
    }
    return entries;
  }, [diff, filter, search]);

  /* ── Handlers ───────────────────────────── */
  const handleSwap = useCallback(() => {
    setFromId(toId);
    setToId(fromId);
  }, [fromId, toId]);

  const handleCopy = useCallback(async () => {
    if (!fromVersion || !toVersion) return;
    const md = formatChangelog(fromVersion.label, toVersion.label, diff);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fromVersion, toVersion, diff]);

  /* ── Empty states ───────────────────────── */
  const noVersionsSelected = !fromId || !toId;
  const sameVersion = fromId === toId;
  const noChanges = diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0;

  /* ── Render ─────────────────────────────── */
  return (
    <section className="token-diff-viewer" aria-label="Token Diff Viewer">
      {/* Header */}
      <header className="token-diff-viewer__header">
        <h1 className="token-diff-viewer__title">Token Diff Viewer</h1>
        <p className="token-diff-viewer__subtitle">
          Compare design tokens across releases — see what was added, removed, or changed.
        </p>
      </header>

      {/* Version selectors */}
      <div className="token-diff-selector" role="group" aria-label="Version selection">
        <div className="token-diff-selector__field">
          <label className="token-diff-selector__label" htmlFor="diff-from">
            From
          </label>
          <select
            id="diff-from"
            className="token-diff-selector__select"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            aria-label="Baseline version"
          >
            <option value="">Select version…</option>
            {TOKEN_VERSIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="token-diff-selector__swap"
          onClick={handleSwap}
          aria-label="Swap versions"
          title="Swap from and to"
          type="button"
        >
          ⇄
        </button>

        <div className="token-diff-selector__field">
          <label className="token-diff-selector__label" htmlFor="diff-to">
            To
          </label>
          <select
            id="diff-to"
            className="token-diff-selector__select"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            aria-label="Target version"
          >
            <option value="">Select version…</option>
            {TOKEN_VERSIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Early returns for empty states */}
      {noVersionsSelected && (
        <div className="token-diff-empty" role="status">
          <span className="token-diff-empty__icon" aria-hidden="true">📋</span>
          <h2 className="token-diff-empty__heading">Select Two Versions</h2>
          <p className="token-diff-empty__body">
            Choose a "From" and "To" version above to compare design tokens.
          </p>
        </div>
      )}

      {!noVersionsSelected && sameVersion && (
        <div className="token-diff-empty" role="status">
          <span className="token-diff-empty__icon" aria-hidden="true">🔄</span>
          <h2 className="token-diff-empty__heading">Same Version Selected</h2>
          <p className="token-diff-empty__body">
            Both selectors point to the same version. Select different versions to see changes.
          </p>
        </div>
      )}

      {!noVersionsSelected && !sameVersion && (
        <>
          {/* Summary stats */}
          <div className="token-diff-stats" role="group" aria-label="Change summary">
            <span className="token-diff-stats__pill token-diff-stats__pill--added">
              <span aria-hidden="true">+</span> {diff.added.length} added
            </span>
            <span className="token-diff-stats__pill token-diff-stats__pill--removed">
              <span aria-hidden="true">−</span> {diff.removed.length} removed
            </span>
            <span className="token-diff-stats__pill token-diff-stats__pill--changed">
              <span aria-hidden="true">↔</span> {diff.changed.length} changed
            </span>
            <span className="token-diff-stats__pill token-diff-stats__pill--unchanged">
              <span aria-hidden="true">=</span> {diff.unchanged.length} unchanged
            </span>
          </div>

          {/* Toolbar */}
          <div className="token-diff-toolbar">
            {/* Filter tabs */}
            <div className="token-diff-filters" role="tablist" aria-label="Filter tokens">
              {(['all', 'added', 'removed', 'changed'] as const).map((f) => {
                const count =
                  f === 'all' ? diff.all.length
                    : f === 'added' ? diff.added.length
                      : f === 'removed' ? diff.removed.length
                        : diff.changed.length;
                return (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={filter === f}
                    className={`token-diff-filters__btn${filter === f ? ' token-diff-filters__btn--active' : ''}`}
                    onClick={() => setFilter(f)}
                    type="button"
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className="token-diff-filters__badge" aria-label={`${count} tokens`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="token-diff-search">
              <span className="token-diff-search__icon" aria-hidden="true">🔍</span>
              <input
                type="search"
                className="token-diff-search__input"
                placeholder="Search tokens…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search tokens by name"
              />
            </div>

            {/* Copy changelog */}
            <button
              className={`token-diff-copy-btn${copied ? ' token-diff-copy-btn--copied' : ''}`}
              onClick={handleCopy}
              aria-label="Copy changelog to clipboard"
              type="button"
            >
              {copied ? '✓ Copied' : '📋 Copy Changelog'}
            </button>
          </div>

          {/* Diff list */}
          {noChanges && (
            <div className="token-diff-empty" role="status">
              <span className="token-diff-empty__icon" aria-hidden="true">✅</span>
              <h2 className="token-diff-empty__heading">No Changes</h2>
              <p className="token-diff-empty__body">
                All tokens are identical between these two versions.
              </p>
            </div>
          )}

          {!noChanges && visibleEntries.length === 0 && (
            <div className="token-diff-empty" role="status">
              <span className="token-diff-empty__icon" aria-hidden="true">🔍</span>
              <h2 className="token-diff-empty__heading">No Matching Tokens</h2>
              <p className="token-diff-empty__body">
                No tokens match your current filter or search. Try broadening your criteria.
              </p>
            </div>
          )}

          {visibleEntries.length > 0 && (
            <div className="token-diff-list" role="table" aria-label="Token differences">
              {visibleEntries.map((entry) => (
                <TokenDiffRow key={`${entry.type}-${entry.name}`} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
