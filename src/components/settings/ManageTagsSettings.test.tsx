import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageTagsSettings, { TagData } from './ManageTagsSettings';
import { useTags } from '../../hooks/useTags';

const STORAGE_KEY = 'stellabill_tags_store';

// Mirrors the wiring in src/pages/Settings.tsx so the rendered list reflects
// everything the useTags hook exposes.
function ManageTagsHarness() {
  const tagsHook = useTags();

  const tagsData: TagData[] = tagsHook.getAllTags().map((tag) => ({
    id: tag.id,
    label: tag.label,
    color: tag.color,
    usageCount: tagsHook.getTagUsageCount(tag.id),
  }));

  return (
    <ManageTagsSettings
      tags={tagsData}
      onRenameTag={tagsHook.renameTag}
      onDeleteTag={tagsHook.deleteTag}
      onChangeColor={(id, newColor) =>
        tagsHook.changeTagColor(
          id,
          newColor as Parameters<typeof tagsHook.changeTagColor>[1]
        )
      }
    />
  );
}

describe('ManageTagsSettings', () => {
  const mockTags = [
    { id: '1', label: 'Tag1', color: 'blue' as const, usageCount: 5 },
    { id: '2', label: 'Tag2', color: 'green' as const, usageCount: 0 },
  ];

  it('renders tags table', () => {
    render(<ManageTagsSettings tags={mockTags} onRenameTag={vi.fn()} onDeleteTag={vi.fn()} onChangeColor={vi.fn()} />);
    expect(screen.getByRole('status', { name: 'Tag: Tag1' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Tag: Tag2' })).toBeInTheDocument();
  });

  it('shows empty state when no tags', () => {
    render(<ManageTagsSettings tags={[]} onRenameTag={vi.fn()} onDeleteTag={vi.fn()} onChangeColor={vi.fn()} />);
    expect(screen.getByText('No tags yet')).toBeInTheDocument();
  });

  it('calls onDeleteTag when delete button clicked', async () => {
    const onDeleteTag = vi.fn();
    render(<ManageTagsSettings tags={mockTags} onRenameTag={vi.fn()} onDeleteTag={onDeleteTag} onChangeColor={vi.fn()} />);
    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[1]);
    expect(onDeleteTag).toHaveBeenCalledWith('2');
  });
});

describe('ManageTagsSettings cross-tab sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('updates the rendered tag list when another tab edits tags', () => {
    render(<ManageTagsHarness />);

    expect(screen.queryByText('External Tag')).not.toBeInTheDocument();

    const externalStore = {
      tags: [
        { id: 't-external', label: 'External Tag', color: 'green' },
        { id: 't-second', label: 'Second Tag', color: 'purple' },
      ],
      subscriptionTags: { 'sub-external': ['t-external'] },
    };

    act(() => {
      const value = JSON.stringify(externalStore);
      localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          oldValue: null,
          newValue: value,
        })
      );
    });

    expect(screen.getByRole('status', { name: 'Tag: External Tag' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Tag: Second Tag' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Tag: Priority' })).not.toBeInTheDocument();
    expect(screen.getAllByText('1 item')).toHaveLength(1);
  });
});
