import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import type { ApiError } from "../api/client";
import WalletConnectModal from "../components/WalletConnectModal";
import GiftPurchaseModal from "../components/GiftPurchaseModal";
import { FreighterConnectionError } from "../wallet/freighter";
import { usePageTitle } from "../hooks/usePageTitle";
import { useBrowsePlansPage } from "../hooks/useBrowsePlansPage";
import BrowsePlansFilterBar from "./browsePlans/BrowsePlansFilterBar";
import BrowsePlansGrid from "./browsePlans/BrowsePlansGrid";
import ErrorState from "../components/ErrorState";
import SortBySelect from "../components/SortBySelect";
import GiftPurchaseModal from "../components/GiftPurchaseModal";
import GiftPurchaseModal, { type Plan as GiftPlan } from "../components/GiftPurchaseModal";
import { ToastContainer, type ToastOptions } from "../components/TransactionToast";
import { copyToClipboard } from "../utils/clipboard";
import { addBillingInterval } from "../utils/billingDate";
import { catalogPlans as mockPlans, type Plan, type PlanInterval } from "../data/catalogPlans";
import styles from "./BrowsePlans.module.css";

type SortField = "name" | "price" | "merchant";
type SortDirection = "asc" | "desc";

const NewspaperIcon = () => (
	<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
		<path d="M18 14h-8" />
		<path d="M15 18h-5" />
		<path d="M10 6h8v4h-8V6Z" />
	</svg>
);

const CloudIcon = () => (
	<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
	</svg>
);

const RobotIcon = () => (
	<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<rect width="18" height="10" x="3" y="11" rx="2" />
		<circle cx="12" cy="5" r="2" />
		<path d="M12 7v4" />
		<line x1="8" x2="8" y1="16" y2="16" />
		<line x1="16" x2="16" y1="16" y2="16" />
	</svg>
);

const MuscleIcon = () => (
	<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M12.5 3.5a3 3 0 0 1 0 6M13.5 3.5a3 3 0 0 0 0 6" />
		<path d="M13.5 9.5V14" />
		<path d="M12.5 14v5.5a3 3 0 0 1-6 0v-2c0-1.7 1.3-3 3-3 1.7 0 3-1.3 3-3Z" />
	</svg>
);

const FitnessIcon = () => (
	<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="m14 7 6-3v18l-6-3" />
		<path d="M4 4v16" />
		<path d="M10 7l-6-3v18l6-3" />
	</svg>
);

const ChartIcon = () => (
	<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M3 3v18h18" />
		<path d="m19 9-5 5-4-4-3 3" />
	</svg>
);

const iconMap = {
	newspaper: NewspaperIcon,
	cloud: CloudIcon,
	robot: RobotIcon,
	muscle: MuscleIcon,
	fitness: FitnessIcon,
	chart: ChartIcon,
};


const SORT_OPTIONS = [
	{ value: "name-asc", label: "Name (A–Z)" },
	{ value: "name-desc", label: "Name (Z–A)" },
	{ value: "price-asc", label: "Price (low to high)" },
	{ value: "price-desc", label: "Price (high to low)" },
	{ value: "merchant-asc", label: "Merchant (A–Z)" },
	{ value: "merchant-desc", label: "Merchant (Z–A)" },
];

function getBillingIntervalCopy(interval: PlanInterval) {
	return interval === "Monthly" ? "Billed every month" : "Billed every year";
}

