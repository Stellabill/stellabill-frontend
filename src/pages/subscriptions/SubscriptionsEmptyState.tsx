import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { IconEmptySubscriptions, IconPlus } from "./icons";

export function EmptyState({ filter }: { filter: string }) {
	const { t } = useTranslation();
	const isFiltered = filter !== "All";
	return (
		<div className="subs-empty" role="status" aria-live="polite">
			<div className="subs-empty__illustration" aria-hidden="true">
				<IconEmptySubscriptions />
			</div>
			<h2 className="subs-empty__title" id="empty-state-heading">
				{isFiltered ? t('subscriptions.empty.noFiltered', { filter: filter }) : t('subscriptions.empty.noSubscriptions')}
			</h2>
			<p className="subs-empty__body" aria-labelledby="empty-state-heading">
				{isFiltered
					? t('subscriptions.empty.noFilteredDesc', { filter: filter.toLowerCase() })
					: t('subscriptions.empty.noSubscriptionsDesc')}
			</p>
			{!isFiltered && (
				<Link to="/plans" className="subs-empty__cta" id="empty-browse-plans-btn">
					<IconPlus />
					{t('subscriptions.browsePlans')}
				</Link>
			)}
		</div>
	);
}
