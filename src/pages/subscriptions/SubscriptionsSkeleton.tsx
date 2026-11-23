const SKELETON_ROWS = 4;

export function SkeletonTable() {
	return (
		<div className="subs-loading-wrapper" aria-busy="true" aria-label="Loading subscriptions" role="status">
			<table className="subs-table" aria-label="Loading subscriptions">
				<thead>
				<tr>
					<th scope="col">Plan</th>
					<th scope="col">Status</th>
					<th scope="col">Price</th>
					<th scope="col">Next Charge</th>
					<th scope="col">Prepaid Balance</th>
					<th scope="col">Actions</th>
				</tr>
				</thead>
				<tbody>
				{Array.from({ length: SKELETON_ROWS }).map((_, i) => (
					<tr key={i} className="skeleton-row" aria-hidden="true">
						<td>
							<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
								<div className="skeleton skeleton-icon" />
								<div>
									<div className="skeleton skeleton-cell" style={{ width: "120px", marginBottom: "6px" }} />
									<div className="skeleton skeleton-cell" style={{ width: "80px" }} />
								</div>
							</div>
						</td>
						<td><div className="skeleton skeleton-badge" /></td>
						<td><div className="skeleton skeleton-cell" style={{ width: "80px" }} /></td>
						<td><div className="skeleton skeleton-cell" style={{ width: "100px" }} /></td>
						<td><div className="skeleton skeleton-cell" style={{ width: "80px" }} /></td>
						<td><div className="skeleton skeleton-cell" style={{ width: "60px" }} /></td>
					</tr>
				))}
				</tbody>
			</table>
		</div>
	);
}

export function SkeletonCards() {
	return (
		<div className="subs-loading-cards" aria-busy="true" aria-label="Loading subscriptions" role="status">
			{Array.from({ length: SKELETON_ROWS }).map((_, i) => (
				<div key={i} className="subs-loading-card" aria-hidden="true">
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
						<div className="skeleton skeleton-icon" />
						<div style={{ flex: 1 }}>
							<div className="skeleton skeleton-cell" style={{ width: "140px", marginBottom: "6px" }} />
							<div className="skeleton skeleton-cell" style={{ width: "90px" }} />
						</div>
						<div className="skeleton skeleton-badge" />
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
						<div className="skeleton skeleton-cell" style={{ width: "100%" }} />
						<div className="skeleton skeleton-cell" style={{ width: "100%" }} />
					</div>
				</div>
			))}
		</div>
	);
}
