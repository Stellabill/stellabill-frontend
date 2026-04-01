import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Icon from './Icon';

describe('Icon Component', () => {
  it('renders the given Lucide icon', () => {
    const { container } = render(<Icon name="Users" size={24} color="red" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '24');
    expect(icon).toHaveAttribute('stroke', 'red');
  });

  it('renders nothing and warns if icon is not found', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Icon name={"InvalidIcon" as any} />);
    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Icon "InvalidIcon" not found in lucide-react');
    consoleSpy.mockRestore();
  });
});
