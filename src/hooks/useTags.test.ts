import { renderHook, act } from '@testing-library/react';
import { useTags, normalizeLabelForComparison } from './useTags';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('normalizeLabelForComparison', () => {
  it('should trim whitespace', () => {
    expect(normalizeLabelForComparison('  Priority  ')).toBe('priority');
  });

  it('should convert to lowercase', () => {
    expect(normalizeLabelForComparison('PRIORITY')).toBe('priority');
  });

  it('should collapse internal whitespace to single spaces', () => {
    expect(normalizeLabelForComparison('Priority   Tag')).toBe('priority tag');
  });

  it('should handle combination of transformations', () => {
    expect(normalizeLabelForComparison('  PRIORITY   TAG  ')).toBe('priority tag');
  });

  it('should handle single word with various whitespace', () => {
    expect(normalizeLabelForComparison('\t Priority \n')).toBe('priority');
  });
});

describe('useTags', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default tags', () => {
    const { result } = renderHook(() => useTags());

    expect(result.current.getAllTags()).toHaveLength(3);
    expect(result.current.getAllTags()[0].label).toBe('Priority');
  });

  it('should persist tags to localStorage', () => {
    const { result } = renderHook(() => useTags());

    act(() => {
      result.current.createTag('Custom Tag', 'blue');
    });

    // Create a new hook instance to verify persistence
    const { result: result2 } = renderHook(() => useTags());
    expect(result2.current.getAllTags()).toHaveLength(4);
    expect(result2.current.getAllTags()[3].label).toBe('Custom Tag');
  });

  it('should create a new tag', () => {
    const { result } = renderHook(() => useTags());

    const initialCount = result.current.getAllTags().length;

    act(() => {
      result.current.createTag('New Tag', 'red');
    });

    expect(result.current.getAllTags()).toHaveLength(initialCount + 1);
    const newTag = result.current.getAllTags()[initialCount];
    expect(newTag.label).toBe('New Tag');
    expect(newTag.color).toBe('red');
  });

  it('should find tag by normalized label', () => {
    const { result } = renderHook(() => useTags());

    const foundTag = result.current.findTagByNormalizedLabel('  PRIORITY  ');
    expect(foundTag).not.toBeNull();
    expect(foundTag?.label).toBe('Priority');
  });

  it('should return null when tag not found', () => {
    const { result } = renderHook(() => useTags());

    const foundTag = result.current.findTagByNormalizedLabel('NonExistent');
    expect(foundTag).toBeNull();
  });

  it('should check if tag exists with normalized comparison', () => {
    const { result } = renderHook(() => useTags());

    expect(result.current.tagExists('priority')).toBe(true);
    expect(result.current.tagExists('PRIORITY')).toBe(true);
    expect(result.current.tagExists('  Priority  ')).toBe(true);
    expect(result.current.tagExists('NonExistent')).toBe(false);
  });

  it('should rename a tag', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    act(() => {
      result.current.renameTag(tagId, 'Urgent');
    });

    const updatedTag = result.current.getTagById(tagId);
    expect(updatedTag?.label).toBe('Urgent');
  });

  it('should change tag color', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    act(() => {
      result.current.changeTagColor(tagId, 'green');
    });

    const updatedTag = result.current.getTagById(tagId);
    expect(updatedTag?.color).toBe('green');
  });

  it('should delete a tag and remove from all subscriptions', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    // Add tag to subscription
    act(() => {
      result.current.addTagToSubscription('sub-1', tagId);
    });

    expect(result.current.getSubscriptionTags('sub-1')).toHaveLength(1);

    // Delete tag
    act(() => {
      result.current.deleteTag(tagId);
    });

    expect(result.current.getAllTags()).toHaveLength(2);
    expect(result.current.getSubscriptionTags('sub-1')).toHaveLength(0);
  });

  it('should add tag to subscription', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    act(() => {
      result.current.addTagToSubscription('sub-1', tagId);
    });

    const subTags = result.current.getSubscriptionTags('sub-1');
    expect(subTags).toHaveLength(1);
    expect(subTags[0].id).toBe(tagId);
  });

  it('should prevent duplicate tags on same subscription', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    act(() => {
      result.current.addTagToSubscription('sub-1', tagId);
      result.current.addTagToSubscription('sub-1', tagId);
    });

    const subTags = result.current.getSubscriptionTags('sub-1');
    expect(subTags).toHaveLength(1);
  });

  it('should remove tag from subscription', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    act(() => {
      result.current.addTagToSubscription('sub-1', tagId);
      result.current.removeTagFromSubscription('sub-1', tagId);
    });

    const subTags = result.current.getSubscriptionTags('sub-1');
    expect(subTags).toHaveLength(0);
  });

  it('should get subscription tags in correct order', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();

    act(() => {
      result.current.addTagToSubscription('sub-1', tags[0].id);
      result.current.addTagToSubscription('sub-1', tags[1].id);
      result.current.addTagToSubscription('sub-1', tags[2].id);
    });

    const subTags = result.current.getSubscriptionTags('sub-1');
    expect(subTags).toHaveLength(3);
    expect(subTags[0].id).toBe(tags[0].id);
    expect(subTags[1].id).toBe(tags[1].id);
    expect(subTags[2].id).toBe(tags[2].id);
  });

  it('should get tag by ID', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    const tag = result.current.getTagById(tagId);
    expect(tag).not.toBeNull();
    expect(tag?.id).toBe(tagId);
  });

  it('should return null for non-existent tag ID', () => {
    const { result } = renderHook(() => useTags());

    const tag = result.current.getTagById('non-existent');
    expect(tag).toBeNull();
  });

  it('should calculate tag usage count', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();
    const tagId = tags[0].id;

    act(() => {
      result.current.addTagToSubscription('sub-1', tagId);
      result.current.addTagToSubscription('sub-2', tagId);
      result.current.addTagToSubscription('sub-3', tagId);
    });

    expect(result.current.getTagUsageCount(tagId)).toBe(3);
  });

  it('should handle subscription-to-tag mapping correctly', () => {
    const { result } = renderHook(() => useTags());

    const tags = result.current.getAllTags();

    act(() => {
      result.current.addTagToSubscription('sub-1', tags[0].id);
      result.current.addTagToSubscription('sub-1', tags[1].id);
      result.current.addTagToSubscription('sub-2', tags[0].id);
    });

    expect(result.current.getSubscriptionTags('sub-1')).toHaveLength(2);
    expect(result.current.getSubscriptionTags('sub-2')).toHaveLength(1);
    expect(result.current.getTagUsageCount(tags[0].id)).toBe(2);
    expect(result.current.getTagUsageCount(tags[1].id)).toBe(1);
  });

  it('should load persisted data on initialization', () => {
    const { result: result1 } = renderHook(() => useTags());

    let newTagId: string;
    act(() => {
      const newTag = result1.current.createTag('Persisted Tag', 'purple');
      newTagId = newTag.id;
      result1.current.addTagToSubscription('sub-1', newTagId);
    });

    // Simulate page reload by creating new hook instance
    localStorage.clear();
    localStorage.setItem(
      'stellabill_tags_store',
      JSON.stringify({
        tags: result1.current.getAllTags(),
        subscriptionTags: result1.current.subscriptionTags,
      })
    );

    const { result: result2 } = renderHook(() => useTags());
    expect(result2.current.getAllTags()).toHaveLength(4);
    expect(result2.current.getSubscriptionTags('sub-1')).toHaveLength(1);
  });
});
