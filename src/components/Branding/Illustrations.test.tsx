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
});
