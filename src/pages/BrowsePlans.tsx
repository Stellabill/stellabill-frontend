import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from '../hooks/usePageTitle';
import type { ApiError } from "../api/client";
import WalletConnectModal from "../components/WalletConnectModal";
import { useWallet } from "../wallet/WalletContext";
import { FreighterConnectionError } from "../wallet/freighter";
import ErrorState from "../components/ErrorState";
import SortBySelect from "../components/SortBySelect";
import GiftPurchaseModal, { type Plan as GiftPlan } from "../components/GiftPurchaseModal";
import { addBillingInterval } from "../utils/billingDate";

type PlanInterval = "Monthly" | "Yearly";
// ... (previous types and icons)
type SortField = "name" | "price" | "merchant";
type SortDirection = "asc" | "desc";

interface Plan {
	id: string;
	merchant: string;
	name: string;
	price: number;
	currency: string;
	interval: PlanInterval;
	description: string;
	icon: "newspaper" | "cloud" | "robot" | "muscle" | "fitness" | "chart";
}

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

const mockPlans: Plan[] = [
	{
		id: "1",
		merchant: "Stellar News",
		name: "Premium Access",
		price: 10,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Get unlimited access to premium articles, exclusive interviews, and breaking news coverage.",
		icon: "newspaper",
	},
	{
		id: "2",
		merchant: "CloudFlow",
		name: "Pro Plan",
		price: 25,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Advanced cloud storage with 1TB space, priority support, and team collaboration features.",
		icon: "cloud",
	},
	{
		id: "3",
		merchant: "DevTools AI",
		name: "Starter",
		price: 15,
		currency: "USDC",
		interval: "Monthly",
		description:
			"AI-powered development tools with code completion, debugging, and documentation generation.",
		icon: "robot",
	},
	{
		id: "4",
		merchant: "Stellar News",
		name: "Annual Premium",
		price: 100,
		currency: "USDC",
		interval: "Yearly",
		description:
			"Full year of premium access at a discounted rate. Save 17% compared to monthly billing.",
		icon: "newspaper",
	},
	{
		id: "5",
		merchant: "CloudFlow",
		name: "Enterprise",
		price: 50,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Unlimited storage, advanced security, dedicated support, and custom integrations for teams.",
		icon: "cloud",
	},
	{
		id: "6",
		merchant: "FitTrack",
		name: "Premium Coaching",
		price: 30,
		currency: "USDC",
		interval: "Monthly",
		description:
			"Personal fitness coaching with custom workout plans, nutrition tracking, and weekly check-ins.",
		icon: "fitness",
	},
];

