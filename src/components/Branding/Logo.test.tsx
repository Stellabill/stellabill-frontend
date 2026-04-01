import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo Component', () => {
  it('renders the icon-only variant correctly', () => {
    const { getByText } = render(<Logo variant="icon" />);
    expect(getByText('S')).toBeInTheDocument();
  });

  it('renders the full logo with text', () => {
    const { getByText } = render(<Logo variant="full" />);
    expect(getByText('S')).toBeInTheDocument();
    expect(getByText('Stellabill')).toBeInTheDocument();
  });

  it('applies the correct theme colors', () => {
    const { getByText } = render(<Logo theme="light" />);
    const textElement = getByText('Stellabill');
    expect(textElement.style.color).toBe('rgb(15, 23, 42)'); // #0f172a
  });

  it('scales correctly with size prop', () => {
    const { container } = render(<Logo size="xl" variant="icon" />);
    const iconBox = container.firstChild as HTMLElement;
    expect(iconBox.style.width).toBe('80px');
  });
});
