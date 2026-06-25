import './Plans.css';

export default function Plans() {
	return (
		<div className="plans-page">
			<h1>Plans</h1>
			<p className="plans-page__description">
				Define billing plans and pricing. Sync with the backend and on-chain
				contract configuration.
			</p>
			<div className="plans-page__empty-card">
				<p>No plans configured. Add plans via API or UI form.</p>
			</div>
		</div>
	);
}
