import { Link } from "react-router-dom";
import PauseSubscriptionModal from "../../components/PauseSubscriptionModal";
import CancelSubscriptionModal from "../../components/CancelSubscriptionModal";
import TopUpModal from "../../components/TopUpModal";
import PrepaidBalanceCard from "../../components/PrepaidBalance";
import UsageThisPeriod from "../../components/UsageThisPeriod";
import Tag from "../../components/Tag";
import AddTagPopover, { type TagOption } from "../../components/AddTagPopover";
import { ToastContainer, type ToastOptions } from "../../components/TransactionToast";
import { formatAmount } from "../../utils/amount";
import { IconArrowLeft, IconHome } from "./icons";
import { StatusBadge } from "./StatusBadge";
import type { StatusType, SubscriptionActionError, SubscriptionWithIcon } from "./types";

interface SubscriptionDetailPanelProps {
	subscription: SubscriptionWithIcon;
	availableTags: TagOption[];
	isTopUpModalOpen: boolean;
	isPauseModalOpen: boolean;
	isCancelModalOpen: boolean;
	isActionLoading: boolean;
	pauseError: SubscriptionActionError | null;
	cancelError: SubscriptionActionError | null;
	resumeLoadingId: string | null;
	toasts: ToastOptions[];
	onBack: () => void;
	onAddTag: (subId: string, tag: TagOption) => void;
	onRemoveTag: (subId: string, tagId: string) => void;
	onCreateTag: (label: string, color: TagOption["color"]) => void;
	onOpenTopUp: () => void;
	onCloseTopUp: () => void;
	onConfirmTopUp: (amount: number) => Promise<void>;
	onOpenPause: () => void;
	onClosePause: () => void;
	onConfirmPause: () => Promise<void>;
	onOpenCancel: () => void;
	onCloseCancel: () => void;
	onConfirmCancel: () => Promise<void>;
	onOfferSelected: (offerId: string) => void;
	onResume: (id: string) => Promise<void>;
	onViewFullUsage: () => void;
	onRemoveToast: (id: string) => void;
}

