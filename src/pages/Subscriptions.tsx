import { useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { subscriptions } from "../api/client";
import ErrorState from "../components/ErrorState";
import type { TagOption } from "../components/AddTagPopover";
import { usePageTitle } from "../hooks/usePageTitle";
import { ToastContainer, type ToastOptions } from "../components/TransactionToast";
import { useRefresh } from "../hooks/useRefresh";
import { useFlip } from "../hooks/useFlip";
import { IconHome, IconPlus, IconWallet } from "./subscriptions/icons";
import { SkeletonCards, SkeletonTable } from "./subscriptions/SubscriptionsSkeleton";
import { EmptyState } from "./subscriptions/SubscriptionsEmptyState";
import { SubscriptionFilterTabs, SubscriptionSortToolbar } from "./subscriptions/SubscriptionsToolbar";
import { SubscriptionsTable } from "./subscriptions/SubscriptionsTable";
import { SubscriptionsMobileCards } from "./subscriptions/SubscriptionsMobileCards";
import { SubscriptionDetailPanel } from "./subscriptions/SubscriptionDetailPanel";
import { useSubscriptionsData } from "./subscriptions/useSubscriptionsData";
import {
	computeSubscriptionStats,
	filterSubscriptions,
	getActionError,
	sortSubscriptions,
} from "./subscriptions/subscriptionUtils";
import type { SortField, SortState, SubscriptionActionError } from "./subscriptions/types";
import "./Subscriptions.css";

export default function Subscriptions() {
	usePageTitle("Subscriptions");
	const { t } = useTranslation();

	const {
		data,
		setData,
		loading,
		error,
		fetchSubscriptions,
		tagsHook,
		availableTags,
		applyTopUp,
	} = useSubscriptionsData();

	const [activeFilter, setActiveFilter] = useState("All");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [sort, setSort] = useState<SortState>({ field: "planName", direction: "asc" });

	const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
	const [isActionLoading, setIsActionLoading] = useState(false);
	const [pauseError, setPauseError] = useState<SubscriptionActionError | null>(null);
	const [cancelError, setCancelError] = useState<SubscriptionActionError | null>(null);
	const [resumeLoadingId, setResumeLoadingId] = useState<string | null>(null);
	const [toasts, setToasts] = useState<ToastOptions[]>([]);
	const toastId = useRef(0);

	const addToast = (status: ToastOptions["status"], title: string, message?: string) => {
		toastId.current += 1;
		const id = `subscription-${toastId.current}`;
		setToasts((prev) => [...prev, { id, status, title, message }]);
		return id;
	};

	const updateToast = (id: string, status: ToastOptions["status"], title: string, message?: string) => {
		setToasts((prev) =>
			prev.map((toast) => (toast.id === id ? { ...toast, status, title, message } : toast)),
		);
	};

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	};

	const handleSortField = useCallback((field: SortField) => {
		setSort((prev) =>
			prev.field === field
				? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
				: { field, direction: "asc" },
		);
	}, []);

	const {
		pullDistance,
		isRefreshing,
		triggerRefresh,
		containerRef: refreshContainerRef,
		handlers: refreshHandlers,
	} = useRefresh({
		onRefresh: fetchSubscriptions,
	});

	const handleTopUpConfirm = useCallback(
		async (amount: number) => {
			await new Promise((resolve) => setTimeout(resolve, 300));
			if (!selectedId) return;
			applyTopUp(selectedId, amount);
		},
		[selectedId, applyTopUp],
	);

	const handleViewFullUsage = () => {
		/* TODO: Navigate to full usage page */
	};

	const filteredData = useMemo(() => {
		const filtered = filterSubscriptions(data, activeFilter);
		return sortSubscriptions(filtered, sort);
	}, [activeFilter, data, sort]);

	// FLIP animation — keys must match the render order
	const flipKeys = useMemo(() => filteredData.map((s) => s.id), [filteredData]);
	const { containerRef: tableBodyRef, getItemProps } = useFlip({
		keys: flipKeys,
		enabled: !loading && filteredData.length > 0,
	});
	// Mobile cards use a separate FLIP container
	const { containerRef: cardsContainerRef } = useFlip({
		keys: flipKeys,
		enabled: !loading && filteredData.length > 0,
	});

	const handleAddTag = (subId: string, tag: TagOption) => {
		tagsHook.addTagToSubscription(subId, tag.id);
	};

	const handleRemoveTag = (subId: string, tagId: string) => {
		tagsHook.removeTagFromSubscription(subId, tagId);
	};

	const handleCreateTag = (label: string, color: TagOption["color"]) => {
		const existingTag = tagsHook.findTagByNormalizedLabel(label);
		if (existingTag) {
			if (selectedId) {
				tagsHook.addTagToSubscription(selectedId, existingTag.id);
			}
		} else {
			const newTag = tagsHook.createTag(label, color);
			if (selectedId) {
				tagsHook.addTagToSubscription(selectedId, newTag.id);
			}
		}
	};

	const selectedSub = useMemo(
		() => data.find((sub) => sub.id === selectedId),
		[selectedId, data],
	);

	const stats = useMemo(() => computeSubscriptionStats(data), [data]);

	const handlePauseConfirm = async () => {
		if (!selectedId) return;
		setIsActionLoading(true);
		setPauseError(null);
		try {
			await subscriptions.pause(selectedId);
			setData((prev) =>
				prev.map((sub) =>
					sub.id === selectedId ? { ...sub, status: "Paused" as const } : sub,
				),
			);
			addToast("success", "Subscription paused", "Your subscription has been paused.");
			setIsPauseModalOpen(false);
		} catch (err) {
			setPauseError(getActionError(err, "Failed to pause subscription. Please try again."));
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleCancelConfirm = async () => {
		if (!selectedId) return;
		setIsActionLoading(true);
		setCancelError(null);
		try {
			await subscriptions.cancel(selectedId);
			setData((prev) =>
				prev.map((sub) =>
					sub.id === selectedId
						? { ...sub, status: "Cancelled" as const }
						: sub,
				),
			);
			addToast("success", "Subscription cancelled", "Your subscription has been cancelled.");
			setIsCancelModalOpen(false);
		} catch (err) {
			setCancelError(getActionError(err, "Failed to cancel subscription. Please try again."));
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleOfferSelected = (offerId: string) => {
		if (offerId === "pause") {
			setPauseError(null);
			setIsCancelModalOpen(false);
			setIsPauseModalOpen(true);
		} else {
			setIsCancelModalOpen(false);
		}
	};

	const handleResume = async (id: string) => {
		if (resumeLoadingId !== null) return;
		setResumeLoadingId(id);
		const pendingToastId = addToast("pending", "Resuming subscription", "Please wait while we resume your subscription.");
		try {
			await subscriptions.resume(id);
			setData((prev) =>
				prev.map((sub) =>
					sub.id === id ? { ...sub, status: "Active" as const } : sub,
				),
			);
			updateToast(pendingToastId, "success", "Subscription resumed", "Your subscription is active again.");
		} catch (err) {
			const actionError = getActionError(err, "Failed to resume subscription. Please try again.");
			updateToast(pendingToastId, "error", actionError.message, actionError.technicalDetails);
		} finally {
			setResumeLoadingId(null);
		}
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
		return (
			<SubscriptionDetailPanel
				subscription={selectedSub}
				availableTags={availableTags}
				isTopUpModalOpen={isTopUpModalOpen}
				isPauseModalOpen={isPauseModalOpen}
				isCancelModalOpen={isCancelModalOpen}
				isActionLoading={isActionLoading}
				pauseError={pauseError}
				cancelError={cancelError}
				resumeLoadingId={resumeLoadingId}
				toasts={toasts}
				onBack={() => setSelectedId(null)}
				onAddTag={handleAddTag}
				onRemoveTag={handleRemoveTag}
				onCreateTag={handleCreateTag}
				onOpenTopUp={() => setIsTopUpModalOpen(true)}
				onCloseTopUp={() => setIsTopUpModalOpen(false)}
				onConfirmTopUp={handleTopUpConfirm}
				onOpenPause={() => {
					setPauseError(null);
					setIsPauseModalOpen(true);
				}}
				onClosePause={() => {
					setIsPauseModalOpen(false);
					setPauseError(null);
				}}
				onConfirmPause={handlePauseConfirm}
				onOpenCancel={() => {
					setCancelError(null);
					setIsCancelModalOpen(true);
				}}
				onCloseCancel={() => {
					setIsCancelModalOpen(false);
					setCancelError(null);
				}}
				onConfirmCancel={handleCancelConfirm}
				onOfferSelected={handleOfferSelected}
				onResume={handleResume}
				onViewFullUsage={handleViewFullUsage}
				onRemoveToast={removeToast}
			/>
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
				<span className="breadcrumb-current" aria-current="page">{t("subscriptions.pageTitle")}</span>
			</nav>

			{/* Header */}
			<div className="header-row">
				<div className="page-title-section">
					<h1>{t("subscriptions.pageTitle")}</h1>
					<p className="page-description">{t("subscriptions.pageDescription")}</p>
				</div>
				<button className="browse-plans-btn" id="browse-plans-btn">
					<IconPlus />
					{t("subscriptions.browsePlans")}
				</button>
			</div>

			{/* Filter tabs */}
			<SubscriptionFilterTabs
				activeFilter={activeFilter}
				stats={stats}
				onFilterChange={setActiveFilter}
			/>

			{/* Empty state */}
			{filteredData.length === 0 ? (
				<EmptyState filter={activeFilter} />
			) : (
				<>
					<SubscriptionSortToolbar sort={sort} onSortField={handleSortField} />

					<SubscriptionsTable
						subscriptions={filteredData}
						tableBodyRef={tableBodyRef}
						getItemProps={getItemProps}
						onSelect={setSelectedId}
					/>

					<SubscriptionsMobileCards
						subscriptions={filteredData}
						cardsContainerRef={cardsContainerRef}
						refreshContainerRef={refreshContainerRef}
						refreshHandlers={refreshHandlers}
						pullDistance={pullDistance}
						isRefreshing={isRefreshing}
						triggerRefresh={triggerRefresh}
						resumeLoadingId={resumeLoadingId}
						onSelect={setSelectedId}
						onPauseRequest={(id) => {
							setSelectedId(id);
							setPauseError(null);
							setIsPauseModalOpen(true);
						}}
						onResumeRequest={handleResume}
						onCancelRequest={(id) => {
							setSelectedId(id);
							setCancelError(null);
							setIsCancelModalOpen(true);
						}}
					/>
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
			<ToastContainer toasts={toasts} removeToast={removeToast} />
		</div>
	);
}
