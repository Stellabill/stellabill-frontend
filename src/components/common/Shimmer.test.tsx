import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Shimmer from './Shimmer';

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })) as unknown as typeof window.matchMedia;
}

describe('Shimmer', () => {
  beforeEach(() => {
    setReducedMotion(false);
  });

  it('renders a decorative block by default', () => {
    const { container } = render(<Shimmer width="10rem" height="1rem" />);
    const el = container.firstChild as HTMLElement;

    expect(el).toHaveClass('sb-shimmer');
    expect(el).toHaveClass('sb-shimmer--block');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).not.toHaveAttribute('role');
    expect(el.style.width).toBe('10rem');
    expect(el.style.height).toBe('1rem');
  });

  it('leaves radius unset for the bare block shape so a wrapping class can own it', () => {
    const { container } = render(<Shimmer className="dashboard-skeleton__button" />);
    expect((container.firstChild as HTMLElement).style.borderRadius).toBe('');
  });

  it('defaults circle and text shapes to a sensible standalone radius', () => {
    const { container: circleContainer } = render(<Shimmer shape="circle" />);
    const { container: textContainer } = render(<Shimmer shape="text" />);

    expect((circleContainer.firstChild as HTMLElement).style.borderRadius).toBe('var(--radius-full)');
    expect((textContainer.firstChild as HTMLElement).style.borderRadius).toBe('var(--radius-sm)');
    expect(circleContainer.firstChild).toHaveClass('sb-shimmer--circle');
    expect(textContainer.firstChild).toHaveClass('sb-shimmer--text');
  });

  it('allows an explicit radius override', () => {
    const { container } = render(<Shimmer radius="4px" />);
    expect((container.firstChild as HTMLElement).style.borderRadius).toBe('4px');
  });

  it('omits data-direction when no direction is specified, letting CSS auto-detect', () => {
    const { container } = render(<Shimmer />);
    expect(container.firstChild).not.toHaveAttribute('data-direction');
  });

  it('sets data-direction when a direction override is provided', () => {
    const { container } = render(<Shimmer direction="rtl" />);
    expect(container.firstChild).toHaveAttribute('data-direction', 'rtl');
  });

  it('applies a custom shimmer duration via the --shimmer-duration custom property', () => {
    const { container } = render(<Shimmer duration="0.8s" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--shimmer-duration')).toBe('0.8s');
  });

  it('applies an animation delay when provided, for staggering multiple shimmers', () => {
    const { container } = render(<Shimmer delay="200ms" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animationDelay).toBe('200ms');
  });

  it('merges a caller-provided className with the base classes', () => {
    const { container } = render(<Shimmer className="dashboard-skeleton__line--title" />);
    expect(container.firstChild).toHaveClass('sb-shimmer');
    expect(container.firstChild).toHaveClass('dashboard-skeleton__line--title');
  });

  it('lets a caller-provided style object override computed defaults', () => {
    const { container } = render(<Shimmer width="10rem" style={{ width: '20rem' }} />);
    expect((container.firstChild as HTMLElement).style.width).toBe('20rem');
  });

  it('becomes an announced status region when given an aria-label', () => {
    const { container } = render(<Shimmer aria-label="Loading revenue chart" />);
    const el = container.firstChild as HTMLElement;

    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-label', 'Loading revenue chart');
    expect(el).not.toHaveAttribute('aria-hidden');
  });

  it('sets zero animation duration and disables animation when prefers-reduced-motion is enabled', () => {
    setReducedMotion(true);
    const { container } = render(<Shimmer duration="1.6s" />);
    const el = container.firstChild as HTMLElement;

    expect(el.style.getPropertyValue('--shimmer-duration')).toBe('0s');
    expect(Number.parseFloat(el.style.animationDuration || '0')).toBe(0);
  });
});
