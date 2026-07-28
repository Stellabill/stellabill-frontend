import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import Tag from '../Tag';
import { Bell } from 'lucide-react';

describe('Dark Mode Focus Ring Tokens and Accessibility', () => {
  it('renders Button with focus-visible styling support', async () => {
    const user = userEvent.setup();
    render(<Button>Test Focus</Button>);
    
    const button = screen.getByRole('button', { name: 'Test Focus' });
    expect(button).toBeInTheDocument();

    await user.tab();
    expect(button).toHaveFocus();
  });

  it('renders IconButton with aria-label and accepts keyboard focus', async () => {
    const user = userEvent.setup();
    render(<IconButton icon={<Bell data-testid="bell-icon" />} aria-label="Alerts button" variant="elevated" />);
    
    const iconBtn = screen.getByRole('button', { name: 'Alerts button' });
    expect(iconBtn).toBeInTheDocument();
    expect(iconBtn).toHaveClass('icon-button', 'icon-button--elevated');

    await user.tab();
    expect(iconBtn).toHaveFocus();
  });

  it('renders Tag with removable button that accepts keyboard focus', async () => {
    const user = userEvent.setup();
    const handleRemove = vi.fn();
    render(<Tag label="Featured" color="blue" removable onRemove={handleRemove} />);

    const removeBtn = screen.getByRole('button', { name: 'Remove Featured tag' });
    expect(removeBtn).toBeInTheDocument();

    await user.tab();
    expect(removeBtn).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
