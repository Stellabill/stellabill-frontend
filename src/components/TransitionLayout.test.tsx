import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import TransitionLayout from './TransitionLayout';
import { transitionTokens } from '../design/tokens/transitions';

/*
 * Regression coverage for TransitionLayout (issue #841).
 *
 * The component derives its animation kind from `useNavigationType()` and
 * `prefers-reduced-motion`, then hands a different variants object to
 * framer-motion for each case. These tests pin each branch so a refactor
 * cannot silently change the direction, duration, or reduced-motion
 * fallback of route transitions.
 */

// Controlled navigation type. Declared with `vi.hoisted` so the `vi.mock`
// factory (hoisted above imports) can read it safely.
const routerState = vi.hoisted(() => ({
  navType: 'POP' as 'PUSH' | 'POP' | 'REPLACE' | 'UNKNOWN',
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigationType: () => routerState.navType,
  };
});

// framer-motion is replaced with plain divs that expose the variants so the
// tests can assert on them without depending on animation frame timing.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const MotionDiv = React.forwardRef<HTMLDivElement, Record<string, unknown>>(
    (props, ref) => {
      const { children, variants, initial, animate, exit, ...rest } = props;
      return (
        <div
          ref={ref}
          data-testid="transition-surface"
          data-variants={JSON.stringify(variants ?? null)}
          data-initial={String(initial)}
          data-animate={String(animate)}
          data-exit={String(exit)}
          {...rest}
        >
          {children as ReactNode}
        </div>
      );
    },
  );
  MotionDiv.displayName = 'MotionDiv';
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

function renderLayout(routeElement: ReactNode = <div>route content</div>) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<TransitionLayout />}>
          <Route path="/" element={routeElement} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function variants(): {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  exit: Record<string, unknown>;
} {
  const surface = screen.getByTestId('transition-surface');
  return JSON.parse(surface.getAttribute('data-variants') ?? 'null');
}

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

describe('TransitionLayout', () => {
  beforeEach(() => {
    routerState.navType = 'POP';
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the active route through <Outlet />', () => {
    renderLayout(<div>dashboard body</div>);
    expect(screen.getByText('dashboard body')).toBeInTheDocument();
  });

  it('does not trap assistive technology: the surface is aria-live="polite"', () => {
    renderLayout();
    expect(screen.getByTestId('transition-surface')).toHaveAttribute('aria-live', 'polite');
  });

  it('animates forward (slide from the right) on PUSH navigation', () => {
    routerState.navType = 'PUSH';
    renderLayout();
    const v = variants();
    expect(v.initial).toMatchObject({ x: transitionTokens.forward.distance });
    expect(v.animate).toMatchObject({ x: 0 });
    expect(v.exit).toMatchObject({ x: -transitionTokens.forward.distance });
    expect((v.animate.transition as { duration: number }).duration).toBe(
      transitionTokens.forward.duration / 1000,
    );
  });

  it('animates backward (slide from the left) on POP navigation', () => {
    routerState.navType = 'POP';
    renderLayout();
    const v = variants();
    // `backward.distance` is negative, so the sign is flipped for the entry.
    expect(v.initial).toMatchObject({ x: -transitionTokens.backward.distance });
    expect(v.animate).toMatchObject({ x: 0 });
    expect(v.exit).toMatchObject({ x: transitionTokens.backward.distance });
  });

  it('cross-fades without translation on REPLACE (peer) navigation', () => {
    routerState.navType = 'REPLACE';
    renderLayout();
    const v = variants();
    expect(v.initial).toEqual({ opacity: 0 });
    expect((v.animate as { opacity: number }).opacity).toBe(1);
    expect((v.exit as { opacity: number }).opacity).toBe(0);
    // Peer transitions must not introduce horizontal movement.
    expect(v.initial).not.toHaveProperty('x');
    expect(v.animate).not.toHaveProperty('x');
    expect(v.exit).not.toHaveProperty('x');
  });

  it('falls back to the forward transition for an unknown navigation type', () => {
    routerState.navType = 'UNKNOWN';
    renderLayout();
    expect(variants().initial).toMatchObject({ x: transitionTokens.forward.distance });
  });

  it('suppresses movement when the user prefers reduced motion', () => {
    setReducedMotion(true);
    routerState.navType = 'PUSH';
    renderLayout();
    const v = variants();
    expect(v.initial).toEqual({});
    expect(v.animate).toEqual({});
    expect(v.exit).toEqual({});
  });

  it('moves focus to the first heading in <main> after the transition duration', () => {
    vi.useFakeTimers();
    routerState.navType = 'PUSH';
    renderLayout(
      <main>
        <h1 tabIndex={-1}>Overview</h1>
      </main>,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(document.activeElement).not.toBe(heading);

    act(() => {
      vi.advanceTimersByTime(transitionTokens.forward.duration);
    });

    expect(document.activeElement).toBe(heading);
  });

  it('does not throw when the new route has no heading to focus', () => {
    vi.useFakeTimers();
    renderLayout(<main><p>no heading here</p></main>);
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(transitionTokens.backward.duration);
      });
    }).not.toThrow();
  });
});
