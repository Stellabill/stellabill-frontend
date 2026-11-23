import { describe, expect, it } from "vitest";
import type { Plan } from "../../data/catalogPlans";
import {
	filterAndSortPlans,
	getBillingIntervalCopy,
	getNextChargeDate,
	parseSortValue,
} from "./browsePlansUtils";

const plans: Plan[] = [
	{
		id: "1",
		merchant: "Zulu",
		name: "Beta",
		price: 20,
		currency: "USDC",
		interval: "Monthly",
		description: "Monthly plan",
		icon: "cloud",
	},
	{
		id: "2",
		merchant: "Alpha",
		name: "Alpha",
		price: 10,
		currency: "USDC",
		interval: "Yearly",
		description: "Annual plan",
		icon: "chart",
	},
];

describe("browsePlansUtils", () => {
	it("returns billing interval copy", () => {
		expect(getBillingIntervalCopy("Monthly")).toBe("Billed every month");
		expect(getBillingIntervalCopy("Yearly")).toBe("Billed every year");
	});

	it("returns a preview of the next charge date", () => {
		expect(getNextChargeDate("Monthly", new Date("2026-01-15T12:00:00Z")))
			.toMatch(/\d/);
		expect(getNextChargeDate("Yearly", new Date("2026-01-15T12:00:00Z")))
			.toMatch(/\d/);
	});

	it("filters by search and interval", () => {
		expect(
			filterAndSortPlans(plans, "alpha", "All", "name", "asc").map((plan) => plan.id),
		).toEqual(["2"]);
		expect(
			filterAndSortPlans(plans, "", "Monthly", "name", "asc").map((plan) => plan.id),
		).toEqual(["1"]);
	});

	it("sorts plans by price in descending order", () => {
		expect(
			filterAndSortPlans(plans, "", "All", "price", "desc").map((plan) => plan.id),
		).toEqual(["1", "2"]);
	});

	it("parses sort values", () => {
		expect(parseSortValue("merchant-desc")).toEqual({
			sortField: "merchant",
			sortDirection: "desc",
		});
	});
});
