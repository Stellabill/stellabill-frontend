import SortBySelect from "../../components/SortBySelect";
import type { PlanInterval } from "../../data/catalogPlans";
import { SORT_OPTIONS, type SortDirection, type SortField } from "./browsePlansUtils";

interface BrowsePlansFilterBarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	intervalFilter: PlanInterval | "All";
	onIntervalChange: (value: PlanInterval | "All") => void;
	sortField: SortField;
	sortDirection: SortDirection;
	onSortChange: (value: string) => void;
	onClearFilters: () => void;
}

export default function BrowsePlansFilterBar({
	searchQuery,
	onSearchChange,
	intervalFilter,
	onIntervalChange,
	sortField,
	sortDirection,
	onSortChange,
	onClearFilters,
}: BrowsePlansFilterBarProps) {
	return (
		<div
			style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
			<div style={{ flex: "1 1 300px", position: "relative" }}>
				<svg
					style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#64748b" }}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="search"
					placeholder="Search plans..."
					value={searchQuery}
					onChange={(event) => onSearchChange(event.target.value)}
					style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#ffffff", fontSize: "0.875rem", outline: "none" }}
					onFocus={(event) => (event.currentTarget.style.borderColor = "#22d3ee")}
					onBlur={(event) => (event.currentTarget.style.borderColor = "#2a2a2a")}
					onKeyDown={(event) => {
						if (event.key === "Escape") onClearFilters();
					}}
					aria-label="Search plans by name, merchant, or description"
				/>
			</div>

			<select
				value={intervalFilter}
				onChange={(event) => onIntervalChange(event.target.value as PlanInterval | "All")}
				style={{ padding: "0.75rem 1rem", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#ffffff", fontSize: "0.875rem", cursor: "pointer", outline: "none" }}
				onFocus={(event) => (event.currentTarget.style.borderColor = "#22d3ee")}
				onBlur={(event) => (event.currentTarget.style.borderColor = "#2a2a2a")}
				aria-label="Filter plans by billing interval">
				<option value="All">All billing intervals</option>
				<option value="Monthly">Billed every month</option>
				<option value="Yearly">Billed every year</option>
			</select>

			<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
				<span id="browse-sort-label" style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
					Sort by:
				</span>
				<div style={{ minWidth: 210 }}>
					<SortBySelect
						value={`${sortField}-${sortDirection}`}
						onValueChange={onSortChange}
						options={SORT_OPTIONS}
						labelId="browse-sort-label"
						ariaLabel="Sort plans"
					/>
				</div>
			</div>
		</div>
	);
}
