import { describe, expect, it } from "vitest";
import {
  resolveEffectiveView,
  segmentAnnouncement,
} from "./revenueSplitHelpers";
import type { ComputedPlanShare } from "./revenueSplitUtils";

const baseShare: ComputedPlanShare = {
  planId: "pro",
  planName: "Pro",
  revenue: 200,
  previousRevenue: 100,
  currency: "USDC",
  sharePercent: 50,
  previousSharePercent: 40,
  revenueDeltaPercent: 100,
  shareDeltaPoints: 10,
  seriesIndex: 0,
};

describe("segmentAnnouncement", () => {
  it("formats positive revenue delta announcements", () => {
    expect(segmentAnnouncement(baseShare, "vs last month")).toBe(
      "Pro, 50 percent, +100% vs last month",
    );
  });

  it("formats zero revenue delta with a plus sign", () => {
    expect(
      segmentAnnouncement(
        { ...baseShare, revenueDeltaPercent: 0 },
        "vs previous period",
      ),
    ).toBe("Pro, 50 percent, +0% vs previous period");
  });

  it("formats negative revenue delta with a minus sign", () => {
    expect(
      segmentAnnouncement(
        { ...baseShare, planName: "Basic", sharePercent: 25.5, revenueDeltaPercent: -12.4 },
        "vs last quarter",
      ),
    ).toBe("Basic, 25.5 percent, −12.4% vs last quarter");
  });

  it("formats null revenue delta as new this period", () => {
    expect(
      segmentAnnouncement(
        { ...baseShare, planName: "Enterprise", sharePercent: 12.5, revenueDeltaPercent: null },
        "vs last month",
      ),
    ).toBe("Enterprise, 12.5 percent, new this period");
  });
});

describe("resolveEffectiveView", () => {
  it("falls back from stacked to ranked on narrow viewports", () => {
    expect(resolveEffectiveView("stacked", true)).toBe("ranked");
  });

  it("keeps stacked on wide viewports", () => {
    expect(resolveEffectiveView("stacked", false)).toBe("stacked");
  });

  it("keeps ranked and table regardless of viewport width", () => {
    expect(resolveEffectiveView("ranked", true)).toBe("ranked");
    expect(resolveEffectiveView("ranked", false)).toBe("ranked");
    expect(resolveEffectiveView("table", true)).toBe("table");
    expect(resolveEffectiveView("table", false)).toBe("table");
  });
});
