import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BrowsePlansFilterBar from "./BrowsePlansFilterBar";

describe("BrowsePlansFilterBar", () => {
	it("renders and forwards search, interval, sort, and clear-filter actions", () => {
		const onSearchChange = vi.fn();
		const onIntervalChange = vi.fn();
		const onSortChange = vi.fn();
		const onClearFilters = vi.fn();
		render(
			<BrowsePlansFilterBar
				searchQuery=""
				onSearchChange={onSearchChange}
				intervalFilter="All"
				onIntervalChange={onIntervalChange}
				sortField="name"
				sortDirection="asc"
				onSortChange={onSortChange}
				onClearFilters={onClearFilters}
			/>,
		);

		fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pro" } });
		fireEvent.change(screen.getByRole("combobox", { name: "Filter plans by billing interval" }), {
			target: { value: "Monthly" },
		});
		fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });

		expect(onSearchChange).toHaveBeenCalledWith("pro");
		expect(onIntervalChange).toHaveBeenCalledWith("Monthly");
		expect(onClearFilters).toHaveBeenCalledOnce();
		expect(onSortChange).not.toHaveBeenCalled();
	});
});
