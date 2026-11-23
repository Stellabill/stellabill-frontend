import { useEffect, useState } from "react";
import {
  resolveEffectiveView,
  type RevenueSplitView,
} from "./revenueSplitHelpers";

const NARROW_QUERY = "(max-width: 639px)";

export function useIsNarrowViewport(): boolean {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(NARROW_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(NARROW_QUERY);
    const onChange = () => setIsNarrow(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isNarrow;
}

export function useRevenueSplitState(
  defaultView: RevenueSplitView,
  summary: string,
) {
  const [view, setView] = useState<RevenueSplitView>(defaultView);
  const [liveMessage, setLiveMessage] = useState("");
  const isNarrow = useIsNarrowViewport();

  useEffect(() => {
    setLiveMessage(summary);
  }, [summary]);

  const announce = (message: string) => {
    setLiveMessage(message);
  };

  const effectiveView = resolveEffectiveView(view, isNarrow);

  return {
    view,
    setView,
    isNarrow,
    effectiveView,
    liveMessage,
    announce,
  };
}
