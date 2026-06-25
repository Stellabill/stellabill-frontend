import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTagPopover from './AddTagPopover';

describe('AddTagPopover', () => {
  const mockTags = [
    { id: '1', label: 'Tag1', color: 'blue' as const },
    { id: '2', label: 'Tag2', color: 'green' as const },
  ];

  it('renders trigger button', () => {
    render(<AddTagPopover availableTags={mockTags} selectedTags={[]} onAddTag={vi.fn()} onCreateTag={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add tag/i })).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    render(<AddTagPopover availableTags={mockTags} selectedTags={[]} onAddTag={vi.fn()} onCreateTag={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /add tag/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onAddTag when tag is selected', async () => {
    const onAddTag = vi.fn();
    render(<AddTagPopover availableTags={mockTags} selectedTags={[]} onAddTag={onAddTag} onCreateTag={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /add tag/i }));
    await userEvent.click(screen.getByRole('button', { name: /add tag1 tag/i }));
    expect(onAddTag).toHaveBeenCalledWith(mockTags[0]);
  });
});
