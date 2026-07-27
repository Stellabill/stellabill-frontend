import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import PauseSubscriptionModal from "../components/PauseSubscriptionModal";
import CancelSubscriptionModal from "../components/CancelSubscriptionModal";
import { subscriptions, ApiError } from "../api/client";
import { Subscription } from "@/types/subscription";
import UsageThisPeriod from "../components/UsageThisPeriod";
import ErrorState from "../components/ErrorState";
import Tag from "../components/Tag";
import AddTagPopover, { TagOption } from "../components/AddTagPopover";
import "./Subscriptions.css";

/* ─── Types ─────────────────────────────────────────────────── */
interface SubscriptionWithIcon extends Omit<Subscription, "icon"> {
	icon: React.ReactNode;
	prepaidBalance: string;
	coverage: string;
	tags?: TagOption[];
}

type StatusType = "Active" | "Paused" | "Cancelled";

/* ─── Icons ─────────────────────────────────────────────────── */
const IconNews = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
		<path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
	</svg>
);

const IconCloud = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M17.5 19c.7 0 1.3-.2 1.8-.7.5-.5.7-1.1.7-1.8 0-1.3-1-2.4-2.3-2.5-.2-2.1-1.9-3.5-4-3.5-1.5 0-2.8.7-3.6 1.8-.3-.1-.6-.1-.9-.1-1.4 0-2.5 1.1-2.5 2.5 0 .1 0 .2.1.3C5.5 15.6 4.5 16.7 4.5 18c0 1.4 1.1 2.5 2.5 2.5h10.5Z" />
	</svg>
);

const IconPlay = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<polygon points="5 3 19 12 5 21 5 3" />
	</svg>
);

const IconCog = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="3" />
		<path d="M19.07 4.93A10 10 0 1 0 4.93 19.07 10 10 0 0 0 19.07 4.93Z" />
	</svg>
);

const IconCalendar = () => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
		<line x1="16" y1="2" x2="16" y2="6" />
		<line x1="8" y1="2" x2="8" y2="6" />
		<line x1="3" y1="10" x2="21" y2="10" />
	</svg>
);

const IconWallet = () => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<line x1="12" y1="1" x2="12" y2="23" />
		<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
	</svg>
);

const IconHome = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);

const IconPlus = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
	</svg>
);

const IconEmptySubscriptions = () => (
	<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<polyline points="14 2 14 8 20 8" />
		<line x1="12" y1="18" x2="12" y2="12" />
		<line x1="9" y1="15" x2="15" y2="15" />
	</svg>
);

