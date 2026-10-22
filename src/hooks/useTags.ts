import { useState, useCallback, useEffect } from 'react';

export interface TagOption {
  id: string;
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange' | 'gray';
}

export interface SubscriptionTags {
  [subscriptionId: string]: string[]; // maps subscription ID to array of tag IDs
}

interface TagsStore {
  tags: TagOption[];
  subscriptionTags: SubscriptionTags;
}

const STORAGE_KEY = 'stellabill_tags_store';

const DEFAULT_TAGS: TagOption[] = [
  { id: 't-priority', label: 'Priority', color: 'red' },
  { id: 't-team', label: 'Team', color: 'blue' },
  { id: 't-trial', label: 'Trial', color: 'yellow' },
];

/**
 * Normalizes a tag label for comparison:
 * - Trims whitespace
 * - Collapses internal whitespace to single spaces
 * - Converts to lowercase
 */
export function normalizeLabelForComparison(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Loads tags store from localStorage or returns default
 */
function loadTagsStore(): TagsStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Silently fail and use defaults
  }
  return {
    tags: DEFAULT_TAGS,
    subscriptionTags: {},
  };
}

/**
 * Saves tags store to localStorage
 */
function saveTagsStore(store: TagsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Silently fail if storage is unavailable
  }
}

/**
 * Hook for managing tags with persistence and shared state
 * Provides tag CRUD operations and subscription-to-tag assignments
 */
export function useTags() {
  const [store, setStore] = useState<TagsStore>(loadTagsStore);

  // Persist store to localStorage whenever it changes
  useEffect(() => {
    saveTagsStore(store);
  }, [store]);

  /**
   * Find an existing tag by normalized label match
   * Returns null if no match found
   */
  const findTagByNormalizedLabel = useCallback(
    (label: string): TagOption | null => {
      const normalized = normalizeLabelForComparison(label);
      return (
        store.tags.find((t) => normalizeLabelForComparison(t.label) === normalized) || null
      );
    },
    [store.tags]
  );

  /**
   * Check if a tag with the normalized label already exists
   */
  const tagExists = useCallback(
    (label: string): boolean => {
      return findTagByNormalizedLabel(label) !== null;
    },
    [findTagByNormalizedLabel]
  );

  /**
   * Create a new tag (does not check for duplicates; caller responsible)
   */
  const createTag = useCallback(
    (label: string, color: TagOption['color']): TagOption => {
      const newTag: TagOption = {
        id: `t-${Date.now()}`,
        label,
        color,
      };
      setStore((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      return newTag;
    },
    []
  );

  /**
   * Rename a tag by ID
   */
  const renameTag = useCallback((tagId: string, newLabel: string): void => {
    setStore((prev) => ({
      ...prev,
      tags: prev.tags.map((t) => (t.id === tagId ? { ...t, label: newLabel } : t)),
    }));
  }, []);

  /**
   * Change a tag's color by ID
   */
  const changeTagColor = useCallback(
    (tagId: string, newColor: TagOption['color']): void => {
      setStore((prev) => ({
        ...prev,
        tags: prev.tags.map((t) => (t.id === tagId ? { ...t, color: newColor } : t)),
      }));
    },
    []
  );

  /**
   * Delete a tag by ID and remove it from all subscriptions
   */
  const deleteTag = useCallback((tagId: string): void => {
    setStore((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== tagId),
      subscriptionTags: Object.fromEntries(
        Object.entries(prev.subscriptionTags).map(([subId, tagIds]) => [
          subId,
          tagIds.filter((id) => id !== tagId),
        ])
      ),
    }));
  }, []);

  /**
   * Add a tag to a subscription
   */
  const addTagToSubscription = useCallback((subscriptionId: string, tagId: string): void => {
    setStore((prev) => {
      const currentTags = prev.subscriptionTags[subscriptionId] ?? [];
      // Prevent duplicates
      if (currentTags.includes(tagId)) {
        return prev;
      }
      return {
        ...prev,
        subscriptionTags: {
          ...prev.subscriptionTags,
          [subscriptionId]: [...currentTags, tagId],
        },
      };
    });
  }, []);

  /**
   * Remove a tag from a subscription
   */
  const removeTagFromSubscription = useCallback(
    (subscriptionId: string, tagId: string): void => {
      setStore((prev) => ({
        ...prev,
        subscriptionTags: {
          ...prev.subscriptionTags,
          [subscriptionId]: (prev.subscriptionTags[subscriptionId] ?? []).filter(
            (id) => id !== tagId
          ),
        },
      }));
    },
    []
  );

  /**
   * Get all tags for a subscription
   */
  const getSubscriptionTags = useCallback(
    (subscriptionId: string): TagOption[] => {
      const tagIds = store.subscriptionTags[subscriptionId] ?? [];
      return tagIds
        .map((id) => store.tags.find((t) => t.id === id))
        .filter((t): t is TagOption => t !== undefined);
    },
    [store]
  );

  /**
   * Get tag by ID
   */
  const getTagById = useCallback(
    (tagId: string): TagOption | null => {
      return store.tags.find((t) => t.id === tagId) ?? null;
    },
    [store.tags]
  );

  /**
   * Get all tags
   */
  const getAllTags = useCallback((): TagOption[] => {
    return store.tags;
  }, [store.tags]);

  /**
   * Get usage count for a tag (how many subscriptions have it)
   */
  const getTagUsageCount = useCallback(
    (tagId: string): number => {
      return Object.values(store.subscriptionTags).filter((tagIds) =>
        tagIds.includes(tagId)
      ).length;
    },
    [store.subscriptionTags]
  );

  return {
    // Query methods
    tags: store.tags,
    subscriptionTags: store.subscriptionTags,
    findTagByNormalizedLabel,
    tagExists,
    getSubscriptionTags,
    getTagById,
    getAllTags,
    getTagUsageCount,

    // Mutation methods
    createTag,
    renameTag,
    changeTagColor,
    deleteTag,
    addTagToSubscription,
    removeTagFromSubscription,
  };
}
