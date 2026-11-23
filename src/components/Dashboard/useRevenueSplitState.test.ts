import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useIsNarrowViewport,
  useRevenueSplitState,
} from "./useRevenueSplitState";

function mockMatchMedia(matches: boolean) {
  let listener: (() => void) | null = null;
  const mql = {
    matches,
    media: "(max-width: 639px)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_event: string, cb: () => void) => {
      listener = cb;
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => mql),
  });

  return {
    setMatches(next: boolean) {
      mql.matches = next;
      listener?.();
    },
  };
}

describe("useIsNarrowViewport", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("tracks viewport width changes via matchMedia", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useIsNarrowViewport());
    expect(result.current).toBe(false);

    act(() => {
      media.setMatches(true);
    });
    expect(result.current).toBe(true);
  });
});

describe("useRevenueSplitState", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("groups view, liveMessage, and narrow-viewport fallback", () => {
    const media = mockMatchMedia(false);
    const { result, rerender } = renderHook(
      ({ summary }) => useRevenueSplitState("stacked", summary),
      { initialProps: { summary: "Initial summary" } },
    );

    expect(result.current.view).toBe("stacked");
    expect(result.current.effectiveView).toBe("stacked");
    expect(result.current.liveMessage).toBe("Initial summary");

    act(() => {
      result.current.announce("Custom announcement");
    });
    expect(result.current.liveMessage).toBe("Custom announcement");

    act(() => {
      media.setMatches(true);
    });
    expect(result.current.isNarrow).toBe(true);
    expect(result.current.effectiveView).toBe("ranked");

    act(() => {
      result.current.setView("table");
    });
    expect(result.current.effectiveView).toBe("table");

    rerender({ summary: "Updated summary" });
    expect(result.current.liveMessage).toBe("Updated summary");
  });
});
