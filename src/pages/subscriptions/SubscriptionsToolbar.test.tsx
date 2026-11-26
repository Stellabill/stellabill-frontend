import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubscriptionFilterTabs, SubscriptionSortToolbar } from "./SubscriptionsToolbar";

describe("SubscriptionsToolbar", () => {
	describe("SubscriptionFilterTabs", () => {
		const stats = { All: 4, Active: 2, Paused: 1, Cancelled: 1 };

		it("renders all filter tabs with counts and marks active tab as pressed", () => {
			const onFilterChange = vi.fn();
			render(
				<SubscriptionFilterTabs
					activeFilter="Active"
					stats={stats}
					onFilterChange={onFilterChange}
				/>,
			);

			const activeBtn = document.getElementById("filter-tab-active");
			const allBtn = document.getElementById("filter-tab-all");
			expect(activeBtn).toHaveAttribute("aria-pressed", "true");
			expect(allBtn).toHaveAttribute("aria-pressed", "false");
			expect(activeBtn?.textContent).toContain("(2)");
		});

		it("calls onFilterChange when a tab is clicked", () => {
			const onFilterChange = vi.fn();
			render(
				<SubscriptionFilterTabs
					activeFilter="All"
					stats={stats}
					onFilterChange={onFilterChange}
				/>,
			);

			const pausedBtn = document.getElementById("filter-tab-paused");
			fireEvent.click(pausedBtn!);
			expect(onFilterChange).toHaveBeenCalledWith("Paused");
		});
	});

	describe("SubscriptionSortToolbar", () => {
		it("renders sort buttons, indicates active sort direction, and announces sort state", () => {
			const onSortField = vi.fn();
			render(
				<SubscriptionSortToolbar
					sort={{ field: "price", direction: "desc" }}
					onSortField={onSortField}
				/>,
			);

			const priceBtn = screen.getByRole("button", { name: /Sort by Price, currently descending/i });
			expect(priceBtn).toHaveAttribute("aria-pressed", "true");
			expect(priceBtn.textContent).toContain("↓");
			expect(screen.getByRole("status")).toHaveTextContent("Sorted by Price, descending");

			fireEvent.click(screen.getByRole("button", { name: /Sort by Plan name/i }));
			expect(onSortField).toHaveBeenCalledWith("planName");
		});
	});
});
