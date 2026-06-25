import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tag from './Tag';

describe('Tag', () => {
  it('renders with label', () => {
    render(<Tag label="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onRemove when clicked', async () => {
    const onRemove = vi.fn();
    render(<Tag label="Test" removable onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onRemove).toHaveBeenCalled();
  });
});
