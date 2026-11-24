import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyDashboard, NoTransactions } from './Illustrations';

describe('Illustrations Components', () => {
  it('renders the EmptyDashboard illustration', () => {
    const { container } = render(<EmptyDashboard size={300} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '300');
    expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
  });

  it('renders the NoTransactions illustration', () => {
    const { container } = render(<NoTransactions size={250} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '250');
    expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
  });

  it('supports numeric, string, and boundary sizes without changing the viewBox', () => {
    const { container, rerender } = render(<EmptyDashboard size={0} className="empty" />);
    let svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveClass('empty');
    expect(svg).toHaveAttribute('aria-hidden', 'true');

    rerender(<EmptyDashboard size="100%" />);
    svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '100%');
    expect(svg).toHaveAttribute('height', '100%');
    expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
  });

  it('updates NoTransactions presentation when its props change', () => {
    const { container, rerender } = render(<NoTransactions size={-1} />);
    let svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '-1');

    rerender(<NoTransactions size={180} className="transactions" />);
    svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '180');
    expect(svg).toHaveClass('transactions');
    expect(svg?.querySelectorAll('defs linearGradient')).toHaveLength(2);
  });
});
