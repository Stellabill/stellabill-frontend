import { useTranslation } from "react-i18next";
import { SORT_LABELS } from "./subscriptionUtils";
import type { FilterTab, SortField, SortState, SubscriptionStats } from "./types";

const FILTER_TABS: readonly FilterTab[] = ["All", "Active", "Paused", "Cancelled"];
const SORT_FIELDS: readonly SortField[] = ["planName", "price", "status", "nextCharge"];

interface SortButtonProps {
	field: SortField;
	sort: SortState;
	onSort: (field: SortField) => void;
}

export function SortButton({ field, sort, onSort }: SortButtonProps) {
	const isActive = sort.field === field;
	const indicator = isActive ? (sort.direction === "asc" ? " ↑" : " ↓") : "";
	return (
		<button
			type="button"
			className={`sort-btn${isActive ? " sort-btn--active" : ""}`}
			onClick={() => onSort(field)}
			aria-label={`Sort by ${SORT_LABELS[field]}${isActive ? `, currently ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}`}
			aria-pressed={isActive}>
			{SORT_LABELS[field]}{indicator}
		</button>
	);
}

interface FilterTabsProps {
	activeFilter: string;
	stats: SubscriptionStats;
	onFilterChange: (tab: FilterTab) => void;
}

export function SubscriptionFilterTabs({
	activeFilter,
	stats,
	onFilterChange,
}: FilterTabsProps) {
	const { t } = useTranslation();

	return (
		<div className="filter-tabs" role="group" aria-label="Filter subscriptions by status">
			{FILTER_TABS.map((tab) => (
				<button
					key={tab}
					id={`filter-tab-${tab.toLowerCase()}`}
					className={`filter-tab${activeFilter === tab ? " active" : ""}`}
					onClick={() => onFilterChange(tab)}
					aria-pressed={activeFilter === tab}
					aria-label={t('subscriptions.tabAriaLabel', { label: tab, count: stats[tab] })}>
					{t(`subscriptions.tabs.${tab.toLowerCase()}`)} <span>({stats[tab]})</span>
				</button>
			))}
		</div>
	);
}

interface SortToolbarProps {
	sort: SortState;
	onSortField: (field: SortField) => void;
}

export function SubscriptionSortToolbar({ sort, onSortField }: SortToolbarProps) {
	return (
		<div
			className="sort-toolbar"
			role="toolbar"
			aria-label="Sort subscriptions"
			data-testid="sort-toolbar">
			<span className="sort-toolbar__label" id="sort-toolbar-label">Sort by:</span>
			<div className="sort-toolbar__buttons" aria-labelledby="sort-toolbar-label">
				{SORT_FIELDS.map((f) => (
					<SortButton key={f} field={f} sort={sort} onSort={onSortField} />
				))}
			</div>
			{/* Accessible live announcement for sort changes */}
			<span
				className="visually-hidden"
				role="status"
				aria-live="polite"
				aria-atomic="true">
				{`Sorted by ${SORT_LABELS[sort.field]}, ${sort.direction === "asc" ? "ascending" : "descending"}`}
			</span>
		</div>
	);
}
