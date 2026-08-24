/**
 * Tests for the SavedViewsDropdown component.
 *
 * react-router-dom is not installed as a project dependency; the component
 * itself does not import it directly, so no mock is required here.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedViewsDropdown } from './SavedViewsDropdown';
import type { SavedView, ViewFilters } from '@/types/savedViews';

// ─── Fixture factory ──────────────────────────────────────────────────────────

let _seq = 0;
function makeView(overrides: Partial<SavedView> = {}): SavedView {
  _seq++;
  const now = Date.now() + _seq * 100;
  return {
    id: `view-${_seq}`,
    name: `View ${_seq}`,
    filters: { statusFilter: 'All' },
    isDefault: false,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Default prop values ──────────────────────────────────────────────────────

const defaultFilters: ViewFilters = { statusFilter: 'All' };

function defaultProps(overrides: Partial<React.ComponentProps<typeof SavedViewsDropdown>> = {}) {
  return {
    views: [] as SavedView[],
    pinnedViews: [] as SavedView[],
    recentViews: [] as SavedView[],
    activeView: null,
    isUnsaved: false,
    currentFilters: defaultFilters,
    onApplyView: vi.fn(),
    onSaveNew: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onSetDefault: vi.fn(),
    onClearDefault: vi.fn(),
    onTogglePin: vi.fn(),
    onShare: vi.fn(),
    onUpdateCurrent: vi.fn(),
    MAX_VIEWS: 20,
    ...overrides,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderDropdown(props?: Partial<React.ComponentProps<typeof SavedViewsDropdown>>) {
  const finalProps = defaultProps(props);
  const result = render(<SavedViewsDropdown {...finalProps} />);
  return { ...result, props: finalProps };
}

async function openDropdown() {
  const trigger = screen.getByRole('button', { name: /all subscriptions|view/i });
  await userEvent.click(trigger);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _seq = 0;
  vi.clearAllMocks();
});

describe('SavedViewsDropdown', () => {

  // ── 1. Renders trigger button with 'All subscriptions' ─────────────────────

  it('renders the trigger button with "All subscriptions" when no active view', () => {
    renderDropdown();
    expect(screen.getByRole('button', { name: /all subscriptions/i })).toBeInTheDocument();
  });

  // ── 2. Renders active view name ────────────────────────────────────────────

  it('renders the active view name in the trigger when activeView is set', () => {
    const view = makeView({ name: 'My filter' });
    renderDropdown({ activeView: view, views: [view], recentViews: [view] });
    const trigger = screen.getByRole('button', { name: /my filter/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('My filter');
  });

  // ── 3. Shows Unsaved badge ─────────────────────────────────────────────────

  it('shows Unsaved badge when isUnsaved=true', () => {
    renderDropdown({ isUnsaved: true });
    // aria-label="Unsaved changes" on the badge span
    expect(screen.getByLabelText(/unsaved changes/i)).toBeInTheDocument();
  });

  // ── 4. Opens dropdown on trigger click ─────────────────────────────────────

  it('opens the dropdown panel when trigger is clicked', async () => {
    renderDropdown();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  // ── 5. Closes on Escape key ────────────────────────────────────────────────

  it('closes the dropdown on Escape key', async () => {
    renderDropdown();
    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  // ── 6. Closes on outside click ─────────────────────────────────────────────

  it('closes on outside click (mousedown on document.body)', async () => {
    renderDropdown();
    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  // ── 7. Shows Pinned section only when pinnedViews has items ────────────────

  it('shows Pinned section only when pinnedViews has items', async () => {
    // No pinned views
    renderDropdown({ views: [], pinnedViews: [], recentViews: [] });
    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);
    expect(screen.queryByText(/^pinned$/i)).not.toBeInTheDocument();
  });

  it('shows Pinned section when pinnedViews has items', async () => {
    const pinned = makeView({ isPinned: true, name: 'Pinned One' });
    renderDropdown({
      views: [pinned],
      pinnedViews: [pinned],
      recentViews: [],
    });
    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);
    expect(screen.getByText(/^pinned$/i)).toBeInTheDocument();
  });

  // ── 8. Shows Recent section with correct view names ────────────────────────

  it('shows Recent section with correct view names', async () => {
    const v1 = makeView({ name: 'Recent One' });
    const v2 = makeView({ name: 'Recent Two' });
    renderDropdown({ views: [v1, v2], pinnedViews: [], recentViews: [v1, v2] });
    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    expect(screen.getByText('Recent One')).toBeInTheDocument();
    expect(screen.getByText('Recent Two')).toBeInTheDocument();
  });

  // ── 9. Clicking a view row calls onApplyView with correct id ────────────────

  it('clicking a view row calls onApplyView with correct id', async () => {
    const view = makeView({ name: 'Click Me' });
    const onApplyView = vi.fn();
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
      onApplyView,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const applyBtn = screen.getByRole('button', { name: /apply view: click me/i });
    await userEvent.click(applyBtn);

    expect(onApplyView).toHaveBeenCalledTimes(1);
    expect(onApplyView).toHaveBeenCalledWith(view.id);
  });

  // ── 10. Shows 'Unsaved changes' microcopy when isUnsaved=true + activeView ──

  it('shows "Unsaved changes" label in the banner when isUnsaved=true and activeView is set', async () => {
    const view = makeView({ name: 'Active View' });
    renderDropdown({
      views: [view],
      recentViews: [view],
      activeView: view,
      isUnsaved: true,
    });
    const trigger = screen.getByRole('button', { name: /active view/i });
    await userEvent.click(trigger);

    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
  });

  // ── 11. 'Save as new' button calls onSaveNew ───────────────────────────────

  it('"Save as new" button in unsaved banner calls onSaveNew', async () => {
    const view = makeView({ name: 'Active' });
    const onSaveNew = vi.fn();
    renderDropdown({
      views: [view],
      recentViews: [view],
      activeView: view,
      isUnsaved: true,
      onSaveNew,
    });

    const trigger = screen.getByRole('button', { name: /active/i });
    await userEvent.click(trigger);

    const saveAsNewBtn = screen.getByRole('button', { name: /save as a new view/i });
    await userEvent.click(saveAsNewBtn);

    expect(onSaveNew).toHaveBeenCalledTimes(1);
  });

  // ── 12. 'Save changes' button calls onUpdateCurrent ───────────────────────

  it('"Save changes" button in unsaved banner calls onUpdateCurrent', async () => {
    const view = makeView({ name: 'Active' });
    const onUpdateCurrent = vi.fn();
    renderDropdown({
      views: [view],
      recentViews: [view],
      activeView: view,
      isUnsaved: true,
      onUpdateCurrent,
    });

    const trigger = screen.getByRole('button', { name: /active/i });
    await userEvent.click(trigger);

    const saveChangesBtn = screen.getByRole('button', {
      name: /save changes to view active/i,
    });
    await userEvent.click(saveChangesBtn);

    expect(onUpdateCurrent).toHaveBeenCalledTimes(1);
  });

  // ── 13. Three-dot menu opens row actions ──────────────────────────────────

  it('three-dot menu button opens the row action menu', async () => {
    const view = makeView({ name: 'Menu View' });
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const moreBtn = screen.getByRole('button', {
      name: /more options for view menu view/i,
    });
    await userEvent.click(moreBtn);

    // The action menu should now be visible
    expect(screen.getByRole('menu', { name: /options for menu view/i })).toBeInTheDocument();
  });

  // ── 14. Rename action calls onRename ──────────────────────────────────────

  it('Rename action calls onRename with the view id', async () => {
    const view = makeView({ name: 'Renamable' });
    const onRename = vi.fn();
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
      onRename,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const moreBtn = screen.getByRole('button', { name: /more options for view renamable/i });
    await userEvent.click(moreBtn);

    const renameBtn = screen.getByRole('menuitem', { name: /rename view: renamable/i });
    await userEvent.click(renameBtn);

    expect(onRename).toHaveBeenCalledWith(view.id);
  });

  // ── 15. Delete action calls onDelete ──────────────────────────────────────

  it('Delete action calls onDelete with the view id', async () => {
    const view = makeView({ name: 'Deletable' });
    const onDelete = vi.fn();
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
      onDelete,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const moreBtn = screen.getByRole('button', { name: /more options for view deletable/i });
    await userEvent.click(moreBtn);

    const deleteBtn = screen.getByRole('menuitem', { name: /delete view: deletable/i });
    await userEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith(view.id);
  });

  // ── 16. Set as default action calls onSetDefault ──────────────────────────

  it('Set as default action calls onSetDefault with the view id', async () => {
    const view = makeView({ name: 'Defaultable', isDefault: false });
    const onSetDefault = vi.fn();
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
      onSetDefault,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const moreBtn = screen.getByRole('button', { name: /more options for view defaultable/i });
    await userEvent.click(moreBtn);

    const setDefaultBtn = screen.getByRole('menuitem', { name: /set as default: defaultable/i });
    await userEvent.click(setDefaultBtn);

    expect(onSetDefault).toHaveBeenCalledWith(view.id);
  });

  // ── 17. Remove default action calls onClearDefault (when isDefault=true) ───

  it('Remove default action calls onClearDefault when view.isDefault=true', async () => {
    const view = makeView({ name: 'Current Default', isDefault: true });
    const onClearDefault = vi.fn();
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
      onClearDefault,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const moreBtn = screen.getByRole('button', {
      name: /more options for view current default/i,
    });
    await userEvent.click(moreBtn);

    const removeDefaultBtn = screen.getByRole('menuitem', {
      name: /remove default: current default/i,
    });
    await userEvent.click(removeDefaultBtn);

    expect(onClearDefault).toHaveBeenCalledTimes(1);
  });

  // ── 18. Pin action calls onTogglePin ─────────────────────────────────────

  it('Pin action calls onTogglePin with the view id', async () => {
    const view = makeView({ name: 'Pinnable', isPinned: false });
    const onTogglePin = vi.fn();
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
      onTogglePin,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const moreBtn = screen.getByRole('button', { name: /more options for view pinnable/i });
    await userEvent.click(moreBtn);

    const pinBtn = screen.getByRole('menuitem', { name: /pin view: pinnable/i });
    await userEvent.click(pinBtn);

    expect(onTogglePin).toHaveBeenCalledWith(view.id);
  });

  // ── 19. Share action calls onShare ────────────────────────────────────────

  it('Share action calls onShare with the view id', async () => {
    const view = makeView({ name: 'Shareable' });
    const onShare = vi.fn();
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
      onShare,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const moreBtn = screen.getByRole('button', { name: /more options for view shareable/i });
    await userEvent.click(moreBtn);

    const shareBtn = screen.getByRole('menuitem', { name: /share url for view: shareable/i });
    await userEvent.click(shareBtn);

    expect(onShare).toHaveBeenCalledWith(view.id);
  });

  // ── 20. Default view shows star icon ─────────────────────────────────────

  it('default view row has star icon (aria-hidden, in indicators area)', async () => {
    const view = makeView({ name: 'Default View', isDefault: true });
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    // The row aria-label should mention "default view"
    const row = screen.getByRole('menuitem', {
      name: /default view.*default view/i,
    });
    expect(row).toBeInTheDocument();
  });

  // ── 21. Pinned view shows pin icon ─────────────────────────────────────────

  it('pinned view row has pinned label in aria-label', async () => {
    const view = makeView({ name: 'Pinned View', isPinned: true });
    renderDropdown({
      views: [view],
      pinnedViews: [view],
      recentViews: [],
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const row = screen.getByRole('menuitem', { name: /pinned view.*pinned/i });
    expect(row).toBeInTheDocument();
  });

  // ── 22. At MAX_VIEWS limit, save button is disabled ───────────────────────

  it('save current view button is disabled when at MAX_VIEWS limit', async () => {
    // Create exactly MAX_VIEWS views
    const MAX_VIEWS = 5;
    const views = Array.from({ length: MAX_VIEWS }, () => makeView());
    renderDropdown({
      views,
      pinnedViews: [],
      recentViews: views.slice(0, 3),
      MAX_VIEWS,
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const saveBtn = screen.getByRole('menuitem', {
      name: /cannot save|max.*views reached/i,
    });
    expect(saveBtn).toBeDisabled();
  });

  // ── 23. Live region announces view name after applying ────────────────────

  it('live region announces view name after applyView is triggered', async () => {
    const view = makeView({ name: 'Announced View' });
    renderDropdown({
      views: [view],
      pinnedViews: [],
      recentViews: [view],
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const applyBtn = screen.getByRole('button', {
      name: /apply view: announced view/i,
    });
    await userEvent.click(applyBtn);

    // The live region (role="status") should eventually contain the view name
    const liveRegion = document.querySelector('[role="status"]') as HTMLElement;
    expect(liveRegion).toBeInTheDocument();
    // Announcement is set via a 50ms timeout; wait for it
    await waitFor(
      () => {
        expect(liveRegion.textContent).toContain('Announced View');
      },
      { timeout: 500 },
    );
  });

  // ── 24. Keyboard navigation: arrow down moves focus between rows ───────────

  it('ArrowDown key moves focus to the next view row', async () => {
    const v1 = makeView({ name: 'Row One' });
    const v2 = makeView({ name: 'Row Two' });
    renderDropdown({
      views: [v1, v2],
      pinnedViews: [],
      recentViews: [v1, v2],
    });

    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    const rows = document.querySelectorAll('[data-view-row]');
    expect(rows).toHaveLength(2);

    // Focus first row and press ArrowDown
    (rows[0] as HTMLElement).focus();
    fireEvent.keyDown(rows[0], { key: 'ArrowDown' });

    await waitFor(() => {
      expect(document.activeElement).toBe(rows[1]);
    });
  });

  // ── 25. RTL: dropdown renders without breaking layout ────────────────────

  it('renders correctly when dir=rtl is set on the container', async () => {
    const { container } = renderDropdown();
    container.setAttribute('dir', 'rtl');

    // The component should still render the trigger and be openable
    const trigger = screen.getByRole('button', { name: /all subscriptions/i });
    await userEvent.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
