import { describe, expect, it } from "vitest";
import { formatDisplayAmount, toMinorUnits } from "./topUpAmount";

describe("toMinorUnits", () => {
  it("converts numbers and decimal strings to seven-place minor units", () => {
    expect(toMinorUnits(12.3456789)).toBe(123456789n);
    expect(toMinorUnits("0.0000001")).toBe(1n);
    expect(toMinorUnits(".5")).toBe(5_000_000n);
  });

  it("returns zero for empty, non-finite, and non-positive numeric values", () => {
    expect(toMinorUnits("")).toBe(0n);
    expect(toMinorUnits(".")).toBe(0n);
    expect(toMinorUnits(Number.POSITIVE_INFINITY)).toBe(0n);
    expect(toMinorUnits(0)).toBe(0n);
  });
});

describe("formatDisplayAmount", () => {
  it("shows at least two decimal places and preserves up to seven", () => {
    expect(formatDisplayAmount(5)).toBe("5.00");
    expect(formatDisplayAmount(1.2)).toBe("1.20");
    expect(formatDisplayAmount(1.2345678)).toBe("1.2345678");
  });
});
