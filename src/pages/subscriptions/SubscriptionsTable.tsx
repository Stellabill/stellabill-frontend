import type React from "react";
import { useTranslation } from "react-i18next";
import Tag from "../../components/Tag";
import { formatAmount } from "../../utils/amount";
import { IconCalendar, IconWallet } from "./icons";
import { StatusBadge } from "./StatusBadge";
import type { StatusType, SubscriptionWithIcon } from "./types";

interface SubscriptionsTableProps {
	subscriptions: SubscriptionWithIcon[];
	tableBodyRef: React.RefObject<HTMLElement | null>;
	getItemProps: (key: string) => Record<string, unknown>;
	onSelect: (id: string) => void;
}

export function SubscriptionsTable({
	subscriptions: items,
	tableBodyRef,
	getItemProps,
	onSelect,
}: SubscriptionsTableProps) {
	const { t } = useTranslation();

	return (
		<div className="subs-table-wrapper" role="region" aria-label="Subscriptions list">
			<table
				className="subs-table"
				aria-label={t('subscriptions.pageTitle')}
				data-testid="subscriptions-table">
				<thead>
				<tr>
					<th scope="col">{t('subscriptions.table.plan')}</th>
					<th scope="col">{t('subscriptions.table.status')}</th>
					<th scope="col">{t('subscriptions.table.price')}</th>
					<th scope="col">Tags</th>
					<th scope="col">{t('subscriptions.table.nextCharge')}</th>
					<th scope="col">{t('subscriptions.table.prepaidBalance')}</th>
					<th scope="col">
						<span className="visually-hidden">{t('subscriptions.table.actions')}</span>
					</th>
				</tr>
				</thead>
				{/* FLIP container — tableBodyRef tracks child positions */}
				<tbody ref={tableBodyRef as React.RefObject<HTMLTableSectionElement>}>
				{items.map((sub) => (
					<tr
						key={sub.id}
						{...getItemProps(sub.id)}
						tabIndex={0}
						aria-label={`${sub.planName} by ${sub.merchantName}, ${sub.status}`}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onSelect(sub.id);
							}
						}}
						onClick={() => onSelect(sub.id)}
						role="button">
						{/* Plan cell */}
						<td>
							<div className="subs-table__plan-cell">
								<div className="subs-table__plan-icon" aria-hidden="true">
									{sub.icon}
								</div>
								<div>
									<div className="subs-table__plan-name">{sub.planName}</div>
									<div className="subs-table__merchant">{sub.merchantName}</div>
								</div>
							</div>
						</td>

						{/* Status */}
						<td>
							<StatusBadge status={sub.status as StatusType} />
						</td>

						{/* Price */}
						<td>
							<span className="subs-table__price">
								{sub.price} {sub.currency}
								<span className="subs-table__price-interval">/ {sub.interval}</span>
							</span>
						</td>

						{/* Tags */}
						<td>
							<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
								{sub.tags?.slice(0, 2).map((tag) => (
									<Tag
										key={tag.id}
										label={tag.label}
										color={tag.color}
										size="small"
									/>
								))}
								{sub.tags && sub.tags.length > 2 && (
									<span style={{ fontSize: 'var(--text-xs)', color: '#64748b' }}>
										+{sub.tags.length - 2}
									</span>
								)}
							</div>
						</td>

						{/* Next charge */}
						<td>
							<span className="subs-table__meta-cell">
								<IconCalendar />
								{sub.nextCharge}
							</span>
						</td>

						{/* Prepaid balance */}
						<td>
							<span className="subs-table__meta-cell">
								<IconWallet />
								{formatAmount(sub.prepaidBalance).number} {sub.currency}
							</span>
						</td>

						{/* Actions */}
						<td>
							<div className="subs-table__actions" onClick={(e) => e.stopPropagation()}>
								<button
									className="subs-table__btn subs-table__btn--primary"
									id={`manage-btn-${sub.id}`}
									onClick={(e) => {
										e.stopPropagation();
										onSelect(sub.id);
									}}
									aria-label={`Manage ${sub.planName}`}>
									{t('subscriptions.table.manage')}
								</button>
							</div>
						</td>
					</tr>
				))}
				</tbody>
			</table>
		</div>
	);
}
