import type { StatusType } from "./types";

export function StatusBadge({ status }: { status: StatusType }) {
	const cls = `status-badge status-badge--${status.toLowerCase()}`;
	const label: Record<StatusType, string> = {
		Active: "Active",
		Paused: "Paused",
		Cancelled: "Cancelled",
	};
	return (
		<span className={cls} role="status" aria-label={`Status: ${label[status]}`}>
			<span className="status-badge__dot" aria-hidden="true" />
			{label[status]}
		</span>
	);
}
