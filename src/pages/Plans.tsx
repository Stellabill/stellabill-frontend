export default function Plans() {
	return (
		<div>
			<h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>Plans</h1>
			<p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
				Define billing plans and pricing. Sync with the backend and on-chain
				contract configuration.
			</p>
			<div
				style={{
					background: "#fff",
					borderRadius: 8,
					boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
					padding: "1.5rem",
				}}>
				<p style={{ color: "#94a3b8", margin: 0 }}>
					No plans configured. Add plans via API or UI form.
				</p>
			</div>
		</div>
	);
}