const IconArrowLeft = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<polyline points="15 18 9 12 15 6" />
	</svg>
);

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }: { status: StatusType }) {
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

/* ─── Loading Skeleton ───────────────────────────────────────── */
const SKELETON_ROWS = 4;

function SkeletonTable() {
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

function SkeletonCards() {
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

/* ─── Empty State ────────────────────────────────────────────── */
function EmptyState({ filter }: { filter: string }) {
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

/* ─── Seed data ─────────────────────────────────────────────── */
const INITIAL_DATA: SubscriptionWithIcon[] = [
	{
		id: "SUB-001",
		planName: "Premium Access",
		merchantName: "Stellar News",
		status: "Active",
		price: 10,
		currency: "USDC",
		interval: "month",
		prepaidBalance: "30 USDC",
		coverage: "~3 payments",
		nextCharge: "Mar 15, 2026",
		lastPayment: "Feb 15, 2026",
		subscribedSince: "Dec 15, 2025",
		icon: <IconNews />,
	},
	{
		id: "SUB-002",
		planName: "Pro Plan",
		merchantName: "CloudFlow",
		status: "Active",
		price: 25,
		currency: "USDC",
		interval: "month",
		prepaidBalance: "75 USDC",
		coverage: "~3 payments",
		nextCharge: "Mar 20, 2026",
		lastPayment: "Feb 20, 2026",
		subscribedSince: "Feb 20, 2026",
		icon: <IconCloud />,
	},
	{
		id: "SUB-003",
		planName: "Basic Stream",
		merchantName: "StreamIt",
		status: "Paused",
		price: 5,
		currency: "USDC",
		interval: "month",
		prepaidBalance: "5 USDC",
		coverage: "~1 payment",
		nextCharge: "Apr 01, 2026",
		lastPayment: "Mar 01, 2026",
		subscribedSince: "Jan 01, 2026",
		icon: <IconPlay />,
	},
	{
		id: "SUB-004",
		planName: "Enterprise AI",
		merchantName: "Cognitive",
		status: "Cancelled",
		price: 50,
		currency: "USDC",
		interval: "month",
		prepaidBalance: "0 USDC",
		coverage: "0 payments",
		nextCharge: "N/A",
		lastPayment: "Feb 28, 2026",
		subscribedSince: "Nov 15, 2025",
		icon: <IconCog />,
	},
];

/* ─── Main component ─────────────────────────────────────────── */
export default function Subscriptions() {
	const { t } = useTranslation();
	const [data, setData] = useState<SubscriptionWithIcon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ApiError | null>(null);
	const [activeFilter, setActiveFilter] = useState("All");
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [isActionLoading, setIsActionLoading] = useState(false);

	const fetchSubscriptions = useCallback(() => {
		setLoading(true);
		setError(null);

		window.setTimeout(() => {
			try {
				if (window.location.search.includes("simulate_error")) {
					const err: ApiError = new Error("Failed to load subscriptions");
					err.status = 500;
					err.technicalDetails =
						"The subscription service returned a malformed response. [Error Code: SUB-FETCH-ERR]";
					setError(err);
				} else {
					setData(INITIAL_DATA);
				}
			} catch (err: unknown) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		}, 0);
	}, []);

	useEffect(() => {
		fetchSubscriptions();
	}, [fetchSubscriptions]);

	const handleViewFullUsage = () => {
		/* TODO: Navigate to full usage page */
	};

	const filteredData = useMemo(() => {
		if (activeFilter === "All") return data;
		return data.filter((sub) => sub.status === activeFilter);
	}, [activeFilter, data]);

	const selectedSub = useMemo(
		() => data.find((sub) => sub.id === selectedId),
		[selectedId, data],
	);

	const stats = {
		All: data.length,
		Active: data.filter((s) => s.status === "Active").length,
		Paused: data.filter((s) => s.status === "Paused").length,
		Cancelled: data.filter((s) => s.status === "Cancelled").length,
	};

	const handlePauseConfirm = async () => {
		if (!selectedId) return;
		setIsActionLoading(true);
		try {
			await subscriptions.pause(selectedId);
			setData((prev) =>
				prev.map((sub) =>
					sub.id === selectedId ? { ...sub, status: "Paused" as const } : sub,
				),
			);
			setIsPauseModalOpen(false);
		} catch (err) {
			console.error("Failed to pause:", err);
			setIsPauseModalOpen(false);
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleCancelConfirm = async () => {
		if (!selectedId) return;
		setIsActionLoading(true);
		try {
			await subscriptions.cancel(selectedId);
			setData((prev) =>
				prev.map((sub) =>
					sub.id === selectedId
						? { ...sub, status: "Cancelled" as const }
						: sub,
				),
			);
			setIsCancelModalOpen(false);
		} catch (err) {
			console.error("Failed to cancel:", err);
			setIsCancelModalOpen(false);
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleOfferSelected = (offerId: string) => {
		if (offerId === "pause") {
			setIsCancelModalOpen(false);
			setIsPauseModalOpen(true);
		} else {
			// Handle other offers (downgrade, discount)
			// For now, we just close the modal as per minimal implementation requirements
			setIsCancelModalOpen(false);
		}
	};

	const handleResume = async (id: string) => {
		setData((prev) =>
			prev.map((sub) =>
				sub.id === id ? { ...sub, status: "Active" as const } : sub,
			),
		);
	};

	/* ── Loading state ─────────────────────────────────────────── */
	if (loading && data.length === 0) {
		return (
			<div className="subscriptions-container">
				<div className="header-row">
					<div className="page-title-section">
						<h1>My subscriptions</h1>
						<p className="page-description">Manage your active and past subscriptions</p>
					</div>
				</div>
				<SkeletonTable />
				<SkeletonCards />
			</div>
		);
	}

	/* ── Error state ───────────────────────────────────────────── */
	if (error) {
		return (
			<div
				className="subscriptions-container"
				style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
				<ErrorState
					title="Subscriptions Unavailable"
					message={error.message}
					technicalDetails={error.technicalDetails}
					onRetry={fetchSubscriptions}
					isRetrying={loading}
					type={error.isOffline ? "offline" : "error"}
				/>
			</div>
		);
	}

	/* ── Detail view ───────────────────────────────────────────── */
	if (selectedSub) {
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
						onClick={() => setSelectedId(null)}
						aria-label="Back to My subscriptions">
						My subscriptions
					</button>
					<span className="breadcrumb-separator" aria-hidden="true">/</span>
					<span className="breadcrumb-current" aria-current="page">
						{selectedSub.planName}
					</span>
				</nav>

				<button onClick={() => setSelectedId(null)} className="back-link" aria-label="Back to subscriptions list">
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
												onRemove={() => handleRemoveTag(selectedSub.id, tag.id)}
											/>
										))}
										<AddTagPopover
											availableTags={availableTags}
											selectedTags={selectedSub.tags}
											onAddTag={(tag) => handleAddTag(selectedSub.id, tag)}
											onCreateTag={handleCreateTag}
										/>
									</div>
								)}
								{(!selectedSub.tags || selectedSub.tags.length === 0) && (
									<div style={{ marginTop: '0.75rem' }}>
										<AddTagPopover
											availableTags={availableTags}
											selectedTags={[]}
											onAddTag={(tag) => handleAddTag(selectedSub.id, tag)}
											onCreateTag={handleCreateTag}
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
										onClick={() => setIsPauseModalOpen(true)}
										aria-label={`Pause ${selectedSub.planName} subscription`}>
										Pause subscription
									</button>
								)}
								{selectedSub.status === "Paused" && (
									<button
										className="detail-action-btn detail-action-btn--resume"
										onClick={() => handleResume(selectedSub.id)}
										aria-label={`Resume ${selectedSub.planName} subscription`}>
										Resume subscription
									</button>
								)}
								{selectedSub.status !== "Cancelled" && (
									<button
										className="detail-action-btn"
										onClick={() => setIsCancelModalOpen(true)}
										aria-label={`Cancel ${selectedSub.planName} subscription`}>
										Cancel billing
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				<div style={{ marginTop: "1.5rem" }}>
					<UsageThisPeriod
						billingPeriod={usageData.billingPeriod}
						usage={usageData.usage}
						estimatedCharge={usageData.estimatedCharge}
						onViewFullUsage={handleViewFullUsage}
					/>
				</div>

				<PauseSubscriptionModal
					isOpen={isPauseModalOpen}
					onClose={() => setIsPauseModalOpen(false)}
					onConfirm={handlePauseConfirm}
					isLoading={isActionLoading}
				/>
				<CancelSubscriptionModal
					isOpen={isCancelModalOpen}
					onClose={() => setIsCancelModalOpen(false)}
					onConfirm={handleCancelConfirm}
					onOfferSelected={handleOfferSelected}
					isLoading={isActionLoading}
					balance={selectedSub.prepaidBalance.replace(" USDC", "") || "0"}
					endDate={selectedSub.nextCharge || "N/A"}
				/>
			</div>
		);
	}

	/* ── List view ─────────────────────────────────────────────── */
	return (
		<div className="subscriptions-container">
			{/* Breadcrumb */}
			<nav className="breadcrumb" aria-label="Breadcrumb">
				<Link to="/dashboard">
					<IconHome />
					Home
				</Link>
				<span className="breadcrumb-separator" aria-hidden="true">/</span>
				<span className="breadcrumb-current" aria-current="page">My subscriptions</span>
				<span className="breadcrumb-current" aria-current="page">{t('subscriptions.pageTitle')}</span>
			</nav>

			{/* Header */}
			<div className="header-row">
				<div className="page-title-section">
					<h1>{t('subscriptions.pageTitle')}</h1>
					<p className="page-description">{t('subscriptions.pageDescription')}</p>
				</div>
				<button className="browse-plans-btn" id="browse-plans-btn">
					<IconPlus />
					{t('subscriptions.browsePlans')}
				</button>
			</div>

			{/* Filter tabs */}
			<div className="filter-tabs" role="group" aria-label="Filter subscriptions by status">
				{(["All", "Active", "Paused", "Cancelled"] as const).map((tab) => (
					<button
						key={tab}
						id={`filter-tab-${tab.toLowerCase()}`}
						className={`filter-tab${activeFilter === tab ? " active" : ""}`}
						onClick={() => setActiveFilter(tab)}
						aria-pressed={activeFilter === tab}
						aria-label={`Show ${tab} subscriptions (${stats[tab]})`}>
						{t(`subscriptions.tabs.${tab.toLowerCase()}`)} <span>({stats[tab]})</span>
					</button>
				))}
			</div>

			{/* Empty state */}
			{filteredData.length === 0 ? (
				<EmptyState filter={activeFilter} />
			) : (
				<>
					{/* ── Desktop table ─────────────────────────────────── */}
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
									<th scope="col">{t('subscriptions.table.nextCharge')}</th>
									<th scope="col">{t('subscriptions.table.prepaidBalance')}</th>
									<th scope="col">
										<span className="visually-hidden">{t('subscriptions.table.actions')}</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredData.map((sub) => (
									<tr
										key={sub.id}
										tabIndex={0}
										aria-label={`${sub.planName} by ${sub.merchantName}, ${sub.status}`}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setSelectedId(sub.id);
											}
										}}
										onClick={() => setSelectedId(sub.id)}
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
												{sub.prepaidBalance}
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
														setSelectedId(sub.id);
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

					{/* ── Mobile cards ──────────────────────────────────── */}
					<div className="subs-cards" aria-label="Subscriptions" data-testid="subscriptions-cards">
						{filteredData.map((sub) => (
							<article
								key={sub.id}
								className="subs-card"
								tabIndex={0}
								role="button"
								aria-label={`${sub.planName} – ${sub.status}. Tap to manage.`}
								onClick={() => setSelectedId(sub.id)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setSelectedId(sub.id);
									}
								}}>
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
										<span className="subs-card__meta-value">{sub.prepaidBalance}</span>
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
											setSelectedId(sub.id);
										}}
										aria-label={`Open ${sub.planName} from card`}>
										Manage
									</button>
								</div>
							</article>
						))}
					</div>
				</>
			)}

			{/* Info card */}
			<div className="bottom-info-card" role="note" aria-label="About prepaid balances">
				<div className="info-icon-circle" aria-hidden="true">
					<IconWallet />
				</div>
				<div className="info-content">
					<h3>About prepaid balances</h3>
					<p>
						Each subscription uses a prepaid vault model. Your USDC balance is held
						securely in a smart contract, and payments are automatically deducted on
						your billing cycle. You can top up anytime to extend coverage.
					</p>
				</div>
			</div>
		</div>
	);
}
