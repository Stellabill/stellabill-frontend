import { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { motionTokens, getMotionTokens } from './motion';
import { transitionTokens, type TransitionKind } from './transitions';

/*
 * Co-located coverage for the motion and transition tokens (issue #1187).
 *
 * `getMotionTokens()` is the only supported way for animation code to read
 * durations: it must return the real reorder/entry values normally and the
 * instant (0 ms) values when the user prefers reduced motion. The transition
 * table must keep an entry for every `TransitionKind` so route animations
 * never read `undefined`.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const originalMatchMedia = window.matchMedia;

/** Install a `matchMedia` mock whose reduced-motion query matches `reduce`. */
function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  });
}

beforeEach(() => {
  setReducedMotion(false);
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
});

describe('motionTokens', () => {
  it('defines the reorder, entry and reduced-motion base values', () => {
    expect(motionTokens.reorder.duration).toBe(320);
    expect(motionTokens.entry.duration).toBe(200);
    expect(motionTokens.reducedMotion.duration).toBe(0);
    expect(motionTokens.reducedMotion.easing).toBe('linear');
  });
});

describe('getMotionTokens()', () => {
  it('returns the reorder 320 ms / entry 200 ms values normally', () => {
    const tokens = getMotionTokens();

    expect(tokens.reorder.duration).toBe(320);
    expect(tokens.entry.duration).toBe(200);
    expect(tokens.reorder.easing).toBe(motionTokens.reorder.easing);
    expect(tokens.entry.easing).toBe(motionTokens.entry.easing);
  });

  it('queries the reduced-motion media query', () => {
    getMotionTokens();

    expect(window.matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
  });

  it('returns 0 ms durations when prefers-reduced-motion matches', () => {
    setReducedMotion(true);

    const tokens = getMotionTokens();

    expect(tokens.reorder.duration).toBe(0);
    expect(tokens.entry.duration).toBe(0);
    expect(tokens.reorder.easing).toBe('linear');
    expect(tokens.entry.easing).toBe('linear');
  });

  it('switches back to full durations once the preference stops matching', () => {
    setReducedMotion(true);
    expect(getMotionTokens().reorder.duration).toBe(0);

    setReducedMotion(false);
    expect(getMotionTokens().reorder.duration).toBe(320);
    expect(getMotionTokens().entry.duration).toBe(200);
  });

  it('falls back to full durations when matchMedia is unavailable', () => {
    // @ts-expect-error — intentionally removing matchMedia to simulate a restricted env
    delete window.matchMedia;

    const tokens = getMotionTokens();

    expect(tokens.reorder.duration).toBe(320);
    expect(tokens.entry.duration).toBe(200);
  });

  it('reflects the preference when read from a rendered component', async () => {
    const user = userEvent.setup();

    function MotionProbe() {
      const [reduce, setReduce] = useState(false);
      const tokens = getMotionTokens();
      return (
        <button
          type="button"
          onClick={() => {
            setReducedMotion(!reduce);
            setReduce(!reduce);
          }}
          data-testid="motion-probe"
        >
          {`reorder:${tokens.reorder.duration} entry:${tokens.entry.duration}`}
        </button>
      );
    }

    render(<MotionProbe />);
    expect(screen.getByTestId('motion-probe')).toHaveTextContent(
      'reorder:320 entry:200',
    );

    await user.click(screen.getByTestId('motion-probe'));
    expect(screen.getByTestId('motion-probe')).toHaveTextContent(
      'reorder:0 entry:0',
    );
  });
});

describe('transitionTokens', () => {
  const kinds: TransitionKind[] = ['forward', 'backward', 'peer', 'reducedMotion'];

  it('has an entry for every TransitionKind', () => {
    kinds.forEach((kind) => {
      expect(transitionTokens).toHaveProperty(kind);
      expect(transitionTokens[kind]).toBeDefined();
    });
  });

  it('exposes exactly the TransitionKind keys', () => {
    expect(Object.keys(transitionTokens).sort()).toEqual([...kinds].sort());
  });

  it('gives every kind a numeric duration, an easing and a distance', () => {
    kinds.forEach((kind) => {
      const token = transitionTokens[kind];
      expect(typeof token.duration).toBe('number');
      expect(token.duration).toBeGreaterThanOrEqual(0);
      expect(typeof token.easing).toBe('string');
      expect(token.easing.length).toBeGreaterThan(0);
      expect(typeof token.distance).toBe('number');
    });
  });

  it('keeps the reduced-motion transition instant', () => {
    expect(transitionTokens.reducedMotion.duration).toBe(0);
    expect(transitionTokens.reducedMotion.distance).toBe(0);
  });
});
