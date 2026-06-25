import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageTagsSettings from './ManageTagsSettings';

describe('ManageTagsSettings', () => {
  const mockTags = [
    { id: '1', label: 'Tag1', color: 'blue' as const, usageCount: 5 },
    { id: '2', label: 'Tag2', color: 'green' as const, usageCount: 0 },
  ];

  it('renders tags table', () => {
    render(<ManageTagsSettings tags={mockTags} onRenameTag={vi.fn()} onDeleteTag={vi.fn()} onChangeColor={vi.fn()} />);
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag2')).toBeInTheDocument();
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
