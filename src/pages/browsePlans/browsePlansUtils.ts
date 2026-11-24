import { addBillingInterval } from "../../utils/billingDate";
import type { Plan, PlanInterval } from "../../data/catalogPlans";

export type SortField = "name" | "price" | "merchant";
export type SortDirection = "asc" | "desc";

export const SORT_OPTIONS = [
	{ value: "name-asc", label: "Name (A–Z)" },
	{ value: "name-desc", label: "Name (Z–A)" },
	{ value: "price-asc", label: "Price (low to high)" },
	{ value: "price-desc", label: "Price (high to low)" },
	{ value: "merchant-asc", label: "Merchant (A–Z)" },
	{ value: "merchant-desc", label: "Merchant (Z–A)" },
];

export function getBillingIntervalCopy(interval: PlanInterval) {
	return interval === "Monthly" ? "Billed every month" : "Billed every year";
}

export function getNextChargeDate(interval: PlanInterval, now = new Date()) {
	const nextCharge = addBillingInterval(
		now,
		interval === "Monthly" ? "monthly" : "yearly",
		1,
	);

	return nextCharge.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function filterAndSortPlans(
	plans: Plan[],
	searchQuery: string,
	intervalFilter: PlanInterval | "All",
	sortField: SortField,
	sortDirection: SortDirection,
) {
	const normalizedSearch = searchQuery.toLowerCase();
	const result = plans.filter((plan) => {
		const matchesSearch =
			plan.name.toLowerCase().includes(normalizedSearch) ||
			plan.merchant.toLowerCase().includes(normalizedSearch) ||
			plan.description.toLowerCase().includes(normalizedSearch);
		const matchesInterval =
			intervalFilter === "All" || plan.interval === intervalFilter;

		return matchesSearch && matchesInterval;
	});

	result.sort((a, b) => {
		let comparison = 0;
		if (sortField === "name") {
			comparison = a.name.localeCompare(b.name);
		} else if (sortField === "price") {
			comparison = a.price - b.price;
		} else if (sortField === "merchant") {
			comparison = a.merchant.localeCompare(b.merchant);
		}
		return sortDirection === "asc" ? comparison : -comparison;
	});

	return result;
}

export function parseSortValue(value: string): {
	sortField: SortField;
	sortDirection: SortDirection;
} {
	const separatorIndex = value.lastIndexOf("-");
	return {
		sortField: value.slice(0, separatorIndex) as SortField,
		sortDirection: value.slice(separatorIndex + 1) as SortDirection,
	};
}
