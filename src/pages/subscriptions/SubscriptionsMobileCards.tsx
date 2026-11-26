import type React from "react";
import { useTranslation } from "react-i18next";
import SwipeableRow from "../../components/SwipeableRow";
import Tag from "../../components/Tag";
import { formatAmount } from "../../utils/amount";
import { IconCog, IconPause, IconPlay, IconX } from "./icons";
import { StatusBadge } from "./StatusBadge";
import type { StatusType, SubscriptionWithIcon } from "./types";

interface SubscriptionsMobileCardsProps {
	subscriptions: SubscriptionWithIcon[];
	cardsContainerRef: React.RefObject<HTMLElement | null>;
	refreshContainerRef: React.MutableRefObject<HTMLElement | null>;
	refreshHandlers: Record<string, unknown>;
	pullDistance: number;
	isRefreshing: boolean;
	triggerRefresh: () => void;
	resumeLoadingId: string | null;
	onSelect: (id: string) => void;
	onPauseRequest: (id: string) => void;
	onResumeRequest: (id: string) => void;
	onCancelRequest: (id: string) => void;
}

export function SubscriptionsMobileCards({
	subscriptions: items,
	cardsContainerRef,
	refreshContainerRef,
	refreshHandlers,
	pullDistance,
	isRefreshing,
	triggerRefresh,
	resumeLoadingId,
	onSelect,
	onPauseRequest,
	onResumeRequest,
	onCancelRequest,
}: SubscriptionsMobileCardsProps) {
	const { t } = useTranslation();

	return (
		<div
			ref={(el: HTMLDivElement | null) => {
				(cardsContainerRef as React.MutableRefObject<HTMLElement | null>).current = el;
				refreshContainerRef.current = el;
			}}
			className="subs-cards"
			aria-label="Subscriptions"
			data-testid="subscriptions-cards"
			{...refreshHandlers}
		>
			{/* Polite live region for accessibility announcements */}
			<div className="visually-hidden" aria-live="polite">
				{isRefreshing ? t('subscriptions.refreshing', 'Refreshing subscriptions...') : ''}
			</div>

			{/* Fallback Refresh Button for keyboard users and screen readers */}
			<button
				className="ptr-fallback-btn"
				onClick={triggerRefresh}
				aria-label="Refresh subscriptions"
			>
				<IconPlay />
				<span className="visually-hidden">Refresh</span>
			</button>

			{/* Pull-to-refresh visual indicator */}
			<div
				className="ptr-indicator"
				style={{
					height: `${Math.min(pullDistance, 100)}px`,
					opacity: pullDistance > 10 ? 1 : 0,
				}}
				aria-hidden="true"
			>
				{isRefreshing || pullDistance > 0 ? (
					<div className={`ptr-spinner ${isRefreshing ? 'spinning' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
						<IconCog />
					</div>
				) : null}
			</div>

			<div
				className="subs-cards-inner"
				style={{ transform: `translateY(${pullDistance}px)` }}
			>
				{items.map((sub) => {
					const leadingActions: Array<Record<string, unknown>> = [];
					const trailingActions: Array<{
						id: string;
						label: string;
						icon: React.ReactNode;
						backgroundColor: string;
						color: string;
						onClick: () => void;
					}> = [];

					if (sub.status === "Active") {
						trailingActions.push({
							id: "pause",
							label: "Pause",
							icon: <IconPause />,
							backgroundColor: "#f59e0b", // amber-500
							color: "#fff",
							onClick: () => onPauseRequest(sub.id),
						});
					} else if (sub.status === "Paused") {
						trailingActions.push({
							id: "resume",
							label: resumeLoadingId === sub.id ? "Resuming..." : "Resume",
							icon: <IconPlay />,
							backgroundColor: "#10b981", // emerald-500
							color: "#fff",
							onClick: () => onResumeRequest(sub.id),
						});
					}

					if (sub.status !== "Cancelled") {
						trailingActions.push({
							id: "cancel",
							label: "Cancel",
							icon: <IconX />,
							backgroundColor: "#ef4444", // red-500
							color: "#fff",
							onClick: () => onCancelRequest(sub.id),
						});
					}

					return (
						<SwipeableRow key={sub.id} leadingActions={leadingActions as never[]} trailingActions={trailingActions}>
							<article
								className="subs-card"
								tabIndex={-1}
								role="button"
								aria-label={`${sub.planName} – ${sub.status}. Tap to manage.`}
								onClick={() => onSelect(sub.id)}>
								<div className="subs-card__top">
									<div className="subs-card__plan-info">
										<div className="subs-card__icon" aria-hidden="true">
											{sub.icon}
										</div>
										<div>
											<div className="subs-card__name">{sub.planName}</div>
											<div className="subs-card__merchant">{sub.merchantName}</div>
											{/* Tags for mobile */}
											{sub.tags && sub.tags.length > 0 && (
												<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
													{sub.tags.slice(0, 2).map((tag) => (
														<Tag
															key={tag.id}
															label={tag.label}
															color={tag.color}
															size="small"
														/>
													))}
													{sub.tags.length > 2 && (
														<span style={{ fontSize: 'var(--text-xs)', color: '#64748b', alignSelf: 'center' }}>
															+{sub.tags.length - 2}
														</span>
													)}
												</div>
											)}
										</div>
									</div>
									<StatusBadge status={sub.status as StatusType} />
								</div>

								<div className="subs-card__meta">
									<div className="subs-card__meta-item">
										<span className="subs-card__meta-label">{t('subscriptions.table.prepaid')}</span>
										<span className="subs-card__meta-value">{formatAmount(sub.prepaidBalance).number} {sub.currency}</span>
									</div>
									<div className="subs-card__meta-item">
										<span className="subs-card__meta-label">{t('subscriptions.table.coverage')}</span>
										<span className="subs-card__meta-value">{sub.coverage}</span>
									</div>
									<div className="subs-card__meta-item">
										<span className="subs-card__meta-label">{t('subscriptions.table.nextCharge')}</span>
										<span className="subs-card__meta-value">{sub.nextCharge}</span>
									</div>
									<div className="subs-card__meta-item">
										<span className="subs-card__meta-label">{t('subscriptions.table.lastPayment')}</span>
										<span className="subs-card__meta-value">{sub.lastPayment}</span>
									</div>
								</div>

								<div className="subs-card__footer">
									<span className="subs-card__price">
										{sub.price} {sub.currency}
										<span className="subs-card__price-interval">
											/ {sub.interval}
										</span>
									</span>
									<button
										className="subs-table__btn subs-table__btn--primary"
										id={`manage-card-btn-${sub.id}`}
										onClick={(e) => {
											e.stopPropagation();
											onSelect(sub.id);
										}}
										aria-label={`Open ${sub.planName} from card`}>
										Manage
									</button>
								</div>
							</article>
						</SwipeableRow>
					);
				})}
			</div>
		</div>
	);
}
