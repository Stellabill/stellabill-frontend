import { StrictMode, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

/** The skeleton is a zero-prop component: it is always in the loading state. */
const LOADING_LABEL = 'Loading dashboard';

/** The stagger the component hard-codes for each of the four-element lists. */
const STAGGER_MS = [50, 100, 150, 200];

/** The header action placeholders start later, offset by one stagger step. */
const ACTION_STAGGER_MS = [100, 150];

/** Total placeholders rendered: 2 header lines + 2 buttons + 4 KPIs + 2 section
 *  headings + 1 chart + 4 activity rows. */
const PLACEHOLDER_COUNT = 15;

const shimmers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.sb-shimmer'));

/**
 * Delays are built as `${i * 0.05}s`, so JS float arithmetic leaks into the
 * serialized value (`0.15000000000000002s` at i=3). Browsers parse that back to
 * 0.15s, so the tests compare whole milliseconds — the behavior that actually
 * matters — instead of freezing the float artifact into the contract.
 */
const delayMs = (el: HTMLElement) => {
  const raw = el.style.animationDelay;
  return raw === '' ? null : Math.round(Number.parseFloat(raw) * 1000);
};

const delaysMs = (container: HTMLElement, selector: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(selector)).map(delayMs);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DashboardSkeleton — root status region', () => {
  it('renders a single busy status region labelled as the loading dashboard', () => {
    render(<DashboardSkeleton />);

    const root = document.querySelector('.dashboard-skeleton');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).toHaveAttribute('aria-label', LOADING_LABEL);
  });

  it('exposes exactly one role="status" region so loading is announced once', () => {
    render(<DashboardSkeleton />);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status', { name: LOADING_LABEL })).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('does not claim failure while loading', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
  });

  it('marks every nested shimmer decorative rather than a nested live region', () => {
    const { container } = render(<DashboardSkeleton />);

    const placeholders = shimmers(container);
    expect(placeholders).toHaveLength(PLACEHOLDER_COUNT);
    for (const shimmer of placeholders) {
      expect(shimmer).toHaveAttribute('aria-hidden', 'true');
      expect(shimmer).not.toHaveAttribute('role');
      expect(shimmer).not.toHaveAttribute('aria-label');
    }
  });

  it('renders no readable text and no interactive elements while loading', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.textContent).toBe('');
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('input')).toBeNull();
  });

  it('renders the skeleton as the root node with no wrapper element around it', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.firstElementChild).toBe(
      document.querySelector('.dashboard-skeleton')
    );
    expect(document.querySelectorAll('.dashboard-skeleton')).toHaveLength(1);
  });
});