export function SubscriptionDetailPanel({
	subscription: selectedSub,
	availableTags,
	isTopUpModalOpen,
	isPauseModalOpen,
	isCancelModalOpen,
	isActionLoading,
	pauseError,
	cancelError,
	resumeLoadingId,
	toasts,
	onBack,
	onAddTag,
	onRemoveTag,
	onCreateTag,
	onOpenTopUp,
	onCloseTopUp,
	onConfirmTopUp,
	onOpenPause,
	onClosePause,
	onConfirmPause,
	onOpenCancel,
	onCloseCancel,
	onConfirmCancel,
	onOfferSelected,
	onResume,
	onViewFullUsage,
	onRemoveToast,
}: SubscriptionDetailPanelProps) {
	const usageData = {
		billingPeriod: "Mar 1 — Mar 31",
		usage: "32450 API calls",
		estimatedCharge: "10 USDC",
	};

	return (
		<div className="subscriptions-container">
			{/* Breadcrumb */}
			<nav className="breadcrumb" aria-label="Breadcrumb">
				<Link to="/dashboard">
					<IconHome />
					Home
				</Link>
				<span className="breadcrumb-separator" aria-hidden="true">/</span>
				<button
					className="breadcrumb-link-btn"
					onClick={onBack}
					aria-label="Back to My subscriptions">
					My subscriptions
				</button>
				<span className="breadcrumb-separator" aria-hidden="true">/</span>
				<span className="breadcrumb-current" aria-current="page">
					{selectedSub.planName}
				</span>
			</nav>

			<button onClick={onBack} className="back-link" aria-label="Back to subscriptions list">
				<IconArrowLeft />
				Back to all subscriptions
			</button>

			<div className="detail-view-card">
				<div className="detail-header">
					<div className="detail-header-left">
						<div className="detail-icon-box" aria-hidden="true">
							{selectedSub.icon}
						</div>
						<div className="detail-title-section">
							<h1>{selectedSub.planName}</h1>
							<div className="detail-merchant">{selectedSub.merchantName}</div>
							<div className="detail-status-row">
								<StatusBadge status={selectedSub.status as StatusType} />
								<span className="sub-id-small">ID: {selectedSub.id}</span>
							</div>
							{/* Tags row */}
							{selectedSub.tags && selectedSub.tags.length > 0 && (
								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
									{selectedSub.tags.map((tag) => (
										<Tag
											key={tag.id}
											label={tag.label}
											color={tag.color}
											size="small"
											removable
											onRemove={() => onRemoveTag(selectedSub.id, tag.id)}
										/>
									))}
									<AddTagPopover
										availableTags={availableTags}
										selectedTags={selectedSub.tags}
										onAddTag={(tag) => onAddTag(selectedSub.id, tag)}
										onCreateTag={onCreateTag}
									/>
								</div>
							)}
							{(!selectedSub.tags || selectedSub.tags.length === 0) && (
								<div style={{ marginTop: '0.75rem' }}>
									<AddTagPopover
										availableTags={availableTags}
										selectedTags={[]}
										onAddTag={(tag) => onAddTag(selectedSub.id, tag)}
										onCreateTag={onCreateTag}
									/>
								</div>
							)}
						</div>
					</div>
					<div className="detail-price-section">
						<div className="detail-price-value">
							{selectedSub.price} {selectedSub.currency}
						</div>
						<div className="detail-price-interval">per {selectedSub.interval}</div>
					</div>
				</div>

				<div className="card-separator-small" aria-hidden="true" />

				<div className="detail-grid-container">
					<div className="detail-grid">
						<div className="detail-item">
							<span className="detail-label">Last payment</span>
							<span className="detail-value">{selectedSub.lastPayment}</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">Next charge</span>
							<span className="detail-value">{selectedSub.nextCharge}</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">Subscribed since</span>
							<span className="detail-value">{selectedSub.subscribedSince}</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">Prepaid balance</span>
							<span className="detail-value">{selectedSub.prepaidBalance}</span>
						</div>
					</div>

					<div className="detail-actions-sidebar">
						<h4>Actions</h4>
						<div className="action-btn-stack">
							{selectedSub.status === "Active" && (
								<button
									className="detail-action-btn detail-action-btn--pause"
									onClick={onOpenPause}
									aria-label={`Pause ${selectedSub.planName} subscription`}>
									Pause subscription
								</button>
							)}
							{selectedSub.status === "Paused" && (
								<button
									className="detail-action-btn detail-action-btn--resume"
									onClick={() => onResume(selectedSub.id)}
									disabled={resumeLoadingId !== null}
									aria-label={`Resume ${selectedSub.planName} subscription`}>
									{resumeLoadingId === selectedSub.id ? "Resuming..." : "Resume subscription"}
								</button>
							)}
							{selectedSub.status !== "Cancelled" && (
								<button
									className="detail-action-btn"
									onClick={onOpenCancel}
									aria-label={`Cancel ${selectedSub.planName} subscription`}>
									Cancel billing
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<div style={{ marginTop: "1.5rem" }}>
				<PrepaidBalanceCard
					balance={selectedSub.prepaidBalance || 0}
					maxBalance={Math.max(selectedSub.prepaidBalance || 0, selectedSub.price * 3, 30)}
					paymentAmount={selectedSub.price}
					onTopUp={onOpenTopUp}
				/>
			</div>
			<div style={{ marginTop: "1.5rem" }}>
				<UsageThisPeriod
					billingPeriod={usageData.billingPeriod}
					usage={usageData.usage}
					estimatedCharge={usageData.estimatedCharge}
					onViewFullUsage={onViewFullUsage}
				/>
			</div>

			<TopUpModal
				isOpen={isTopUpModalOpen}
				onClose={onCloseTopUp}
				planName={selectedSub.planName}
				planPrice={selectedSub.price}
				currentBalance={selectedSub.prepaidBalance || 0}
				walletBalance={150}
				currency={selectedSub.currency}
				onConfirm={onConfirmTopUp}
			/>
			<PauseSubscriptionModal
				isOpen={isPauseModalOpen}
				onClose={onClosePause}
				onConfirm={onConfirmPause}
				isLoading={isActionLoading}
				error={pauseError}
			/>
			<CancelSubscriptionModal
				isOpen={isCancelModalOpen}
				onClose={onCloseCancel}
				onConfirm={onConfirmCancel}
				onOfferSelected={onOfferSelected}
				isLoading={isActionLoading}
				balance={formatAmount(selectedSub.prepaidBalance).number}
				endDate={selectedSub.nextCharge || "N/A"}
				error={cancelError}
			/>
			<ToastContainer toasts={toasts} removeToast={onRemoveToast} />
		</div>
	);
}
