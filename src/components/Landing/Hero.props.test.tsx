import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Hero from './Hero';

/**
 * Focused behaviour coverage for the `HeroProps` contract (issue #786) that the
 * accessibility/structure suite does not exercise: the exact reduced-motion
 * effect wiring, particle style contract, listener teardown and the empty-string
 * href boundary (defaults only apply to `undefined`, never to `""`).
 */
type MQListener = (e: { matches: boolean }) => void;

interface MQMock {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  _listeners: MQListener[];
  _emit: (matches: boolean) => void;
}

const installMatchMedia = (initialMatches = false) => {
  const mq: MQMock = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    _listeners: [],
    _emit(matches: boolean) {
      this.matches = matches;
      this._listeners.forEach((fn) => fn({ matches }));
    },
  };
  mq.addEventListener.mockImplementation((_event: string, fn: MQListener) => {
    mq._listeners.push(fn);
  });
  mq.removeEventListener.mockImplementation((_event: string, fn: MQListener) => {
    mq._listeners = mq._listeners.filter((l) => l !== fn);
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue(mq),
  });
  return mq;
};

const particleContainer = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[class*="particles"]');

describe('Hero props contract', () => {
  beforeEach(() => {
    installMatchMedia(false);
  });

  it('renders exactly 20 decorative particles when motion is allowed', () => {
    const { container } = render(<Hero />);

    const wrap = particleContainer(container);
    expect(wrap).not.toBeNull();
    expect(wrap).toHaveAttribute('aria-hidden', 'true');
    expect(wrap!.children).toHaveLength(20);
  });

  it('gives every particle the bounded inline style contract', () => {
    const { container } = render(<Hero />);

    const wrap = particleContainer(container)!;
    Array.from(wrap.children).forEach((node) => {
      const el = node as HTMLElement;
      const width = parseFloat(el.style.width);
      const height = parseFloat(el.style.height);

      // size = Math.random() * 4 + 2  ->  [2, 6)
      expect(width).toBeGreaterThanOrEqual(2);
      expect(width).toBeLessThan(6);
      expect(height).toBe(width);
      expect(el.style.left).toMatch(/^\d+(\.\d+)?%$/);
      expect(el.style.top).toMatch(/^\d+(\.\d+)?%$/);
      expect(el.style.animationDelay).toMatch(/s$/);
      expect(el.style.animationDuration).toMatch(/s$/);
    });
  });

  it('removes the reduced-motion change listener on unmount', () => {
    const mq = installMatchMedia(false);
    const { unmount } = render(<Hero />);

    expect(mq._listeners).toHaveLength(1);

    unmount();

    expect(mq._listeners).toHaveLength(0);
    expect(mq.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('still renders particles when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });

    const { container } = render(<Hero />);

    expect(particleContainer(container)!.children).toHaveLength(20);
  });

  it('treats empty-string hrefs as explicit overrides, not as missing props', () => {
    render(<Hero primaryHref="" secondaryHref="" />);

    expect(screen.getByTestId('hero-primary-cta')).toHaveAttribute('href', '');
    expect(screen.getByTestId('hero-secondary-cta')).toHaveAttribute('href', '');
  });

  it('uses one default and one override href independently', () => {
    render(<Hero secondaryHref="/enterprise" />);

    expect(screen.getByTestId('hero-primary-cta')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByTestId('hero-secondary-cta')).toHaveAttribute('href', '/enterprise');
  });

  it('does not require either click handler to be supplied', () => {
    expect(() => render(<Hero />)).not.toThrow();
    expect(() => {
      fireEvent.click(screen.getByTestId('hero-primary-cta'));
      fireEvent.click(screen.getByTestId('hero-secondary-cta'));
    }).not.toThrow();
  });

  it('drops particles when the preference flips on and restores them when it flips off', () => {
    const mq = installMatchMedia(false);
    const { container } = render(<Hero />);

    act(() => mq._emit(true));
    expect(particleContainer(container)).toBeNull();

    act(() => mq._emit(false));
    expect(particleContainer(container)!.children).toHaveLength(20);
  });
});