describe('DashboardSkeleton — placeholder structure', () => {
  it('renders the header, KPI, and main regions exactly once each', () => {
    const { container } = render(<DashboardSkeleton />);

    for (const region of [
      'dashboard-skeleton__header',
      'dashboard-skeleton__kpis',
      'dashboard-skeleton__main',
      'dashboard-skeleton__side',
      'dashboard-skeleton__list',
      'dashboard-skeleton__actions',
    ]) {
      expect(document.querySelectorAll('.' + region), region).toHaveLength(1);
    }

    // `__stack` appears twice: the header text stack and the chart column.
    expect(container.querySelectorAll('.dashboard-skeleton__stack')).toHaveLength(2);
    expect(container.querySelectorAll('.dashboard-skeleton__chart-column')).toHaveLength(1);
  });

  it('renders a title, a subtitle, and two section-heading placeholders', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.querySelectorAll('.dashboard-skeleton__line--title')).toHaveLength(1);
    expect(container.querySelectorAll('.dashboard-skeleton__line--subtitle')).toHaveLength(1);
    expect(container.querySelectorAll('.dashboard-skeleton__line--section')).toHaveLength(2);
  });

  it('renders four KPI card placeholders staggered in order', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.querySelectorAll('.dashboard-skeleton__card')).toHaveLength(4);
    expect(delaysMs(container, '.dashboard-skeleton__card')).toEqual(STAGGER_MS);
  });

  it('renders four activity placeholders staggered in order', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.querySelectorAll('.dashboard-skeleton__activity')).toHaveLength(4);
    expect(delaysMs(container, '.dashboard-skeleton__activity')).toEqual(STAGGER_MS);
  });

  it('renders two header action placeholders offset one stagger step', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.querySelectorAll('.dashboard-skeleton__button')).toHaveLength(2);
    expect(delaysMs(container, '.dashboard-skeleton__button')).toEqual(ACTION_STAGGER_MS);
  });

  it('renders a single chart placeholder standing in for the revenue chart', () => {
    const { container } = render(<DashboardSkeleton />);

    const chartColumn = container.querySelector('.dashboard-skeleton__chart-column');
    expect(chartColumn).toBeInTheDocument();

    const chart = container.querySelectorAll('.dashboard-skeleton__chart');
    expect(chart).toHaveLength(1);
    expect(chartColumn).toContainElement(chart[0]);
    expect(delayMs(chart[0])).toBe(100);
  });

  it('leaves the title placeholder un-delayed and the subtitle at 50ms', () => {
    const { container } = render(<DashboardSkeleton />);

    const stack = container.querySelector(
      '.dashboard-skeleton__header .dashboard-skeleton__stack'
    );
    const [title, subtitle] = shimmers(stack as HTMLElement);

    expect(title).toHaveClass('dashboard-skeleton__line--title');
    expect(delayMs(title)).toBeNull();
    expect(subtitle).toHaveClass('dashboard-skeleton__line--subtitle');
    expect(delayMs(subtitle)).toBe(50);
  });

  it('keeps the generated stagger strictly increasing within one step of 50ms', () => {
    const { container } = render(<DashboardSkeleton />);

    for (const selector of [
      '.dashboard-skeleton__card',
      '.dashboard-skeleton__activity',
    ]) {
      const delays = delaysMs(container, selector);
      expect(delays).toHaveLength(4);
      for (let i = 0; i < delays.length; i += 1) {
        expect(delays[i]).toBeGreaterThan(delays[i - 1] ?? 0);
        expect(Math.abs((delays[i] ?? 0) - (i + 1) * 50)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('gives every placeholder the shared shimmer base and block-shape classes', () => {
    const { container } = render(<DashboardSkeleton />);

    for (const shimmer of shimmers(container)) {
      expect(shimmer).toHaveClass('sb-shimmer');
      expect(shimmer).toHaveClass('sb-shimmer--block');
      // Each placeholder also needs a layout class so the CSS can size it.
      const layoutClasses = Array.from(shimmer.classList).filter((name) =>
        name.startsWith('dashboard-skeleton__')
      );
      expect(layoutClasses.length, shimmer.className).toBeGreaterThan(0);
    }
  });

  it('does not force a sweep direction so RTL layouts inherit the ambient direction', () => {
    const { container } = render(
      <div dir="rtl">
        <DashboardSkeleton />
      </div>
    );

    expect(document.querySelector('.dashboard-skeleton')).not.toHaveAttribute('dir');
    for (const shimmer of shimmers(container)) {
      expect(shimmer).not.toHaveAttribute('data-direction');
    }
  });
});

describe('DashboardSkeleton — representative invalid inputs', () => {
  /** The component declares no props, so these casts stand in for callers
   *  that pass unsupported props or children. */
  const Untyped = DashboardSkeleton as unknown as ComponentType<Record<string, unknown>>;

  it('ignores unknown props instead of spreading them onto the DOM', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Untyped id="hijacked" data-testid="injected" aria-hidden="true" />);

    const root = document.querySelector('.dashboard-skeleton');
    expect(root).not.toHaveAttribute('id');
    expect(root).not.toHaveAttribute('data-testid');
    // The caller's `aria-hidden` must not hide the loading announcement.
    expect(root).not.toHaveAttribute('aria-hidden');
    expect(screen.queryByTestId('injected')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("keeps its own role when a caller tries to override it with role=\"alert\"", () => {
    render(<Untyped role="alert" />);

    const root = document.querySelector('.dashboard-skeleton');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores children so placeholder markup cannot be overridden', () => {
    const WithChildren = DashboardSkeleton as unknown as ComponentType<{
      children?: ReactNode;
    }>;
    const { container } = render(
      <WithChildren>
        <span>injected child</span>
      </WithChildren>
    );

    expect(container.textContent).toBe('');
    expect(screen.queryByText('injected child')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.sb-shimmer')).toHaveLength(PLACEHOLDER_COUNT);
  });

  it('emits no React key, prop, or unknown-attribute warnings while rendering', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DashboardSkeleton />);

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('emits no warnings and stays a single status region inside StrictMode', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <StrictMode>
        <DashboardSkeleton />
      </StrictMode>
    );

    // StrictMode double-invokes render; the tree must not be duplicated.
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(document.querySelectorAll('.sb-shimmer')).toHaveLength(PLACEHOLDER_COUNT);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe('DashboardSkeleton — lifecycle', () => {
  it('never self-dismisses: advancing time leaves the skeleton in place', async () => {
    vi.useFakeTimers();
    try {
      render(<DashboardSkeleton />);
      const root = document.querySelector('.dashboard-skeleton');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      // Only the parent may end the loading state, so the markup is unchanged.
      expect(document.querySelector('.dashboard-skeleton')).toBe(root);
      expect(screen.getAllByRole('status')).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('removes every node from the document on unmount', () => {
    const { unmount } = render(<DashboardSkeleton />);
    expect(document.querySelector('.dashboard-skeleton')).toBeInTheDocument();

    unmount();

    expect(document.querySelector('.dashboard-skeleton')).toBeNull();
    expect(document.querySelectorAll('.sb-shimmer')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('produces identical markup on re-render because it holds no state', () => {
    const { container, rerender } = render(<DashboardSkeleton />);
    const first = container.innerHTML;

    rerender(<DashboardSkeleton />);

    expect(container.innerHTML).toBe(first);
  });
});

type LoadState = 'loading' | 'ready' | 'error' | 'partial-error';

/**
 * Mirrors the `isInitialLoading` gate in `src/pages/Dashboard.tsx:116` so the
 * primary state transitions out of the skeleton are exercised end to end.
 */
function DashboardHarness({ state }: { state: LoadState }) {
  if (state === 'loading') return <DashboardSkeleton />;

  if (state === 'error') {
    return (
      <div role="alert">
        <p>Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard Overview</h1>
      {state === 'partial-error' && (
        <div role="status" className="dashboard-partial-error-banner">
          1 section failed to load.
        </div>
      )}
    </div>
  );
}

function HarnessUnderTest({ load }: { load: () => Promise<LoadState> }) {
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    load().then(
      (next) => {
        if (!cancelled) setState(next);
      },
      () => {
        if (!cancelled) setState('error');
      }
    );
    return () => {
      cancelled = true;
    };
  }, [load]);

  return <DashboardHarness state={state} />;
}

describe('DashboardSkeleton — loading state transitions', () => {
  it('shows the skeleton while loading, then unmounts it once the load resolves', async () => {
    let resolveLoad: (state: LoadState) => void = () => {};
    const pending = new Promise<LoadState>((resolve) => {
      resolveLoad = resolve;
    });
    const load = () => pending;

    render(<HarnessUnderTest load={load} />);

    expect(screen.getByRole('status', { name: LOADING_LABEL })).toBeInTheDocument();
    expect(document.querySelectorAll('.sb-shimmer')).toHaveLength(PLACEHOLDER_COUNT);
    expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument();

    await act(async () => {
      resolveLoad('ready');
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });
    expect(document.querySelector('.dashboard-skeleton')).toBeNull();
    expect(document.querySelectorAll('.sb-shimmer')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(0);
  });

  it('leaves no stale busy region behind when the load fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('network down');
    const load = () => Promise.reject(failure);

    render(<HarnessUnderTest load={load} />);

    expect(screen.getByRole('status', { name: LOADING_LABEL })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard data.');
    });

    // The failure replaces — rather than augments — the loading announcement.
    expect(screen.queryByRole('status', { name: LOADING_LABEL })).not.toBeInTheDocument();
    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(0);
    expect(document.querySelectorAll('.sb-shimmer')).toHaveLength(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('hands aria-busy over to the resolved page when a widget fails partially', async () => {
    let resolveLoad: (state: LoadState) => void = () => {};
    const pending = new Promise<LoadState>((resolve) => {
      resolveLoad = resolve;
    });
    const load = () => pending;

    render(<HarnessUnderTest load={load} />);

    expect(screen.getByRole('status', { name: LOADING_LABEL })).toBeInTheDocument();

    await act(async () => {
      resolveLoad('partial-error');
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('1 section failed to load.');
    });
    // Exactly one status region, and it is no longer the busy loading region.
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(0);
    expect(document.querySelectorAll('.sb-shimmer')).toHaveLength(0);
  });

  it('survives unmounting while still loading without an unhandled rejection', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = () => Promise.reject(new Error('network down'));

    const { unmount } = render(<HarnessUnderTest load={load} />);
    expect(screen.getByRole('status', { name: LOADING_LABEL })).toBeInTheDocument();

    unmount();
    await act(async () => {
      await Promise.resolve();
    });

    expect(document.querySelector('.dashboard-skeleton')).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
