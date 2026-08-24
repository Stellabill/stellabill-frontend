/**
 * Saved Views — shared types for the Subscriptions page view manager.
 */

/** A filter state that a view captures */
export interface ViewFilters {
  statusFilter: string; // 'All' | 'Active' | 'Paused' | 'Cancelled'
  // extensible for future filters (search, sort, date range, etc.)
}

/** A single saved view definition */
export interface SavedView {
  id: string;        // e.g. Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  name: string;
  filters: ViewFilters;
  isDefault: boolean;
  isPinned: boolean;
  createdAt: number; // Date.now()
  updatedAt: number; // Date.now()
}

/** The store shape persisted to localStorage */
export interface SavedViewsStore {
  views: SavedView[];
  activeViewId: string | null; // which view is currently selected (null = unsaved / default state)
}

/** URL serialization: ?view=<id> or ?sv_status=<status> */
export interface ViewURLParams {
  view?: string;
  sv_status?: string;
}
