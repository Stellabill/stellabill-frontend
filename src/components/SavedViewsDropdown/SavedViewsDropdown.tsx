import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from 'react';
import {
  ChevronDown,
  Star,
  Pin,
  Link,
  Pencil,
  Trash2,
  Check,
  MoreHorizontal,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import type { SavedView, ViewFilters } from '@/types/savedViews';
import './SavedViewsDropdown.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SavedViewsDropdownProps {
  views: SavedView[];
  pinnedViews: SavedView[];
  recentViews: SavedView[];
  activeView: SavedView | null;
  isUnsaved: boolean;
  currentFilters: ViewFilters;
  onApplyView: (id: string) => void;
  onSaveNew: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onClearDefault: () => void;
  onTogglePin: (id: string) => void;
  onShare: (id: string) => void;
  onUpdateCurrent: () => void;
  MAX_VIEWS: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SavedViewsDropdown({
  views,
  pinnedViews,
  recentViews,
  activeView,
  isUnsaved,
  onApplyView,
  onSaveNew,
  onRename,
  onDelete,
  onSetDefault,
  onClearDefault,
  onTogglePin,
  onShare,
  onUpdateCurrent,
  MAX_VIEWS,
}: SavedViewsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const triggerId = useId();
  const panelId = useId();

  // All displayed view rows (pinned first, then recent)
  const displayedViews = [
    ...pinnedViews,
    ...recentViews.filter((v) => !pinnedViews.some((p) => p.id === v.id)),
  ];

  const hasMoreViews = views.length > displayedViews.length;
  const atMax = views.length >= MAX_VIEWS;

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setOpenActionMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // ── Escape closes dropdown ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (openActionMenuId !== null) {
          setOpenActionMenuId(null);
        } else {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, openActionMenuId]);

  // ── Focus first item when opened ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setFocusedRowIndex(-1);
    }
  }, [isOpen]);

  // ── Announce view applied ────────────────────────────────────────────────
  const announce = useCallback((msg: string) => {
    setAnnouncement('');
    // Small delay so screen readers pick up the change
    setTimeout(() => setAnnouncement(msg), 50);
  }, []);

  // ── Keyboard navigation on rows ──────────────────────────────────────────
  function handleRowKeyDown(e: React.KeyboardEvent, index: number, viewId: string) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedRowIndex(Math.min(index + 1, displayedViews.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedRowIndex(Math.max(index - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleApplyView(viewId);
    }
  }

  // Focus the row by index
  useEffect(() => {
    if (focusedRowIndex < 0 || !panelRef.current) return;
    const rows = panelRef.current.querySelectorAll<HTMLElement>('[data-view-row]');
    rows[focusedRowIndex]?.focus();
  }, [focusedRowIndex]);

  // ── Actions ──────────────────────────────────────────────────────────────

  function handleToggle() {
    setIsOpen((prev) => !prev);
    setOpenActionMenuId(null);
  }

  function handleApplyView(id: string) {
    const view = views.find((v) => v.id === id) ?? displayedViews.find((v) => v.id === id);
    onApplyView(id);
    setIsOpen(false);
    if (view) announce(`View applied: ${view.name}`);
  }

  function handleActionMenuToggle(e: React.MouseEvent, viewId: string) {
    e.stopPropagation();
    setOpenActionMenuId((prev) => (prev === viewId ? null : viewId));
  }

  function handleRename(id: string) {
    onRename(id);
    setOpenActionMenuId(null);
    setIsOpen(false);
  }

  function handleDelete(id: string) {
    onDelete(id);
    setOpenActionMenuId(null);
    // Keep panel open so user can continue
  }

  function handleSetDefault(view: SavedView) {
    if (view.isDefault) {
      onClearDefault();
    } else {
      onSetDefault(view.id);
    }
    setOpenActionMenuId(null);
  }

  function handleTogglePin(id: string) {
    onTogglePin(id);
    setOpenActionMenuId(null);
  }

  function handleShare(id: string) {
    onShare(id);
    setOpenActionMenuId(null);
    setIsOpen(false);
  }

  function handleUpdateCurrent() {
    onUpdateCurrent();
    setIsOpen(false);
  }

  function handleSaveNew() {
    onSaveNew();
    setIsOpen(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const triggerLabel = activeView ? activeView.name : 'All subscriptions';

  return (
    <div className="svd">
      {/* Live region for announcements */}
      <div
        ref={liveRegionRef}
        className="svd__live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={`svd__trigger${isUnsaved ? ' svd__trigger--unsaved' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
      >
        {isUnsaved ? (
          <BookmarkCheck size={15} aria-hidden="true" />
        ) : (
          <Bookmark size={15} aria-hidden="true" />
        )}
        <span className="svd__trigger-label">{triggerLabel}</span>
        {isUnsaved && (
          <span className="svd__unsaved-badge" aria-label="Unsaved changes">
            Unsaved
          </span>
        )}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`svd__chevron${isOpen ? ' svd__chevron--open' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-labelledby={triggerId}
          className="svd__panel"
        >
          {/* ── Unsaved changes banner ── */}
          {isUnsaved && activeView && (
            <div className="svd__unsaved-bar" role="none">
              <span className="svd__unsaved-bar-label">Unsaved changes</span>
              <div className="svd__unsaved-bar-actions">
                <button
                  type="button"
                  className="svd__unsaved-action"
                  onClick={handleUpdateCurrent}
                  aria-label={`Save changes to view ${activeView.name}`}
                >
                  <Check size={13} aria-hidden="true" />
                  Save changes
                </button>
                <button
                  type="button"
                  className="svd__unsaved-action svd__unsaved-action--secondary"
                  onClick={handleSaveNew}
                  aria-label="Save as a new view"
                >
                  Save as new
                </button>
              </div>
            </div>
          )}

          {isUnsaved && !activeView && (
            <div className="svd__unsaved-bar" role="none">
              <span className="svd__unsaved-bar-label">Current view is unsaved</span>
              <button
                type="button"
                className="svd__unsaved-action"
                onClick={handleSaveNew}
                aria-label="Save as a new view"
              >
                <Bookmark size={13} aria-hidden="true" />
                Save as new view
              </button>
            </div>
          )}

          {/* ── Pinned section ── */}
          {pinnedViews.length > 0 && (
            <div className="svd__section" role="none">
              <div className="svd__section-label" role="presentation">
                <Pin size={11} aria-hidden="true" />
                Pinned
              </div>
              {pinnedViews.map((view, index) => (
                <ViewRow
                  key={view.id}
                  view={view}
                  index={index}
                  isActive={activeView?.id === view.id}
                  isActionOpen={openActionMenuId === view.id}
                  onApply={() => handleApplyView(view.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, index, view.id)}
                  onActionToggle={(e) => handleActionMenuToggle(e, view.id)}
                  onRename={() => handleRename(view.id)}
                  onDelete={() => handleDelete(view.id)}
                  onSetDefault={() => handleSetDefault(view)}
                  onTogglePin={() => handleTogglePin(view.id)}
                  onShare={() => handleShare(view.id)}
                  onCloseActionMenu={() => setOpenActionMenuId(null)}
                />
              ))}
            </div>
          )}

          {/* ── Recent section ── */}
          {recentViews.length > 0 && (
            <div className="svd__section" role="none">
              {pinnedViews.length > 0 && (
                <div className="svd__section-label" role="presentation">
                  Recent
                </div>
              )}
              {recentViews.map((view, index) => {
                const rowIndex = pinnedViews.length + index;
                return (
                  <ViewRow
                    key={view.id}
                    view={view}
                    index={rowIndex}
                    isActive={activeView?.id === view.id}
                    isActionOpen={openActionMenuId === view.id}
                    onApply={() => handleApplyView(view.id)}
                    onKeyDown={(e) => handleRowKeyDown(e, rowIndex, view.id)}
                    onActionToggle={(e) => handleActionMenuToggle(e, view.id)}
                    onRename={() => handleRename(view.id)}
                    onDelete={() => handleDelete(view.id)}
                    onSetDefault={() => handleSetDefault(view)}
                    onTogglePin={() => handleTogglePin(view.id)}
                    onShare={() => handleShare(view.id)}
                    onCloseActionMenu={() => setOpenActionMenuId(null)}
                  />
                );
              })}
            </div>
          )}

          {/* ── Empty state ── */}
          {views.length === 0 && (
            <div className="svd__empty" role="none">
              No saved views yet
            </div>
          )}

          {/* ── See all link ── */}
          {hasMoreViews && (
            <>
              <div className="svd__divider" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="svd__see-all"
                onClick={() => {
                  /* future: open full views manager */
                }}
                aria-label={`See all ${views.length} saved views`}
              >
                See all views ({views.length})
              </button>
            </>
          )}

          {/* ── Footer actions ── */}
          <div className="svd__divider" role="separator" />
          <div className="svd__footer" role="none">
            <button
              type="button"
              role="menuitem"
              className="svd__save-btn"
              onClick={handleSaveNew}
              disabled={atMax}
              aria-label={
                atMax
                  ? `Cannot save — maximum of ${MAX_VIEWS} views reached`
                  : 'Save current view'
              }
            >
              <Bookmark size={14} aria-hidden="true" />
              {atMax ? `Max ${MAX_VIEWS} views reached` : 'Save current view'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ViewRow sub-component ────────────────────────────────────────────────────

interface ViewRowProps {
  view: SavedView;
  index: number;
  isActive: boolean;
  isActionOpen: boolean;
  onApply: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onActionToggle: (e: React.MouseEvent) => void;
  onRename: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onTogglePin: () => void;
  onShare: () => void;
  onCloseActionMenu: () => void;
}

function ViewRow({
  view,
  isActive,
  isActionOpen,
  onApply,
  onKeyDown,
  onActionToggle,
  onRename,
  onDelete,
  onSetDefault,
  onTogglePin,
  onShare,
  onCloseActionMenu,
}: ViewRowProps) {
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Close action menu on outside click
  useEffect(() => {
    if (!isActionOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        onCloseActionMenu();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isActionOpen, onCloseActionMenu]);

  return (
    <div
      role="menuitem"
      tabIndex={0}
      data-view-row
      className={`svd__row${isActive ? ' svd__row--active' : ''}`}
      onKeyDown={onKeyDown}
      aria-label={`${view.name}${view.isDefault ? ', default view' : ''}${view.isPinned ? ', pinned' : ''}`}
    >
      {/* Name (clickable area) */}
      <button
        type="button"
        className="svd__row-name"
        tabIndex={-1}
        onClick={onApply}
        aria-label={`Apply view: ${view.name}`}
      >
        {isActive && <Check size={12} className="svd__active-check" aria-hidden="true" />}
        {view.name}
      </button>

      {/* Indicators */}
      <div className="svd__row-indicators" aria-hidden="true">
        {view.isDefault && (
          <Star size={12} className="svd__default-icon" fill="currentColor" aria-hidden="true" />
        )}
        {view.isPinned && (
          <Pin size={12} className="svd__pin-icon" aria-hidden="true" />
        )}
      </div>

      {/* Three-dot menu */}
      <div className="svd__row-actions">
        <button
          ref={moreButtonRef}
          type="button"
          className="svd__more-btn"
          tabIndex={-1}
          aria-label={`More options for view ${view.name}`}
          aria-haspopup="menu"
          aria-expanded={isActionOpen}
          onClick={onActionToggle}
        >
          <MoreHorizontal size={14} aria-hidden="true" />
        </button>

        {isActionOpen && (
          <div
            ref={actionMenuRef}
            role="menu"
            aria-label={`Options for ${view.name}`}
            className="svd__action-menu"
          >
            <button
              type="button"
              role="menuitem"
              className="svd__action-item"
              onClick={onRename}
              aria-label={`Rename view: ${view.name}`}
            >
              <Pencil size={13} aria-hidden="true" />
              Rename
            </button>

            <button
              type="button"
              role="menuitem"
              className="svd__action-item"
              onClick={onSetDefault}
              aria-label={view.isDefault ? `Remove default: ${view.name}` : `Set as default: ${view.name}`}
            >
              <Star
                size={13}
                aria-hidden="true"
                fill={view.isDefault ? 'currentColor' : 'none'}
              />
              {view.isDefault ? 'Remove default' : 'Set as default'}
            </button>

            <button
              type="button"
              role="menuitem"
              className="svd__action-item"
              onClick={onTogglePin}
              aria-label={view.isPinned ? `Unpin view: ${view.name}` : `Pin view: ${view.name}`}
            >
              <Pin size={13} aria-hidden="true" />
              {view.isPinned ? 'Unpin' : 'Pin'}
            </button>

            <button
              type="button"
              role="menuitem"
              className="svd__action-item"
              onClick={onShare}
              aria-label={`Share URL for view: ${view.name}`}
            >
              <Link size={13} aria-hidden="true" />
              Share URL
            </button>

            <div className="svd__action-divider" role="separator" />

            <button
              type="button"
              role="menuitem"
              className="svd__action-item svd__action-item--danger"
              onClick={onDelete}
              aria-label={`Delete view: ${view.name}`}
            >
              <Trash2 size={13} aria-hidden="true" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedViewsDropdown;
