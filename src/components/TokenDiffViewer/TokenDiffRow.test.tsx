import { render, screen } from '@testing-library/react';
import TokenDiffRow from './TokenDiffRow';
import type { DiffEntry } from './diffEngine';

describe('TokenDiffRow', () => {
  it('renders an added token correctly', () => {
    const entry: DiffEntry = {
      type: 'added',
      name: 'color-brand-primary',
      value: '#0055ff',
      category: 'color',
    };
    render(<TokenDiffRow entry={entry} />);
    
    expect(screen.getByRole('row', { name: /added token: color-brand-primary/i })).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('color-brand-primary')).toBeInTheDocument();
    
    // Impact scope
    expect(screen.getByText('Global')).toBeInTheDocument();
    
    // Swatch (color)
    const swatch = screen.getByRole('img', { name: /new value: #0055ff/i });
    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveStyle({ backgroundColor: '#0055ff' });
  });

  it('renders a removed token correctly', () => {
    const entry: DiffEntry = {
      type: 'removed',
      name: 'spacing-large',
      value: '24px',
      category: 'spacing',
    };
    render(<TokenDiffRow entry={entry} />);
    
    expect(screen.getByRole('row', { name: /removed token: spacing-large/i })).toBeInTheDocument();
    expect(screen.getByText('−')).toBeInTheDocument();
    expect(screen.getByText('spacing-large')).toBeInTheDocument();
    
    // Impact scope for spacing
    expect(screen.getByText('Layout')).toBeInTheDocument();
    
    // Swatch (non-color)
    const swatch = screen.getByRole('img', { name: /old value: 24px/i });
    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveTextContent('val'); // non-color placeholder
  });

  it('renders a changed token correctly (color with delta)', () => {
    const entry: DiffEntry = {
      type: 'changed',
      name: 'color-text-body',
      oldValue: '#333333',
      newValue: '#555555',
      category: 'color',
      contrastDelta: 0.15,
    };
    render(<TokenDiffRow entry={entry} />);
    
    expect(screen.getByRole('row', { name: /changed token: color-text-body/i })).toBeInTheDocument();
    expect(screen.getByText('↔')).toBeInTheDocument();
    
    // Old and New Swatches
    expect(screen.getByRole('img', { name: /old value: #333333/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /new value: #555555/i })).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument(); // arrow
    
    // Contrast delta
    expect(screen.getByText('Δ')).toBeInTheDocument();
    expect(screen.getByText('0.150')).toBeInTheDocument();
  });

  it('renders a changed token correctly (non-color without delta)', () => {
    const entry: DiffEntry = {
      type: 'changed',
      name: 'font-size-base',
      oldValue: '14px',
      newValue: '16px',
      category: 'typography',
      contrastDelta: null,
    };
    render(<TokenDiffRow entry={entry} />);
    
    expect(screen.getByRole('row', { name: /changed token: font-size-base/i })).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // Null delta indicator
    
    // Non-color swatches
    expect(screen.getByRole('img', { name: /old value: 14px/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /new value: 16px/i })).toBeInTheDocument();
  });

  it('renders an unchanged token correctly', () => {
    const entry: DiffEntry = {
      type: 'unchanged',
      name: 'border-radius-sm',
      value: '4px',
      category: 'radius',
    };
    render(<TokenDiffRow entry={entry} />);
    
    expect(screen.getByRole('row', { name: /unchanged token: border-radius-sm/i })).toBeInTheDocument();
    expect(screen.getByText('=')).toBeInTheDocument();
    
    // Unchanged uses newValue logic mapped to value, ariaLabel="Value"
    const swatch = screen.getByRole('img', { name: /value: 4px/i });
    expect(swatch).toBeInTheDocument();
  });

  it('renders warning class when contrastDelta > 0.1', () => {
    const entry: DiffEntry = {
      type: 'changed',
      name: 'color-bg-subtle',
      oldValue: '#f0f0f0',
      newValue: '#ffffff',
      category: 'color',
      contrastDelta: 0.12,
    };
    render(<TokenDiffRow entry={entry} />);
    
    const deltaContainer = screen.getByText('Δ').closest('span')?.parentElement;
    expect(deltaContainer).toHaveClass('token-diff-row__delta--warning');
  });

  it('does not render warning class when contrastDelta <= 0.1', () => {
    const entry: DiffEntry = {
      type: 'changed',
      name: 'color-bg-subtle',
      oldValue: '#f0f0f0',
      newValue: '#f2f2f2',
      category: 'color',
      contrastDelta: 0.05,
    };
    render(<TokenDiffRow entry={entry} />);
    
    const deltaContainer = screen.getByText('Δ').closest('span')?.parentElement;
    expect(deltaContainer).not.toHaveClass('token-diff-row__delta--warning');
  });
});