const SORT_OPTIONS = [
	{ value: "name-asc", label: "Name (A–Z)" },
	{ value: "name-desc", label: "Name (Z–A)" },
	{ value: "price-asc", label: "Price (low to high)" },
	{ value: "price-desc", label: "Price (high to low)" },
	{ value: "merchant-asc", label: "Merchant (I–Z)" },
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
	const [isHovered, setIsHovered] = useState(false);
	const billingCopy = getBillingIntervalCopy(plan.interval);
	const nextChargeDate = getNextChargeDate(plan.interval);

	return (
		<article
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				background: "#161B22",
				borderRadius: 16,
				padding: "24px",
				border: "1px solid #30363D",
				display: "flex",
				flexDirection: "column",
				gap: "20px",
				transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
				position: "relative",
			
boxShadow: isHovered
					? "0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(79, 209, 197, 0.15)"
						: "0 4px 6px rgba(0, 0, 0, 0.1)",
				transform: isHovered ? "translateY(-4px)" : "translateY(0)",
			}}>
			<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
				<div
					style={{
						width: 44,
						height: 44,
						borderRadius: 10,
						background: "rgba(255, 255, 255, 0.05)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#ffffff",
						flexShrink: 0,
						border: "1px solid rgba(255, 255, 255, 0.1)",
					}}>
					<IconComponent />
				</div>
				<span style={{ color: "#8b949e", fontSize: "14px", fontWeight: 500 }}>
					{plan.merchant}
				</span>
			</div>

			<h3
				style={{
					color: "#ffffff",
					fontSize: "22px",
					fontWeight: 700,
					margin: 0,
					lineHeight: 1.2,
				}}>
				{plan.name}
			</h3>

			<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
				<div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
					<span style={{
						color: "#ffffff",
						fontSize: "36px",
						fontWeight: 800,
					}}>
						{ plan.price }
					</span>
					<span style={{ color: "#8b949e", fontSize: "16px", fontWeight: 500 }}>
						{plan.currency}
					</span>
				</div>
				<p style={{ color: "#8b949e", fontSize: "14px", margin: 0 }}>
					{ billingCopy }
				</p>
				<p
					aria-label={`Next charge preview for ${plan.name}`}
					style={{ color: "#4FD1C5", fontSize: "14px", fontWeight: 600, margin: 0 }}>
					Next charge: { nextChargeDate }
				</p>
			</div>

			<p
				style={{
					color: "#8b949e",
					fontSize: "15px",
					lineHeight: 1.55,
					margin: 0,
					flex: 1,
					display: "-webkit-box",
					WebkitLineClamp: 2,
					WebkitBoxOrient: "vertical",
					overflow: "hidden",
				}}>
				{ plan.description }
			</p>

			<button
				onClick={() => onSubscribe(plan)}
				style={{
					width: "100%",
					padding: "14px 20px",
					background: "linear-gradient(90deg, #4FD1C5 0%, #38B2AC 100%)",
					color: "#0D1117",
					fontSize: "16px",
					fontWeight: 700,
					border: "none",
					borderRadius: 12,
					cursor: "pointer",
					transition: "all 0.2s ease",
					boxShadow: isHovered ? "0 4px 12px rgba(79, 209, 197, 0.3)" : "none",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.filter = "brightness(1.1)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.filter = "brightness(1)";
				}}
				onFocus={(e) => {
					e.currentTarget.style.outline = "2px solid #22d3ee";
					e.currentTarget.style.outlineOffset = "2px";
				}}
				onBlur={(e) => {
					e.currentTarget.style.outline = "none";
				}}
				aria-label={`Subscribe to ${plan.name} plan for ${plan.price} ${plan.currency}. ${billingCopy}. Next charge on ${nextChargeDate} from ${plan.merchant}`}>
				Subscribe
			</button>

			<button
				onClick={() => onSendGift(plan)}
				style={{
					width: "100%",
					padding: "14px 20px",
					background: "transparent",
					color: "#c084fc",
					fontSize: "16px",
					fontWeight: 700,
					border: "1px solid rgba(168, 85, 247, 0.4)",
					borderRadius: 12,
					cursor: "pointer",
					transition: "all 0.2s ease",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "8px",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = "rgba(168, 85, 247, 0.1)";
					e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.6)";
					e.currentTarget.style.boxShadow = "0 0 20px rgba(168, 85, 247, 0.2)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = "transparent";
					e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)";
					e.currentTarget.style.boxShadow = "none";
				}}
				onFocus={(e) => {
					e.currentTarget.style.outline = "2px solid #a855f7";
					e.currentTarget.style.outlineOffset = "2px";
				}}
				onBlur={(e) => {
					e.currentTarget.style.outline = "none";
				}}
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
  usePageTitle('Browse Plans');
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
						err.technicalDetails = 'The decentralized plan registry is experiencing high latency. [Error Code: REG-CAT-';
						reject(err);
						return;
					}
					setPlans(mockPlans);
					setLoading(false);
					resolve(null);
				}, 500);
			});
		} catch (err) {
			setError(err as ApiError);
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlans();
	}, [fetchPlans]);

	const filteredPlans = useMemo(() => {
		let result = [...plans];

		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.name.toLowerCase().includes(q) ||
					p.merchant.toLowerCase().includes(q),
			);
		}

		if (intervalFilter !== "All") {
			result = result.filter((p) => p.interval === intervalFilter);
		}

		result.sort((a, b) => {
			let cmp = 0;
			if (sortField === "name") cmp = a.name.localeCompare(b.name);
			else if (sortField === "price") cmp = a.price - b.price;
			else cmp = a.merchant.localeCompare(b.merchant);
			return sortDirection === "asc" ? cmp : -cmp;
		});

		return result;
	}, [plans, searchQuery, intervalFilter, sortField, sortDirection]);

	const handleSubscribe = (plan: Plan) => {
		if (status !== "connected") {
			setWalletModalOpen(true);
			return;
		}
		navigate(`/subscribe/${plan.id}`);
	};

	const handleSendGift = (plan: Plan) => {
		setSelectedPlanForGift(plan);
		setGiftModalOpen(true);
	};

	const handleWalletConnect = () => {
		setIsWalletConnected(true);
		setWalletModalOpen(false);
	};

	if (error) {
		return (
			<ErrorState
				title="Failed to load plans"
				message={error.message}
				technicalDetails={error.technicalDetails}
				onChange={() => {
					setError(null);
					fetchPlans();
				}}
				retryLabel="Try again"
			/>
		);
	}

	if (loading) {
		return <div style={{ color: "#fff", padding: "24px" }}>Loading plans...</div>;
	}

	return (
		<main style={{ padding: "24px", color: "#fff" }}>
			<h1>Browse Plans</h1>
			<div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
				<input
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search plans..."
				/>
				<select
					value={intervalFilter}
					onChange={(e) => setIntervalFilter(e.target.value as PlanInterval | "All")}>
					<option value="All">All</option>
					<option value="Monthly">Monthly</option>
					<option value="Yearly">Yearly</option>
				</select>
				<SortBySelect
					options={SORT_OPTIONS}
					value={`${sortField}-${sortDirection}`}
					onChange={(value) => {
						const [nf, nd] = value.split("-");
						setSortField(nf as SortField);
						setSortDirection(nd as SortDirection);
					}}
				/>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
				{filteredPlans.map((plan) => (
					<PlanCard
						key={plan.id}
						plan={plan}
						onSubscribe={handleSubscribe}
						onSendGift={handleSendGift}
					/>
				))}
			</div>
			{walletModalOpen && (
				<WalletConnectModal
					onClose={() => setWalletModalOpen(false)}
					onConnect={handleWalletConnect}
				/>
			)}
			{gentModalOpen && selectedPlanForGift && (
				<GiftPurchaseModal
					plan={selectedPlanForGift as unknown as GiftPlan}
					onClose={() => {
						setGiftModalOpen(false);
						setSelectedPlanForGift(null);
					}}
				/>
			)}
		</main>
	);
}
