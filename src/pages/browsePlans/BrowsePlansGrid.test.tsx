import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Plan } from "../../data/catalogPlans";
import BrowsePlansGrid from "./BrowsePlansGrid";

const plan: Plan = {
	id: "1",
	merchant: "Stellar News",
	name: "Premium Access",
	price: 10,
	currency: "USDC",
	interval: "Monthly",
	description: "Premium articles",
	icon: "newspaper",
};

describe("BrowsePlansGrid", () => {
	it("renders plan cards and gift and subscribe actions", () => {
		const onSubscribe = vi.fn();
		const onSendGift = vi.fn();
		render(
			<BrowsePlansGrid
				plans={[plan]}
				loading={false}
				error={null}
				onRetry={vi.fn()}
				onSubscribe={onSubscribe}
				onSendGift={onSendGift}
				onClearFilters={vi.fn()}
			/>,
		);

		expect(screen.getByRole("list", { name: "Available subscription plans" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /Subscribe to Premium Access/ }));
		fireEvent.click(screen.getByRole("button", { name: "Send Premium Access as a gift" }));
		expect(onSubscribe).toHaveBeenCalledWith(plan);
		expect(onSendGift).toHaveBeenCalledWith(plan);
	});

	it("renders an empty state and clear action", () => {
		const onClearFilters = vi.fn();
		render(
			<BrowsePlansGrid
				plans={[]}
				loading={false}
				error={null}
				onRetry={vi.fn()}
				onSubscribe={vi.fn()}
				onSendGift={vi.fn()}
				onClearFilters={onClearFilters}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
		expect(onClearFilters).toHaveBeenCalledOnce();
	});
});
