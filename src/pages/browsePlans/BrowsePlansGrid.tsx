import { useState } from "react";
import type { Plan } from "../../data/catalogPlans";
import ErrorState from "../../components/ErrorState";
import type { ApiError } from "../../api/client";
import {
	ChartIcon,
	CloudIcon,
	FitnessIcon,
	MuscleIcon,
	NewspaperIcon,
	RobotIcon,
} from "./BrowsePlansIcons";
import { getBillingIntervalCopy, getNextChargeDate } from "./browsePlansUtils";

const iconMap = {
	newspaper: NewspaperIcon,
	cloud: CloudIcon,
	robot: RobotIcon,
	muscle: MuscleIcon,
	fitness: FitnessIcon,
	chart: ChartIcon,
};

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
					<span style={{ color: "#ffffff", fontSize: "36px", fontWeight: 800 }}>
						{plan.price}
					</span>
					<span style={{ color: "#8b949e", fontSize: "16px", fontWeight: 500 }}>
						{plan.currency}
					</span>
				</div>
				<p style={{ color: "#8b949e", fontSize: "14px", margin: 0 }}>
					{billingCopy}
				</p>
				<p
					aria-label={`Next charge preview for ${plan.name}`}
					style={{ color: "#4FD1C5", fontSize: "14px", fontWeight: 600, margin: 0 }}>
					Next charge: {nextChargeDate}
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
				{plan.description}
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
				onMouseEnter={(event) => { event.currentTarget.style.filter = "brightness(1.1)"; }}
				onMouseLeave={(event) => { event.currentTarget.style.filter = "brightness(1)"; }}
				onFocus={(event) => { event.currentTarget.style.outline = "2px solid #22d3ee"; event.currentTarget.style.outlineOffset = "2px"; }}
				onBlur={(event) => { event.currentTarget.style.outline = "none"; }}
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
				onMouseEnter={(event) => { event.currentTarget.style.background = "rgba(168, 85, 247, 0.1)"; event.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.6)"; event.currentTarget.style.boxShadow = "0 0 20px rgba(168, 85, 247, 0.2)"; }}
				onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; event.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)"; event.currentTarget.style.boxShadow = "none"; }}
				onFocus={(event) => { event.currentTarget.style.outline = "2px solid #a855f7"; event.currentTarget.style.outlineOffset = "2px"; }}
				onBlur={(event) => { event.currentTarget.style.outline = "none"; }}
				aria-label={`Send ${plan.name} as a gift`}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

interface BrowsePlansGridProps {
	plans: Plan[];
	loading: boolean;
	error: ApiError | null;
	onRetry: () => void;
	onSubscribe: (plan: Plan) => void;
	onSendGift: (plan: Plan) => void;
	onClearFilters: () => void;
}

export default function BrowsePlansGrid({
	plans,
	loading,
	error,
	onRetry,
	onSubscribe,
	onSendGift,
	onClearFilters,
}: BrowsePlansGridProps) {
	if (loading) {
		return (
			<div
				style={{
					textAlign: "center",
					padding: "4rem 2rem",
					background: "#1a1a1a",
					borderRadius: 12,
					border: "1px solid #2a2a2a",
				}}>
				<div
					style={{
						width: 48,
						height: 48,
						margin: "0 auto 1.5rem",
						borderRadius: "50%",
						border: "3px solid #2a2a2a",
						borderTopColor: "#22d3ee",
						animation: "spin 1s linear infinite",
					}}
				/>
				<h2 style={{ color: "#ffffff", fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
					Loading plans...
				</h2>
				<p style={{ color: "#94a3b8", margin: 0 }}>
					Please wait while we fetch available subscription plans
				</p>
				<style>{`
					@keyframes spin {
						to { transform: rotate(360deg); }
					}
				`}</style>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: "4rem 2rem", background: "#1a1a1a", borderRadius: 12, border: "1px solid #2a2a2a", display: "flex", justifyContent: "center" }}>
				<ErrorState
					title="Failed to load plans"
					message={error.message}
					technicalDetails={error.technicalDetails}
					onRetry={onRetry}
					isRetrying={loading}
					type={error.isOffline ? "offline" : "error"}
				/>
			</div>
		);
	}

	if (plans.length === 0) {
		return (
			<div
				role="status"
				aria-live="polite"
				style={{
					textAlign: "center",
					padding: "4rem 2rem",
					background: "#1a1a1a",
					borderRadius: 12,
					border: "1px solid #2a2a2a",
				}}>
				<h2 style={{ color: "#ffffff", fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
					No plans match your filters
				</h2>
				<p style={{ color: "#94a3b8", margin: "0 0 1.5rem" }}>
					Try adjusting your search criteria or browse all plans
				</p>
				<button
					onClick={onClearFilters}
					style={{
						padding: "0.75rem 1.5rem",
						background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)",
						color: "#ffffff",
						fontSize: "0.875rem",
						fontWeight: 600,
						border: "none",
						borderRadius: 8,
						cursor: "pointer",
					}}>
					Clear Filters
				</button>
			</div>
		);
	}

	return (
		<div
			role="list"
			aria-label="Available subscription plans"
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
				gap: "24px 32px",
			}}>
			{plans.map((plan) => (
				<PlanCard
					key={plan.id}
					plan={plan}
					onSubscribe={onSubscribe}
					onSendGift={onSendGift}
				/>
			))}
		</div>
	);
}
