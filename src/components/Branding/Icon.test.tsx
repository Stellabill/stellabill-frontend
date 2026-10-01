import { render } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import Icon, { type IconName } from './Icon';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Icon Component', () => {
  it('renders the given Lucide icon', () => {
    const { container } = render(<Icon name="Users" size={24} color="red" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '24');
    expect(icon).toHaveAttribute('stroke', 'red');
  });

  it('renders icons with the default props', () => {
    const { container } = render(<Icon name="Users" />);
    const icon = container.querySelector('svg');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '20');
    expect(icon).toHaveAttribute('stroke', 'currentColor');
    expect(icon).toHaveAttribute('stroke-width', '2');
  });

  it.each(['InvalidIcon', '', undefined])('renders nothing and warns for an unresolved name: %s', (name) => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Icon name={name as IconName} />);

    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Icon "' + name + '" not found in lucide-react');
  });
});
