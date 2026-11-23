import type {
	SortField,
	SortState,
	StatusType,
	SubscriptionActionError,
	SubscriptionStats,
	SubscriptionWithIcon,
} from "./types";

export const SORT_LABELS: Record<SortField, string> = {
	planName: "Plan name",
	price: "Price",
	nextCharge: "Next charge",
	status: "Status",
};

export function getActionError(error: unknown, fallbackMessage: string): SubscriptionActionError {
	if (!(error instanceof Error)) return { message: fallbackMessage };

	const technicalDetails =
		"technicalDetails" in error && typeof error.technicalDetails === "string"
			? error.technicalDetails
			: undefined;
	return { message: error.message || fallbackMessage, technicalDetails };
}

export function compareDates(a: string, b: string): number {
	if (a === "N/A") return 1;
	if (b === "N/A") return -1;
	return new Date(a).getTime() - new Date(b).getTime();
}

export function sortSubscriptions(
	data: SubscriptionWithIcon[],
	sort: SortState,
): SubscriptionWithIcon[] {
	return [...data].sort((a, b) => {
		let cmp = 0;
		switch (sort.field) {
			case "planName":
				cmp = a.planName.localeCompare(b.planName);
				break;
			case "price":
				cmp = a.price - b.price;
				break;
			case "nextCharge":
				cmp = compareDates(a.nextCharge ?? "N/A", b.nextCharge ?? "N/A");
				break;
			case "status": {
				const order: Record<StatusType, number> = { Active: 0, Paused: 1, Cancelled: 2 };
				cmp = (order[a.status as StatusType] ?? 3) - (order[b.status as StatusType] ?? 3);
				break;
			}
		}
		return sort.direction === "asc" ? cmp : -cmp;
	});
}

export function filterSubscriptions(
	data: SubscriptionWithIcon[],
	activeFilter: string,
): SubscriptionWithIcon[] {
	return activeFilter === "All" ? data : data.filter((sub) => sub.status === activeFilter);
}

export function computeSubscriptionStats(data: SubscriptionWithIcon[]): SubscriptionStats {
	return {
		All: data.length,
		Active: data.filter((s) => s.status === "Active").length,
		Paused: data.filter((s) => s.status === "Paused").length,
		Cancelled: data.filter((s) => s.status === "Cancelled").length,
	};
}

export function formatCoverage(balance: number, price: number): string {
	const count = price > 0 ? Math.floor(balance / price) : 0;
	return count === 1 ? "~1 payment" : `~${count} payments`;
}