function getNextChargeDate(interval: PlanInterval) {
	const nextCharge = addBillingInterval(
		new Date(),
		interval === "Monthly" ? "monthly" : "yearly",
		1,
	);

	return nextCharge.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

interface PlanCardProps {
	plan: Plan;
	onSubscribe: (plan: Plan) => void;
	onSendGift: (plan: Plan) => void;
}

function PlanCard({ plan, onSubscribe, onSendGift }: PlanCardProps) {
	const IconComponent = iconMap[plan.icon];
	const billingCopy = getBillingIntervalCopy(plan.interval);
	const nextChargeDate = getNextChargeDate(plan.interval);

	return (
		<article className={styles.planCard}>
			<div className={styles.cardHeader}>
				<div className={styles.planIcon}>
					<IconComponent />
				</div>
				<span className={styles.planMerchant}>{plan.merchant}</span>
			</div>

			<h3 className={styles.planName}>{plan.name}</h3>

			<div className={styles.pricing}>
				<div className={styles.priceRow}>
					<span className={styles.planPrice}>{plan.price}</span>
					<span className={styles.planCurrency}>{plan.currency}</span>
				</div>
				<p className={styles.billingCopy}>{billingCopy}</p>
				<p
					aria-label={`Next charge preview for ${plan.name}`}
					className={styles.nextCharge}>
					Next charge: {nextChargeDate}
				</p>
			</div>

			<p className={styles.planDescription}>{plan.description}</p>

			<button
				onClick={() => onSubscribe(plan)}
				className={styles.subscribeButton}
				aria-label={`Subscribe to ${plan.name} plan for ${plan.price} ${plan.currency}. ${billingCopy}. Next charge on ${nextChargeDate} from ${plan.merchant}`}>
				Subscribe
			</button>

			<button
				onClick={() => onSendGift(plan)}
				className={styles.giftButton}
				aria-label={`Send ${plan.name} as a gift`}>
				<svg 
					width="18" 
					height="18" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					strokeWidth="2" 
					strokeLinecap="round" 
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<polyline points="20 12 20 22 4 22 4 12" />
					<rect x="2" y="7" width="20" height="5" />
					<line x1="12" y1="22" x2="12" y2="7" />
					<path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
					<path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
				</svg>
				Send as gift
			</button>
		</article>
	);
}

export default function BrowsePlans() {
	usePageTitle("Browse Plans");
	const state = useBrowsePlansPage();
	const navigate = useNavigate();
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ApiError | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [intervalFilter, setIntervalFilter] = useState<PlanInterval | "All">("All");
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [giftModalOpen, setGiftModalOpen] = useState(false);
	const [selectedPlanForGift, setSelectedPlanForGift] = useState<Plan | null>(null);
	const [toasts, setToasts] = useState<ToastOptions[]>([]);
	const toastId = useRef(0);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);
	const {
		status,
		error: walletError,
		connect,
		clearError,
		cancelConnect,
	} = useWallet();

	// Fetch plans from API
	const fetchPlans = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			// Simulate API call with potential error
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					if (window.location.search.includes('simulate_error')) {
						const err: ApiError = new Error('Failed to load plans from catalog');
						err.status = 500;
						err.technicalDetails = 'The decentralized plan registry is experiencing high latency. [Error Code: REG-CAT-503]';
						reject(err);
					} else {
						resolve(true);
					}
				}, 800);
			});
			// No backend is deployed for this demo, so the catalog is sample data.
			setPlans(mockPlans);
			setLoading(false);
		} catch (err: unknown) {
			setError(err as Error);
			// Fallback to mock data on error so UI still shows something if desired, 
			// but here we want to show the error state primarily.
			setPlans(mockPlans);
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlans();
	}, [fetchPlans]);

	const filteredPlans = useMemo(() => {
		const result = plans.filter((plan) => {
			const matchesSearch =
				plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				plan.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
				plan.description.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesInterval =
				intervalFilter === "All" || plan.interval === intervalFilter;

			return matchesSearch && matchesInterval;
		});

		result.sort((a, b) => {
			let comparison = 0;

			if (sortField === "name") {
				comparison = a.name.localeCompare(b.name);
			} else if (sortField === "price") {
				comparison = a.price - b.price;
			} else if (sortField === "merchant") {
				comparison = a.merchant.localeCompare(b.merchant);
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});

		return result;
	}, [plans, searchQuery, intervalFilter, sortField, sortDirection]);

	const handleSortChange = (value: string) => {
		const separatorIndex = value.lastIndexOf("-");
		setSortField(value.slice(0, separatorIndex) as SortField);
		setSortDirection(value.slice(separatorIndex + 1) as SortDirection);
	};

	const handleSubscribe = (plan: Plan) => {
		if (status !== "connected") {
			setWalletModalOpen(true);
			return;
		}

		navigate(`/checkout/${plan.id}`);
	};

	const handleSendGift = (plan: Plan) => {
		setSelectedPlanForGift(plan);
		setGiftModalOpen(true);
	};

	const handleGiftPurchaseComplete = (giftCode: string) => {
		toastId.current += 1;
		const id = `gift-${toastId.current}`;
		setToasts((prev) => [
			...prev,
			{
				id,
				status: "success",
				title: "Gift created",
				message: "Your gift subscription is ready to share.",
				actionText: "Copy Code",
				onAction: () => {
					void copyToClipboard(giftCode).then((copied) => {
						if (copied) {
							setToasts((current) =>
								current.map((t) =>
									t.id === id ? { ...t, actionText: "Copied!" } : t,
								),
							);
						}
					});
				},
			},
		]);
	};

	const handleWalletConnect = async () => {
		try {
			const result = await connect();
			if (!result) return;
			setWalletModalOpen(false);
		} catch {
			// The provider exposes the error to the modal.
		}
	};

	const clearFilters = () => {
		setSearchQuery("");
		setIntervalFilter("All");
		setSortField("name");
		setSortDirection("asc");
	};

	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<div className={styles.pageHeader}>
					<h1 className={styles.pageTitle}>Browse Plans</h1>
					<p className={styles.pageSubtitle}>
						Discover subscription plans from verified merchants on Stellar
					</p>
				</div>

				<BrowsePlansFilterBar
					searchQuery={state.searchQuery}
					onSearchChange={state.setSearchQuery}
					intervalFilter={state.intervalFilter}
					onIntervalChange={state.setIntervalFilter}
					sortField={state.sortField}
					sortDirection={state.sortDirection}
					onSortChange={state.handleSortChange}
					onClearFilters={state.clearFilters}
				/>

				<div style={{ marginBottom: "1.5rem" }}>
					<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
						{state.filteredPlans.length}{" "}
						{state.filteredPlans.length === 1 ? "plan" : "plans"} found
					</span>
				</div>

				<BrowsePlansGrid
					plans={state.filteredPlans}
					loading={state.loading}
					error={state.error}
					onRetry={state.fetchPlans}
					onSubscribe={state.handleSubscribe}
					onSendGift={state.handleSendGift}
					onClearFilters={state.clearFilters}
				/>
				<div className={styles.controls}>
					<div className={styles.searchWrapper}>
						<svg
							className={styles.searchIcon}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							type="search"
							placeholder="Search plans..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className={styles.searchInput}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									clearFilters();
								}
							}}
							aria-label="Search plans by name, merchant, or description"
						/>
					</div>

					<select
						value={intervalFilter}
						onChange={(e) =>
							setIntervalFilter(e.target.value as PlanInterval | "All")
						}
						className={styles.intervalSelect}
						aria-label="Filter plans by billing interval">
						<option value="All">All billing intervals</option>
						<option value="Monthly">Billed every month</option>
						<option value="Yearly">Billed every year</option>
					</select>

					<div className={styles.sortGroup}>
						<span id="browse-sort-label" className={styles.sortLabel}>
							Sort by:
						</span>
						<div className={styles.sortControl}>
							<SortBySelect
								value={`${sortField}-${sortDirection}`}
								onValueChange={handleSortChange}
								options={SORT_OPTIONS}
								labelId="browse-sort-label"
								ariaLabel="Sort plans"
							/>
						</div>
					</div>
				</div>

				<div className={styles.resultsCount}>
					<span className={styles.resultsCountText}>
						{filteredPlans.length}{" "}
						{filteredPlans.length === 1 ? "plan" : "plans"} found
					</span>
				</div>

				{loading && (
					<div className={styles.statePanel}>
						<div className={styles.spinner} />
						<h2 className={styles.stateTitle}>Loading plans...</h2>
						<p className={styles.stateMessage}>
							Please wait while we fetch available subscription plans
						</p>
					</div>
				)}

				{error && !loading && (
					<div className={styles.errorPanel}>
						<ErrorState 
							title="Failed to load plans"
							message={error.message}
							technicalDetails={error.technicalDetails}
							onRetry={fetchPlans}
							isRetrying={loading}
							type={error.isOffline ? 'offline' : 'error'}
						/>
					</div>
				)}

				{!loading &&
					(filteredPlans.length > 0 ? (
						<div
							role="list"
							aria-label="Available subscription plans"
							className={styles.planGrid}>
							{filteredPlans.map((plan) => (
								<PlanCard 
									key={plan.id} 
									plan={plan} 
									onSubscribe={handleSubscribe} 
									onSendGift={handleSendGift}
								/>
							))}
						</div>
					) : (
						<div
							role="status"
							aria-live="polite"
							className={styles.statePanel}>
							<h2 className={styles.stateTitle}>
								No plans match your filters
							</h2>
							<p className={styles.stateMessageWithAction}>
								Try adjusting your search criteria or browse all plans
							</p>
							<button
								onClick={clearFilters}
								className={styles.clearFiltersButton}>
								Clear Filters
							</button>
						</div>
					))}

				<WalletConnectModal
					isOpen={state.walletModalOpen}
					onClose={() => {
						state.cancelConnect();
						state.setWalletModalOpen(false);
					}}
					onConnectFreighter={state.handleWalletConnect}
					connectionState={state.status}
					errorMessage={state.walletError?.message}
					errorType={
						state.walletError instanceof FreighterConnectionError
							? state.walletError.type
							: undefined
					}
					onRetry={state.clearError}
				/>

				<GiftPurchaseModal
					isOpen={state.giftModalOpen}
					onClose={() => state.setGiftModalOpen(false)}
					plan={state.selectedPlanForGift}
					onPurchaseComplete={state.handleGiftPurchaseComplete}
				/>
				<ToastContainer toasts={toasts} removeToast={removeToast} />
			</div>
		</div>
	);
}
