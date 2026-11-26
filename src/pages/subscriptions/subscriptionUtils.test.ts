import { describe, it, expect } from "vitest";
import {
	compareDates,
	computeSubscriptionStats,
	filterSubscriptions,
	formatCoverage,
	getActionError,
	sortSubscriptions,
} from "./subscriptionUtils";
import type { SubscriptionWithIcon } from "./types";

const makeSub = (overrides: Partial<SubscriptionWithIcon> = {}): SubscriptionWithIcon => ({
	id: "SUB-1",
	planName: "Alpha Plan",
	merchantName: "Acme",
	status: "Active",
	price: 10,
	currency: "USDC",
	interval: "month",
	prepaidBalance: 30,
	coverage: "~3 payments",
	nextCharge: "Mar 15, 2026",
	lastPayment: "Feb 15, 2026",
	subscribedSince: "Jan 15, 2026",
	icon: null,
	...overrides,
});

describe("subscriptionUtils", () => {
	describe("compareDates", () => {
		it("sorts valid dates chronologically", () => {
			expect(compareDates("Mar 15, 2026", "Mar 20, 2026")).toBeLessThan(0);
			expect(compareDates("Apr 01, 2026", "Mar 15, 2026")).toBeGreaterThan(0);
			expect(compareDates("Mar 15, 2026", "Mar 15, 2026")).toBe(0);
		});

		it("places N/A after valid dates", () => {
			expect(compareDates("N/A", "Mar 15, 2026")).toBe(1);
			expect(compareDates("Mar 15, 2026", "N/A")).toBe(-1);
		});
	});

	describe("sortSubscriptions", () => {
		const subs: SubscriptionWithIcon[] = [
			makeSub({ id: "1", planName: "Pro Plan", price: 25, status: "Active", nextCharge: "Mar 20, 2026" }),
			makeSub({ id: "2", planName: "Basic Stream", price: 5, status: "Paused", nextCharge: "Apr 01, 2026" }),
			makeSub({ id: "3", planName: "Enterprise AI", price: 50, status: "Cancelled", nextCharge: "N/A" }),
		];

		it("sorts by planName ascending and descending without mutating input", () => {
			const asc = sortSubscriptions(subs, { field: "planName", direction: "asc" });
			expect(asc.map((s) => s.planName)).toEqual(["Basic Stream", "Enterprise AI", "Pro Plan"]);
			expect(subs[0].planName).toBe("Pro Plan");

			const desc = sortSubscriptions(subs, { field: "planName", direction: "desc" });
			expect(desc.map((s) => s.planName)).toEqual(["Pro Plan", "Enterprise AI", "Basic Stream"]);
		});

		it("sorts by price ascending and descending", () => {
			const asc = sortSubscriptions(subs, { field: "price", direction: "asc" });
			expect(asc.map((s) => s.price)).toEqual([5, 25, 50]);

			const desc = sortSubscriptions(subs, { field: "price", direction: "desc" });
			expect(desc.map((s) => s.price)).toEqual([50, 25, 5]);
		});

		it("sorts by status in Active -> Paused -> Cancelled order", () => {
			const asc = sortSubscriptions(subs, { field: "status", direction: "asc" });
			expect(asc.map((s) => s.status)).toEqual(["Active", "Paused", "Cancelled"]);

			const desc = sortSubscriptions(subs, { field: "status", direction: "desc" });
			expect(desc.map((s) => s.status)).toEqual(["Cancelled", "Paused", "Active"]);
		});

		it("sorts by nextCharge date with N/A last in ascending order", () => {
			const asc = sortSubscriptions(subs, { field: "nextCharge", direction: "asc" });
			expect(asc.map((s) => s.nextCharge)).toEqual(["Mar 20, 2026", "Apr 01, 2026", "N/A"]);
		});
	});

	describe("filterSubscriptions", () => {
		const subs = [
			makeSub({ id: "1", status: "Active" }),
			makeSub({ id: "2", status: "Paused" }),
			makeSub({ id: "3", status: "Cancelled" }),
		];

		it("returns all items when filter is All", () => {
			expect(filterSubscriptions(subs, "All")).toHaveLength(3);
		});

		it("filters by exact status", () => {
			expect(filterSubscriptions(subs, "Active").map((s) => s.id)).toEqual(["1"]);
			expect(filterSubscriptions(subs, "Paused").map((s) => s.id)).toEqual(["2"]);
			expect(filterSubscriptions(subs, "Cancelled").map((s) => s.id)).toEqual(["3"]);
		});
	});

	describe("computeSubscriptionStats", () => {
		it("computes counts for each status bucket", () => {
			const subs = [
				makeSub({ id: "1", status: "Active" }),
				makeSub({ id: "2", status: "Active" }),
				makeSub({ id: "3", status: "Paused" }),
				makeSub({ id: "4", status: "Cancelled" }),
			];
			expect(computeSubscriptionStats(subs)).toEqual({
				All: 4,
				Active: 2,
				Paused: 1,
				Cancelled: 1,
			});
		});
	});

	describe("formatCoverage", () => {
		it("formats singular and plural payment coverage", () => {
			expect(formatCoverage(10, 10)).toBe("~1 payment");
			expect(formatCoverage(30, 10)).toBe("~3 payments");
			expect(formatCoverage(0, 10)).toBe("~0 payments");
			expect(formatCoverage(50, 0)).toBe("~0 payments");
		});
	});

	describe("getActionError", () => {
		it("returns fallback message for non-Error values", () => {
			expect(getActionError("boom", "Fallback")).toEqual({ message: "Fallback" });
		});

		it("extracts message and technicalDetails from Error instances", () => {
			const err = Object.assign(new Error("Request failed"), { technicalDetails: "HTTP 500" });
			expect(getActionError(err, "Fallback")).toEqual({
				message: "Request failed",
				technicalDetails: "HTTP 500",
			});
		});
	});
});
