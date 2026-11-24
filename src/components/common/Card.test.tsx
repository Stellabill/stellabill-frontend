import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Card, { Card as NamedCard, CardProps } from './Card';

describe('Card — Public Contract & Core Rendering', () => {
  it('exposes Card both as default and named export', () => {
    expect(Card).toBeDefined();
    expect(NamedCard).toBeDefined();
    expect(Card).toBe(NamedCard);
  });

  it('renders children within a div container by default', () => {
    render(<Card>Card content</Card>);
    const element = screen.getByText('Card content');
    expect(element).toBeInTheDocument();
    expect(element.tagName.toLowerCase()).toBe('div');
  });

  it('renders complex nested children correctly', () => {
    render(
      <Card>
        <h2>Card Title</h2>
        <p>Card description</p>
        <button type="button">Action</button>
      </Card>
    );

    expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('forwards arbitrary HTMLDivElement attributes and data attributes via CardProps', () => {
    const props: CardProps = {
      id: 'custom-card-id',
      role: 'region',
      'aria-label': 'Account Summary',
      'aria-expanded': true,
      'data-testid': 'custom-card',
      tabIndex: 0,
      title: 'Summary Card',
    };

    render(<Card {...props}>Summary details</Card>);
    const card = screen.getByTestId('custom-card');

    expect(card).toHaveAttribute('id', 'custom-card-id');
    expect(card).toHaveAttribute('role', 'region');
    expect(card).toHaveAttribute('aria-label', 'Account Summary');
    expect(card).toHaveAttribute('aria-expanded', 'true');
    expect(card).toHaveAttribute('tabindex', '0');
    expect(card).toHaveAttribute('title', 'Summary Card');
  });

  it('forwards inline style definitions via CardProps', () => {
    render(
      <Card data-testid="styled-card" style={{ minHeight: '200px', zIndex: 10 }}>
        Styled
      </Card>
    );
    const card = screen.getByTestId('styled-card');
    expect(card.style.minHeight).toBe('200px');
    expect(card.style.zIndex).toBe('10');
  });
});

describe('Card — Default Configuration', () => {
  it('applies standard base styles and default variant and padding classes', () => {
    const { container } = render(<Card>Default Card</Card>);
    const card = container.firstChild as HTMLElement;

    // Base styles
    expect(card).toHaveClass('rounded-[var(--radius-2xl)]');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('transition-all');
    expect(card).toHaveClass('duration-300');
    expect(card).toHaveClass('overflow-hidden');

    // Default variant ('default')
    expect(card).toHaveClass('bg-[var(--color-surface-card)]');
    expect(card).toHaveClass('border-white/5');
    expect(card).toHaveClass('hover:border-white/10');
    expect(card).toHaveClass('shadow-sm');

    // Default padding ('md')
    expect(card).toHaveClass('p-[var(--space-6)]');
  });
});

describe('Card — Variant Behavior', () => {
  it('applies the default variant styling when explicitly specified', () => {
    const { container } = render(<Card variant="default">Default Variant</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('bg-[var(--color-surface-card)]');
    expect(card).toHaveClass('border-white/5');
    expect(card).toHaveClass('hover:border-white/10');
    expect(card).toHaveClass('shadow-sm');
  });

  it('applies the primary variant styling', () => {
    const { container } = render(<Card variant="primary">Primary Variant</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('bg-linear-to-br');
    expect(card).toHaveClass('from-[#00b8db1a]');
    expect(card).toHaveClass('to-[#00bba71a]');
    expect(card).toHaveClass('border-[#2a2a2a]');
    expect(card).toHaveClass('hover:border-cyan-500/30');
  });

  it('applies the secondary variant styling', () => {
    const { container } = render(<Card variant="secondary">Secondary Variant</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('bg-white/2');
    expect(card).toHaveClass('border-white/5');
    expect(card).toHaveClass('hover:bg-white/4');
  });

  it('applies the glass variant styling', () => {
    const { container } = render(<Card variant="glass">Glass Variant</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('bg-white/5');
    expect(card).toHaveClass('backdrop-blur-md');
    expect(card).toHaveClass('border-white/10');
  });
});

describe('Card — Padding Behavior', () => {
  it('applies "none" padding class p-0', () => {
    const { container } = render(<Card padding="none">No Padding</Card>);
    expect(container.firstChild).toHaveClass('p-0');
    expect(container.firstChild).not.toHaveClass('p-[var(--space-6)]');
  });

  it('applies "sm" padding class p-[var(--space-4)]', () => {
    const { container } = render(<Card padding="sm">Small Padding</Card>);
    expect(container.firstChild).toHaveClass('p-[var(--space-4)]');
  });

  it('applies "md" padding class p-[var(--space-6)]', () => {
    const { container } = render(<Card padding="md">Medium Padding</Card>);
    expect(container.firstChild).toHaveClass('p-[var(--space-6)]');
  });

  it('applies "lg" padding class p-[var(--space-8)]', () => {
    const { container } = render(<Card padding="lg">Large Padding</Card>);
    expect(container.firstChild).toHaveClass('p-[var(--space-8)]');
  });
});

describe('Card — ClassName Merging & Sanitization', () => {
  it('combines custom className with computed base, variant, and padding classes', () => {
    const { container } = render(
      <Card variant="primary" padding="lg" className="custom-shadow my-custom-class">
        With Custom Class
      </Card>
    );
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('rounded-[var(--radius-2xl)]');
    expect(card).toHaveClass('bg-linear-to-br');
    expect(card).toHaveClass('p-[var(--space-8)]');
    expect(card).toHaveClass('custom-shadow');
    expect(card).toHaveClass('my-custom-class');
  });

  it('trims leading and trailing whitespace when className is empty or omitted', () => {
    const { container } = render(<Card>Trimmed Card</Card>);
    const className = (container.firstChild as HTMLElement).className;

    expect(className).toBe(className.trim());
    expect(className.startsWith(' ')).toBe(false);
    expect(className.endsWith(' ')).toBe(false);
  });
});

describe('Card — Boundary & Representative Invalid Inputs', () => {
  it('deterministically falls back to default variant styles when an invalid variant string is passed', () => {
    // @ts-expect-error Testing invalid runtime variant input
    const { container } = render(<Card variant="invalid_variant">Invalid Variant</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card.className).not.toContain('undefined');
    expect(card).toHaveClass('bg-[var(--color-surface-card)]');
    expect(card).toHaveClass('border-white/5');
  });

  it('deterministically falls back to default variant styles when variant is null or empty', () => {
    // @ts-expect-error Testing null variant input
    const { container: nullContainer } = render(<Card variant={null}>Null Variant</Card>);
    expect((nullContainer.firstChild as HTMLElement).className).not.toContain('undefined');
    expect(nullContainer.firstChild).toHaveClass('bg-[var(--color-surface-card)]');

    // @ts-expect-error Testing empty string variant input
    const { container: emptyContainer } = render(<Card variant="">Empty Variant</Card>);
    expect((emptyContainer.firstChild as HTMLElement).className).not.toContain('undefined');
    expect(emptyContainer.firstChild).toHaveClass('bg-[var(--color-surface-card)]');
  });

  it('deterministically falls back to md padding styles when an invalid padding string is passed', () => {
    // @ts-expect-error Testing invalid runtime padding input
    const { container } = render(<Card padding="xl">Invalid Padding</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card.className).not.toContain('undefined');
    expect(card).toHaveClass('p-[var(--space-6)]');
  });

  it('deterministically falls back to md padding styles when padding is null or empty', () => {
    // @ts-expect-error Testing null padding input
    const { container: nullContainer } = render(<Card padding={null}>Null Padding</Card>);
    expect((nullContainer.firstChild as HTMLElement).className).not.toContain('undefined');
    expect(nullContainer.firstChild).toHaveClass('p-[var(--space-6)]');

    // @ts-expect-error Testing empty string padding input
    const { container: emptyContainer } = render(<Card padding="">Empty Padding</Card>);
    expect((emptyContainer.firstChild as HTMLElement).className).not.toContain('undefined');
    expect(emptyContainer.firstChild).toHaveClass('p-[var(--space-6)]');
  });

  it('renders boundary children values (null, undefined, 0, empty string) without throwing', () => {
    expect(() => render(<Card>{null}</Card>)).not.toThrow();
    expect(() => render(<Card>{undefined}</Card>)).not.toThrow();
    expect(() => render(<Card>{''}</Card>)).not.toThrow();

    const { getByText } = render(<Card>{0}</Card>);
    expect(getByText('0')).toBeInTheDocument();
  });

  it('handles whitespace-only className without introducing spurious duplicate classes', () => {
    const { container } = render(<Card className="    ">Whitespace Class</Card>);
    const className = (container.firstChild as HTMLElement).className;
    expect(className).not.toContain('undefined');
    expect(className).toBe(className.trim());
  });
});

describe('Card — State Transitions & Re-rendering', () => {
  it('transitions cleanly across all variants upon re-rendering', () => {
    const { container, rerender } = render(<Card variant="default">Transition Card</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-[var(--color-surface-card)]');

    // Transition to primary
    rerender(<Card variant="primary">Transition Card</Card>);
    expect(card).not.toHaveClass('bg-[var(--color-surface-card)]');
    expect(card).toHaveClass('bg-linear-to-br');

    // Transition to secondary
    rerender(<Card variant="secondary">Transition Card</Card>);
    expect(card).not.toHaveClass('bg-linear-to-br');
    expect(card).toHaveClass('bg-white/2');

    // Transition to glass
    rerender(<Card variant="glass">Transition Card</Card>);
    expect(card).not.toHaveClass('bg-white/2');
    expect(card).toHaveClass('backdrop-blur-md');

    // Transition back to default
    rerender(<Card variant="default">Transition Card</Card>);
    expect(card).not.toHaveClass('backdrop-blur-md');
    expect(card).toHaveClass('bg-[var(--color-surface-card)]');
  });

  it('transitions cleanly across all padding options upon re-rendering', () => {
    const { container, rerender } = render(<Card padding="none">Padding Transition</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-0');

    // Transition to sm
    rerender(<Card padding="sm">Padding Transition</Card>);
    expect(card).not.toHaveClass('p-0');
    expect(card).toHaveClass('p-[var(--space-4)]');

    // Transition to md
    rerender(<Card padding="md">Padding Transition</Card>);
    expect(card).not.toHaveClass('p-[var(--space-4)]');
    expect(card).toHaveClass('p-[var(--space-6)]');

    // Transition to lg
    rerender(<Card padding="lg">Padding Transition</Card>);
    expect(card).not.toHaveClass('p-[var(--space-6)]');
    expect(card).toHaveClass('p-[var(--space-8)]');

    // Transition back to none
    rerender(<Card padding="none">Padding Transition</Card>);
    expect(card).not.toHaveClass('p-[var(--space-8)]');
    expect(card).toHaveClass('p-0');
  });

  it('supports dynamic interactive state transitions (e.g. selection toggle)', () => {
    const TestComponent = () => {
      const [isSelected, setIsSelected] = React.useState(false);
      return (
        <Card
          data-testid="interactive-card"
          data-selected={isSelected}
          className={isSelected ? 'ring-2 ring-cyan-500 bg-cyan-950/20' : ''}
          onClick={() => setIsSelected(prev => !prev)}
        >
          {isSelected ? 'Selected' : 'Unselected'}
        </Card>
      );
    };

    render(<TestComponent />);
    const card = screen.getByTestId('interactive-card');

    expect(card).toHaveAttribute('data-selected', 'false');
    expect(card).toHaveTextContent('Unselected');
    expect(card).not.toHaveClass('ring-2');

    // State transition on click: unselected -> selected
    fireEvent.click(card);
    expect(card).toHaveAttribute('data-selected', 'true');
    expect(card).toHaveTextContent('Selected');
    expect(card).toHaveClass('ring-2');
    expect(card).toHaveClass('ring-cyan-500');

    // State transition on second click: selected -> unselected
    fireEvent.click(card);
    expect(card).toHaveAttribute('data-selected', 'false');
    expect(card).toHaveTextContent('Unselected');
    expect(card).not.toHaveClass('ring-2');
  });

  it('triggers mouse and keyboard event handlers properly across interactions', () => {
    const handleClick = vi.fn();
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();
    const handleKeyDown = vi.fn();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(
      <Card
        data-testid="event-card"
        tabIndex={0}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        Interactive Events Card
      </Card>
    );

    const card = screen.getByTestId('event-card');

    // Click event
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Mouse events
    fireEvent.mouseEnter(card);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(card);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);

    // Focus & Blur events
    fireEvent.focus(card);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(card);
    expect(handleBlur).toHaveBeenCalledTimes(1);

    // Keyboard events
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('updates dynamically when children change from loading to content state', () => {
    const { rerender } = render(
      <Card data-testid="dynamic-content-card">
        <span data-testid="loading-indicator">Loading...</span>
      </Card>
    );

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('content-ready')).not.toBeInTheDocument();

    // Transition to content loaded state
    rerender(
      <Card data-testid="dynamic-content-card">
        <div data-testid="content-ready">Data ready</div>
      </Card>
    );

    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    expect(screen.getByTestId('content-ready')).toBeInTheDocument();
  });
});
